#!/usr/bin/env python3
"""Assemble stills (Ken Burns + Cross Dissolves) and rendered .mov graphics onto a Premiere Pro sequence, writing a NEW
copy of a saved .prproj (Premiere stays closed), plus an FCP7 xmeml fallback of the whole sequence.

    python3 scripts/prproj_assemble.py SOURCE.prproj assembly.json OUT.prproj [--sequence NAME] [--allow-running]

assembly.json (times in sequence seconds, snapped to frames; transitions in frames):
  {"images": {"track": 1, "dir": "/abs/images", "items": [
      {"file": "12.3_Baghdad_X.jpg", "in": 12.25, "out": 15.6,
       "scale": [s0, s1],             # percent of native pixels at the first / last visible frame (default: fit whole)
       "pos": [[x0, y0], [x1, y1]],   # image centre in normalised frame coords (0.5, 0.5 = centred) at first / last frame
       "ease": true,                  # bezier ease in/out on both keyframes (false: linear)
       "xfade_in": 8, "xfade_out": 8} # Cross Dissolve frames (see below)
   ]},
   "graphics": {"track": 2, "items": [{"path": "/abs/00_X.mov", "in": 0.5, "out": 11.542, "xfade_in": 0, "xfade_out": 0}]}}
  "track" is the video track index (0 = V1, which is refused: the footage stays untouched).
  Either section may carry "remove": ["file.jpg", ...] (relative to "dir"): items on that track using those files are
  removed and not placed again.

Transitions (Premiere's Cross Dissolve = AE.AE_Impact_Dissolve in Premiere 26):
  - two of our items butting on a track (a.out == b.in) with a.xfade_out or b.xfade_in > 0 get ONE dissolve centred on the
    cut, length max(a.xfade_out, b.xfade_in) (floor(L/2) frames before the cut, the rest after; both clips need media
    handles: stills always have them, a .mov starting at media 0 has none, so that case is refused);
  - an edge that meets empty track gets a one-sided dissolve inside the clip (a fade over the tracks below).
Keyframes (stills): Scale and Position get two keyframes each, at the first and the last VISIBLE frame of the still,
  i.e. including the handle it shows under a centred dissolve, so the move never freezes inside a dissolve. Equal start
  and end values give a static (non-keyframed) param. Keyframe times are media times: the clip's InPoint (one hour into the
  infinite still, as Premiere places stills) + the offset from the track item's Start.
Graphics: .mov at default Motion (Scale 100), media from 0, exactly like scripts/prproj_insert.py.

Rules (same as prproj_insert.py / prproj_insert_stills.py, whose object graphs this re-uses):
  - never invent a BinaryHash: new Media re-use SOURCE's stored ModificationState blob, Motion re-uses SOURCE's Motion
    PremiereFilterPrivateData blob; the Cross Dissolve graph has no blob at all;
  - every new object graph is cloned from what Premiere 26.5.1 wrote:
      still media / still track item / Motion ......... prproj_insert_stills.py (Sheppard_Cajamarca_infinite_KD.prproj)
      keyframed Scale / Position (linear + ease) ....... SarahWar_Both_sides_overreached_in_Korea.prproj (stills 294, 296),
                                                         Sheppard_Atahualpa_ambush.prproj (pure ease, linear position)
      Cross Dissolve VideoTransitionTrackItem + comp ... SarahWar_Both_sides_overreached_in_Korea.prproj (302 head, 307 tail;
                                                         component 664 + its 30 params, verbatim); two-sided Alignment from
                                                         Tuberculosis.prproj 7228 (Alignment = cut - transition Start)
      .mov media / track item .......................... prproj_insert.py (opened in Premiere twice)
  - idempotent: items on the target tracks that use the given files are removed first (with their chains, Motion, params,
    SubClip, clip and attached transitions); media already in the project (by FilePath) is re-used;
  - untouched objects stay byte for byte; touched existing blocks: the target tracks (ClipItems / TransitionItems lists),
    the Root Bin (Items), Project NextID (and, on re-runs only, a kept item's reference to a removed transition);
  - SOURCE is only read; OUT must be a different path. OUT.xml (same name, .xml) is the xmeml fallback.
"""
import argparse, gzip, json, math, os, re, struct, subprocess, sys, urllib.parse
import xml.etree.ElementTree as ET
from xml.sax.saxutils import escape

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from prproj_insert import Project, TPS, stored_blobs, media_mod_state, ensure_mov_media, add_mov_item  # noqa: E402
from prproj_insert_stills import (reusable_blobs, still_media, still_item, media_graph, set_track_items,  # noqa: E402
                                  append_bin_items, bump_next_id, f32, K0, TIMECODE_FORMAT)

PREMIERE_PROCS = ("Adobe Premiere Pro 2026", "Adobe Premiere Pro 2025", "Adobe Premiere Pro")
MOTION = "AE.ADBE Motion"
XD_MATCH, XD_NAME = "AE.AE_Impact_Dissolve", "Cross Dissolve"
EASE_INFL, LIN_INFL = 1 / 3, 1 / 6  # Premiere's influences: ease keyframes 33.3 %, linear keyframes 16.7 %

