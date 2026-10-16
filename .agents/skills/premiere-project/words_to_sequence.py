#!/usr/bin/env python3
"""Episode word timings -> sequence seconds, through the V1 items of the saved project. Read-only on the project.

    python3 words_to_sequence.py PROJECT.prproj EPISODE_word_transcript.json ACTUAL_IN OUT.json [--sequence NAME]

ACTUAL_IN: where the clip's media starts in the episode (actual_in in <Episode>_clip_timing_report.csv, "00:24:01.875",
or seconds; 0 when V1 holds the episode file itself). Each V1 item, enabled or not, maps media src_in .. src_in + its
length to its sequence start .. end (100 % speed). A word goes to the item holding its onset, else its end, so an onset
the edit cut off comes out before that item's start.
OUT, one word per line, sorted by s: {"w", "s", "e", "p", "v1", "on"} = word, start and end in sequence seconds,
probability, 1-based V1 item, whether that item is enabled."""
import argparse, gzip, json, xml.etree.ElementTree as ET

T = 254016000000  # Premiere ticks per second
ap = argparse.ArgumentParser()
ap.add_argument("project"); ap.add_argument("transcript"); ap.add_argument("actual_in"); ap.add_argument("out")
ap.add_argument("--sequence")
a = ap.parse_args()
off = sum(float(x) * 60 ** i for i, x in enumerate(reversed(a.actual_in.split(":"))))
raw = open(a.project, "rb").read()
r = ET.fromstring(gzip.decompress(raw) if raw[:2] == b"\x1f\x8b" else raw)
by = {e.get("ObjectID") or e.get("ObjectUID"): e for e in r if e.get("ObjectID") or e.get("ObjectUID")}
ref = lambda x: None if x is None else by.get(x.get("ObjectRef") or x.get("ObjectURef"))
seq = next(e for e in r if e.tag == "Sequence" and e.get("ObjectUID") and a.sequence in (None, e.findtext("Name")))
vg = next(ref(tg.find("Second")) for tg in seq.findall("TrackGroups/TrackGroup")
          if ref(tg.find("Second")).tag == "VideoTrackGroup")
v1 = []  # (sequence start, sequence end, media in, enabled), seconds
for ti in ref(vg.find("TrackGroup/Tracks/Track")).findall("ClipTrack/ClipItems/TrackItems/TrackItem"):
    cti = ref(ti).find("ClipTrackItem")
    clip = ref(ref(cti.find("SubClip")).find("Clip"))
    s, e = int(cti.findtext("TrackItem/Start") or 0) / T, int(cti.findtext("TrackItem/End")) / T
    v1.append((s, e, int(clip.findtext("Clip/InPoint") or 0) / T, cti.findtext("IsMuted") != "true"))
words = [w for sg in json.load(open(a.transcript))["segments"] for w in sg.get("words", [])]
out = []
for w in words:
    t0, t1 = w["start"] - off, w["end"] - off  # clip media time
    hit = [n for n, (s, e, src, on) in enumerate(v1) if src <= t0 < src + (e - s)] or \
          [n for n, (s, e, src, on) in enumerate(v1) if src < t1 <= src + (e - s)]
    for n in hit[:1]:
        s, e, src, on = v1[n]
        out.append(dict(w=w["word"].strip(), s=round(s + t0 - src, 3), e=round(min(e, s + t1 - src), 3),
                        p=round(w.get("probability", 1), 3), v1=n + 1, on=on))
out.sort(key=lambda x: x["s"])
open(a.out, "w").write("[\n" + ",\n".join(json.dumps(x, ensure_ascii=False) for x in out) + "\n]\n")
print(f"{len(out)} words on {len(v1)} V1 items ->", a.out)
for x in out[:3] + out[-2:]:
    print(f"  {x['s']:8.3f}  V1#{x['v1']:<3} {'on ' if x['on'] else 'OFF'}  {x['w']}")
