#!/usr/bin/env python3
"""job.json: one file per clip folder that every pipeline step reads and writes.

Format: /mnt/project-files/pipeline/job-schema.md (copy in pipeline/job-schema.md).

    python3 pipeline/job.py import     CLIPDIR            build or refresh job.json from the files already there
    python3 pipeline/job.py sync       CLIPDIR [--prproj F] in/out/track from the real .prproj timeline (hand trims win)
    python3 pipeline/job.py status     CLIPDIR            one line per graphic and image
    python3 pipeline/job.py set        CLIPDIR ID [--status S] [--note TEXT]
    python3 pipeline/job.py placements CLIPDIR [--write]  placements.txt from job.json (stdout unless --write)
    python3 pipeline/job.py assembly   CLIPDIR [--out F]  assembly JSON for scripts/prproj_assemble.py
    python3 pipeline/job.py run        CLIPDIR [--dry-run] [--no-agent] [--no-assemble]
        kickoff (no graphics yet) or revision (graphics marked "needs fix") through the agent,
        then re-import, placements.txt, and a NEW <clip>_graphics.prproj (the source .prproj is only read).

Agent command: $KISE_AGENT (default "claude -p"), run in the kise repo with the prompt as its last argument.
Standard library only. Never deletes or overwrites a .prproj or a .mov.
"""
import argparse, json, math, os, re, shlex, shutil, subprocess, sys, tempfile, time

KISE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATUSES = ["planned", "drafting", "ready for review", "approved", "needs fix", "dropped"]
VIDEO = {".mov", ".mp4", ".mxf", ".m4v"}
GFX_RE = re.compile(r"^(?P<prefix>\d+(?:\.\d+)?)_(?P<name>[A-Za-z0-9]+?)(?:_V(?P<v>\d+))?\.mov$")


# --- file helpers ------------------------------------------------------------------------------

def load(clipdir):
    p = os.path.join(clipdir, "job.json")
    return json.load(open(p)) if os.path.isfile(p) else None


def save(clipdir, job):
    """Atomic write; keeps fields this tool does not know about (they are in `job` already)."""
    job["updated"] = time.strftime("%Y-%m-%dT%H:%M:%S")
    os.makedirs(os.path.join(clipdir, ".job"), exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=clipdir, prefix=".job.", suffix=".json")
    with os.fdopen(fd, "w") as f:
        json.dump(job, f, indent=2, ensure_ascii=False)
        f.write("\n")
    os.replace(tmp, os.path.join(clipdir, "job.json"))
    tl = os.path.join(os.path.dirname(os.path.abspath(__file__)), "job_timeline.py")
    if os.path.isfile(tl):  # the board's timeline view (format owned by the editor clones thread)
        subprocess.run([sys.executable, tl, clipdir, "-o", os.path.join(clipdir, ".job", "timeline.json")],
                       capture_output=True)


def ffprobe_bin():
    return shutil.which("ffprobe") or next((p for p in ("/opt/homebrew/bin/ffprobe", "/usr/local/bin/ffprobe") if os.path.exists(p)), None)


def probe(path):
    """(fps, frames, width, height) or None."""
    fp = ffprobe_bin()
    if not fp:
        return None
    try:
        r = subprocess.run([fp, "-v", "error", "-select_streams", "v:0", "-show_entries",
                            "stream=r_frame_rate,nb_frames,width,height:format=duration", "-of", "json", path],
                           capture_output=True, text=True, timeout=30)
        d = json.loads(r.stdout)
        s = d["streams"][0]
        n, dn = (int(x) for x in s["r_frame_rate"].split("/"))
        fps = n / dn if dn else 0
        frames = int(s.get("nb_frames") or round(float(d["format"]["duration"]) * fps))
        return round(fps, 3), frames, s.get("width"), s.get("height")
    except Exception:
        return None


def secs(tok):
    """'00:00:28.719' / '0:06.640' / '28.719' -> seconds."""
    parts = tok.split(":")
    v = 0.0
    for p in parts:
        v = v * 60 + float(p)
    return v


# --- reading what is already in a clip folder --------------------------------------------------

def gfx_dir(clipdir):
    g = os.path.join(clipdir, "graphics")
    return g if os.path.isdir(g) else clipdir


