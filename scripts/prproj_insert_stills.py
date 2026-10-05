#!/usr/bin/env python3
"""Place still images (.jpg) on a Premiere Pro sequence by writing a NEW copy of a saved .prproj (Premiere stays closed).

    python3 scripts/prproj_insert_stills.py SOURCE.prproj placements.json OUT.prproj --image-dir DIR
        [--sequence NAME] [--track 2]

placements.json: [{"file": "03 - name.jpg", "in": 3.20, "out": 5.32}, ...]   (sequence seconds; "file" is
relative to --image-dir, or absolute). Each still runs in -> out on video track --track (0 = V1; default 2 = V3),
scaled to fit the sequence frame whole and centred: Scale = min(W/w, H/h) * 100.

Companion to scripts/prproj_insert.py (which handles .mov); it reuses that script's block splitter, and the same rules:
- Never invent a BinaryHash. Every blob a new object points at must already be stored in SOURCE with its content:
  the still Media re-uses SOURCE's media ModificationState blob (ContentAndMetadataState = its decoded text, exactly as
  prproj_insert.py does for .mov; Premiere re-derives the real state on its next save) and the Motion component
  re-uses SOURCE's Motion PremiereFilterPrivateData blob. If either is missing the script stops.
- New objects are written as text, tab-indented like Premiere, "/>" with no space; untouched objects stay byte for byte.
  Touched existing blocks: the target track (its TrackItems list), the Root Bin (its Items list), Project NextID.
- The object graph mirrors what Premiere 26 writes for a .jpg still (template: Sheppard_Cajamarca_infinite_KD.prproj,
  track item 6817 + its master clip; 25 fps values from the 25 fps .jpg stills in the same project):
    ClipProjectItem -> MasterClip -> ClipLoggingInfo, VideoClip(master), ClipChannelGroupVectorSerializer
    VideoClip -> Markers, VideoMediaSource -> Media -> VideoStream (IsStill, Infinite, 12 h duration;
      OriginalImageOrientationType 1 when the JPEG carries an EXIF orientation tag, as Premiere writes it)
    VideoClipTrackItem -> VideoComponentChain -> Motion VideoFilterComponent -> 11 params; -> SubClip -> VideoClip
  The timeline VideoClip's in-point sits one hour into the infinite still, as Premiere places stills.
- Idempotent: items on the target track that use any of the given files are removed first (with their chain,
  Motion, params, SubClip and clip); media already in the project (by FilePath) is re-used as is, not duplicated.
SOURCE is only read; OUT must be a different path. To re-run, pass a previous OUT as SOURCE: our items are replaced, not duplicated.
"""
import argparse, base64, gzip, json, os, re, struct, sys, uuid
import xml.etree.ElementTree as ET
from xml.sax.saxutils import escape

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from prproj_insert import Project, TPS  # noqa: E402  (block splitter shared with the .mov inserter)

STILL_DURATION = 10973491200000000          # VideoStream Duration / OriginalDuration of an infinite still (12 h)
TIMECODE_FORMAT = {10160640000: 101, 10594584000: 110, 10584000000: 100}  # frame ticks -> Premiere timebase code
JPEG_CODEC = 1785750887                      # 'jpeg'
LABEL_COLOR, LABEL_NAME = 11369724, "BE.Prefs.LabelColors.3"  # Premiere's default label for stills
COLOR_SPACE = '{"baseColorProfile":{"colorProfileName":"BT.709 RGB Full"},"baseProfileType":1}'
K0 = "-91445760000000000"
MOTION_CLASS = "d10da199-beea-4dd1-b941-ed3a78766d50"
POINT, FLOAT = "ca81d347-309b-44d2-acc7-1c572efb973c", "fe47129e-6c94-4fc0-95d5-c056a517aaf3"
UPPER = "AE.ADBE Motion"


def tabs(s, base=1):
    """Template text indented 4 spaces per level -> Premiere's tab indentation (top-level object = 1 tab)."""
    out = []
    for ln in s.strip("\n").split("\n"):
        n = (len(ln) - len(ln.lstrip(" "))) // 4
        out.append("\t" * (base + n) + ln.lstrip(" "))
    return "\n".join(out)