# Cross Dissolve component exactly as Premiere 26.5.1 wrote it (Korea project, component 664 + params), ids as {C}/{P0..29}
XD_COMPONENT = """	<VideoFilterComponent ObjectID="{C}" ClassID="d10da199-beea-4dd1-b941-ed3a78766d50" Version="9">
		<Component Version="7">
			<Params Version="1">
				<Param Index="0" ObjectRef="{P0}"/>
				<Param Index="1" ObjectRef="{P1}"/>
				<Param Index="2" ObjectRef="{P2}"/>
				<Param Index="3" ObjectRef="{P3}"/>
				<Param Index="4" ObjectRef="{P4}"/>
				<Param Index="5" ObjectRef="{P5}"/>
				<Param Index="6" ObjectRef="{P6}"/>
				<Param Index="7" ObjectRef="{P7}"/>
				<Param Index="8" ObjectRef="{P8}"/>
				<Param Index="9" ObjectRef="{P9}"/>
				<Param Index="10" ObjectRef="{P10}"/>
				<Param Index="11" ObjectRef="{P11}"/>
				<Param Index="12" ObjectRef="{P12}"/>
				<Param Index="13" ObjectRef="{P13}"/>
				<Param Index="14" ObjectRef="{P14}"/>
				<Param Index="15" ObjectRef="{P15}"/>
				<Param Index="16" ObjectRef="{P16}"/>
				<Param Index="17" ObjectRef="{P17}"/>
				<Param Index="18" ObjectRef="{P18}"/>
				<Param Index="19" ObjectRef="{P19}"/>
				<Param Index="20" ObjectRef="{P20}"/>
				<Param Index="21" ObjectRef="{P21}"/>
				<Param Index="22" ObjectRef="{P22}"/>
				<Param Index="23" ObjectRef="{P23}"/>
				<Param Index="24" ObjectRef="{P24}"/>
				<Param Index="25" ObjectRef="{P25}"/>
				<Param Index="26" ObjectRef="{P26}"/>
				<Param Index="27" ObjectRef="{P27}"/>
				<Param Index="28" ObjectRef="{P28}"/>
				<Param Index="29" ObjectRef="{P29}"/>
			</Params>
			<DisplayName>Cross Dissolve</DisplayName>
		</Component>
		<VideoFilterType>2</VideoFilterType>
		<MatchName>AE.AE_Impact_Dissolve</MatchName>
	</VideoFilterComponent>
	<VideoComponentParam ObjectID="{P0}" ClassID="cc12343e-f113-4d3b-ae05-b287db77d461" Version="10">
		<Name>Error occurred</Name>
		<ParameterControlType>16</ParameterControlType>
		<ParameterID>8100</ParameterID>
		<StartKeyframe>-91445760000000000,false,0,0,0,0,0,0</StartKeyframe>
	</VideoComponentParam>
	<VideoComponentParam ObjectID="{P1}" ClassID="cc12343e-f113-4d3b-ae05-b287db77d461" Version="10">
		<Name>Transition Timing</Name>
		<ParameterControlType>11</ParameterControlType>
		<ParameterID>8120</ParameterID>
		<StartKeyframe>-91445760000000000,false,0,0,0,0,0,0</StartKeyframe>
		<UpperBound>false</UpperBound>
	</VideoComponentParam>
	<VideoComponentParam ObjectID="{P2}" ClassID="a4ff2d6e-7ac2-44f8-9d52-17d9ca50e542" Version="10">
		<Name>Start</Name>
		<ParameterID>2</ParameterID>
		<StartKeyframe>-91445760000000000,0.,0,0,0,0,0,0</StartKeyframe>
		<LowerBound>0</LowerBound>
		<UpperBound>100</UpperBound>
	</VideoComponentParam>
	<VideoComponentParam ObjectID="{P3}" ClassID="a4ff2d6e-7ac2-44f8-9d52-17d9ca50e542" Version="10">
		<Name>End</Name>
		<ParameterID>3</ParameterID>
		<StartKeyframe>-91445760000000000,100.,0,0,0,0,0,0</StartKeyframe>
		<LowerBound>0</LowerBound>
		<UpperBound>100</UpperBound>
	</VideoComponentParam>
	<VideoComponentParam ObjectID="{P4}" ClassID="cc12343e-f113-4d3b-ae05-b287db77d461" Version="10">
		<Name>Transition Timing</Name>
		<ParameterControlType>12</ParameterControlType>
		<ParameterID>8121</ParameterID>
		<StartKeyframe>-91445760000000000,false,0,0,0,0,0,0</StartKeyframe>
		<UpperBound>false</UpperBound>
	</VideoComponentParam>
	<VideoComponentParam ObjectID="{P5}" ClassID="cc12343e-f113-4d3b-ae05-b287db77d461" Version="10">
		<Name>Controls</Name>
		<ParameterControlType>11</ParameterControlType>
		<ParameterID>19</ParameterID>
		<StartKeyframe>-91445760000000000,false,0,0,0,0,0,0</StartKeyframe>
		<UpperBound>false</UpperBound>
	</VideoComponentParam>
	<VideoComponentParam ObjectID="{P6}" ClassID="cc12343e-f113-4d3b-ae05-b287db77d461" Version="10">
		<ParameterControlType>16</ParameterControlType>
		<ParameterID>8040</ParameterID>
		<StartKeyframe>-91445760000000000,false,0,0,0,0,0,0</StartKeyframe>
	</VideoComponentParam>
	<VideoComponentParam ObjectID="{P7}" ClassID="a4ff2d6e-7ac2-44f8-9d52-17d9ca50e542" Version="10">
		<Name>Seed</Name>
		<ParameterID>22</ParameterID>
		<StartKeyframe>-91445760000000000,0.,0,0,0,0,0,0</StartKeyframe>
		<LowerBound>0</LowerBound>
		<UpperBound>99999</UpperBound>
	</VideoComponentParam>
	<VideoComponentParam ObjectID="{P8}" ClassID="cc12343e-f113-4d3b-ae05-b287db77d461" Version="10">
		<Name>Visual Curve Editor</Name>
		<ParameterControlType>11</ParameterControlType>
		<ParameterID>8020</ParameterID>
		<StartKeyframe>-91445760000000000,false,0,0,0,0,0,0</StartKeyframe>
		<UpperBound>false</UpperBound>
	</VideoComponentParam>
	<ArbVideoComponentParam ObjectID="{P9}" ClassID="313e54d4-6903-49ad-b0bf-8262cdd10f4e" Version="3">
		<Name>Curve Graph</Name>
		<ParameterControlType>9</ParameterControlType>
		<ParameterID>8022</ParameterID>
		<StartKeyframePosition>-91445760000000000</StartKeyframePosition>
	</ArbVideoComponentParam>
	<VideoComponentParam ObjectID="{P10}" ClassID="a4ff2d6e-7ac2-44f8-9d52-17d9ca50e542" Version="10">
		<Name>Ease In</Name>
		<ParameterID>16</ParameterID>
		<StartKeyframe>-91445760000000000,34.,0,0,0,0,0,0</StartKeyframe>
		<LowerBound>0</LowerBound>
		<UpperBound>100</UpperBound>
	</VideoComponentParam>
	<VideoComponentParam ObjectID="{P11}" ClassID="a4ff2d6e-7ac2-44f8-9d52-17d9ca50e542" Version="10">
		<Name>Ease Out</Name>
		<ParameterID>17</ParameterID>
		<StartKeyframe>-91445760000000000,34.,0,0,0,0,0,0</StartKeyframe>
		<LowerBound>0</LowerBound>
		<UpperBound>100</UpperBound>
	</VideoComponentParam>
	<VideoComponentParam ObjectID="{P12}" ClassID="cc12343e-f113-4d3b-ae05-b287db77d461" Version="10">
		<Name>Visual Curve Editor</Name>
		<ParameterControlType>12</ParameterControlType>
		<ParameterID>8021</ParameterID>
		<StartKeyframe>-91445760000000000,false,0,0,0,0,0,0</StartKeyframe>
		<UpperBound>false</UpperBound>
	</VideoComponentParam>
	<VideoComponentParam ObjectID="{P13}" ClassID="6e02e8bb-2569-46b2-8ab1-4ab11c43e9c8" Version="10">
		<Name>Type</Name>
		<DiscontinuousInterpolate>true</DiscontinuousInterpolate>
		<ParameterID>5</ParameterID>
		<StartKeyframe>-91445760000000000,0,0,0,0,0,0,0</StartKeyframe>
		<LowerBound>0</LowerBound>
		<UpperBound>4</UpperBound>
	</VideoComponentParam>
	<VideoComponentParam ObjectID="{P14}" ClassID="6e02e8bb-2569-46b2-8ab1-4ab11c43e9c8" Version="10">
		<Name>Type</Name>
		<DiscontinuousInterpolate>true</DiscontinuousInterpolate>
		<ParameterID>34</ParameterID>
		<StartKeyframe>-91445760000000000,0,0,0,0,0,0,0</StartKeyframe>
		<LowerBound>0</LowerBound>
		<UpperBound>3</UpperBound>
	</VideoComponentParam>
	<VideoComponentParam ObjectID="{P15}" ClassID="a4ff2d6e-7ac2-44f8-9d52-17d9ca50e542" Version="10">
		<Name>Focus Amount</Name>
		<ParameterID>31</ParameterID>
		<StartKeyframe>-91445760000000000,0.,0,0,0,0,0,0</StartKeyframe>
		<LowerBound>0</LowerBound>
		<UpperBound>100</UpperBound>
	</VideoComponentParam>
	<PointComponentParam ObjectID="{P16}" ClassID="ca81d347-309b-44d2-acc7-1c572efb973c" Version="4">
		<Name>Focus Position</Name>
		<ParameterID>32</ParameterID>
		<StartKeyframe>-91445760000000000,0.5:0.5,0,0,0,0,0,0,5,4,0,0,0,0</StartKeyframe>
	</PointComponentParam>
	<VideoComponentParam ObjectID="{P17}" ClassID="cc12343e-f113-4d3b-ae05-b287db77d461" Version="10">
		<Name>Invert Focus</Name>
		<ParameterID>33</ParameterID>
		<StartKeyframe>-91445760000000000,false,0,0,0,0,0,0</StartKeyframe>
	</VideoComponentParam>
	<VideoComponentParam ObjectID="{P18}" ClassID="cc12343e-f113-4d3b-ae05-b287db77d461" Version="10">
		<Name>Controls</Name>
		<ParameterControlType>12</ParameterControlType>
		<ParameterID>20</ParameterID>
		<StartKeyframe>-91445760000000000,false,0,0,0,0,0,0</StartKeyframe>
		<UpperBound>false</UpperBound>
	</VideoComponentParam>
	<VideoComponentParam ObjectID="{P19}" ClassID="6e02e8bb-2569-46b2-8ab1-4ab11c43e9c8" Version="10">
		<Name>_ Overlay Mode</Name>
		<DiscontinuousInterpolate>true</DiscontinuousInterpolate>
		<ParameterID>8280</ParameterID>
		<StartKeyframe>-91445760000000000,0,0,0,0,0,0,0</StartKeyframe>
		<LowerBound>0</LowerBound>
		<UpperBound>2</UpperBound>
	</VideoComponentParam>
	<VideoComponentParam ObjectID="{P20}" ClassID="cc12343e-f113-4d3b-ae05-b287db77d461" Version="10">
		<Name>_ Overlay Info</Name>
		<ParameterID>8281</ParameterID>
		<StartKeyframe>-91445760000000000,false,0,0,0,0,0,0</StartKeyframe>
	</VideoComponentParam>
	<VideoComponentParam ObjectID="{P21}" ClassID="cc12343e-f113-4d3b-ae05-b287db77d461" Version="10">
		<ParameterControlType>16</ParameterControlType>
		<ParameterID>8141</ParameterID>
		<StartKeyframe>-91445760000000000,false,0,0,0,0,0,0</StartKeyframe>
	</VideoComponentParam>
	<VideoComponentParam ObjectID="{P22}" ClassID="a4ff2d6e-7ac2-44f8-9d52-17d9ca50e542" Version="10">
		<Name>_ Applied Version</Name>
		<ParameterID>24</ParameterID>
		<StartKeyframe>-91445760000000000,260501.,0,0,0,0,0,0</StartKeyframe>
		<LowerBound>0</LowerBound>
		<UpperBound>999999</UpperBound>
	</VideoComponentParam>
	<VideoComponentParam ObjectID="{P23}" ClassID="a4ff2d6e-7ac2-44f8-9d52-17d9ca50e542" Version="10">
		<ParameterID>8300</ParameterID>
		<StartKeyframe>-91445760000000000,0.,0,0,0,0,0,0</StartKeyframe>
		<LowerBound>0</LowerBound>
		<UpperBound>16777215</UpperBound>
	</VideoComponentParam>
	<VideoComponentParam ObjectID="{P24}" ClassID="a4ff2d6e-7ac2-44f8-9d52-17d9ca50e542" Version="10">
		<ParameterID>8301</ParameterID>
		<StartKeyframe>-91445760000000000,0.,0,0,0,0,0,0</StartKeyframe>
		<LowerBound>0</LowerBound>
		<UpperBound>16777215</UpperBound>
	</VideoComponentParam>
	<VideoComponentParam ObjectID="{P25}" ClassID="2f2eb0a3-318c-4a93-99fc-f1d319edc864" Version="10">
		<Name>_ Source B Layer</Name>
		<ParameterID>9000</ParameterID>
		<StartKeyframe>-91445760000000000,4294967293,0,0,0,0,0,0</StartKeyframe>
	</VideoComponentParam>
	<VideoComponentParam ObjectID="{P26}" ClassID="cc12343e-f113-4d3b-ae05-b287db77d461" Version="10">
		<Name>_ Overlay Enabled</Name>
		<ParameterID>9020</ParameterID>
		<StartKeyframe>-91445760000000000,false,0,0,0,0,0,0</StartKeyframe>
	</VideoComponentParam>
	<VideoComponentParam ObjectID="{P27}" ClassID="a4ff2d6e-7ac2-44f8-9d52-17d9ca50e542" Version="10">
		<Name>_ Sequence Width</Name>
		<ParameterID>9040</ParameterID>
		<StartKeyframe>-91445760000000000,-1.,0,0,0,0,0,0</StartKeyframe>
		<LowerBound>-1</LowerBound>
		<UpperBound>1000000000</UpperBound>
	</VideoComponentParam>
	<VideoComponentParam ObjectID="{P28}" ClassID="a4ff2d6e-7ac2-44f8-9d52-17d9ca50e542" Version="10">
		<Name>_ Sequence Height</Name>
		<ParameterID>9041</ParameterID>
		<StartKeyframe>-91445760000000000,-1.,0,0,0,0,0,0</StartKeyframe>
		<LowerBound>-1</LowerBound>
		<UpperBound>1000000000</UpperBound>
	</VideoComponentParam>
	<VideoComponentParam ObjectID="{P29}" ClassID="a4ff2d6e-7ac2-44f8-9d52-17d9ca50e542" Version="10">
		<Name>_ Sequence Pixel Ratio</Name>
		<ParameterID>9042</ParameterID>
		<StartKeyframe>-91445760000000000,-1.,0,0,0,0,0,0</StartKeyframe>
		<LowerBound>-1</LowerBound>
		<UpperBound>1000000000</UpperBound>
	</VideoComponentParam>"""