def placements_text(clipdir):
    for d in (gfx_dir(clipdir), clipdir):
        p = os.path.join(d, "placements.txt")
        if os.path.isfile(p):
            return open(p, errors="replace").read()
    return ""


def old_assembly(clipdir):
    """The newest assembly JSON an earlier run wrote (what is actually on the timeline)."""
    cands = [os.path.join(clipdir, ".job", "assembly.json"), os.path.join(gfx_dir(clipdir), "assembly.json")]
    for root in ("animation_source/notes", "animation_source/scripts", "animation_source"):
        cands.append(os.path.join(clipdir, root, "assembly.json"))
    cands = [c for c in cands if os.path.isfile(c)]
    if not cands:
        return {}
    try:
        return json.load(open(max(cands, key=os.path.getmtime)))
    except Exception:
        return {}


TIME = r"(\d+:\d+:\d+(?:\.\d+)?|\d+:\d+(?:\.\d+)?|\d+\.\d+)"


def parse_line(text, fname):
    """In-point, spoken line and flags for one graphic from free-form placements.txt prose."""
    out = {}
    for ln in text.splitlines():
        if fname not in ln:
            continue
        rest = ln.split(fname, 1)[1]
        if "in" not in out:
            m = re.search(r"\bin\b[\s:|]*" + TIME, rest) or re.match(r"[\s|]+" + TIME, rest)
            if m:
                out["in"] = secs(m.group(1))
            elif re.search(r"same in[- ]point", rest, re.I):
                out["same_in"] = True
        if "line" not in out:
            q = re.search(r"[\"“](.+?)[\"”]", rest)
            if q:
                out["line"] = q.group(1)
            else:
                t = re.search(r"\d+-\d+\s{2,}(.+?)(?:\s{2,}\(|$)", rest)  # table form: frames  line  (note)
                if t:
                    out["line"] = t.group(1).strip()
        if re.search(r"not on the timeline|superseded|unused", rest, re.I):
            out["off"] = True
        if re.search(r"use this one|\bCURRENT\b|use V\d", rest, re.I):
            out["current"] = True
    return out


def scan_graphics(clipdir):
    """{name: {versions: [(v, relpath)], prefix}} for every NN_Name[_Vn].mov in the clip and its old/."""
    found = {}
    gdir = gfx_dir(clipdir)
    for d in {gdir, clipdir, os.path.join(gdir, "old"), os.path.join(clipdir, "old")}:
        if not os.path.isdir(d):
            continue
        for f in sorted(os.listdir(d)):
            m = GFX_RE.match(f)
            if not m:
                continue
            e = found.setdefault(m["name"], {"prefix": m["prefix"], "versions": []})
            in_old = os.path.basename(d) == "old"
            v = int(m["v"]) if m["v"] else (0 if in_old else None)
            e["versions"].append({"v": v, "rel": os.path.relpath(os.path.join(d, f), clipdir), "old": in_old})
    for name, e in found.items():
        live = [x for x in e["versions"] if not x["old"]]
        olds = [x for x in e["versions"] if x["old"]]
        # A live file without a suffix is V1 when only it exists, or the newest when old/ holds earlier ones
        # (the "new version keeps the original name" rule).
        for x in live:
            if x["v"] is None:
                x["v"] = (max((o["v"] or 1) for o in olds) + 1) if olds else 1
        for x in olds:
            x["v"] = x["v"] or 1
        e["versions"].sort(key=lambda x: (x["v"], not x["old"]))
    return found


def source_video(clipdir):
    name = os.path.basename(os.path.normpath(clipdir))
    vids = [f for f in os.listdir(clipdir) if os.path.splitext(f)[1].lower() in VIDEO and not GFX_RE.match(f)]
    same = [f for f in vids if os.path.splitext(f)[0] == name]
    if same:
        return same[0]
    return max(vids, key=lambda f: os.path.getsize(os.path.join(clipdir, f))) if vids else None


