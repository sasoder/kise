#!/usr/bin/env python3
"""Place rendered graphics on a Premiere Pro sequence by editing the saved .prproj directly (Premiere stays closed).

    python3 scripts/prproj_insert.py PROJECT.prproj placements.json [--sequence NAME] [--track 1]
        [--size 1080x1920] [--source-scale 177.777786254883] [--dry-run] [--allow-running]

placements.json: [{"path": "/abs/0_Name.mov", "in": 0.0, "out": 7.04}, ...]   (sequence seconds)

What it does:
- adds each .mov to the Root Bin once (re-used by path on re-runs, its stream info refreshed);
- puts one clip per placement on video track --track (0 = V1; default 1 = V2) from `in` to `out`, media from 0;
- is idempotent: items on that track that use any of the given files are removed first, so re-running replaces them;
- --size switches the sequence frame (VideoTrackGroup FrameRect + preview size); --source-scale gives every V1 clip
  that still uses default Motion an explicit Motion at that scale (fill height for 16:9 media in 9:16, centred);
- backs the original up to <project dir>/old/<name>_before_<timestamp>.prproj and writes the new one in place.
Edits are block-local: untouched top-level objects are written back byte for byte.
"""
import argparse, copy, gzip, json, os, re, shutil, subprocess, sys, time, uuid, base64
import xml.etree.ElementTree as ET

TPS = 254016000000  # Premiere ticks per second

MOTION_TMPL = """<VideoFilterComponent ObjectID="{cid}" ClassID="d10da199-beea-4dd1-b941-ed3a78766d50" Version="9">
		<Component Version="7">
			<Params Version="1">
{params}
			</Params>
			<ID>1</ID>
			<Intrinsic>true</Intrinsic>
			<DisplayName>Motion</DisplayName>
		</Component>
		<PremiereFilterPrivateData Encoding="base64" BinaryHash="88406df2-012a-8730-431d-89a90000000e"></PremiereFilterPrivateData>
		<VideoFilterType>2</VideoFilterType>
		<MatchName>AE.ADBE Motion</MatchName>
	</VideoFilterComponent>"""
K0 = "-91445760000000000"
MOTION_BLOB = ("88406df2-012a-8730-431d-89a90000000e", "AZc=")  # Motion's private data as Premiere 26 writes it
POINT = "ca81d347-309b-44d2-acc7-1c572efb973c"
FLOAT = "fe47129e-6c94-4fc0-95d5-c056a517aaf3"
MOTION_PARAMS = [  # (tag, classid, inner xml) in the order Premiere writes them
    ("PointComponentParam", POINT, f"<Name>Position</Name><ParameterID>1</ParameterID><StartKeyframe>{K0},0.5:0.5,0,0,0,0,0,0,5,4,0,0,0,0</StartKeyframe>"),
    ("VideoComponentParam", FLOAT, "<Name>Scale</Name><ParameterID>2</ParameterID><UpperUIBound>200</UpperUIBound><StartKeyframe>{K0},{S},0,0,0,0,0,0</StartKeyframe><LowerBound>0</LowerBound><UpperBound>10000</UpperBound>"),
    ("VideoComponentParam", FLOAT, "<Name>Scale Width</Name><ParameterID>3</ParameterID><UpperUIBound>200</UpperUIBound><StartKeyframe>{K0},{S},0,0,0,0,0,0</StartKeyframe><LowerBound>0</LowerBound><UpperBound>10000</UpperBound>"),
    ("VideoComponentParam", "cc12343e-f113-4d3b-ae05-b287db77d461", f"<Name> </Name><ParameterID>4</ParameterID><StartKeyframe>{K0},true,0,0,0,0,0,0</StartKeyframe>"),
    ("VideoComponentParam", FLOAT, f"<Name>Rotation</Name><ParameterControlType>3</ParameterControlType><ParameterID>5</ParameterID><StartKeyframe>{K0},0.,0,0,0,0,0,0</StartKeyframe><LowerBound>-32768</LowerBound><UpperBound>32767</UpperBound>"),
    ("PointComponentParam", POINT, f"<Name>Anchor Point</Name><ParameterID>6</ParameterID><StartKeyframe>{K0},0.5:0.5,0,0,0,0,0,0,5,4,0,0,0,0</StartKeyframe>"),
    ("VideoComponentParam", "a4ff2d6e-7ac2-44f8-9d52-17d9ca50e542", f"<Name>Anti-flicker Filter</Name><ParameterID>7</ParameterID><StartKeyframe>{K0},0.,0,0,0,0,0,0</StartKeyframe><LowerBound>0</LowerBound><UpperBound>1</UpperBound>"),
] + [
    ("VideoComponentParam", FLOAT, f"<Name>Crop {n}</Name><ParameterID>{i}</ParameterID><StartKeyframe>{K0},0.,0,0,0,0,0,0</StartKeyframe><LowerBound>0</LowerBound><UpperBound>100</UpperBound>")
    for i, n in ((8, "Left"), (9, "Top"), (10, "Right"), (11, "Bottom"))
]