XD_PARAMS = 30


def g(v):
    """A double as Premiere writes keyframe tangents ('%.17g'; zero as '0')."""
    return "0" if v == 0 else "%.17g" % v


def f32d(v):
    """float32-rounded value as a double (Premiere stores param values as float32)."""
    return struct.unpack("f", struct.pack("f", v))[0]


def scalar_param(name, pid, sv0, keys, ease, extra_head=(), bounds=("<UpperUIBound>200</UpperUIBound>",),
                 tail=("<LowerBound>0</LowerBound>", "<UpperBound>10000</UpperBound>")):
    """Inner lines of a float VideoComponentParam: static at sv0, or keyframed [(t, v), (t, v)]."""
    if not keys:
        return [f"<Name>{name}</Name>", *extra_head, f"<ParameterID>{pid}</ParameterID>", *bounds,
                f"<StartKeyframe>{K0},{f32(sv0)},0,0,0,0,0,0</StartKeyframe>", *tail]
    (t0, v0), (t1, v1) = keys
    a, b = f32d(v0), f32d(v1)
    if ease:
        k0 = f"{t0},{f32(v0)},5,0,0,{g(EASE_INFL)},0,{g(EASE_INFL)}"
        k1 = f"{t1},{f32(v1)},5,0,0,{g(EASE_INFL)},0,{g(EASE_INFL)}"
    else:
        sp = (b - a) / ((t1 - t0) / TPS)
        k0 = f"{t0},{f32(v0)},0,0,0,{g(LIN_INFL)},{g(sp)},{g(LIN_INFL)}"
        k1 = f"{t1},{f32(v1)},0,0,{g(sp)},{g(LIN_INFL)},0,{g(LIN_INFL)}"
    return [f"<Name>{name}</Name>", *extra_head, "<IsTimeVarying>true</IsTimeVarying>", f"<ParameterID>{pid}</ParameterID>", *bounds,
            f"<StartKeyframe>{K0},{f32(v0)},0,0,0,0,0,0</StartKeyframe>", f"<Keyframes>{k0};{k1};</Keyframes>", *tail]