def import_job(clipdir):
    clipdir = os.path.abspath(clipdir)
    job = load(clipdir) or {"schema": 1}
    job.setdefault("clip", os.path.basename(clipdir))
    parts = clipdir.split(os.sep)
    if "tom fant" in parts and len(parts) > parts.index("tom fant") + 1:
        job.setdefault("client", parts[parts.index("tom fant") + 1])
    projs = sorted(f for f in os.listdir(clipdir) if f.endswith(".prproj") and not f.endswith("_graphics.prproj"))
    src = source_video(clipdir)
    seq = job.setdefault("sequence", {})
    if projs:
        seq.setdefault("prproj", projs[0])
    if src:
        s = job.setdefault("source", {"file": src})
        pr = probe(os.path.join(clipdir, src))
        if pr:  # the source clip, not the (usually vertical) sequence, whose settings live in the .prproj
            s.setdefault("fps", pr[0])
            s.setdefault("width", pr[2])
            s.setdefault("height", pr[3])
    for f in os.listdir(clipdir):
        if f.endswith(".srt"):
            job.setdefault("srt", f)
    words = os.path.join(clipdir, "animation_source", "notes", "words.json")
    if os.path.isfile(words):
        job.setdefault("words", os.path.relpath(words, clipdir))

    text = placements_text(clipdir)
    asm = old_assembly(clipdir)
    asm_g = {os.path.basename(i["path"]): i for i in asm.get("graphics", {}).get("items", [])}
    have = {g["name"]: g for g in job.get("graphics", [])}
    graphics = []
    for name, e in sorted(scan_graphics(clipdir).items(), key=lambda kv: float(kv[1]["prefix"])):
        live = [x for x in e["versions"] if not x["old"]]
        if not live:
            continue
        # the current file: one marked "use this one"/CURRENT, else one on the old timeline, else the newest
        marked = [x for x in live if parse_line(text, os.path.basename(x["rel"])).get("current")]
        on_tl = [x for x in live if os.path.basename(x["rel"]) in asm_g]
        cur = (marked or on_tl or live)[-1]
        fname = os.path.basename(cur["rel"])
        info = parse_line(text, fname)
        g = have.get(name, {"id": "g_" + name, "name": name})
        if fname in asm_g:
            g["in"], g["out"] = round(asm_g[fname]["in"], 3), round(asm_g[fname]["out"], 3)
            g["xfade_in"], g["xfade_out"] = asm_g[fname].get("xfade_in", 0), asm_g[fname].get("xfade_out", 0)
            g["track"] = asm.get("graphics", {}).get("track", 2)
        else:
            first = os.path.basename(live[0]["rel"])
            base = parse_line(text, first) if first != fname else {}
            t_in = info.get("in", base.get("in"))
            if t_in is None:
                t_in = float(e["prefix"])  # the file name's prefix is the in-point in seconds, rounded
                g["in_guessed"] = True
            g["in"] = round(t_in, 3)
            pr = probe(os.path.join(clipdir, cur["rel"]))
            if pr and pr[0]:
                # Snap to the sequence's frames without running past the media (a 24 fps graphic in a 23.976
                # sequence is slightly shorter in sequence frames than in its own).
                fps = seq.get("fps") or job.get("source", {}).get("fps") or pr[0]
                f_in = round(t_in * fps)
                f_out = f_in + math.floor(pr[1] / pr[0] * fps + 1e-6)
                g["in"], g["out"] = round(f_in / fps, 6), round(f_out / fps, 6)
        g["line"] = g.get("line") or info.get("line") or parse_line(text, os.path.basename(live[0]["rel"])).get("line")
        g["file"] = cur["rel"]
        g["version"] = cur["v"]
        g["history"] = [{"version": x["v"], "file": x["rel"]} for x in e["versions"] if x is not cur]
        if "status" not in g:
            if info.get("off") and not info.get("current"):
                g["status"] = "dropped"
            else:
                g["status"] = "approved" if delivered(clipdir, name) else "ready for review"
        g.setdefault("note", None)
        g.setdefault("track", 2)
        graphics.append(g)
    job["graphics"] = graphics

    imgs = import_images(clipdir, asm, {i["file"]: i for i in job.get("images", [])})
    if imgs:
        job["images"] = imgs
    if job.get("sequence", {}).get("prproj"):
        try:
            for c in sync_prproj(job, clipdir):
                print("timeline:", c, file=sys.stderr)
        except Exception as e:
            print(f"could not read the .prproj timeline ({e}); kept placements/assembly times", file=sys.stderr)
    job["status"] = clip_status(job)
    return job