def ffprobe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets", "-show_entries",
                          "stream=width,height,r_frame_rate,nb_read_packets,codec_tag_string", "-of", "json", path],
                         capture_output=True, text=True, check=True).stdout
    s = json.loads(out)["streams"][0]
    num, den = (int(x) for x in s["r_frame_rate"].split("/"))
    return dict(w=s["width"], h=s["height"], fps=num / den, frames=int(s["nb_read_packets"]), tag=s.get("codec_tag_string", ""))


class Project:
    def __init__(self, text):
        self.head, self.blocks, self.tail = self._split(text)
        self.by_key = {}
        for i, b in enumerate(self.blocks):
            m = re.match(r'\t<(\w+) Object(U?)ID="([^"]+)"', b)
            if m:
                self.by_key[m.group(3)] = i
        self.trees = {}  # block index -> parsed element (only for blocks we touch)
        self.max_obj = max(int(k) for k in self.by_key if k.isdigit())
        ids = [int(x) for x in re.findall(r"<ID>(\d+)</ID>", text)]
        self.next_node = max([i for i in ids if 1000000 <= i < 2000000] + [1000000]) + 1
        self.root = ET.fromstring(text.encode("utf-8"))
        self.el = {e.attrib.get("ObjectID") or e.attrib.get("ObjectUID"): e for e in self.root
                   if "ObjectID" in e.attrib or "ObjectUID" in e.attrib}

    @staticmethod
    def _split(text):
        lines = text.split("\n")
        i = 0
        while not lines[i].startswith("<PremiereData"):
            i += 1
        head = "\n".join(lines[: i + 1])
        blocks, cur, j = [], None, i + 1
        while j < len(lines):
            ln = lines[j]
            if ln.startswith("</PremiereData>"):
                break
            if cur is None:
                cur = [ln]
                if re.match(r"\t<[^>]*/>\s*$", ln) or re.match(r"\t<(\w+)[^>]*>.*</\1>\s*$", ln):
                    blocks.append(ln); cur = None
            else:
                cur.append(ln)
                if ln.startswith("\t</"):
                    blocks.append("\n".join(cur)); cur = None
            j += 1
        tail = "\n".join(lines[j:])
        return head, blocks, tail

    def text(self):
        PH = "\ue000"  # placeholder for a newline inside element text
        for i, e in self.trees.items():
            new = self.blocks[i] is None
            had_nl_entity = not new and "&#10;" in self.blocks[i]
            for x in e.iter():  # keep Premiere's &#10; inside text (newlines between tags stay as they are)
                if had_nl_entity and x.text and "\n" in x.text and x.text.strip():
                    x.text = x.text.replace("\n", PH)
            if new:  # a new object: indent like Premiere (one tab per level)
                ET.indent(e, space="\t", level=1)
            out = ET.tostring(e, encoding="unicode").rstrip().replace(PH, "&#10;")
            self.blocks[i] = "\t" + out.replace(" />", "/>")  # Premiere writes <X a="b"/>
        return self.head + "\n" + "\n".join(b for b in self.blocks if b is not None) + "\n" + self.tail

    def get(self, key):
        """Editable element for a top-level object."""
        i = self.by_key[key]
        if i not in self.trees:
            self.trees[i] = ET.fromstring(self.blocks[i].strip())
        return self.trees[i]

    def ref(self, e):
        return self.el[e.attrib.get("ObjectRef") or e.attrib.get("ObjectURef")]

    def add(self, xml):
        e = ET.fromstring(xml)
        key = e.attrib.get("ObjectID") or e.attrib.get("ObjectUID")
        self.blocks.append(None)
        i = len(self.blocks) - 1
        self.by_key[key] = i
        self.trees[i] = e
        self.el[key] = e
        return e

    def drop(self, key):
        i = self.by_key.pop(key)
        self.blocks[i] = None
        self.trees.pop(i, None)

    def oid(self):
        self.max_obj += 1
        return str(self.max_obj)

    def nid(self):
        self.next_node += 1
        return str(self.next_node - 1)