def jpeg_info(path):
    """(width, height, EXIF orientation or None) from the JPEG headers, stdlib only."""
    data = open(path, "rb").read()
    if data[:2] != b"\xff\xd8":
        sys.exit(f"{path}: not a JPEG")
    i, orient, wh = 2, None, None
    while i < len(data) - 4:
        if data[i] != 0xFF:
            i += 1; continue
        m = data[i + 1]
        if m in (0xD8, 0x01) or 0xD0 <= m <= 0xD7:
            i += 2; continue
        ln = struct.unpack(">H", data[i + 2:i + 4])[0]
        seg = data[i + 4:i + 2 + ln]
        if m == 0xE1 and seg[:6] == b"Exif\0\0":
            t = seg[6:]; bo = "<" if t[:2] == b"II" else ">"
            off = struct.unpack(bo + "I", t[4:8])[0]
            for k in range(struct.unpack(bo + "H", t[off:off + 2])[0]):
                ent = t[off + 2 + 12 * k:off + 14 + 12 * k]
                if struct.unpack(bo + "H", ent[:2])[0] == 0x0112:
                    orient = struct.unpack(bo + "H", ent[8:10])[0]
        if m in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
            h, w = struct.unpack(">HH", seg[1:5]); wh = (w, h); break
        if m == 0xDA:
            break
        i += 2 + ln
    if not wh:
        sys.exit(f"{path}: no JPEG frame header")
    return wh[0], wh[1], orient


def f32(v):
    """A float as Premiere writes a float32 keyframe value: 12 decimals, trailing zeros dropped ('61.')."""
    return ("%.12f" % struct.unpack("f", struct.pack("f", v))[0]).rstrip("0")