def import_images(clipdir, asm, have):
    idir = os.path.join(clipdir, "images")
    meta = {}
    p = os.path.join(idir, "placements.json")
    if os.path.isfile(p):
        try:
            for it in json.load(open(p)):
                meta[it["file"]] = it
        except Exception:
            pass
    sec = asm.get("images", {})
    items = {it["file"]: it for it in sec.get("items", [])}
    out = []
    for f in sorted(set(meta) | set(items), key=lambda f: (items.get(f) or meta.get(f) or {}).get("in", 0)):
        rel = os.path.join("images", f)
        i = have.get(rel, {"id": "i_" + re.sub(r"\W+", "", os.path.splitext(f)[0])[:48], "file": rel})
        for k, v in {**meta.get(f, {}), **items.get(f, {})}.items():
            if k != "file":
                i.setdefault(k, v)
        i.setdefault("track", sec.get("track", 1))
        i.setdefault("status", "approved" if f in items else "ready for review")
        i.setdefault("note", None)
        out.append(i)
    return out


def delivered(clipdir, name):
    """A graphic of this name sits in the clip's final/ folder (any version)."""
    for d in (os.path.join(clipdir, "final"), os.path.join(gfx_dir(clipdir), "final")):
        if os.path.isdir(d) and any((m := GFX_RE.match(f)) and m["name"] == name for f in os.listdir(d)):
            return True
    return False


def clip_status(job):
    items = [x for x in job.get("graphics", []) + job.get("images", []) if x.get("status") != "dropped"]
    if job.get("status") in ("rendered", "delivered"):
        return job["status"]
    if not items:
        return "cut" if job.get("source") else "raw"
    st = {x.get("status") for x in items}
    if st == {"approved"}:
        return "approved"
    if st <= {"approved", "ready for review"}:
        return "ready for review"
    return "graphics"


# --- reading the real timeline (hand trims in Premiere win over job.json) --------------------------------

def read_prproj(path, seq_name=None):
    sys.path.insert(0, os.path.join(KISE, "scripts"))
    import gzip, prproj_assemble as pa
    raw = open(path, "rb").read()
    text = gzip.decompress(raw).decode("utf-8") if raw[:2] == b"\x1f\x8b" else raw.decode("utf-8")
    return pa.read_sequence(text, seq_name), pa.TPS


def current_prproj(job, clipdir):
    """The .prproj that holds the latest edit: the original or its _graphics copy, whichever was saved last."""
    src = job.get("sequence", {}).get("prproj")
    if not src:
        return None
    cands = [src, os.path.splitext(src)[0] + "_graphics.prproj"]
    cands = [c for c in cands if os.path.isfile(os.path.join(clipdir, c))]
    return max(cands, key=lambda c: os.path.getmtime(os.path.join(clipdir, c))) if cands else None


def sync_prproj(job, clipdir, prproj=None):
    """Update in/out/track of graphics and images from what is actually on the .prproj timeline (V2 and up);
    add graphics that exist only there. Returns a list of change lines."""
    clipdir = os.path.abspath(clipdir)
    prproj = prproj or current_prproj(job, clipdir)
    if not prproj:
        return []
    sq, tps = read_prproj(os.path.join(clipdir, prproj), job.get("sequence", {}).get("name"))
    job.setdefault("sequence", {}).setdefault("name", sq["name"])
    job["sequence"].update({"timebase": sq["frame"], "width": sq["W"], "height": sq["H"]})
    by_name = {g["name"]: g for g in job.get("graphics", [])}
    by_img = {os.path.basename(i["file"]): i for i in job.get("images", [])}
    seen, changes = set(), []
    rel = lambda p: os.path.relpath(p, clipdir) if p.startswith(clipdir + os.sep) else p
    for ti, tr in enumerate(sq["video"]):
        if ti == 0:
            continue
        for it in tr["items"]:
            if not it["path"]:
                continue
            base = os.path.basename(it["path"])
            t_in, t_out = round(it["start"] / tps, 6), round(it["end"] / tps, 6)
            m = GFX_RE.match(base)
            if m and not it["still"]:
                g = by_name.get(m["name"])
                if g is None:
                    g = {"id": "g_" + m["name"], "name": m["name"], "file": rel(it["path"]),
                         "version": int(m["v"] or 1), "status": "ready for review", "note": None, "history": []}
                    job.setdefault("graphics", []).append(g)
                    by_name[m["name"]] = g
                    changes.append(f"added {m['name']} (only on the timeline)")
                if abs(g.get("in", -1) - t_in) > 1e-3 or abs(g.get("out", -1) - t_out) > 1e-3 or g.get("track") != ti:
                    changes.append(f"{m['name']}: {g.get('in')}-{g.get('out')} -> {t_in}-{t_out} on V{ti + 1}")
                g.update({"in": t_in, "out": t_out, "track": ti, "on_timeline": True, "enabled": it["enabled"]})
                g.pop("in_guessed", None)
                if it["media_in"]:
                    g["media_in"] = round(it["media_in"] / tps, 6)
                seen.add(g["id"])
            elif it["still"] and base in by_img:
                i = by_img[base]
                if abs(i.get("in", -1) - t_in) > 1e-3 or abs(i.get("out", -1) - t_out) > 1e-3:
                    changes.append(f"{base}: {i.get('in')}-{i.get('out')} -> {t_in}-{t_out}")
                i.update({"in": t_in, "out": t_out, "track": ti, "on_timeline": True, "enabled": it["enabled"]})
                seen.add(i["id"])
    for x in job.get("graphics", []) + job.get("images", []):
        if x["id"] not in seen and x.get("status") != "planned":
            x["on_timeline"] = False
    job["synced"] = {"prproj": prproj, "at": time.strftime("%Y-%m-%dT%H:%M:%S")}
    return changes


