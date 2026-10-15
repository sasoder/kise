#!/usr/bin/env python3
"""job.json (+ the real Premiere project) -> timeline.json: the frame-snapped view of one clip's edit that the
board's timeline view draws. Spec: timeline-format.md beside this file.

Positions come from the real .prproj when there is one (it is what Premiere opens, and the editor may have trimmed
there), otherwise from the FCP7 XML, otherwise from job.json. Status, version and notes always come from job.json.
Read-only on every input. Stdlib only.

    python3 job_timeline.py <clip folder or job.json> [--prproj X] [--fcp7 X] [--assets timeline.assets.json] [-o timeline.json]
"""
import argparse, datetime, hashlib, json, os, sys
from fractions import Fraction

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import project_read

STATUSES = ["planned", "drafting", "ready for review", "approved", "needs fix"]
RATES = {23.976: Fraction(24000, 1001), 29.97: Fraction(30000, 1001), 59.94: Fraction(60000, 1001)}
PASS = ("line", "preview", "thumb", "frames", "previewMp4", "history", "scale", "pos", "focus", "ease")


def rate(fps):
    for k, v in RATES.items():
        if abs(fps - k) < 0.01:
            return v
    return Fraction(fps).limit_denominator(1001)


def stem(path):
    return os.path.splitext(os.path.basename(path or ""))[0]


def find_project(job, folder, prproj, fcp7):
    if prproj:
        return "prproj", prproj
    if fcp7:
        return "fcp7", fcp7
    p = (job.get("sequence") or {}).get("prproj")
    if p:
        p = p if os.path.isabs(p) else os.path.join(folder, p)
        if os.path.exists(p):
            return "prproj", p
    return "job", None