def media_path(p, ti):
    sc = p.ref(ti.find("ClipTrackItem/SubClip"))
    clip = p.ref(sc.find("Clip")).find("Clip")
    src = p.ref(clip.find("Source"))
    m = src.find("MediaSource/Media")
    return p.ref(m).findtext("FilePath") if m is not None else None


def stored_blobs(p):
    """BinaryHash -> decoded bytes, for every blob stored with content in this project."""
    blobs = {}
    for x in p.root.iter():
        h = x.attrib.get("BinaryHash")
        if h and x.text and x.text.strip():
            blobs[h] = base64.b64decode(x.text.strip())
    return blobs


def media_mod_state(blobs):
    """(hash, decoded state uuid) of a stored media ModificationState blob to re-use (StopIteration if none)."""
    h = next(h for h, b in blobs.items() if len(b) == 72 and int(h[-8:], 16) == 84
             and re.fullmatch(r"[0-9a-f-]{36}", b.decode("utf-16-le", "ignore")))
    return h, blobs[h].decode("utf-16-le")


def ensure_mov_media(p, path, proj_path, existing, root_bin, proto_impl, mod_state_hash, mod_state_cms,
                     bin_items=None, refresh_always=True):
    """Re-use the .mov's media graph by FilePath (refreshing its stream info) or create it.
    Returns (master uid, video media source id, markers id, ffprobe info, duration ticks).
    bin_items: if a list, the new ClipProjectItem uid is appended to it (the caller edits the Root Bin) instead of
    editing the Root Bin here. refresh_always=False leaves an existing media graph untouched when its stream info
    already matches the file."""
    info = ffprobe(path)
    fr_ticks = round(TPS / info["fps"])
    dur = fr_ticks * info["frames"]
    state = str(uuid.uuid4())
    mod = int(os.path.getmtime(path) * 1e6)
    name = os.path.basename(path)
    rel = os.path.relpath(path, os.path.dirname(proj_path))
    rel = rel if rel.startswith(".") else "./" + rel
    if path in existing:
        m0 = existing[path]
        vs0 = p.el[m0.find("VideoStream").attrib["ObjectRef"]]
        src = next(e for e in p.root if e.tag == "VideoMediaSource" and e.find("MediaSource/Media").attrib["ObjectURef"] == m0.attrib["ObjectUID"])
        vclip = next(e for e in p.root if e.tag == "VideoClip" and e.find("Clip/Source").attrib["ObjectRef"] == src.attrib["ObjectID"])
        master = next(e for e in p.root if e.tag == "MasterClip" and any(c.attrib["ObjectRef"] == vclip.attrib["ObjectID"] for c in e.find("Clips")))
        same = (vs0.findtext("Duration") == str(dur) and vs0.findtext("FrameRate") == str(fr_ticks)
                and vs0.findtext("FrameRect") == f"0,0,{info['w']},{info['h']}")
        if refresh_always or not same:
            m = p.get(m0.attrib["ObjectUID"])
            if m.find("CCFileModTime") is not None:  # states/hashes stay as Premiere wrote them
                m.find("CCFileModTime").text = str(mod)
            vs = p.get(m.find("VideoStream").attrib["ObjectRef"])
            vs.find("Duration").text = str(dur); vs.find("FrameRate").text = str(fr_ticks)
            vs.find("FrameRect").text = f"0,0,{info['w']},{info['h']}"
            p.get(src.attrib["ObjectID"]).find("OriginalDuration").text = str(dur)
            log = p.get(master.find("LoggingInfo").attrib["ObjectRef"])
            log.find("MediaOutPoint").text = str(dur); log.find("MediaFrameRate").text = str(fr_ticks)
        return (master.attrib["ObjectUID"], src.attrib["ObjectID"], vclip.find("Clip/MarkerOwner/Markers").attrib["ObjectRef"], info, dur)
    mid, vsid, srcid, mkid, logid, vcid, grpid = (p.oid() for _ in range(7))
    muid, mcuid, cpiuid = (str(uuid.uuid4()) for _ in range(3))
    p.add(f'<VideoStream ObjectID="{vsid}" ClassID="a36e4719-3ec6-4a0c-ab11-8b4aab377aa5" Version="23"><Duration>{dur}</Duration>'
          f'<CodecType>1634743400</CodecType><OriginalColorSpace>{{"baseColorProfile":{{"colorProfileName":"BT.709 RGB Full"}},"baseProfileType":1}}</OriginalColorSpace>'
          f'<AlphaInfoIsUncertain>true</AlphaInfoIsUncertain><OriginalImageOrientationType>1</OriginalImageOrientationType>'
          f'<FrameRate>{fr_ticks}</FrameRate><FrameRect>0,0,{info["w"]},{info["h"]}</FrameRect><AlphaType>1</AlphaType></VideoStream>')
    state = mod_state_cms  # BinaryHash is content-addressed (unknown hash, suffix = len + 12): never invent one
    esc = lambda s: s.replace("&", "&amp;").replace("<", "&lt;")
    p.add(f'<Media ObjectUID="{muid}" ClassID="7a5c103e-f3ac-4391-b6b4-7cc3d2f9a7ff" Version="30"><VideoStream ObjectRef="{vsid}"/>'
          f'<ModificationState Encoding="base64" BinaryHash="{mod_state_hash}"/>'
          f'<RelativePath>{esc(rel)}</RelativePath><ImplementationID>{proto_impl}</ImplementationID><FileKey>{uuid.uuid4()}</FileKey>'
          f'<ContentAndMetadataState>{state}</ContentAndMetadataState><RelativePath>{esc(rel)}</RelativePath><CCFileModTime>{mod}</CCFileModTime>'
          f'<ActualMediaFilePath>{esc(path)}</ActualMediaFilePath><FilePath>{esc(path)}</FilePath><Title>{esc(name)}</Title></Media>')
    p.add(f'<VideoMediaSource ObjectID="{srcid}" ClassID="e64ddf74-8fac-4682-8aa8-0e0ca2248949" Version="2"><MediaSource Version="4">'
          f'<Content Version="10"></Content><Media ObjectURef="{muid}"/></MediaSource><OriginalDuration>{dur}</OriginalDuration></VideoMediaSource>')
    p.add(f'<Markers ObjectID="{mkid}" ClassID="bee50706-b524-416c-9f03-b596ce5f6866" Version="4"><ByGUID>byGUID</ByGUID>'
          f'<LastMetadataState>00000000-0000-0000-0000-000000000000</LastMetadataState><LastContentState>{state}</LastContentState></Markers>')
    p.add(f'<ClipLoggingInfo ObjectID="{logid}" ClassID="77ab7fdd-dcdf-465d-9906-7a330ca1e738" Version="10"><CaptureMode>2</CaptureMode>'
          f'<ClipName>{esc(name)}</ClipName><MediaInPoint>0</MediaInPoint><MediaOutPoint>{dur}</MediaOutPoint>'
          f'<MediaFrameRate>{fr_ticks}</MediaFrameRate><TimecodeFormat>100</TimecodeFormat></ClipLoggingInfo>')
    p.add(f'<VideoClip ObjectID="{vcid}" ClassID="9308dbef-2440-4acb-9ab2-953b9a4e82ec" Version="11"><Clip Version="18">'
          f'<MarkerOwner Version="1"><Markers ObjectRef="{mkid}"/></MarkerOwner><Source ObjectRef="{srcid}"/>'
          f'<ClipID>{uuid.uuid4()}</ClipID><InUse>false</InUse></Clip></VideoClip>')
    p.add(f'<ClipChannelGroupVectorSerializer ObjectID="{grpid}" ClassID="a3127a8c-95d4-456e-a7f5-171b3f922426" Version="1"></ClipChannelGroupVectorSerializer>')
    p.add(f'<MasterClip ObjectUID="{mcuid}" ClassID="fb11c33a-b0a9-4465-aa94-b6d5db2628cf" Version="12"><LoggingInfo ObjectRef="{logid}"/>'
          f'<Clips Version="1"><Clip Index="0" ObjectRef="{vcid}"/></Clips><AudioClipChannelGroups ObjectRef="{grpid}"/>'
          f'<Name>{esc(name)}</Name><MasterClipChangeVersion>1</MasterClipChangeVersion></MasterClip>')
    p.add(f'<ClipProjectItem ObjectUID="{cpiuid}" ClassID="cb4e0ed7-aca1-4171-8525-e3658dec06dd" Version="1"><ProjectItem Version="1">'
          f'<Node Version="1"><ID>{p.nid()}</ID></Node><Name>{esc(name)}</Name></ProjectItem><MasterClip ObjectURef="{mcuid}"/></ClipProjectItem>')
    if bin_items is None:
        rb = p.get(root_bin.attrib["ObjectUID"]).find("ProjectItemContainer/Items")
        ET.SubElement(rb, "Item", {"Index": str(len(rb)), "ObjectURef": cpiuid})
    else:
        bin_items.append(cpiuid)
    return (mcuid, srcid, mkid, info, dur)