def pt(v):
    return "%.17g:%.17g" % (f32d(v[0]), f32d(v[1]))


def point_param(name, pid, p0, keys, ease):
    """Inner lines of a PointComponentParam (normalised frame coords): static at p0, or keyframed [(t, (x, y)), ...]."""
    if not keys:
        return [f"<Name>{name}</Name>", f"<ParameterID>{pid}</ParameterID>",
                f"<StartKeyframe>{K0},{pt(p0)},0,0,0,0,0,0,5,4,0,0,0,0</StartKeyframe>"]
    (t0, a), (t1, b) = keys
    dx, dy = f32d(b[0]) - f32d(a[0]), f32d(b[1]) - f32d(a[1])
    tx, ty = dx / 6, dy / 6  # Premiere's spatial tangents: one sixth of the segment, out of the first, into the second
    if ease:
        tm = f"5,0,0,{g(EASE_INFL)},0,{g(EASE_INFL)}"
        k0, k1 = f"{t0},{pt(a)},{tm}", f"{t1},{pt(b)},{tm}"
    else:
        sp = math.hypot(dx, dy) / ((t1 - t0) / TPS)
        k0 = f"{t0},{pt(a)},0,0,0,{g(LIN_INFL)},{g(sp)},{g(LIN_INFL)}"
        k1 = f"{t1},{pt(b)},0,0,{g(sp)},{g(LIN_INFL)},0,{g(LIN_INFL)}"
    k0 += f",5,4,0,0,{g(tx)},{g(ty)}"
    k1 += f",5,4,{g(-tx)},{g(-ty)},0,0"
    return [f"<Name>{name}</Name>", "<IsTimeVarying>true</IsTimeVarying>", f"<ParameterID>{pid}</ParameterID>",
            f"<StartKeyframe>{K0},{pt(a)},0,0,0,0,0,0,5,4,0,0,0,0</StartKeyframe>", f"<Keyframes>{k0};{k1};</Keyframes>"]


def transition_blocks(tid, cid, pids, start, end, outgoing, incoming, alignment):
    item = (f'\t<VideoTransitionTrackItem ObjectID="{tid}" ClassID="3eeaed31-f78e-4144-b8e8-077656517181" Version="6">\n'
            f'\t\t<TransitionTrackItem Version="3">\n\t\t\t<TrackItem Version="4">\n'
            + (f"\t\t\t\t<Start>{start}</Start>\n" if start else "")
            + f"\t\t\t\t<End>{end}</End>\n\t\t\t</TrackItem>\n"
            f"\t\t\t<HasOutgoingClip>{str(outgoing).lower()}</HasOutgoingClip>\n"
            f"\t\t\t<HasIncomingClip>{str(incoming).lower()}</HasIncomingClip>\n"
            f"\t\t\t<DisplayName>{XD_NAME}</DisplayName>\n\t\t\t<MatchName>{XD_MATCH}</MatchName>\n"
            f"\t\t\t<Alignment>{alignment}</Alignment>\n\t\t</TransitionTrackItem>\n"
            f'\t\t<VideoFilterComponent ObjectRef="{cid}"/>\n\t</VideoTransitionTrackItem>')
    comp = XD_COMPONENT.replace("{C}", cid)
    for i in reversed(range(XD_PARAMS)):  # reversed: {P1} must not eat {P10}
        comp = comp.replace("{P%d}" % i, pids[i])
    assert "{" not in comp
    return [item, comp]


def transition_keys(p, tid):
    """Keys of a transition's graph (item, component, params)."""
    tr = p.el[tid]
    comp = p.el[tr.find("VideoFilterComponent").attrib["ObjectRef"]]
    return [tid, comp.attrib["ObjectID"]] + [x.attrib["ObjectRef"] for x in comp.find("Component/Params")]


def premiere_running():
    return any(subprocess.run(["pgrep", "-x", n], capture_output=True).returncode == 0 for n in PREMIERE_PROCS)


# ----------------------------------------------------------------------------------------------------------------------
# reader: the whole sequence as plain data (used for the report, the xmeml fallback and the tests)

def parse_keys(param):
    """[(media ticks, value)] of a keyframed param, or [(None, value)] for a static one; value float or (x, y)."""
    def val(s):
        return tuple(float(c) for c in s.split(":")) if ":" in s else (s == "true" if s in ("true", "false") else float(s))
    if param.findtext("IsTimeVarying") == "true" and param.findtext("Keyframes"):
        out = []
        for k in param.findtext("Keyframes").strip().strip(";").split(";"):
            f = k.split(",")
            out.append((int(f[0]), val(f[1]), int(f[2])))
        return out
    f = param.findtext("StartKeyframe").split(",")
    return [(None, val(f[1]), 0)]