def build(job, folder, prproj=None, fcp7=None, assets=None, job_bytes=b""):
    seq_meta = job.get("sequence") or {}
    kind_src, ppath = find_project(job, folder, prproj, fcp7)
    seq = None
    if ppath:
        seqs = project_read.parse_prproj(ppath) if kind_src == "prproj" else project_read.parse_fcp7(ppath)
        name = seq_meta.get("name")
        seq = next((s for s in seqs if s["name"] == name), None) or max(seqs, key=lambda s: sum(map(len, s["video"])))
    fps = rate(seq["fps"] if seq else (seq_meta.get("fps") or 23.976))
    frame = lambda s: round(Fraction(s).limit_denominator(1_000_000) * fps)
    secs = lambda f: round(float(f / fps), 3)
    warnings = []
    warn = lambda i, kind, msg: warnings.append({"id": i, "kind": kind, "problem": msg})

    jobitems = {}  # file stem -> (kind, job item)
    for kind, key in (("graphic", "graphics"), ("image", "images"), ("broll", "broll")):
        for it in job.get(key) or []:
            jobitems[stem(it.get("file"))] = (kind, it)

    def item(kind, base, sf, ef, j=None, enabled=True, extra=None):
        j = j or {}
        out = {"id": j.get("id"), "kind": kind, "label": j.get("name") or stem(base), "file": j.get("file") or base,
               "status": j.get("status"), "version": j.get("version"), "note": j.get("note"),
               "enabled": enabled, "startFrame": sf, "endFrame": ef, "start": secs(sf), "end": secs(ef)}
        out.update({k: j[k] for k in PASS if k in j})
        out.update(extra or {})
        if j and out["status"] not in STATUSES:
            warn(out["id"], "status", f"unknown status {out['status']!r}")
        return out

    tracks = []
    if seq:
        v1 = next((t for t in seq["video"] if t), [])
        main = v1[0]["path"] if v1 else None
        seen = set()
        for n, track in enumerate(seq["video"]):
            if not track:
                continue
            items = []
            for c, clip in enumerate(track):
                kind = project_read.kind_of(clip["path"], main)
                sf, ef = frame(clip["start"]), frame(clip["end"])
                base = os.path.basename(clip["path"] or "")
                if kind == "source":
                    items.append(item("source", base, sf, ef, enabled=not clip["muted"],
                                      extra={"id": f"V{n + 1}-cut{c + 1}", "sourceInFrame": frame(clip["src_in"])}))
                    continue
                k, j = jobitems.get(stem(base), (kind, None))
                if j:
                    seen.add(stem(base))
                    if j.get("in") is not None and j.get("out") is not None:
                        js, je = frame(j["in"]), frame(j["out"])
                        if abs(js - sf) > 1 or abs(je - ef) > 1:
                            warn(j.get("id"), "moved",
                                 f"{stem(base)} is at frames {sf}-{ef} in the project, job.json says {js}-{je}")
                elif kind in ("graphic", "image"):
                    warn(None, "untracked", f"{base} is in the project (V{n + 1}) but not in job.json")
                items.append(item(k, base, sf, ef, j, enabled=not clip["muted"]))
            kinds = sorted({i["kind"] for i in items})
            tracks.append({"id": f"V{n + 1}", "kind": kinds[0] if len(kinds) == 1 else "mixed", "kinds": kinds, "items": items})
        for s, (kind, j) in jobitems.items():
            if s not in seen:
                warn(j.get("id"), "missing", f"{s} is in job.json but not in the project")
        dur_f = max([i["endFrame"] for t in tracks for i in t["items"]] + [0])
        width, height = seq["size"]
    else:
        src = job.get("source") or {}
        dur = (src.get("out") or 0) - (src.get("in") or 0)
        dur_f = frame(dur) if dur > 0 else 0
        tracks.append({"id": "V1", "kind": "source", "kinds": ["source"], "items": [item(
            "source", src.get("file"), 0, dur_f, extra={"id": "V1-cut1", "sourceInFrame": frame(src.get("in") or 0)})]})
        by_track = {}
        for s, (kind, j) in jobitems.items():
            if j.get("in") is None or j.get("out") is None:
                warn(j.get("id"), "timing", "missing in/out")
                continue
            by_track.setdefault(j.get("track") or (2 if kind == "graphic" else 1), []).append(
                item(kind, os.path.basename(j.get("file") or ""), frame(j["in"]), frame(j["out"]), j))
        for n in sorted(by_track):
            items = sorted(by_track[n], key=lambda i: i["startFrame"])
            kinds = sorted({i["kind"] for i in items})
            tracks.append({"id": f"V{n + 1}", "kind": kinds[0] if len(kinds) == 1 else "mixed", "kinds": kinds, "items": items})
        width, height = seq_meta.get("width"), seq_meta.get("height")

    for t in tracks:
        live = sorted((i for i in t["items"] if i["enabled"]), key=lambda i: i["startFrame"])
        if t["kind"] != "source":
            for a, b in zip(live, live[1:]):
                if b["startFrame"] < a["endFrame"]:
                    warn(b["id"], "overlap", f"{b['label']} overlaps {a['label']} on {t['id']}")
        for i in t["items"]:
            if i["endFrame"] <= i["startFrame"]:
                warn(i["id"], "timing", f"{i['label']} ends before it starts")
            elif dur_f and i["endFrame"] > dur_f:
                warn(i["id"], "timing", f"{i['label']} runs past the end of the clip")
            f = i.get("file")
            if i["kind"] != "source" and f and not os.path.isabs(f) and os.path.isdir(folder) \
                    and not os.path.exists(os.path.join(folder, f)):
                warn(i["id"], "file", f"file not found: {f}")

    mtime = lambda p: datetime.datetime.fromtimestamp(os.path.getmtime(p), datetime.timezone.utc).isoformat(timespec="seconds")
    tracked = [i for t in tracks for i in t["items"] if i["kind"] != "source" and i["status"]]
    tl = {
        "schema": 1, "clip": job.get("clip"), "client": job.get("client"), "status": job.get("status"),
        "sourceOfTruth": kind_src, "project": os.path.basename(ppath) if ppath else None,
        "projectMtime": mtime(ppath) if ppath else None,
        "generatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "generatedOn": "mac" if sys.platform == "darwin" or folder.startswith("/Users/") else "cloud",
        "jobSha1": hashlib.sha1(job_bytes).hexdigest() if job_bytes else None,
        "fps": float(fps), "fpsRational": [fps.numerator, fps.denominator], "width": width, "height": height,
        "duration": secs(dur_f), "durationFrames": dur_f,
        "tracks": tracks,
        "counts": {s: sum(1 for i in tracked if i["status"] == s) for s in STATUSES},
        # graphics in the project that job.json doesn't know about block the render until someone tracks them
        "allApproved": bool(tracked) and all(i["status"] == "approved" for i in tracked if i["enabled"])
                       and not any(w["kind"] == "untracked" for w in warnings),
        "warnings": warnings,
    }
    if assets:  # sidecar built on the Mac: {"proxy": {...}, "waveform": {...}, "items": {"<id>": {...}}}
        tl.update({k: v for k, v in assets.items() if k != "items"})
        per = assets.get("items") or {}
        for t in tracks:
            for i in t["items"]:
                i.update(per.get(i["id"] or "", {}))
    return tl


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("job", help="clip folder or job.json")
    ap.add_argument("--prproj"); ap.add_argument("--fcp7"); ap.add_argument("--assets")
    ap.add_argument("-o", "--out")
    a = ap.parse_args()
    jp = os.path.join(a.job, "job.json") if os.path.isdir(a.job) else a.job
    raw = open(jp, "rb").read()
    folder = os.path.dirname(os.path.abspath(jp))
    side = a.assets or os.path.join(folder, "timeline.assets.json")
    assets = json.load(open(side)) if os.path.exists(side) else None
    tl = build(json.loads(raw), folder, a.prproj, a.fcp7, assets, raw)
    text = json.dumps(tl, indent=1, ensure_ascii=False)
    if a.out:
        tmp = a.out + ".tmp"
        with open(tmp, "w") as f:
            f.write(text)
        os.replace(tmp, a.out)
    else:
        sys.stdout.write(text + "\n")