def add_mov_item(p, media_entry, s, e, path):
    """One VideoClipTrackItem (+ VideoClip, SubClip, default-Motion chain) for a .mov from s to e (ticks), media from 0.
    Returns the track item element (its block is new; callers may still add HeadTransition/TailTransition)."""
    mcuid, srcid, mkid, info, dur = media_entry
    clipid, subid, ccid, tiid = (p.oid() for _ in range(4))
    name = os.path.basename(path).replace("&", "&amp;").replace("<", "&lt;")
    p.add(f'<VideoClip ObjectID="{clipid}" ClassID="9308dbef-2440-4acb-9ab2-953b9a4e82ec" Version="11"><Clip Version="18">'
          f'<MarkerOwner Version="1"><Markers ObjectRef="{mkid}"/></MarkerOwner><Source ObjectRef="{srcid}"/>'
          f'<ClipID>{uuid.uuid4()}</ClipID><InPoint>0</InPoint><OutPoint>{e - s}</OutPoint></Clip></VideoClip>')
    p.add(f'<SubClip ObjectID="{subid}" ClassID="e0c58dc9-dbdd-4166-aef7-5db7e3f22e84" Version="6"><Clip ObjectRef="{clipid}"/>'
          f'<MasterClip ObjectURef="{mcuid}"/><Name>{name}</Name><OrigChGrp>0</OrigChGrp></SubClip>')
    p.add(f'<VideoComponentChain ObjectID="{ccid}" ClassID="0970e08a-f58f-4108-b29a-1a717b8e12e2" Version="3"><DefaultMotion>true</DefaultMotion>'
          f'<DefaultOpacity>true</DefaultOpacity><DefaultMotionComponentID>1</DefaultMotionComponentID><DefaultOpacityComponentID>2</DefaultOpacityComponentID>'
          f'<ComponentChain Version="3"><Node Version="1"><Properties Version="1"><MZ.ComponentChain.ActiveComponentID>2</MZ.ComponentChain.ActiveComponentID>'
          f'<MZ.ComponentChain.ActiveComponentParamIndex>4294967295</MZ.ComponentChain.ActiveComponentParamIndex></Properties></Node></ComponentChain></VideoComponentChain>')
    return p.add(f'<VideoClipTrackItem ObjectID="{tiid}" ClassID="368b0406-29e3-4923-9fcd-094fbf9a1089" Version="8"><ClipTrackItem Version="8">'
                 f'<ComponentOwner Version="1"><Components ObjectRef="{ccid}"/></ComponentOwner><TrackItem Version="4"><Node Version="1"><ID>{p.nid()}</ID></Node>'
                 f'<Start>{s}</Start><End>{e}</End></TrackItem><SubClip ObjectRef="{subid}"/></ClipTrackItem>'
                 f'<ToneMapSettings>{{"peak":-1,"version":3}}</ToneMapSettings><FrameRect>0,0,{info["w"]},{info["h"]}</FrameRect><PixelAspectRatio>1,1</PixelAspectRatio></VideoClipTrackItem>')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project"); ap.add_argument("placements")
    ap.add_argument("--sequence"); ap.add_argument("--track", type=int, default=1)
    ap.add_argument("--size"); ap.add_argument("--source-scale", type=float)
    ap.add_argument("--dry-run", action="store_true"); ap.add_argument("--allow-running", action="store_true")
    ap.add_argument("--remove", action="append", default=[])  # also drop the target track's items that use these files
    a = ap.parse_args()

    if not a.dry_run and not a.allow_running and subprocess.run(["pgrep", "-x", "Adobe Premiere Pro 2026"], capture_output=True).returncode == 0:
        sys.exit("Premiere Pro is running. Close it (or at least this project, without saving) first, or pass --allow-running.")

    proj_path = os.path.abspath(a.project)
    raw = open(proj_path, "rb").read()
    text = gzip.decompress(raw).decode("utf-8") if raw[:2] == b"\x1f\x8b" else raw.decode("utf-8")
    p = Project(text)
    placements = json.load(open(a.placements))
    paths = {os.path.abspath(x["path"]) for x in placements}
    drop_paths = paths | {os.path.abspath(x) for x in a.remove}

    seqs = [e for e in p.root if e.tag == "Sequence"]
    seq = next(s for s in seqs if a.sequence in (None, s.findtext("Name")))
    groups = {p.ref(tg.find("Second")).tag: p.ref(tg.find("Second")) for tg in seq.find("TrackGroups")}
    vg = groups["VideoTrackGroup"]
    seq_fps = TPS / int(vg.findtext("TrackGroup/FrameRate"))
    tracks = vg.find("TrackGroup/Tracks")
    if a.track >= len(tracks):
        sys.exit(f"sequence has only {len(tracks)} video tracks")
    track_key = tracks[a.track].attrib["ObjectURef"]
    track = p.get(track_key)
    clip_items = track.find("ClipTrack/ClipItems")
    items = clip_items.find("TrackItems")

    # 1. idempotence: drop our earlier items on this track
    kept, removed = [], 0
    if items is not None:
        for ti_ref in list(items):
            ti = p.el[ti_ref.attrib["ObjectRef"]]
            if os.path.abspath(media_path(p, ti) or "") in drop_paths:
                sc = p.ref(ti.find("ClipTrackItem/SubClip"))
                for k in (ti.find("ClipTrackItem/ComponentOwner/Components").attrib["ObjectRef"],
                          sc.find("Clip").attrib["ObjectRef"], sc.attrib["ObjectID"], ti.attrib["ObjectID"]):
                    p.drop(k)
                removed += 1
            else:
                kept.append(ti)
    if items is None:
        items = ET.Element("TrackItems", {"Version": "1"})
        clip_items.insert(0, items)

    # 2. media: re-use by path, else create
    existing = {e.findtext("FilePath"): e for e in p.root if e.tag == "Media" and e.findtext("FilePath")}
    root_bin = next(e for e in p.root if e.tag == "RootProjectItem")
    proto_impl = next((e.findtext("ImplementationID") for e in existing.values()), "1fa18bfa-255c-44b1-ad73-56bcd99fceaf")
    blobs = stored_blobs(p)
    mod_state_hash, mod_state_cms = media_mod_state(blobs)
    media = {}  # path -> (master uid, video media source id, markers id, info)
    for path in sorted(paths):
        media[path] = ensure_mov_media(p, path, proj_path, existing, root_bin, proto_impl, mod_state_hash, mod_state_cms)

    # 3. placements
    new_items = []
    for pl in placements:
        path = os.path.abspath(pl["path"])
        dur = media[path][4]
        s, e = round(pl["in"] * TPS), round(pl["out"] * TPS)
        if e - s > dur:
            sys.exit(f"{path}: media {dur / TPS:.3f}s is shorter than the slot {(e - s) / TPS:.3f}s")
        new_items.append(add_mov_item(p, media[path], s, e, path))
    allitems = kept + new_items
    spans = sorted((int(t.findtext("ClipTrackItem/TrackItem/Start") or 0), int(t.findtext("ClipTrackItem/TrackItem/End")), t) for t in allitems)
    for (s0, e0, _), (s1, _, _) in zip(spans, spans[1:]):
        if s1 < e0:
            sys.exit("placements overlap on the target track")
    for c in list(items):
        items.remove(c)
    for i, (_, _, t) in enumerate(spans):
        ET.SubElement(items, "TrackItem", {"Index": str(i), "ObjectRef": t.attrib["ObjectID"]})

    # 4. sequence frame + source scale
    rescaled = skipped = 0
    if a.size:
        w, h = a.size.lower().split("x")
        p.get(vg.attrib["ObjectID"]).find("FrameRect").text = f"0,0,{w},{h}"
        sq = p.get(seq.attrib["ObjectUID"])
        for tag, val in (("MZ.Sequence.PreviewFrameSizeWidth", w), ("MZ.Sequence.PreviewFrameSizeHeight", h)):
            for x in sq.iter(tag):
                x.text = val
    if a.source_scale:
        v1 = p.el[tracks[0].attrib["ObjectURef"]]
        for ref in v1.find("ClipTrack/ClipItems/TrackItems"):
            ti = p.el[ref.attrib["ObjectRef"]]
            cc = p.get(ti.find("ClipTrackItem/ComponentOwner/Components").attrib["ObjectRef"])
            if cc.findtext("DefaultMotion") != "true":
                skipped += 1
                continue
            cid = p.oid()
            params = []
            for k, (tag, cls, inner) in enumerate(MOTION_PARAMS):
                pid = p.oid()
                p.add(f'<{tag} ObjectID="{pid}" ClassID="{cls}" Version="{4 if tag == "PointComponentParam" else 10}">'
                      + inner.replace("{K0}", K0).replace("{S}", repr(a.source_scale)) + f"</{tag}>")
                params.append(f'\t\t\t\t<Param Index="{k}" ObjectRef="{pid}"/>')
            comp = p.add(MOTION_TMPL.format(cid=cid, params="\n".join(params)))
            if MOTION_BLOB[0] not in blobs:  # first use in this project carries the bytes
                comp.find("PremiereFilterPrivateData").text = MOTION_BLOB[1]
                blobs[MOTION_BLOB[0]] = base64.b64decode(MOTION_BLOB[1])
            for tag in ("DefaultMotion", "DefaultMotionComponentID"):
                cc.remove(cc.find(tag))
            chain = cc.find("ComponentChain")
            comps = ET.SubElement(chain, "Components", {"Version": "1"})
            ET.SubElement(comps, "Component", {"Index": "0", "ObjectRef": cid})
            rescaled += 1

    # 5. project NextID
    pr = next(e for e in p.root if e.tag == "Project" and "ObjectID" in e.attrib)
    bi = p.by_key[pr.attrib["ObjectID"]]  # text edit: leave the big Project block byte-identical otherwise
    cur = int(re.search(r"<NextID>(\d+)</NextID>", p.blocks[bi]).group(1))
    p.blocks[bi] = re.sub(r"<NextID>\d+</NextID>", f"<NextID>{max(cur, p.next_node)}</NextID>", p.blocks[bi], count=1)

    out = p.text()
    ET.fromstring(out.encode("utf-8"))  # must still parse
    print(f"sequence {seq.findtext('Name')!r} ({seq_fps:g} fps): removed {removed}, placed {len(new_items)} on V{a.track + 1}"
          + (f", frame {a.size}" if a.size else "") + (f", V1 rescaled {rescaled} (kept {skipped} with custom Motion)" if a.source_scale else ""))
    for t in new_items:
        s = int(t.findtext("ClipTrackItem/TrackItem/Start")); e = int(t.findtext("ClipTrackItem/TrackItem/End"))
        print(f"  {s / TPS:8.3f} – {e / TPS:8.3f}  {p.ref(t.find('ClipTrackItem/SubClip')).findtext('Name')}")
    if a.dry_run:
        dst = os.path.join(os.environ.get("TMPDIR", "/tmp"), "prproj_insert_dryrun.xml")
        open(dst, "w").write(out); print("dry run, wrote", dst); return
    old = os.path.join(os.path.dirname(proj_path), "old"); os.makedirs(old, exist_ok=True)
    bak = os.path.join(old, f"{os.path.splitext(os.path.basename(proj_path))[0]}_before_{time.strftime('%Y%m%d-%H%M%S')}.prproj")
    shutil.copy2(proj_path, bak)
    tmp = proj_path + ".tmp"
    with gzip.open(tmp, "wb") as f:
        f.write(out.encode("utf-8"))
    os.replace(tmp, proj_path)
    print("backup:", bak); print("wrote:", proj_path)


if __name__ == "__main__":
    main()