# --- derived files -----------------------------------------------------------------------------

def placements(job):
    fps = job.get("sequence", {}).get("fps") or job.get("source", {}).get("fps") or 24
    rows = [g for g in job.get("graphics", []) if g.get("status") != "dropped"]
    w = max([len(os.path.basename(g["file"])) for g in rows] + [4])
    lines = [f"{job.get('clip')} - graphics placements (generated from job.json {job.get('updated', '')}; edit job.json, not this file)",
             f"sequence {fps} fps; in/out are sequence seconds; each graphic starts at its media frame 0", "",
             f"{'file'.ljust(w)}  {'in (s)':>8}  {'out (s)':>8}  {'status':<16}  line"]
    for g in rows:
        lines.append(f"{os.path.basename(g['file']).ljust(w)}  {g.get('in', 0):8.3f}  {g.get('out', 0) or 0:8.3f}  "
                     f"{g.get('status', ''):<16}  {g.get('line') or ''}")
        if g.get("note"):
            lines.append(f"{''.ljust(w)}  note: {g['note']}")
    old = [h["file"] for g in rows for h in g.get("history", [])]
    if old:
        lines += ["", "Previous versions: " + ", ".join(old)]
    return "\n".join(lines) + "\n"


def write_placements(clipdir, job):
    """placements.txt, unless the one there was written by hand: then placements.generated.txt beside it."""
    p = os.path.join(gfx_dir(clipdir), "placements.txt")
    if os.path.isfile(p) and "generated from job.json" not in open(p, errors="replace").readline():
        p = os.path.join(gfx_dir(clipdir), "placements.generated.txt")
    open(p, "w").write(placements(job))
    return p


def assembly(job, clipdir, statuses=("drafting", "ready for review", "approved", "needs fix")):
    """Everything that has a rendered file: a graphic waiting on a fix keeps its current version on the timeline."""
    clipdir = os.path.abspath(clipdir)
    out = {}
    gs = [g for g in job.get("graphics", []) if g.get("status") in statuses and g.get("out")]
    if gs:
        out["graphics"] = {"track": gs[0].get("track", 2), "items": [
            {"path": os.path.join(clipdir, g["file"]), "in": g["in"], "out": g["out"],
             "xfade_in": g.get("xfade_in", 0), "xfade_out": g.get("xfade_out", 0)} for g in gs]}
    ims = [i for i in job.get("images", []) if i.get("status") in statuses]
    if ims:
        keys = ("in", "out", "scale", "pos", "ease", "xfade_in", "xfade_out")
        out["images"] = {"track": ims[0].get("track", 1), "dir": os.path.join(clipdir, "images"), "items": [
            {"file": os.path.relpath(os.path.join(clipdir, i["file"]), os.path.join(clipdir, "images")),
             **{k: i[k] for k in keys if k in i}} for i in ims]}
    return out


# --- the one-command run -----------------------------------------------------------------------