def read_sequence(text, seq_name=None):
    r = ET.fromstring(text.encode("utf-8"))
    el = {e.attrib.get("ObjectID") or e.attrib.get("ObjectUID"): e for e in r if "ObjectID" in e.attrib or "ObjectUID" in e.attrib}
    ref = lambda e: el[e.attrib.get("ObjectRef") or e.attrib.get("ObjectURef")]
    seq = next(s for s in r if s.tag == "Sequence" and seq_name in (None, s.findtext("Name")))
    groups = {ref(tg.find("Second")).tag: ref(tg.find("Second")) for tg in seq.find("TrackGroups")}
    vg, ag = groups["VideoTrackGroup"], groups.get("AudioTrackGroup")
    frame = int(vg.findtext("TrackGroup/FrameRate"))
    _, _, W, H = (int(v) for v in vg.findtext("FrameRect").split(","))

    def media_of(clip):
        src = ref(clip.find("Clip/Source"))
        m = src.find("MediaSource/Media")
        if m is None:
            return None, None
        med = ref(m)
        return med.findtext("FilePath"), med

    def transition(tr):
        t = tr.find("TransitionTrackItem")
        comp = ref(tr.find("VideoFilterComponent"))
        return dict(id=tr.attrib["ObjectID"], start=int(t.findtext("TrackItem/Start") or 0), end=int(t.findtext("TrackItem/End")),
                    outgoing=t.findtext("HasOutgoingClip") == "true", incoming=t.findtext("HasIncomingClip") == "true",
                    alignment=int(t.findtext("Alignment") or 0), name=t.findtext("DisplayName"), match=comp.findtext("MatchName"))

    video = []
    for tref in vg.find("TrackGroup/Tracks"):
        track = ref(tref)
        items, trans = [], []
        lst = track.find("ClipTrack/ClipItems/TrackItems")
        for x in (lst if lst is not None else []):
            ti = ref(x)
            cti = ti.find("ClipTrackItem")
            clip = ref(ref(cti.find("SubClip")).find("Clip"))
            path, med = media_of(clip)
            vs = ref(med.find("VideoStream")) if med is not None and med.find("VideoStream") is not None else None
            it = dict(id=ti.attrib["ObjectID"], path=path, start=int(cti.findtext("TrackItem/Start") or 0), end=int(cti.findtext("TrackItem/End")),
                      media_in=int(clip.findtext("Clip/InPoint") or 0), media_out=int(clip.findtext("Clip/OutPoint") or 0),
                      enabled=cti.findtext("IsMuted") != "true", still=vs is not None and vs.findtext("IsStill") == "true",
                      size=tuple(int(v) for v in vs.findtext("FrameRect").split(",")[2:]) if vs is not None else None,
                      media_dur=int(vs.findtext("Duration")) if vs is not None else None,
                      media_rate=int(vs.findtext("FrameRate")) if vs is not None and vs.findtext("FrameRate") else frame,
                      scale=[(None, 100.0, 0)], pos=[(None, (0.5, 0.5), 0)], head=None, tail=None)
            cc = ref(cti.find("ComponentOwner/Components"))
            comps = cc.find("ComponentChain/Components")
            for c in (comps if comps is not None else []):
                comp = ref(c)
                if comp.findtext("MatchName") == MOTION:
                    for pr in comp.find("Component/Params"):
                        pe = ref(pr)
                        if pe.findtext("ParameterID") == "1":
                            it["pos"] = parse_keys(pe)
                        elif pe.findtext("ParameterID") == "2":
                            it["scale"] = parse_keys(pe)
            for k in ("Head", "Tail"):
                x2 = cti.find(k + "Transition")
                if x2 is not None:
                    it[k.lower()] = transition(ref(x2))
            items.append(it)
        tl = track.find("ClipTrack/TransitionItems/TrackItems")
        for x in (tl if tl is not None else []):
            trans.append(transition(ref(x)))
        video.append(dict(items=items, transitions=trans))
    audio = []
    for tref in (ag.find("TrackGroup/Tracks") if ag is not None else []):
        track = ref(tref)
        items = []
        lst = track.find("ClipTrack/ClipItems/TrackItems")
        for x in (lst if lst is not None else []):
            ti = ref(x)
            cti = ti.find("ClipTrackItem")
            clip = ref(ref(cti.find("SubClip")).find("Clip"))
            path, med = media_of(clip)
            items.append(dict(path=path, start=int(cti.findtext("TrackItem/Start") or 0), end=int(cti.findtext("TrackItem/End") or 0),
                              media_in=int(clip.findtext("Clip/InPoint") or 0), enabled=cti.findtext("IsMuted") != "true"))
        audio.append(items)
    return dict(name=seq.findtext("Name"), frame=frame, W=W, H=H, video=video, audio=audio)


def report(sq, tracks):
    fr = sq["frame"]
    sec = lambda t: f"{t / TPS:8.3f}s"
    lines = []
    for ti in tracks:
        tr = sq["video"][ti]
        lines.append(f"V{ti + 1}: {len(tr['items'])} items, {len(tr['transitions'])} transitions")
        for it in tr["items"]:
            lines.append(f"  {sec(it['start'])} – {sec(it['end'])} ({(it['end'] - it['start']) // fr:4d} f)  {os.path.basename(it['path'] or '?')}"
                         + ("" if it["enabled"] else "  [disabled]"))
            for nm in ("scale", "pos"):
                ks = it[nm]
                fmt = (lambda v: "%.4f:%.4f" % v) if nm == "pos" else (lambda v: "%.3f" % v)
                if ks[0][0] is None:
                    lines.append(f"      {nm:5} static {fmt(ks[0][1])}")
                else:  # media time -> timeline time
                    lines.append(f"      {nm:5} " + "  ->  ".join(
                        f"{fmt(v)} @ {sec(it['start'] + t - it['media_in']).strip()} ({'ease' if fl == 5 else 'linear'})" for t, v, fl in ks))
            for k in ("head", "tail"):
                t = it[k]
                if t:
                    kind = "centred" if t["outgoing"] and t["incoming"] else "one-sided"
                    lines.append(f"      {k} {t['name']} ({t['match']}) {sec(t['start']).strip()} – {sec(t['end']).strip()} "
                                 f"{(t['end'] - t['start']) // fr} f {kind}, cut at +{t['alignment'] // fr} f")
    return "\n".join(lines)


# ----------------------------------------------------------------------------------------------------------------------
# FCP7 xmeml fallback

def pathurl(path):
    return "file://localhost" + urllib.parse.quote(path, safe="/")


