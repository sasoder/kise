#!/usr/bin/env python3
"""Every track item of a saved .prproj, one line each: track, sequence in - out (seconds), enabled or OFF, RED label,
clip name. Read-only, stdlib only.

    python3 list_timeline.py PROJECT.prproj [--sequence NAME]

Selections = V1 lines marked OFF whose time is still covered by an "on" A item (the dialogue plays).
RED = label BE.Prefs.LabelColors.10 on the clip = a news card request. Multicam: V1 and V2 hold the two angles."""
import argparse, gzip, xml.etree.ElementTree as ET

T = 254016000000  # Premiere ticks per second
ap = argparse.ArgumentParser()
ap.add_argument("project"); ap.add_argument("--sequence")
a = ap.parse_args()
raw = open(a.project, "rb").read()
r = ET.fromstring(gzip.decompress(raw) if raw[:2] == b"\x1f\x8b" else raw)
by = {e.get("ObjectID") or e.get("ObjectUID"): e for e in r if e.get("ObjectID") or e.get("ObjectUID")}
ref = lambda x: None if x is None else by.get(x.get("ObjectRef") or x.get("ObjectURef"))
for seq in (e for e in r if e.tag == "Sequence" and e.get("ObjectUID") and a.sequence in (None, e.findtext("Name"))):
    print("SEQUENCE", seq.findtext("Name"))
    for tg in seq.findall("TrackGroups/TrackGroup"):
        g = ref(tg.find("Second"))
        kind = {"VideoTrackGroup": "V", "AudioTrackGroup": "A"}.get(g.tag)
        if kind == "V":
            print("  fps %.3f  frame %s" % (T / int(g.findtext("TrackGroup/FrameRate")), g.findtext("FrameRect")))
        for n, t in enumerate(g.findall("TrackGroup/Tracks/Track") if kind else [], 1):
            for ti in ref(t).findall("ClipTrack/ClipItems/TrackItems/TrackItem"):
                cti = ref(ti).find("ClipTrackItem")
                sub = ref(cti.find("SubClip"))
                clip = ref(sub.find("Clip"))
                s = int(cti.findtext("TrackItem/Start") or 0) / T
                e = int(cti.findtext("TrackItem/End")) / T
                label = clip.findtext("Clip/Node/Properties/asl.clip.label.name") if clip is not None else None
                red = (label or "").endswith("LabelColors.10")
                print(f"  {kind}{n:<2} {s:8.3f} - {e:8.3f}  {'OFF' if cti.findtext('IsMuted') == 'true' else 'on '}"
                      f"  {'RED' if red else '   '}  {sub.findtext('Name')}")