def kickoff_prompt(job, clipdir):
    return (f"Create motion graphics in: {job.get('source', {}).get('file') or job['clip']}\n"
            f"Working folder: {os.path.abspath(clipdir)}\n\n"
            "Run this as a clip job (AGENTS.md). Style: "
            f"{job.get('style') or 'pick from the client (AGENTS.md, Styles)'}. Render every cut into graphics/ "
            "under the usual <in>_<Name>.mov names. Before rendering, write the planned cuts into job.json "
            "in the working folder (format: pipeline/job-schema.md) with status 'drafting'; set each to "
            "'ready for review' once its render passes review. Do not ask questions: decide and report.")


def revision_prompt(job, clipdir, todo):
    items = "\n".join(f"- {g['name']} ({g['file']}, in {g.get('in')}s, now V{g.get('version', 1)}): {g.get('note') or 'no note'}"
                      for g in todo)
    return (f"Revise motion graphics in: {job['clip']}\nWorking folder: {os.path.abspath(clipdir)}\n\n"
            f"These graphics were marked 'needs fix' in job.json, with the reviewer's note:\n{items}\n\n"
            "For each: rebuild from its src/Root.<Name>.tsx, render the new version under the SAME file name, "
            "move the previous file to old/<file>_V<n>.mov (AGENTS.md, 'Deliver'), and set its "
            "status in job.json to 'ready for review'. Touch nothing else. Do not ask questions.")


def run(clipdir, dry=False, agent=True, assemble=True):
    clipdir = os.path.abspath(clipdir)
    job = load(clipdir) or import_job(clipdir)
    if job.get("sequence", {}).get("prproj") and not dry:
        try:
            sync_prproj(job, clipdir)
        except Exception as e:
            print(f"could not read the .prproj timeline: {e}", file=sys.stderr)
    todo = [g for g in job.get("graphics", []) if g.get("status") == "needs fix"]
    prompt = None
    if not [g for g in job.get("graphics", []) if g.get("status") != "dropped"]:
        prompt = kickoff_prompt(job, clipdir)
    elif todo:
        prompt = revision_prompt(job, clipdir, todo)
        for g in todo:
            g["status"] = "drafting"
    if prompt and agent:
        cmd = shlex.split(os.environ.get("KISE_AGENT", "claude -p")) + [prompt]
        print("agent:", " ".join(shlex.quote(c) for c in cmd[:-1]), "<prompt>", file=sys.stderr)
        print(prompt, file=sys.stderr)
        if dry:
            return 0
        save(clipdir, job)
        r = subprocess.run(cmd, cwd=KISE)
        if r.returncode:
            print(f"agent exited {r.returncode}; job.json left as is", file=sys.stderr)
            return r.returncode
        job = load(clipdir) or job
        for g in todo:  # the note was acted on: keep it in the history, clear it
            cur = next((x for x in job.get("graphics", []) if x.get("id") == g["id"]), None)
            if cur and cur.get("note"):
                cur.setdefault("notes", []).append({"version": g.get("version"), "note": cur["note"]})
                cur["note"] = None
        save(clipdir, job)
    elif not prompt:
        print("nothing to build: no graphics marked 'needs fix'", file=sys.stderr)
    if dry:
        return 0
    job = import_job(clipdir)
    save(clipdir, job)
    write_placements(clipdir, job)
    if assemble:
        return assemble_prproj(job, clipdir)
    return 0