def write_xmeml(sq, xml_path, seq_label):
    fr = sq["frame"]
    ntsc = "TRUE" if fr == 10594584000 else "FALSE"
    tb = round(TPS / fr) if ntsc == "FALSE" else 24
    rate = f"<rate><timebase>{tb}</timebase><ntsc>{ntsc}</ntsc></rate>"
    F = lambda t: int(round(t / fr))
    files, media_dur = {}, {}
    W, H = sq["W"], sq["H"]

    def file_xml(path, it=None, audio=False):
        if path in files:
            return f'<file id="{files[path]}"/>'
        fid = files[path] = f"file-{len(files) + 1}"
        name = escape(os.path.basename(path))
        if it is not None and it["still"]:
            w, h = it["size"]
            return (f'<file id="{fid}"><name>{name}</name><pathurl>{pathurl(path)}</pathurl>{rate}<duration>86400</duration>'
                    f'<media><video><samplecharacteristics><width>{w}</width><height>{h}</height></samplecharacteristics></video></media></file>')
        dur = F(it["media_dur"]) if it is not None and it["media_dur"] else 0
        w, h = it["size"] if it is not None and it["size"] else (W, H)
        aud = "<audio><samplecharacteristics><depth>16</depth><samplerate>48000</samplerate></samplecharacteristics><channelcount>2</channelcount></audio>" if audio else ""
        return (f'<file id="{fid}"><name>{name}</name><pathurl>{pathurl(path)}</pathurl>{rate}<duration>{dur}</duration>'
                f'<media><video><samplecharacteristics>{rate}<width>{w}</width><height>{h}</height></samplecharacteristics></video>{aud}</media></file>')

    def motion_xml(it, vis0, mi):
        sc, ps = it["scale"], it["pos"]
        if sc[0][0] is None and abs(sc[0][1] - 100) < 1e-6 and ps[0][0] is None and ps[0][1] == (0.5, 0.5):
            return ""
        def when(t):  # keyframe times live in the clip's in/out (media frame) space, as Premiere exports them
            return mi + F(it["start"] + t - it["media_in"]) - vis0
        s = (f"<parameter authoringApp=\"PremierePro\"><parameterid>scale</parameterid><name>Scale</name><valuemin>0</valuemin>"
             f"<valuemax>1000</valuemax><value>{sc[0][1]:.4f}</value>")
        if sc[0][0] is not None:
            s += "".join(f"<keyframe><when>{when(t)}</when><value>{v:.4f}</value></keyframe>" for t, v, _ in sc)
        s += "</parameter>"
        # Premiere's xmeml centre: offset from the sequence centre in SOURCE media pixels, y down
        mw, mh = it["size"] or (W, H)
        c = lambda v: f"<horiz>{(v[0] - 0.5) * W / mw:.6f}</horiz><vert>{(v[1] - 0.5) * H / mh:.6f}</vert>"
        s += (f"<parameter authoringApp=\"PremierePro\"><parameterid>center</parameterid><name>Center</name>"
              f"<value>{c(ps[0][1])}</value>")
        if ps[0][0] is not None:
            s += "".join(f"<keyframe><when>{when(t)}</when><value>{c(v)}</value></keyframe>" for t, v, _ in ps)
        s += "</parameter>"
        return ("<filter><effect><name>Basic Motion</name><effectid>basic</effectid><effectcategory>motion</effectcategory>"
                f"<effecttype>motion</effecttype><mediatype>video</mediatype>{s}</effect></filter>")

    def trans_xml(t, align):
        return (f"<transitionitem>{rate}<start>{F(t['start'])}</start><end>{F(t['end'])}</end><alignment>{align}</alignment>"
                f"<effect><name>Cross Dissolve</name><effectid>Cross Dissolve</effectid><effectcategory>Dissolve</effectcategory>"
                f"<effecttype>transition</effecttype><mediatype>video</mediatype><wipecode>0</wipecode><wipeaccuracy>100</wipeaccuracy>"
                f"<startratio>0</startratio><endratio>1</endratio><reverse>FALSE</reverse></effect></transitionitem>")

    total = max([it["end"] for tr in sq["video"] for it in tr["items"]] + [it["end"] for tr in sq["audio"] for it in tr] + [0])
    vtracks = []
    for n, tr in enumerate(sq["video"]):
        parts = []
        for k, it in enumerate(sorted(tr["items"], key=lambda i: i["start"])):
            h, t = it["head"], it["tail"]
            centred = lambda x: x and x["outgoing"] and x["incoming"]
            if h and not centred(h):
                parts.append(trans_xml(h, "start-black"))
            elif centred(h):
                parts.append(trans_xml(h, "center"))
            vis0 = F(h["start"]) if centred(h) else F(it["start"])
            vis1 = F(t["end"]) if centred(t) else F(it["end"])
            # in/out cover the visible range incl. the handles under centred dissolves; a still starts at its media 0
            mi = 0 if it["still"] else F(it["media_in"]) - (F(it["start"]) - vis0)
            if it["media_dur"] and not it["still"]:
                media_dur[it["path"]] = F(it["media_dur"])
            name = escape(os.path.basename(it["path"]))
            dur = 86400 if it["still"] else F(it["media_dur"] or it["end"])
            parts.append(f'<clipitem id="v{n + 1}-{k + 1}"><name>{name}</name><enabled>{"TRUE" if it["enabled"] else "FALSE"}</enabled>'
                         f"<duration>{dur}</duration>{rate}<start>{-1 if centred(h) else F(it['start'])}</start>"
                         f"<end>{-1 if centred(t) else F(it['end'])}</end><in>{mi}</in><out>{mi + vis1 - vis0}</out>"
                         + ("<alphatype>none</alphatype>" if it["still"] else "")
                         + file_xml(it["path"], it, audio=not it["still"] and n == 0) + motion_xml(it, vis0, mi) + "</clipitem>")
            if t and not centred(t):
                parts.append(trans_xml(t, "end-black"))
        vtracks.append(f"<track>{''.join(parts)}<enabled>TRUE</enabled><locked>FALSE</locked></track>")
    atracks = []
    for tr in sq["audio"]:
        for ch in (1, 2):
            parts = []
            for k, it in enumerate(tr):
                name = escape(os.path.basename(it["path"]))
                dur = media_dur.get(it["path"], F(it["end"]))
                parts.append(f'<clipitem id="a{len(atracks) + 1}-{k + 1}"><name>{name}</name><enabled>{"TRUE" if it["enabled"] else "FALSE"}</enabled>'
                             f"<duration>{dur}</duration>{rate}<start>{F(it['start'])}</start><end>{F(it['end'])}</end>"
                             f"<in>{F(it['media_in'])}</in><out>{F(it['media_in']) + F(it['end']) - F(it['start'])}</out>"
                             + file_xml(it["path"], None, audio=True)
                             + f"<sourcetrack><mediatype>audio</mediatype><trackindex>{ch}</trackindex></sourcetrack></clipitem>")
            if parts:
                atracks.append(f"<track>{''.join(parts)}<enabled>TRUE</enabled><locked>FALSE</locked><outputchannelindex>{ch}</outputchannelindex></track>")
    tc = f"<timecode>{rate}<string>00:00:00:00</string><frame>0</frame><displayformat>NDF</displayformat></timecode>"
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE xmeml>\n<xmeml version="4">\n'
           f'<sequence id="seq-1"><name>{escape(seq_label)}</name><duration>{F(total)}</duration>{rate}\n{tc}\n<media>\n'
           f"<video><format><samplecharacteristics>{rate}<width>{W}</width><height>{H}</height><anamorphic>FALSE</anamorphic>"
           f"<pixelaspectratio>square</pixelaspectratio><fielddominance>none</fielddominance></samplecharacteristics></format>\n"
           + "\n".join(vtracks) + "\n</video>\n<audio><numOutputChannels>2</numOutputChannels><format><samplecharacteristics>"
           "<depth>16</depth><samplerate>48000</samplerate></samplecharacteristics></format>\n" + "\n".join(atracks)
           + "\n</audio>\n</media></sequence>\n</xmeml>\n")
    open(xml_path, "w", encoding="utf-8").write(xml)
    return xml