def media_graph(p, ti):
    """(file path, keys of objects owned by this track item) for an existing VideoClipTrackItem."""
    sc = p.ref(ti.find("ClipTrackItem/SubClip"))
    vc = p.ref(sc.find("Clip"))
    src = p.ref(vc.find("Clip/Source"))
    m = src.find("MediaSource/Media")
    path = p.ref(m).findtext("FilePath") if m is not None else None
    cc = p.ref(ti.find("ClipTrackItem/ComponentOwner/Components"))
    keys = [ti.attrib["ObjectID"], cc.attrib["ObjectID"], sc.attrib["ObjectID"], vc.attrib["ObjectID"]]
    comps = cc.find("ComponentChain/Components")
    for c in (comps if comps is not None else []):
        comp = p.el[c.attrib["ObjectRef"]]
        keys.append(comp.attrib["ObjectID"])
        keys += [x.attrib["ObjectRef"] for x in comp.find("Component/Params")]
    return path, keys


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project"); ap.add_argument("placements"); ap.add_argument("out")
    ap.add_argument("--image-dir", required=True)
    ap.add_argument("--sequence"); ap.add_argument("--track", type=int, default=2)
    a = ap.parse_args()

    src_path, out_path = os.path.abspath(a.project), os.path.abspath(a.out)
    if src_path == out_path:
        sys.exit("OUT must be a new file; SOURCE is never written")
    raw = open(src_path, "rb").read()
    text = gzip.decompress(raw).decode("utf-8") if raw[:2] == b"\x1f\x8b" else raw.decode("utf-8")
    p = Project(text)
    proj_dir = os.path.dirname(out_path)

    # --- blobs we may point at: only ones stored with content in SOURCE ---
    blobs = {}
    for x in p.root.iter():
        h = x.attrib.get("BinaryHash")
        if h and x.text and x.text.strip():
            blobs[(x.tag, h)] = base64.b64decode(x.text.strip())
    mod_state = next(((h, b.decode("utf-16-le")) for (tag, h), b in blobs.items() if tag == "ModificationState"
                      and len(b) == 72 and int(h[-8:], 16) == len(b) + 12
                      and re.fullmatch(r"[0-9a-f-]{36}", b.decode("utf-16-le", "ignore"))), None)
    if not mod_state:
        sys.exit("SOURCE has no stored media ModificationState blob to re-use; refusing to invent one")
    motion_blobs = {e.find("PremiereFilterPrivateData").attrib["BinaryHash"] for e in p.root
                    if e.tag == "VideoFilterComponent" and e.findtext("MatchName") == UPPER
                    and e.find("PremiereFilterPrivateData") is not None}
    motion_hash = next((h for (tag, h) in blobs if tag == "PremiereFilterPrivateData" and h in motion_blobs), None)
    if not motion_hash:
        sys.exit("SOURCE has no stored Motion PremiereFilterPrivateData blob to re-use; refusing to invent one")

    # --- sequence / track ---
    seqs = [e for e in p.root if e.tag == "Sequence"]
    seq = next(s for s in seqs if a.sequence in (None, s.findtext("Name")))
    groups = {p.ref(tg.find("Second")).tag: p.ref(tg.find("Second")) for tg in seq.find("TrackGroups")}
    vg = groups["VideoTrackGroup"]
    frame = int(vg.findtext("TrackGroup/FrameRate"))
    if frame not in TIMECODE_FORMAT:
        sys.exit(f"sequence frame rate {TPS / frame:g} fps has no known still template")
    _, _, W, H = (int(v) for v in vg.findtext("FrameRect").split(","))
    tracks = vg.find("TrackGroup/Tracks")
    if a.track >= len(tracks):
        sys.exit(f"sequence has only {len(tracks)} video tracks")
    track_key = tracks[a.track].attrib["ObjectURef"]
    track = p.el[track_key]

    placements = json.load(open(a.placements))
    for pl in placements:
        pl["path"] = os.path.abspath(os.path.join(a.image_dir, pl["file"]))
        if not pl["path"].lower().endswith((".jpg", ".jpeg")):
            sys.exit(f"{pl['path']}: only .jpg stills are templated")
        if not os.path.isfile(pl["path"]):
            sys.exit(f"{pl['path']}: missing")
    paths = {pl["path"] for pl in placements}

    # --- 1. idempotence: drop our earlier items on the target track ---
    items = track.find("ClipTrack/ClipItems/TrackItems")
    kept, removed = [], 0
    for ref in (items if items is not None else []):
        ti = p.el[ref.attrib["ObjectRef"]]
        path, keys = media_graph(p, ti)
        if path and os.path.abspath(path) in paths:
            for k in keys:
                p.drop(k)
            removed += 1
        else:
            kept.append(ti)

    # --- 2. media: re-use by FilePath, else create the Premiere still graph ---
    existing = {e.findtext("FilePath"): e for e in p.root if e.tag == "Media" and e.findtext("FilePath")}
    new_blocks, bin_items = [], []
    grid = max([int(x.text) for x in p.root.iter("project.icon.view.grid.order")] + [-1])
    media = {}
    for path in sorted(paths):
        w, h, orient = jpeg_info(path)
        orient = None if orient == 0 else orient  # Premiere writes no orientation field for a 0 tag
        if orient not in (None, 1):  # Premiere writes OriginalImageOrientationType 1 for a tagged upright JPEG; no template for rotated
            sys.exit(f"{path}: EXIF orientation {orient} (rotated); no Premiere template for that")
        if path in existing:
            m = existing[path]
            srcobj = next(e for e in p.root if e.tag == "VideoMediaSource" and e.find("MediaSource/Media") is not None
                          and e.find("MediaSource/Media").attrib["ObjectURef"] == m.attrib["ObjectUID"])
            vclip = next(e for e in p.root if e.tag == "VideoClip" and e.find("Clip/Source").attrib["ObjectRef"] == srcobj.attrib["ObjectID"]
                         and any(c.attrib["ObjectRef"] == e.attrib["ObjectID"] for mc in p.root if mc.tag == "MasterClip" for c in mc.find("Clips")))
            master = next(mc for mc in p.root if mc.tag == "MasterClip" and any(c.attrib["ObjectRef"] == vclip.attrib["ObjectID"] for c in mc.find("Clips")))
            fr = int(p.ref(m.find("VideoStream")).findtext("FrameRate"))
            media[path] = dict(mc=master.attrib["ObjectUID"], src=srcobj.attrib["ObjectID"], w=w, h=h, fr=fr,
                               mk=vclip.find("Clip/MarkerOwner/Markers").attrib["ObjectRef"], reused=True)
            continue
        name = escape(os.path.basename(path))
        rel = os.path.relpath(path, proj_dir)
        rel = escape(rel if rel.startswith(".") else "./" + rel)
        vsid, srcid, mkid, logid, vcid, grpid = (p.oid() for _ in range(6))
        muid, mcuid, cpiuid = (str(uuid.uuid4()) for _ in range(3))
        grid += 1
        state = mod_state[1]
        mod = int(os.path.getmtime(path)) * 1000000
        orient_xml = "\n    <OriginalImageOrientationType>1</OriginalImageOrientationType>" if orient == 1 else ""
        new_blocks += [tabs(f"""
<ClipProjectItem ObjectUID="{cpiuid}" ClassID="cb4e0ed7-aca1-4171-8525-e3658dec06dd" Version="1">
    <ProjectItem Version="1">
        <Node Version="1">
            <Properties Version="1">
                <project.icon.view.grid.order>{grid}</project.icon.view.grid.order>
                <Column.PropertyText.Label>{LABEL_NAME}</Column.PropertyText.Label>
            </Properties>
            <ID>{p.nid()}</ID>
        </Node>
        <Name>{name}</Name>
    </ProjectItem>
    <MasterClip ObjectURef="{mcuid}"/>
</ClipProjectItem>"""), tabs(f"""
<MasterClip ObjectUID="{mcuid}" ClassID="fb11c33a-b0a9-4465-aa94-b6d5db2628cf" Version="12">
    <LoggingInfo ObjectRef="{logid}"/>
    <Clips Version="1">
        <Clip Index="0" ObjectRef="{vcid}"/>
    </Clips>
    <AudioClipChannelGroups ObjectRef="{grpid}"/>
    <Name>{name}</Name>
    <MasterClipChangeVersion>1</MasterClipChangeVersion>
</MasterClip>"""), tabs(f"""
<ClipLoggingInfo ObjectID="{logid}" ClassID="77ab7fdd-dcdf-465d-9906-7a330ca1e738" Version="10">
    <CaptureMode>2</CaptureMode>
    <ClipName>{name}</ClipName>
    <MediaFrameRate>{frame}</MediaFrameRate>
    <TimecodeFormat>{TIMECODE_FORMAT[frame]}</TimecodeFormat>
</ClipLoggingInfo>"""), tabs(f"""
<VideoClip ObjectID="{vcid}" ClassID="9308dbef-2440-4acb-9ab2-953b9a4e82ec" Version="11">
    <Clip Version="18">
        <Node Version="1">
            <Properties Version="1">
                <asl.clip.label.color>{LABEL_COLOR}</asl.clip.label.color>
                <BE.Prefs.StillImages.DefaultIsDropFrame>false</BE.Prefs.StillImages.DefaultIsDropFrame>
                <asl.clip.label.name>{LABEL_NAME}</asl.clip.label.name>
            </Properties>
        </Node>
        <MarkerOwner Version="1">
            <Markers ObjectRef="{mkid}"/>
        </MarkerOwner>
        <Source ObjectRef="{srcid}"/>
        <ClipID>{uuid.uuid4()}</ClipID>
        <InUse>false</InUse>
        <InPoint>0</InPoint>
        <OutPoint>{(TPS // frame) * frame}</OutPoint>
    </Clip>
</VideoClip>"""), tabs(f"""
<Markers ObjectID="{mkid}" ClassID="bee50706-b524-416c-9f03-b596ce5f6866" Version="4">
    <ByGUID>byGUID</ByGUID>
    <LastMetadataState>00000000-0000-0000-0000-000000000000</LastMetadataState>
    <LastContentState>{state}</LastContentState>
</Markers>"""), tabs(f"""
<VideoMediaSource ObjectID="{srcid}" ClassID="e64ddf74-8fac-4682-8aa8-0e0ca2248949" Version="2">
    <MediaSource Version="4">
        <Content Version="10">
        </Content>
        <Media ObjectURef="{muid}"/>
    </MediaSource>
    <OriginalDuration>{STILL_DURATION}</OriginalDuration>
</VideoMediaSource>"""), tabs(f"""
<Media ObjectUID="{muid}" ClassID="7a5c103e-f3ac-4391-b6b4-7cc3d2f9a7ff" Version="30">
    <VideoStream ObjectRef="{vsid}"/>
    <ModificationState Encoding="base64" BinaryHash="{mod_state[0]}"/>
    <RelativePath>{rel}</RelativePath>
    <ImplementationID>1fa18bfa-255c-44b1-ad73-56bcd99fceaf</ImplementationID>
    <FileKey>{uuid.uuid4()}</FileKey>
    <Infinite>true</Infinite>
    <ContentAndMetadataState>{state}</ContentAndMetadataState>
    <RelativePath>{rel}</RelativePath>
    <CCFileModTime>{mod}</CCFileModTime>
    <ActualMediaFilePath>{escape(path)}</ActualMediaFilePath>
    <FilePath>{escape(path)}</FilePath>
    <Title>{name}</Title>
</Media>"""), tabs(f"""
<VideoStream ObjectID="{vsid}" ClassID="a36e4719-3ec6-4a0c-ab11-8b4aab377aa5" Version="23">
    <Duration>{STILL_DURATION}</Duration>
    <CodecType>{JPEG_CODEC}</CodecType>
    <IsStill>true</IsStill>
    <OriginalColorSpace>{COLOR_SPACE}</OriginalColorSpace>
    <FieldTypeIsUncertain>true</FieldTypeIsUncertain>{orient_xml}
    <FrameRate>{frame}</FrameRate>
    <FrameRect>0,0,{w},{h}</FrameRect>
</VideoStream>"""), tabs(f"""
<ClipChannelGroupVectorSerializer ObjectID="{grpid}" ClassID="a3127a8c-95d4-456e-a7f5-171b3f922426" Version="1">
</ClipChannelGroupVectorSerializer>""")]
        bin_items.append(cpiuid)
        media[path] = dict(mc=mcuid, src=srcid, mk=mkid, w=w, h=h, fr=frame, reused=False)

    # --- 3. placements ---
    spans = [(int(t.findtext("ClipTrackItem/TrackItem/Start") or 0), int(t.findtext("ClipTrackItem/TrackItem/End")),
              t.attrib["ObjectID"]) for t in kept]
    report = []
    for pl in placements:
        md = media[pl["path"]]
        s, e = round(pl["in"] * TPS / frame) * frame, round(pl["out"] * TPS / frame) * frame
        if e <= s:
            sys.exit(f"{pl['file']}: empty slot")
        in0 = (3600 * TPS // md["fr"]) * md["fr"]  # Premiere places a still one hour into its infinite media
        scale = min(W / md["w"], H / md["h"]) * 100
        sv = f32(scale)
        name = escape(os.path.basename(pl["path"]))
        tiid, ccid, cid = p.oid(), p.oid(), p.oid()
        pids = [p.oid() for _ in range(11)]
        subid, clipid = p.oid(), p.oid()
        new_blocks.append(tabs(f"""
<VideoClipTrackItem ObjectID="{tiid}" ClassID="368b0406-29e3-4923-9fcd-094fbf9a1089" Version="8">
    <ClipTrackItem Version="8">
        <ComponentOwner Version="1">
            <Components ObjectRef="{ccid}"/>
        </ComponentOwner>
        <TrackItem Version="4">
            <Node Version="1">
                <ID>{p.nid()}</ID>
            </Node>
            <Start>{s}</Start>
            <End>{e}</End>
        </TrackItem>
        <SubClip ObjectRef="{subid}"/>
    </ClipTrackItem>
    <ToneMapSettings>{{"peak":-1,"version":3}}</ToneMapSettings>
    <FrameRect>0,0,{W},{H}</FrameRect>
    <PixelAspectRatio>1,1</PixelAspectRatio>
</VideoClipTrackItem>"""))
        new_blocks.append(tabs(f"""
<VideoComponentChain ObjectID="{ccid}" ClassID="0970e08a-f58f-4108-b29a-1a717b8e12e2" Version="3">
    <DefaultOpacity>true</DefaultOpacity>
    <DefaultOpacityComponentID>2</DefaultOpacityComponentID>
    <ComponentChain Version="3">
        <Node Version="1">
            <Properties Version="1">
                <MZ.ComponentChain.ActiveComponentID>2</MZ.ComponentChain.ActiveComponentID>
                <MZ.ComponentChain.ActiveComponentParamIndex>4294967295</MZ.ComponentChain.ActiveComponentParamIndex>
            </Properties>
        </Node>
        <Components Version="1">
            <Component Index="0" ObjectRef="{cid}"/>
        </Components>
    </ComponentChain>
</VideoComponentChain>"""))
        params = "\n".join(f'            <Param Index="{k}" ObjectRef="{pid}"/>' for k, pid in enumerate(pids))
        new_blocks.append(tabs(f"""
<VideoFilterComponent ObjectID="{cid}" ClassID="{MOTION_CLASS}" Version="9">
    <Component Version="7">
        <Params Version="1">
{params}
        </Params>
        <ID>1</ID>
        <Intrinsic>true</Intrinsic>
        <DisplayName>Motion</DisplayName>
    </Component>
    <PremiereFilterPrivateData Encoding="base64" BinaryHash="{motion_hash}"/>
    <VideoFilterType>2</VideoFilterType>
    <MatchName>{UPPER}</MatchName>
</VideoFilterComponent>"""))
        pt = f"{K0},0.5:0.5,0,0,0,0,0,0,5,4,0,0,0,0"
        defs = [
            ("PointComponentParam", POINT, 4, ["<Name>Position</Name>", "<ParameterID>1</ParameterID>", f"<StartKeyframe>{pt}</StartKeyframe>"]),
            ("VideoComponentParam", FLOAT, 10, ["<Name>Scale</Name>", "<ParameterID>2</ParameterID>", "<UpperUIBound>200</UpperUIBound>",
                                                f"<StartKeyframe>{K0},{sv},0,0,0,0,0,0</StartKeyframe>", "<LowerBound>0</LowerBound>", "<UpperBound>10000</UpperBound>"]),
            ("VideoComponentParam", FLOAT, 10, ["<Name>Scale Width</Name>", "<ParameterID>3</ParameterID>", "<UpperUIBound>200</UpperUIBound>",
                                                f"<StartKeyframe>{K0},{sv},0,0,0,0,0,0</StartKeyframe>", "<LowerBound>0</LowerBound>", "<UpperBound>10000</UpperBound>"]),
            ("VideoComponentParam", "cc12343e-f113-4d3b-ae05-b287db77d461", 10, ["<Name> </Name>", "<ParameterID>4</ParameterID>",
                                                                                 f"<StartKeyframe>{K0},true,0,0,0,0,0,0</StartKeyframe>"]),
            ("VideoComponentParam", FLOAT, 10, ["<Name>Rotation</Name>", "<ParameterControlType>3</ParameterControlType>", "<ParameterID>5</ParameterID>",
                                                f"<StartKeyframe>{K0},0.,0,0,0,0,0,0</StartKeyframe>", "<LowerBound>-32768</LowerBound>", "<UpperBound>32767</UpperBound>"]),
            ("PointComponentParam", POINT, 4, ["<Name>Anchor Point</Name>", "<ParameterID>6</ParameterID>", f"<StartKeyframe>{pt}</StartKeyframe>"]),
            ("VideoComponentParam", "a4ff2d6e-7ac2-44f8-9d52-17d9ca50e542", 10, ["<Name>Anti-flicker Filter</Name>", "<ParameterID>7</ParameterID>",
                                                                                 f"<StartKeyframe>{K0},0.,0,0,0,0,0,0</StartKeyframe>", "<LowerBound>0</LowerBound>", "<UpperBound>1</UpperBound>"]),
        ] + [("VideoComponentParam", FLOAT, 10, [f"<Name>Crop {n}</Name>", f"<ParameterID>{i}</ParameterID>", f"<StartKeyframe>{K0},0.,0,0,0,0,0,0</StartKeyframe>",
                                                 "<LowerBound>0</LowerBound>", "<UpperBound>100</UpperBound>"])
             for i, n in ((8, "Left"), (9, "Top"), (10, "Right"), (11, "Bottom"))]
        for pid, (tag, cls, ver, inner) in zip(pids, defs):
            new_blocks.append(f'\t<{tag} ObjectID="{pid}" ClassID="{cls}" Version="{ver}">\n'
                              + "\n".join("\t\t" + x for x in inner) + f"\n\t</{tag}>")
        new_blocks.append(tabs(f"""
<SubClip ObjectID="{subid}" ClassID="e0c58dc9-dbdd-4166-aef7-5db7e3f22e84" Version="6">
    <Clip ObjectRef="{clipid}"/>
    <MasterClip ObjectURef="{md['mc']}"/>
    <Name>{name}</Name>
    <OrigChGrp>0</OrigChGrp>
</SubClip>"""))
        new_blocks.append(tabs(f"""
<VideoClip ObjectID="{clipid}" ClassID="9308dbef-2440-4acb-9ab2-953b9a4e82ec" Version="11">
    <Clip Version="18">
        <Node Version="1">
            <Properties Version="1">
                <BE.Prefs.StillImages.DefaultIsDropFrame>false</BE.Prefs.StillImages.DefaultIsDropFrame>
            </Properties>
        </Node>
        <MarkerOwner Version="1">
            <Markers ObjectRef="{md['mk']}"/>
        </MarkerOwner>
        <Source ObjectRef="{md['src']}"/>
        <ClipID>{uuid.uuid4()}</ClipID>
        <InPoint>{in0}</InPoint>
        <OutPoint>{in0 + e - s}</OutPoint>
    </Clip>
</VideoClip>"""))
        spans.append((s, e, tiid))
        report.append(f"  {s / TPS:7.2f} – {e / TPS:7.2f}  scale {sv:<18} {md['w']}x{md['h']}  {os.path.basename(pl['path'])}")

    spans.sort()
    for (s0, e0, _), (s1, _, _) in zip(spans, spans[1:]):
        if s1 < e0:
            sys.exit("placements overlap on the target track")

    # --- 4. text edits of the three touched existing blocks ---
    ti_lines = "".join(f'\t\t\t\t\t<TrackItem Index="{i}" ObjectRef="{k}"/>\n' for i, (_, _, k) in enumerate(spans))
    ti_xml = f'\t\t\t\t<TrackItems Version="1">\n{ti_lines}\t\t\t\t</TrackItems>\n' if spans else ""
    bi = p.by_key[track_key]
    blk = p.blocks[bi]
    if re.search(r"\t\t\t\t<TrackItems Version=\"1\">\n.*?\t\t\t\t</TrackItems>\n", blk, re.S):
        blk = re.sub(r"\t\t\t\t<TrackItems Version=\"1\">\n.*?\t\t\t\t</TrackItems>\n", lambda _: ti_xml, blk, count=1, flags=re.S)
    else:
        blk, n = re.subn(r'(\t\t\t<ClipItems Version="3">\n)', lambda m: m.group(1) + ti_xml, blk, count=1)
        if n != 1:
            sys.exit("unexpected track layout")
    p.blocks[bi] = blk

    if bin_items:
        rb = next(e for e in p.root if e.tag == "RootProjectItem")
        ri = p.by_key[rb.attrib["ObjectUID"]]
        n0 = len(rb.find("ProjectItemContainer/Items"))
        add = "".join(f'\t\t\t\t<Item Index="{n0 + i}" ObjectURef="{u}"/>\n' for i, u in enumerate(bin_items))
        blk, n = re.subn(r"(\t\t\t</Items>\n\t\t</ProjectItemContainer>)", lambda m: add + m.group(1), p.blocks[ri], count=1)
        if n != 1:
            sys.exit("unexpected Root Bin layout")
        p.blocks[ri] = blk

    pr = next(e for e in p.root if e.tag == "Project" and "ObjectID" in e.attrib)
    pi = p.by_key[pr.attrib["ObjectID"]]
    cur = int(re.search(r"<NextID>(\d+)</NextID>", p.blocks[pi]).group(1))
    p.blocks[pi] = re.sub(r"<NextID>\d+</NextID>", f"<NextID>{max(cur, p.next_node)}</NextID>", p.blocks[pi], count=1)

    p.blocks += new_blocks
    out = p.text()
    ET.fromstring(out.encode("utf-8"))  # must still parse
    if " />" in "\n".join(new_blocks):
        sys.exit("internal: ' />' in a new block")

    print(f"sequence {seq.findtext('Name')!r} ({TPS / frame:g} fps, {W}x{H}): removed {removed}, placed {len(placements)} "
          f"on V{a.track + 1}; media new {len(bin_items)}, re-used {sum(m['reused'] for m in media.values())}")
    print(f"  re-used blobs: ModificationState {mod_state[0]} (state {mod_state[1]}), Motion {motion_hash}")
    print("\n".join(report))
    tmp = out_path + ".tmp"
    with gzip.open(tmp, "wb") as f:
        f.write(out.encode("utf-8"))
    os.replace(tmp, out_path)
    print("wrote:", out_path)


if __name__ == "__main__":
    main()