def assemble_prproj(job, clipdir):
    """Write <clip>_graphics.prproj from the newest edit (so your trims in the _graphics copy survive a re-run).
    A previous _graphics copy moves to old/ first; nothing is deleted."""
    src = current_prproj(job, clipdir)
    if not src:
        print("no .prproj in the clip folder: skipped assembly", file=sys.stderr)
        return 0
    base = os.path.splitext(job["sequence"]["prproj"])[0]
    out = os.path.join(clipdir, base + "_graphics.prproj")
    jd = os.path.join(clipdir, ".job")
    os.makedirs(jd, exist_ok=True)
    ap = os.path.join(jd, "assembly.pending.json")  # becomes assembly.json once Premiere's copy is written
    json.dump(assembly(job, clipdir), open(ap, "w"), indent=1)
    tmp = os.path.join(jd, "assembling.prproj")
    cmd = [sys.executable, os.path.join(KISE, "scripts", "prproj_assemble.py"), os.path.join(clipdir, src), ap, tmp]
    seq = job.get("sequence", {}).get("name")
    if seq:
        cmd += ["--sequence", seq]
    r = subprocess.run(cmd)
    if r.returncode or not os.path.isfile(tmp):
        print("assembly failed; nothing in the clip folder changed", file=sys.stderr)
        return r.returncode or 1
    if os.path.isfile(out):
        os.makedirs(os.path.join(clipdir, "old"), exist_ok=True)
        stamp = time.strftime("%Y%m%d-%H%M%S")
        os.replace(out, os.path.join(clipdir, "old", f"{base}_graphics_{stamp}.prproj"))
        if os.path.isfile(os.path.splitext(out)[0] + ".xml"):
            os.replace(os.path.splitext(out)[0] + ".xml", os.path.join(clipdir, "old", f"{base}_graphics_{stamp}.xml"))
    os.replace(tmp, out)
    if os.path.isfile(os.path.join(jd, "assembling.xml")):
        os.replace(os.path.join(jd, "assembling.xml"), os.path.splitext(out)[0] + ".xml")
    os.replace(ap, os.path.join(jd, "assembly.json"))
    print("wrote", out)
    return 0


# --- cli ---------------------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    for c in ("import", "sync", "status", "placements", "assembly", "run", "set"):
        p = sub.add_parser(c)
        p.add_argument("clipdir")
        if c == "import":
            p.add_argument("--print", action="store_true", help="print instead of writing job.json")
        if c == "placements":
            p.add_argument("--write", action="store_true")
        if c == "sync":
            p.add_argument("--prproj", help="a .prproj in the clip folder other than the job's")
        if c == "assembly":
            p.add_argument("--out")
        if c == "run":
            p.add_argument("--dry-run", action="store_true")
            p.add_argument("--no-agent", action="store_true")
            p.add_argument("--no-assemble", action="store_true")
        if c == "set":
            p.add_argument("id")
            p.add_argument("--status", choices=STATUSES)
            p.add_argument("--note")
            p.add_argument("--by", default=os.environ.get("USER"))
    a = ap.parse_args()
    d = a.clipdir
    if a.cmd == "import":
        job = import_job(d)
        if a.print:
            print(json.dumps(job, indent=2, ensure_ascii=False))
        else:
            save(d, job)
            print(f"job.json: {len(job['graphics'])} graphics, {len(job.get('images', []))} images, status {job['status']}")
        return 0
    job = load(d)
    if job is None:
        sys.exit("no job.json here; run: job.py import " + shlex.quote(d))
    if a.cmd == "sync":
        ch = sync_prproj(job, d, a.prproj)
        job["status"] = clip_status(job)
        save(d, job)
        print("\n".join(ch) or "job.json already matches the timeline")
        return 0
    if a.cmd == "status":
        print(f"{job.get('clip')}: {job.get('status')}")
        for x in job.get("graphics", []) + job.get("images", []):
            print(f"  {x['id']:<40} {x.get('status', ''):<16} {x.get('in', 0):7.2f}  {x.get('note') or ''}")
    elif a.cmd == "set":
        x = next((x for x in job.get("graphics", []) + job.get("images", []) if x["id"] == a.id), None)
        if not x:
            sys.exit("no item " + a.id)
        if a.status:
            x["status"] = a.status
        if a.note is not None:
            x["note"] = a.note or None
            if a.note and not a.status:
                x["status"] = "needs fix"
        x.setdefault("log", []).append({"at": time.strftime("%Y-%m-%dT%H:%M:%S"), "by": a.by,
                                        "version": x.get("version"), "status": x["status"], "note": x.get("note")})
        job["status"] = clip_status(job)
        save(d, job)
    elif a.cmd == "placements":
        txt = placements(job)
        if a.write:
            print("wrote", write_placements(d, job))
        else:
            sys.stdout.write(txt)
    elif a.cmd == "assembly":
        s = json.dumps(assembly(job, d), indent=1)
        open(a.out, "w").write(s) if a.out else print(s)
    elif a.cmd == "run":
        return run(d, a.dry_run, not a.no_agent, not a.no_assemble)
    return 0


if __name__ == "__main__":
    sys.exit(main())