# ----------------------------------------------------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project"); ap.add_argument("assembly"); ap.add_argument("out")
    ap.add_argument("--sequence"); ap.add_argument("--allow-running", action="store_true")
    ap.add_argument("--motion-donor", help="a Premiere-saved .prproj whose stored Motion blob is copied verbatim when SOURCE "
                                           "has none (a project whose clips all use default Motion stores no Motion component)")
    a = ap.parse_args()
    if not a.allow_running and premiere_running():
        sys.exit("Premiere Pro is running. Close it first (a later save from an open copy would overwrite edits), or pass --allow-running.")
    src_path, out_path = os.path.abspath(a.project), os.path.abspath(a.out)
    if src_path == out_path:
        sys.exit("OUT must be a new file; SOURCE is never written")
    if not out_path.endswith(".prproj"):
        sys.exit("OUT must end in .prproj")
    raw = open(src_path, "rb").read()
    text = gzip.decompress(raw).decode("utf-8") if raw[:2] == b"\x1f\x8b" else raw.decode("utf-8")
    p = Project(text)
    asm = json.load(open(a.assembly))

    donor_motion = None
    if a.motion_donor and '<MatchName>AE.ADBE Motion</MatchName>' not in text:
        # SOURCE stores no Motion component: take Premiere's own Motion blob element (hash + content) from the donor, verbatim
        draw = open(a.motion_donor, "rb").read()
        dtext = gzip.decompress(draw).decode("utf-8") if draw[:2] == b"\x1f\x8b" else draw.decode("utf-8")
        m = next(m for m in re.finditer(r'<PremiereFilterPrivateData Encoding="base64" BinaryHash="([0-9a-f-]+)">([^<]+)</PremiereFilterPrivateData>(?=\s*<VideoFilterType>2</VideoFilterType>\s*<MatchName>AE\.ADBE Motion</MatchName>)', dtext))
        donor_motion = (m.group(1), m.group(0))
        mod_state, motion_hash = media_mod_state(stored_blobs(p)), donor_motion[0]
    else:
        mod_state, motion_hash = reusable_blobs(p)        # stills: ModificationState + Motion blobs stored in SOURCE
    mov_state = media_mod_state(stored_blobs(p))          # .mov: the same kind of ModificationState blob

    seq = next(s for s in p.root if s.tag == "Sequence" and a.sequence in (None, s.findtext("Name")))
    groups = {p.ref(tg.find("Second")).tag: p.ref(tg.find("Second")) for tg in seq.find("TrackGroups")}
    vg = groups["VideoTrackGroup"]
    frame = int(vg.findtext("TrackGroup/FrameRate"))
    if frame not in TIMECODE_FORMAT:
        sys.exit(f"sequence frame rate {TPS / frame:g} fps has no known still template")
    _, _, W, H = (int(v) for v in vg.findtext("FrameRect").split(","))
    tracks = vg.find("TrackGroup/Tracks")
    snap = lambda sec: round(sec * TPS / frame) * frame

    # --- 1. the request, per track ---
    sections = []  # (kind, track index, [item dicts])
    extra_remove = {}  # track index -> files whose items are removed without being placed again ("remove": [...])
    for kind in ("images", "graphics"):
        sec = asm.get(kind)
        if not sec or not sec.get("items"):
            continue
        tix = int(sec["track"])
        if tix == 0:
            sys.exit(f"{kind}: track 0 is V1 (the footage); refusing to touch it")
        if tix >= len(tracks):
            sys.exit(f"{kind}: sequence has only {len(tracks)} video tracks")
        its = []
        for x in sec["items"]:
            path = os.path.abspath(os.path.join(sec.get("dir", ""), x["file"])) if kind == "images" else os.path.abspath(x["path"])
            s, e = snap(x["in"]), snap(x["out"])
            if e <= s:
                sys.exit(f"{path}: empty slot after snapping to frames")
            its.append(dict(kind=kind, path=path, s=s, e=e, src=x, xin=int(x.get("xfade_in", 0)), xout=int(x.get("xfade_out", 0))))
        sections.append((kind, tix, its))
        extra_remove[tix] = {os.path.abspath(os.path.join(sec.get("dir", ""), f)) for f in sec.get("remove", [])}
    if len({t for _, t, _ in sections}) != len(sections):
        sys.exit("images and graphics must go on different tracks")

    # --- 2. idempotence: remove our earlier items (and their transitions) from the target tracks ---
    removed, keep = {}, {}
    for kind, tix, its in sections:
        track_key = tracks[tix].attrib["ObjectURef"]
        track = p.el[track_key]
        paths = {i["path"] for i in its} | extra_remove.get(tix, set())
        lst = track.find("ClipTrack/ClipItems/TrackItems")
        kept, dropped_tr, n = [], set(), 0
        for x in (lst if lst is not None else []):
            ti = p.el[x.attrib["ObjectRef"]]
            path, keys = media_graph(p, ti)
            if path and os.path.abspath(path) in paths:
                for tk in ("HeadTransition", "TailTransition"):
                    r = ti.find("ClipTrackItem/" + tk)
                    if r is not None:
                        dropped_tr.add(r.attrib["ObjectRef"])
                for k in keys:
                    p.drop(k)
                n += 1
            else:
                kept.append(ti)
        for tid in dropped_tr:
            for k in transition_keys(p, tid):
                if k in p.by_key:
                    p.drop(k)
        for ti in kept:  # a kept neighbour must not point at a removed transition (re-runs only)
            bi = p.by_key[ti.attrib["ObjectID"]]
            for tid in dropped_tr:
                p.blocks[bi] = re.sub(rf'\n\t\t\t<(Head|Tail)Transition ObjectRef="{tid}"/>', "", p.blocks[bi])
        tl = track.find("ClipTrack/TransitionItems/TrackItems")
        kept_tr = [x.attrib["ObjectRef"] for x in (tl if tl is not None else []) if x.attrib["ObjectRef"] not in dropped_tr]
        removed[tix] = n
        keep[tix] = (track_key, kept, kept_tr)

    # --- 3. media ---
    existing = {e.findtext("FilePath"): e for e in p.root if e.tag == "Media" and e.findtext("FilePath")}
    root_bin = next(e for e in p.root if e.tag == "RootProjectItem")
    proto_impl = next((e.findtext("ImplementationID") for e in existing.values()), "1fa18bfa-255c-44b1-ad73-56bcd99fceaf")
    grid = max([int(x.text) for x in p.root.iter("project.icon.view.grid.order")] + [-1])
    new_blocks, bin_items, media = [], [], {}
    for kind, tix, its in sections:
        for path in sorted({i["path"] for i in its}):
            if path in media:
                continue
            if kind == "images":
                blocks, cpiuid, media[path], grid = still_media(p, path, frame, os.path.dirname(out_path), existing, mod_state, grid)
                new_blocks += blocks
                if cpiuid:
                    bin_items.append(cpiuid)
            else:
                if not os.path.isfile(path):
                    sys.exit(f"{path}: missing")
                media[path] = ensure_mov_media(p, path, out_path, existing, root_bin, proto_impl, mov_state[0], mov_state[1],
                                               bin_items=bin_items, refresh_always=False)
                for i in its:
                    if i["path"] == path and i["e"] - i["s"] > media[path][4]:
                        sys.exit(f"{path}: media {media[path][4] / TPS:.3f}s is shorter than the slot {(i['e'] - i['s']) / TPS:.3f}s")

    # --- 4. plan: overlaps, cuts, transitions, handles ---
    rep = []
    for kind, tix, its in sections:
        track_key, kept, kept_tr = keep[tix]
        spans = sorted([(int(t.findtext("ClipTrackItem/TrackItem/Start") or 0), int(t.findtext("ClipTrackItem/TrackItem/End")), None) for t in kept]
                       + [(i["s"], i["e"], i) for i in its], key=lambda x: (x[0], x[1]))
        for (s0, e0, _), (s1, _, _) in zip(spans, spans[1:]):
            if s1 < e0:
                sys.exit(f"V{tix + 1}: items overlap at {s1 / TPS:.3f}s")
        for i in its:
            i.update(head=None, tail=None, before=0, after=0)
        for (s0, e0, A), (s1, e1, B) in zip(spans, spans[1:]):
            if e0 != s1:
                continue
            L = max(A["xout"] if A else 0, B["xin"] if B else 0)
            if not L:
                continue
            if A is None or B is None:
                sys.exit(f"V{tix + 1} {s1 / TPS:.3f}s: a dissolve against an item this script does not manage; leave that cut hard")
            before, after = L // 2, L - L // 2
            for clip, need, side in ((A, after, "tail"), (B, before, "head")):  # media handles beyond the visible clip
                if kind == "graphics":
                    dur = media[clip["path"]][4]
                    ok = (clip["e"] - clip["s"]) + need * frame <= dur if side == "tail" else need == 0
                    if not ok:
                        sys.exit(f"{os.path.basename(clip['path'])}: a centred {L} f dissolve needs {need} f of media {'after' if side == 'tail' else 'before'} "
                                 f"the clip; the render has none. Use one-sided fades (leave a gap) or render handles.")
            tr = dict(L=L, start=s1 - before * frame, end=s1 + after * frame, cut=s1, out=True, inc=True, A=A, B=B)
            A["tail"], B["head"] = tr, tr
            A["after"], B["before"] = after, before
        for i in its:
            if i["head"] is None and i["xin"]:
                i["head"] = dict(L=i["xin"], start=i["s"], end=i["s"] + i["xin"] * frame, cut=i["s"], out=False, inc=True, A=None, B=i)
            if i["tail"] is None and i["xout"]:
                i["tail"] = dict(L=i["xout"], start=i["e"] - i["xout"] * frame, end=i["e"], cut=i["e"], out=True, inc=False, A=i, B=None)
            cover = lambda t, side: 0 if t is None else ((t["end"] - t["cut"]) if side == "head" else (t["cut"] - t["start"]))
            if cover(i["head"], "head") + cover(i["tail"], "tail") > i["e"] - i["s"]:
                sys.exit(f"{os.path.basename(i['path'])}: its dissolves are longer than the clip ({(i['e'] - i['s']) // frame} f)")

        # --- 5. objects: transitions first (ids), then items ---
        trs = []
        for i in its:
            for side in ("head", "tail"):
                t = i[side]
                if t is not None and "id" not in t:
                    t["id"], t["cid"] = p.oid(), p.oid()
                    t["pids"] = [p.oid() for _ in range(XD_PARAMS)]
                    new_blocks += transition_blocks(t["id"], t["cid"], t["pids"], t["start"], t["end"], t["out"], t["inc"], t["cut"] - t["start"])
                    trs.append(t)
        item_keys = {}
        for i in its:
            head = i["head"]["id"] if i["head"] else None
            tail = i["tail"]["id"] if i["tail"] else None
            name = os.path.basename(i["path"])
            if kind == "images":
                md = media[i["path"]]
                x = i["src"]
                fit = min(W / md["w"], H / md["h"]) * 100
                sc = x.get("scale") or [fit, fit]
                ps = x.get("pos") or [[0.5, 0.5], [0.5, 0.5]]
                ease = bool(x.get("ease", True))
                in0 = (3600 * TPS // md["fr"]) * md["fr"]
                kh = in0 - i["before"] * frame                                   # first visible frame (media time)
                kt = in0 + (i["e"] - i["s"]) + i["after"] * frame - frame         # last visible frame
                skeys = [(kh, sc[0]), (kt, sc[1])] if f32(sc[0]) != f32(sc[1]) and kt > kh else None
                pkeys = [(kh, tuple(ps[0])), (kt, tuple(ps[1]))] if pt(ps[0]) != pt(ps[1]) and kt > kh else None
                blocks, tiid, sv = still_item(p, md, i["s"], i["e"], W, H, i["path"], motion_hash, sv=f32(sc[0]),
                                              position=point_param("Position", 1, ps[0], pkeys, ease),
                                              scale=scalar_param("Scale", 2, sc[0], skeys, ease),
                                              head=head, tail=tail, omit_zero_start=True)
                new_blocks += blocks
                item_keys[id(i)] = tiid
                rep.append(f"  V{tix + 1} {i['s'] / TPS:8.3f} – {i['e'] / TPS:8.3f}  scale {sc[0]:.2f}->{sc[1]:.2f}  pos {ps[0]}->{ps[1]}"
                           f"  {'ease' if ease else 'linear'}  {md['w']}x{md['h']}  {name}")
            else:
                ti = add_mov_item(p, media[i["path"]], i["s"], i["e"], i["path"])
                cti = ti.find("ClipTrackItem")
                if i["s"] == 0:  # Premiere writes no <Start> for an item at 0
                    tri = cti.find("TrackItem")
                    tri.remove(tri.find("Start"))
                for tag, k in (("HeadTransition", head), ("TailTransition", tail)):
                    if k:
                        ET.SubElement(cti, tag, {"ObjectRef": k})
                item_keys[id(i)] = ti.attrib["ObjectID"]
                rep.append(f"  V{tix + 1} {i['s'] / TPS:8.3f} – {i['e'] / TPS:8.3f}  scale 100 (default Motion)  {name}")
        # track lists, in time order
        allspans = sorted([(int(t.findtext("ClipTrackItem/TrackItem/Start") or 0), t.attrib["ObjectID"]) for t in kept]
                          + [(i["s"], item_keys[id(i)]) for i in its])
        set_track_items(p, track_key, [k for _, k in allspans], "ClipItems")
        tspans = sorted([(int(p.el[k].findtext("TransitionTrackItem/TrackItem/Start") or 0), k) for k in kept_tr]
                        + [(t["start"], t["id"]) for t in trs])
        set_track_items(p, track_key, [k for _, k in tspans], "TransitionItems")
        for t in trs:
            kind_t = "centred" if t["out"] and t["inc"] else ("head" if t["inc"] else "tail")
            rep.append(f"  V{tix + 1} dissolve {t['start'] / TPS:8.3f} – {t['end'] / TPS:8.3f}  {t['L']} f  {kind_t}")

    append_bin_items(p, bin_items)
    bump_next_id(p)
    p.blocks += new_blocks
    out = p.text()
    if donor_motion:  # the first new Motion component stores the blob's content, exactly as Premiere writes it once per project
        ref = f'<PremiereFilterPrivateData Encoding="base64" BinaryHash="{donor_motion[0]}"/>'
        if ref not in out:
            sys.exit("internal: no Motion blob reference to give the donor content to")
        out = out.replace(ref, donor_motion[1], 1)
    ET.fromstring(out.encode("utf-8"))  # must still parse
    if " />" in "\n".join(new_blocks):
        sys.exit("internal: ' />' in a new block")
    if out == text:
        sys.exit("nothing changed; OUT would equal SOURCE")

    print(f"sequence {seq.findtext('Name')!r} ({TPS / frame:g} fps, {W}x{H}); removed "
          + ", ".join(f"{n} from V{t + 1}" for t, n in removed.items()) + f"; new media {len(bin_items)}")
    print(f"  re-used blobs: ModificationState {mod_state[0]}, Motion {motion_hash}")
    print("\n".join(rep))
    tmp = out_path + ".tmp"
    with gzip.open(tmp, "wb") as f:
        f.write(out.encode("utf-8"))
    os.replace(tmp, out_path)
    print("wrote:", out_path)

    sq = read_sequence(out, a.sequence)
    xml_path = os.path.splitext(out_path)[0] + ".xml"
    write_xmeml(sq, xml_path, os.path.splitext(os.path.basename(out_path))[0])
    bad = [u for u in re.findall(r"<pathurl>([^<]+)</pathurl>", open(xml_path).read())
           if not os.path.exists(urllib.parse.unquote(u[len("file://localhost"):]))]
    if bad:
        sys.exit(f"xmeml: unresolved pathurls: {bad}")
    print("wrote:", xml_path)
    print(report(sq, sorted(t for _, t, _ in sections)))


if __name__ == "__main__":
    main()
