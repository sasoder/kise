// ---------------------------------------------------------------------------
// FillThatRoom (60_FillThatRoom; cut H of the "strings" set). Dwarkesh Patel
// with Si Sheppard, "Why captured emperors cooperated". He = ATAHUALPA, the
// Inca emperor held by Pizarro at Cajamarca, 1532-33.
//   "(Because, bear in mind, the deal was,) if he provided - and he walked
//    into that room and said, I can fill it up this high with gold and silver,
//    and Pizarro would promise to release him at that point"
// Dwarkesh map style, "beyond maps" page; the world is stringsShared.tsx (used
// as-is, frozen). Opaque 1080x1920, 24 fps, 190 frames. In-point 60.394 s.
//
// WORD -> LOCAL FRAME
//   if 4 · he 7 · provided 7-17 · and 31 · he 33 · walked 36 · into 41 ·
//   that 44 · ROOM 48-56 · and 56 · said 63 · I 67 · can 69 · FILL 71 · it 79 ·
//   up 79 · THIS 89 · HIGH 96-103 · with 103 · GOLD 113 · and 123 ·
//   SILVER 130-138 · and 139 · PIZARRO 140 · would 152 · PROMISE 153 · to 161 ·
//   be 163 · RELEASED 163-174 · at 174 · that 178 · POINT 178-185; the cut ends
//   f188 (f188-189 = safety tail).
//
// THE PICTURE: the captive of ReachingOutToHisPeople (Atahualpa, the inca
// variant, upright under the gauntlet + bar, three taut orange strings: head and
// the two forearms), now INSIDE a room drawn in plain engraved elevation: a
// cut-away stone chamber seen front-on (floor line, two battered side walls of
// coursed ashlar, two trapezoidal niches on the back wall, no ceiling: the
// strings come down through the open top). He stands by the left wall.
//
// GESTURES (each with the words it serves; nothing else)
//   1. f0-f30 "if he provided": the opening of ReachingOutToHisPeople (focus
//      (540, 600), k 1.40 creeping), no label; the room's lines already there,
//      dormant (0.28).
//   2. f30-f60 "and he walked into that ROOM": ONE glide back to the wide
//      (k 1.0, the room centred, floor at screen y 1080) while the room's lines
//      come up to 0.55 from the floor upward (a front, f31-f54).
//   3. f63-f106 "I can FILL it up THIS HIGH": his arm on the wall's side lifts
//      to full reach, he goes up on his toes (10 px); that forearm's string
//      slackens to let it (still orange); the hand touches the wall on "this"
//      (f89); on "high" a chalk line runs from his fingertip across the whole
//      room (head-led, f96-f106). He lowers the arm (f106-f128); the line stays.
//   4. f103-f136 "with GOLD and SILVER": the room fills from the floor to the
//      line with engraved Inca goldwork (keros, aryballos jars, sun discs,
//      figurines, llama figurines, masks, bars), cream, never orange: each
//      piece comes in just under a rising level and settles 3 px. A third full
//      at f113, at the line f135, level, never above it. He stands in front.
//   5. f138-end "and PIZARRO would PROMISE to RELEASE him at that POINT": the
//      camera eases up and back (k 0.95); "PIZARRO" beside the gauntlet's cuff
//      (lands f140); f151-f176 the gauntlet's grip eases (fingers uncurl and
//      part, the bar dips 6 px) and the three orange strings go slack one after
//      another from the bar down (head f153, left f158, right f163). They stay
//      orange. They hang there, swaying: a promise, not a release.
//
// ACCENT: orange = the live hold only (the captor's three strings).
//
// BUILT LOCALLY (stringsShared untouched): the room, the heap, the chalk
// line, and RansomHand (the shared CaptorHand with its four fingers cut out
// and redrawn so they can open, over a locally drawn bar that can dip; at
// loose 0 it is the shared hand + bar to the pixel).
//
// EXPORTS FOR THE NEXT CUT (frozen once RANSOM_READY.md exists): ROOM, LINE_Y,
// RansomState, ransomStateAt, ransomCamAt, RANSOM_END, RANSOM_END_FRAME,
// RANSOM_LABEL, RansomTableau, Room, Heap, ChalkLine, RansomHand, ransomStrings.
//
// HISTORY (nothing of it on screen but the picture): Atahualpa offered to fill
// a room once with gold, to a line as high as he could reach on the wall, and
// twice over with silver, for his freedom; Pizarro accepted and had the offer
// recorded. The ransom was collected and melted; he was executed 26 July 1533.
// Sources: Francisco de Xerez, Verdadera relacion (1534); Pedro Pizarro,
// Relacion (1571); Hemming, The Conquest of the Incas (1970), ch. 2-4.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CAPTION_TOP, DARK, INK, LAND, camFor, clamp01, hash, makeTrack, mixColor, pchip, screenOf, smootherstep, smoothstep, type Bump } from "./incaShared";
import {
  CaptorHand,
  EMPEROR_AT,
  Emperor,
  HAND_AT,
  HAND_S,
  Label,
  PuppetString,
  StringsPage,
  WorldSvg,
  add,
  emperorRig,
  glintAt,
  handAnchors,
  mix,
  mix2,
  mul,
  norm,
  sub,
  vlen,
  type Cam,
  type EmperorPose,
  type P2,
  type StringGeom,
} from "./stringsShared";

export const FPS = 24;
export const DURATION = 190;
const LAST = DURATION - 1;

export const schema = z.object({ vignette: z.number() });
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

// ---------------------------------------------------------------------------
// THE ROOM (world px). The inner faces are plumb; the outer faces batter.
// ---------------------------------------------------------------------------
export const ROOM = {
  /** the inner faces of the side walls */
  x0: 384,
  x1: 1144,
  floorY: 760,
  topY: 296,
  /** wall thickness at the top; + `batter` at the floor */
  wall: 50,
  batter: 8,
  /** the niches on the back wall: centre x, sill y, lintel y, half widths (sill, lintel) */
  niches: [800, 1000],
  nicheY: [610, 480] as [number, number],
  nicheHalf: [44, 33] as [number, number],
};
const ROOM_H = ROOM.floorY - ROOM.topY;
export const ROOM_CX = (ROOM.x0 + ROOM.x1) / 2;

// ---------------------------------------------------------------------------
// ATAHUALPA
// ---------------------------------------------------------------------------
const REST: EmperorPose = { head: 0, nod: 0, slump: 0, lean: 0, wristL: [-72, -150], wristR: [72, -150], fistL: 1, fistR: 1, hang: 0, limp: 0 };
const REACH = { lean: -7, hang: 10, head: -8, arm: 115, hand: 25, fist: 0.5 };
/** the reaching wrist (figure-local, as the rig will place it) and the fingertip's height */
const REACH_GEOM = (() => {
  const r = emperorRig({ ...REST, lean: REACH.lean, hang: REACH.hang }, "inca");
  const S = r.shL;
  const tx = ROOM.x0 - EMPEROR_AT[0] - 2;
  const dx = tx - S[0];
  const R = REACH.arm + REACH.hand;
  const T: P2 = [tx, S[1] - Math.sqrt(R * R - dx * dx)];
  const u = norm(sub(T, S));
  return { W: add(S, mul(u, REACH.arm)), T };
})();
/** the chalk line's height: his fingertip at full reach */
export const LINE_Y = Math.round(EMPEROR_AT[1] + REACH_GEOM.T[1]);
const HEAP_H = ROOM.floorY - LINE_Y;

const bez = (a: P2, c: P2, b: P2, t: number): P2 => mix2(mix2(a, c, t), mix2(c, b, t), t);

// ---------------------------------------------------------------------------
// TIMELINE
// ---------------------------------------------------------------------------
const T = {
  room: [31, 54] as [number, number],
  reach: [63, 89] as [number, number],
  lower: [106, 128] as [number, number],
  toes: [74, 89] as [number, number],
  toesDown: [104, 118] as [number, number],
  line: [96, 106] as [number, number],
  labelF0: 128,
  grip: [151, 169] as [number, number],
  /** the strings go slack: head, left forearm, right forearm */
  loosen: [153, 158, 163],
};
const FILL = pchip(
  [
    [103, 0],
    [113, 0.34],
    [125, 0.72],
    [135, 1],
  ],
  true,
);
const fillAt = (f: number) => (f <= 103 ? 0 : f >= 135 ? 1 : FILL(f));
const SLACK_END = 0.35;

// ---------------------------------------------------------------------------
// THE CAMERA: one keyed C1 track (velocity bumps). Focus = the world point
// held at screen (540, 835).
// ---------------------------------------------------------------------------
const K_OPEN = 1.4;
const K_WIDE = 1.0;
const K_END = 0.95;
const after0 = (b: Bump) => makeTrack([b], 0)(470);
const CREEP1: Bump = [-30, 44, Math.log(1.045), 0.25];
const GLIDE: [number, number] = [30, 60];
const LNK = makeTrack(
  [
    CREEP1,
    [GLIDE[0], GLIDE[1], Math.log(K_WIDE / K_OPEN) - after0(CREEP1), 0.9],
    [56, 102, Math.log(1.05), 0.7],
    [100, 142, Math.log(1.02 / 1.05), 0.8],
    [138, 168, Math.log(K_END / 1.02), 0.85],
    [160, 330, Math.log(1.04), 0.3],
  ],
  Math.log(K_OPEN),
);
const WX = makeTrack(
  [
    [GLIDE[0], GLIDE[1], ROOM_CX - 540, 0.9],
    [56, 102, -28, 0.7],
    [100, 142, 28, 0.8],
  ],
  540,
);
const WY = makeTrack(
  [
    [GLIDE[0], GLIDE[1], -85, 0.9],
    [56, 102, -6, 0.7],
    [100, 142, 11, 0.8],
    [138, 168, -58, 0.85],
    [160, 330, 6, 0.3],
  ],
  600,
);
/** the cut's camera; past the last frame the end hold's creep simply goes on */
export const ransomCamAt = (f: number): Cam => camFor([WX(f), WY(f)], Math.exp(LNK(f)));

// ---------------------------------------------------------------------------
// THE STATE (plain data: the next cut spreads and overrides it)
// ---------------------------------------------------------------------------
export type RansomString = { slack: [number, number]; sag: number; side: number; live: [number, number] | null; base: number };
export type RansomState = {
  pose: EmperorPose;
  /** 0..1 the room's lines brought up from 0.28 to 0.55, floor upward */
  room: number;
  /** 0..1 the chalk line drawn, left to right */
  line: number;
  /** 0..1 the heap's level (1 = at the line) */
  fill: number;
  /** the heap dimmed behind his silhouette (0..1 opacity of the page colour) */
  dim: number;
  /** the gauntlet: grip eased 0..1 (fingers uncurl and part), the bar dipped (world px) */
  loose: number;
  dip: number;
  /** the captor's three strings, bar (s = 0) -> head / forearm (s = 1) */
  strings: { head: RansomString; wristL: RansomString; wristR: RansomString };
  /** the frame the PIZARRO label starts its slide-up (null = no label; <= -40 = simply there) */
  labelF0: number | null;
};

const TIE = 0.42;
/** the three strings' ends in WORLD px for a pose + bar dip */
const stringEnds = (pose: EmperorPose, dip: number) => {
  const r = emperorRig(pose, "inca");
  const h = handAnchors({ bar: 1, tilt: 0 });
  const w = (p: P2): P2 => add(EMPEROR_AT, p);
  const d = (p: P2): P2 => [p[0], p[1] + dip];
  return {
    head: { from: d(h.barC), to: w(r.headTop) },
    wristL: { from: d(h.barL), to: w(mix2(r.armL.E, r.armL.W, TIE)) },
    wristR: { from: d(h.barR), to: w(mix2(r.armR.E, r.armR.W, TIE)) },
  };
};
type Which = "head" | "wristL" | "wristR";
const WHICH: Which[] = ["head", "wristL", "wristR"];
const REST_LEN = (() => {
  const e = stringEnds(REST, 0);
  return { head: vlen(sub(e.head.to, e.head.from)), wristL: vlen(sub(e.wristL.to, e.wristL.from)), wristR: vlen(sub(e.wristR.to, e.wristR.from)) };
})();
/** which way each slack string bows (all three hang to screen right: the left one clear of the wall) */
const SIDE: Record<Which, number> = { head: -1.3, wristL: -2.5, wristR: -0.6 };

const poseAt = (f: number): EmperorPose => {
  const u = smootherstep((f - T.reach[0]) / (T.reach[1] - T.reach[0])) * (1 - smootherstep((f - T.lower[0]) / (T.lower[1] - T.lower[0])));
  const tip = smootherstep((f - T.toes[0]) / (T.toes[1] - T.toes[0])) * (1 - smootherstep((f - T.toesDown[0]) / (T.toesDown[1] - T.toesDown[0])));
  return {
    ...REST,
    head: 0.7 * Math.sin(f / 23) + REACH.head * u,
    lean: REACH.lean * u,
    hang: REACH.hang * tip,
    wristL: bez(REST.wristL, [-138, -212], [REACH_GEOM.W[0], REACH_GEOM.W[1] + REACH.hang], u),
    fistL: 1 - (1 - REACH.fist) * smoothstep(u * 1.5),
  };
};

/** the whole picture at frame f. Past the last frame it is the end state, still swaying. */
export const ransomStateAt = (f: number): RansomState => {
  const pose = poseAt(f);
  const loose = smootherstep((f - T.grip[0]) / (T.grip[1] - T.grip[0]));
  const dip = 6 * loose;
  const ends = stringEnds(pose, dip);
  const late = f >= 140;
  const str = (w: Which, i: number): RansomString => {
    // the string gives where its ends have come nearer than at rest (the lifted arm, the toes, the dipped bar)
    const d = vlen(sub(ends[w].to, ends[w].from));
    const give = clamp01((REST_LEN[w] - d) / REST_LEN[w] / 0.37);
    const t0 = T.loosen[i];
    const sway = smoothstep((f - t0 - 8) / 14);
    const a = SLACK_END * smootherstep((f - t0) / 11);
    const b = SLACK_END * smootherstep((f - t0 - 5) / 13);
    return {
      slack: [give + a, give + b],
      sag: (late ? 0.8 : 0.5) * (1 + 0.07 * sway * Math.sin(f / 10 + i * 1.7)),
      side: (late ? SIDE[w] : SIDE[w] * (0.4 + 0.6 * give)) * (1 + 0.24 * sway * Math.sin(f / 9 + i * 2.3)),
      live: [0, 1],
      base: 1,
    };
  };
  const fill = fillAt(f);
  return {
    pose,
    room: smootherstep((f - T.room[0]) / (T.room[1] - T.room[0])),
    line: smootherstep((f - T.line[0]) / (T.line[1] - T.line[0])),
    fill,
    dim: 0.5 * smoothstep((fill - 0.08) / 0.4),
    loose,
    dip,
    strings: { head: str("head", 0), wristL: str("wristL", 1), wristR: str("wristR", 2) },
    labelF0: T.labelF0,
  };
};
export const RANSOM_END_FRAME = LAST;
/** exactly the last frame's state */
export const RANSOM_END: RansomState = ransomStateAt(LAST);
/** the three strings' geometry (WORLD px) for a state */
export const ransomStrings = (s: RansomState): Record<Which, StringGeom> => {
  const e = stringEnds(s.pose, s.dip);
  const g = (w: Which): StringGeom => ({ ...e[w], slack: s.strings[w].slack, sag: s.strings[w].sag, side: s.strings[w].side });
  return { head: g("head"), wristL: g("wristL"), wristR: g("wristR") };
};
/** the label beside the gauntlet's cuff (world anchor = baseline, screen px size) */
export const RANSOM_LABEL = { text: "PIZARRO", x: 838, y: 24, size: 44 };

// ---------------------------------------------------------------------------
// DRAWING HELPERS
// ---------------------------------------------------------------------------
const C_DEEP = "#D3C5A2";
const n1 = (v: number) => v.toFixed(1);
/** hand-cut hatching (stringsFigures' hatchD, which is not exported): parallel strokes at `ang` deg filling the rect, ragged at both ends */
const hatchD = (x0: number, y0: number, x1: number, y1: number, ang: number, gap: number, seed: number, rag = 0.28) => {
  const r = (ang * Math.PI) / 180;
  const dx = Math.cos(r);
  const dy = Math.sin(r);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const R = Math.hypot(x1 - x0, y1 - y0) / 2;
  let d = "";
  let i = 0;
  for (let o = -R; o <= R; o += gap, i++) {
    const oo = o + (hash(i, seed) - 0.5) * gap * 0.5;
    const px = cx - dy * oo;
    const py = cy + dx * oo;
    let t0 = -R;
    let t1 = R;
    if (Math.abs(dx) > 1e-6) {
      const a = (x0 - px) / dx;
      const b = (x1 - px) / dx;
      t0 = Math.max(t0, Math.min(a, b));
      t1 = Math.min(t1, Math.max(a, b));
    } else if (px < x0 || px > x1) continue;
    if (Math.abs(dy) > 1e-6) {
      const a = (y0 - py) / dy;
      const b = (y1 - py) / dy;
      t0 = Math.max(t0, Math.min(a, b));
      t1 = Math.min(t1, Math.max(a, b));
    } else if (py < y0 || py > y1) continue;
    const span = t1 - t0;
    if (span < 3) continue;
    t0 += hash(i, seed + 7) * rag * span;
    t1 -= hash(i, seed + 13) * rag * span;
    d += `M${n1(px + dx * t0)},${n1(py + dy * t0)}L${n1(px + dx * t1)},${n1(py + dy * t1)}`;
  }
  return d;
};
const OUT = { stroke: DARK, strokeWidth: 2.3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const ln = (w = 1.2, a = 0.8) => ({ fill: "none", stroke: DARK, strokeWidth: w, strokeOpacity: a, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });

// ---------------------------------------------------------------------------
// THE ROOM: cream line. Floor line with a hatched thickness, two walls of
// coursed ashlar (courses lower as they rise, joints a hair off level), two
// trapezoidal niches on the back wall.
// ---------------------------------------------------------------------------
const COURSES = [52, 48, 46, 44, 42, 40, 38, 36, 34, 32, 28, 24];
const ROOM_PATHS = (() => {
  const { x0, x1, floorY, topY, wall, batter } = ROOM;
  let line = "";
  let fine = "";
  const outer = (sg: number, y: number) => (sg < 0 ? x0 - wall - (batter * (y - topY)) / ROOM_H : x1 + wall + (batter * (y - topY)) / ROOM_H);
  for (const sg of [-1, 1]) {
    const xi = sg < 0 ? x0 : x1;
    line += `M${xi},${floorY}L${xi},${topY}L${n1(outer(sg, topY))},${topY}L${n1(outer(sg, floorY))},${floorY}`;
    let y = floorY;
    COURSES.forEach((h, i) => {
      const ya = y;
      const yb = y - h;
      const seed = 300 + i * 7 + (sg < 0 ? 0 : 50);
      if (i < COURSES.length - 1) {
        const j0 = yb + (hash(seed, 1) - 0.5) * 3;
        const j1 = yb + (hash(seed, 2) - 0.5) * 3;
        line += `M${xi},${n1(j0)}L${n1(outer(sg, yb))},${n1(j1)}`;
      }
      // every other course is two stones
      if (i % 2 === 1) {
        const xm = xi + sg * (wall * (0.4 + 0.25 * hash(seed, 3)));
        line += `M${n1(xm)},${n1(ya - 1)}L${n1(xm + (hash(seed, 4) - 0.5) * 6)},${n1(yb + 1)}`;
      }
      // the shaded half of each stone
      const xa = sg < 0 ? outer(sg, ya) + 3 : xi + wall * 0.42;
      const xb = sg < 0 ? xi - wall * 0.42 : outer(sg, yb) - 3;
      fine += hatchD(Math.min(xa, xb), yb + 4, Math.max(xa, xb), ya - 4, 58, 5.2, seed + 9, 0.3);
      y = yb;
    });
  }
  const xl = outer(-1, floorY);
  const xr = outer(1, floorY);
  line += `M${n1(xl - 6)},${floorY}L${n1(xr + 6)},${floorY}`;
  for (let x = xl - 2, i = 0; x < xr + 4; x += 9, i++) {
    const l = 9 + 6 * hash(i, 411);
    fine += `M${n1(x + 2 * hash(i, 412))},${floorY + 4}l${n1(-l * 0.62)},${n1(l * 0.78)}`;
  }
  let niche = "";
  let nicheFine = "";
  const [ys, yl] = ROOM.nicheY;
  const [hs, hl] = ROOM.nicheHalf;
  for (const cx of ROOM.niches) {
    niche += `M${cx - hs},${ys}L${cx - hl},${yl}L${cx + hl},${yl}L${cx + hs},${ys}Z`;
    const jamb = (y: number) => cx - hs + ((hs - hl) * (ys - y)) / (ys - yl);
    niche += `M${n1(jamb(ys) + 9)},${ys}L${n1(jamb(yl + 8) + 9)},${yl + 8}L${n1(cx + hl + 0.7)},${yl + 8}`;
    for (let y = yl + 12, i = 0; y < ys - 3; y += 6.5, i++) nicheFine += `M${n1(jamb(y) + 1.6)},${n1(y)}l${n1(5 + 1.6 * hash(i, cx))},1`;
    for (let x = cx - hl + 10, i = 0; x < cx + hl - 2; x += 6.5, i++) nicheFine += `M${n1(x)},${yl + 1.8}l0.6,${n1(4 + 1.4 * hash(i, cx + 1))}`;
  }
  return { line, fine, niche, nicheFine };
})();

const RoomLines: React.FC = () => (
  <g fill="none" stroke={INK} strokeLinecap="round" strokeLinejoin="round">
    <path d={ROOM_PATHS.niche} strokeWidth={2.6} />
    <path d={ROOM_PATHS.nicheFine} strokeWidth={1.3} strokeOpacity={0.75} />
    <path d={ROOM_PATHS.line} strokeWidth={3} />
    <path d={ROOM_PATHS.fine} strokeWidth={1.3} strokeOpacity={0.7} />
  </g>
);
/** the room. `draw` 0 = dormant (0.28) .. 1 = drawn (0.55), the front going from the floor up */
export const Room: React.FC<{ draw?: number; uid?: string }> = ({ draw = 1, uid = "room" }) => {
  const front = mix(ROOM.floorY + 24, ROOM.topY - 8, draw);
  return (
    <g>
      <clipPath id={`${uid}-up`}>
        <rect x={-400} y={-400} width={2400} height={front + 400} />
      </clipPath>
      <clipPath id={`${uid}-dn`}>
        <rect x={-400} y={front} width={2400} height={1600} />
      </clipPath>
      {draw < 0.999 ? (
        <g clipPath={`url(#${uid}-up)`} opacity={0.28}>
          <RoomLines />
        </g>
      ) : null}
      {draw > 0.001 ? (
        <g clipPath={`url(#${uid}-dn)`} opacity={0.55}>
          <RoomLines />
        </g>
      ) : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE GOLDWORK: seven kinds of Inca piece, engraved (cream form, dark outline,
// a few strokes of shade on the right). Local units = world px, (0, 0) = the
// middle of the piece.
// ---------------------------------------------------------------------------
const circ = (cx: number, cy: number, r: number) => `M${cx - r},${cy}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0Z`;
const RAYS = Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * 2 * Math.PI;
  return `M${n1(18.6 * Math.cos(a))},${n1(18.6 * Math.sin(a))}L${n1(22 * Math.cos(a))},${n1(22 * Math.sin(a))}`;
}).join("");
type Kind = { w: number; h: number; body: string; lines: string; turn: number; weight: number };
const KINDS: Kind[] = [
  // kero: the flared beaker
  {
    w: 38,
    h: 50,
    turn: 12,
    weight: 2,
    body: "M-13,25L13,25Q13.5,2 19,-25L-19,-25Q-13.5,2 -13,25Z",
    lines: "M-17.6,-19L17.6,-19M-14.6,-5L14.6,-5M-13.5,9L13.5,9M-13,7L-8.7,-3L-4.3,7L0,-3L4.3,7L8.7,-3L13,7M8,13L9,22M11,12L11.5,22M12,-9L14,-16M15,-9L16.6,-16",
  },
  // aryballos (urpu): pointed base, round body, tall flared neck, two low handles
  {
    w: 40,
    h: 56,
    turn: 16,
    weight: 2,
    body: "M0,28Q-20,18 -18,6Q-16,-5 -5.5,-8L-4.6,-21Q-11,-25 -13,-28L13,-28Q11,-25 4.6,-21L5.5,-8Q16,-5 18,6Q20,18 0,28Z",
    lines: "M-4.9,-17L4.9,-17M-5.3,-11L5.3,-11M-17,4Q0,9 17,4M-17,11q-8,1 -4.5,8M17,11q8,1 4.5,8M0,-4l0,2.4M9,9L11.6,18M12.4,7L15,15M6,13L8,22",
  },
  // sun disc with a face
  {
    w: 48,
    h: 48,
    turn: 180,
    weight: 2,
    body: circ(0, 0, 24),
    lines: `${circ(0, 0, 16.5)}${circ(0, 0, 5.5)}${RAYS}M-11,0L-5.5,0M5.5,0L11,0M0,-11L0,-5.5M0,5.5L0,11M8,11L11.6,7.4M10.4,13.6L14.6,9.4M5.6,8.6L8.4,5.6`,
  },
  // standing figurine, hands on the chest
  {
    w: 20,
    h: 56,
    turn: 14,
    weight: 1,
    body: "M-6,28L-7,8L-9,6L-9,-10Q-9,-14 -5,-15L-6,-18Q-8,-27 0,-28Q8,-27 6,-18L5,-15Q9,-14 9,-10L9,6L7,8L6,28L1,28L0,11L-1,28Z",
    lines: "M-9,-8L-3,-3L3,-3L9,-8M-3.4,-21h2M1.4,-21h2M-1.6,-17.4h3.2M-6.6,-23.6Q0,-25.8 6.6,-23.6M-7,6h14M4,-12L6,-5M6,-1L7,5M3.4,13L4.4,25",
  },
  // llama figurine
  {
    w: 42,
    h: 50,
    turn: 9,
    weight: 1.5,
    body: "M-21,-16L-14,-19L-13,-26L-10.5,-20L-8.5,-26L-6,-18Q-4.5,-8 -3,-4L14,-4Q20,-3 20,6L19,24L14,24L13.5,9L-6.5,9L-7,24L-12,24L-12,4Q-12.5,-6 -14,-11L-20,-11.5Z",
    lines: "M-12.6,-15.6h0.2M-2,9L-2.4,21M9,9L9.4,21M0,-4L0,3L10,3L10,-4M2,-2.5L8,1.5M2,1.5L8,-2.5M20,0q4.4,2 2,7M14,0L16.5,7M17,-1L18.6,5M-9,-8L-7,-2",
  },
  // mask: a broad face with ear-tabs
  {
    w: 52,
    h: 38,
    turn: 10,
    weight: 0.8,
    body: "M-18,-18L18,-18Q22,-18 22,-9L26,-9L26,6L21,6Q19,19 0,19Q-19,19 -21,6L-26,6L-26,-9L-22,-9Q-22,-18 -18,-18Z",
    lines: "M-21,-12.5L21,-12.5M-14,-5Q-9,-10 -4,-5Q-9,-2 -14,-5M4,-5Q9,-10 14,-5Q9,-2 4,-5M-2,-6L-3.2,5L3.2,5L2,-6M-8,10.5L8,10.5M-8,10.5Q0,15 8,10.5M-4,10.6l0,2.4M0,10.6l0,3M4,10.6l0,2.4M14,2L17,10M17.4,0L19.4,8M11,9L13,15",
  },
  // bar
  {
    w: 54,
    h: 20,
    turn: 7,
    weight: 2,
    body: "M-27,10L-22,-10L22,-10L27,10Z",
    lines: "M-19,-4.5L19,-4.5M-22,-10L-19,-4.5M22,-10L19,-4.5M14,-1L17,8M18,-2L21,8M10,1L12,8",
  },
];
const KIND_SUM = KINDS.reduce((s, q) => s + q.weight, 0);
type Piece = { kind: number; tf: string; x: number; y: number; deep: boolean; back: boolean; p: number };
const FILL_WINDOW = 0.09;
/** the heap, packed in courses whose tops step down from the line; drawn floor course first, the back layer under the front */
const PIECES: Piece[] = (() => {
  const out: (Piece & { order: number })[] = [];
  const NROWS = 8;
  const pitch = (HEAP_H - 62) / (NROWS - 1);
  for (const back of [true, false]) {
    for (let r = 0; r <= NROWS; r++) {
      const floorRow = r === NROWS;
      const rowTop = LINE_Y + r * pitch + (back && r > 0 ? -pitch / 2 : 0);
      const sd = r * 31 + (back ? 500 : 0);
      let x = ROOM.x0 - 26 * hash(sd, 1) - (back ? 14 : 0);
      let prev = -1;
      for (let i = 0; x < ROOM.x1 + 4; i++) {
        let pick = hash(sd + i * 3, 2) * KIND_SUM;
        let kind = 0;
        while (pick > KINDS[kind].weight) pick -= KINDS[kind++].weight;
        if (kind === prev) kind = (kind + 1 + Math.floor(hash(sd + i, 3) * 5)) % KINDS.length;
        prev = kind;
        const q = KINDS[kind];
        const sc = 1.16 + 0.2 * hash(sd + i, 4);
        const w = q.w * sc;
        const h = q.h * sc;
        const rot = (hash(sd + i, 5) - 0.5) * 2 * (r === 0 ? Math.min(3, q.turn) : q.turn);
        const top = floorRow ? ROOM.floorY - h - 1 : rowTop + (r === 0 ? 0.5 : 7 * hash(sd + i, 6));
        const cx = x + w / 2;
        const cy = top + h / 2;
        const base = clamp01((ROOM.floorY - top) / HEAP_H);
        out.push({
          kind,
          x: cx,
          y: cy,
          tf: `rotate(${rot.toFixed(1)}) scale(${sc.toFixed(3)})`,
          deep: hash(sd + i, 7) < 0.3,
          back,
          p: (1 - FILL_WINDOW - 0.05) * base + 0.05 * hash(sd + i, 8) - (back ? 0.01 : 0),
          order: (back ? 0 : 1000) + (NROWS - r) * 10 + hash(sd + i, 9),
        });
        x += w * 0.9 + 1;
      }
    }
  }
  return out.sort((a, b) => a.order - b.order);
})();
const BACK_FILL = mixColor(LAND, INK, 0.56);
/** the heap of goldwork. `fill` 0 = none .. 1 = to the line (level; clipped at the line and the walls' inner faces) */
export const Heap: React.FC<{ fill: number; uid?: string }> = ({ fill, uid = "heap" }) => {
  if (fill <= 0.0005) return null;
  return (
    <g>
      <clipPath id={`${uid}-in`}>
        <rect x={ROOM.x0 + 1.5} y={LINE_Y} width={ROOM.x1 - ROOM.x0 - 3} height={HEAP_H - 1.5} />
      </clipPath>
      <g clipPath={`url(#${uid}-in)`}>
        {PIECES.map((q, i) => {
          const a = smoothstep((fill - q.p) / FILL_WINDOW);
          if (a <= 0.002) return null;
          const k = KINDS[q.kind];
          return (
            <g key={i} transform={`translate(${q.x.toFixed(1)} ${(q.y - 3 * (1 - a)).toFixed(2)}) ${q.tf}`} opacity={a < 0.998 ? a : undefined}>
              <path d={k.body} fill={q.back ? BACK_FILL : q.deep ? C_DEEP : INK} stroke={DARK} strokeWidth={q.back ? 1.6 : 2} strokeLinejoin="round" />
              <path d={k.lines} {...ln(q.back ? 1 : 1.25, q.back ? 0.6 : 0.82)} />
            </g>
          );
        })}
      </g>
    </g>
  );
};

/** his mark: a chalk line across the room at LINE_Y, drawn head-led left -> right (p 0..1) */
const CHALK = Array.from({ length: 96 }, (_, i): P2 => {
  const x = ROOM.x0 + ((ROOM.x1 - ROOM.x0) * i) / 95;
  return [x, LINE_Y + 1.5 * (hash(Math.floor(i / 3), 601) - 0.5) + 0.9 * (hash(i, 602) - 0.5)];
});
export const ChalkLine: React.FC<{ p?: number; k?: number }> = ({ p = 1, k = 1 }) => {
  if (p <= 0.002) return null;
  const xe = mix(ROOM.x0, ROOM.x1, p);
  const pts = CHALK.filter((q) => q[0] <= xe);
  const nxt = CHALK[pts.length];
  if (nxt) {
    const prv = pts[pts.length - 1];
    const t = (xe - prv[0]) / (nxt[0] - prv[0]);
    pts.push([xe, mix(prv[1], nxt[1], t)]);
  }
  if (pts.length < 2) return null;
  const d = `M${pts.map((q) => `${n1(q[0])},${n1(q[1])}`).join("L")}`;
  const w = 4.4 / k;
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={DARK} strokeOpacity={0.6} strokeWidth={w + 3 / k} />
      <path d={d} stroke={INK} strokeWidth={w} />
      <path d={d} stroke="#FFF8E6" strokeOpacity={0.7} strokeWidth={w * 0.38} strokeDasharray="9 4 17 3 6 5" transform="translate(0 -0.6)" />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE GAUNTLET, ABLE TO LOOSEN: stringsShared's CaptorHand (drawn without its
// bar, its four fingers cut out) over a local copy of its bar, with the fingers
// and knuckles redrawn on top. loose 0 = the shared hand + bar to the pixel;
// loose 1 = the fingers uncurled 7 units and parted, the bar free to dip.
// ---------------------------------------------------------------------------
const FINGERS = [0, 1, 2, 3].map((j) => ({ j, x0: -59.5 + j * 29.8, w: 28.8 }));
const BAR_HALF = 180;
const BAR_HATCH = hatchD(-BAR_HALF, 18, BAR_HALF, 26, 100, 4, 77, 0.2);
const FINGER_HATCH = FINGERS.map((f) => hatchD(f.x0 + f.w - 10, -9, f.x0 + f.w - 1.4, 27, 95, 2.2, 78 + f.j, 0.2));
export const RansomHand: React.FC<{ loose?: number; dip?: number; at?: P2; uid?: string }> = ({ loose = 0, dip = 0, at = HAND_AT, uid = "rh" }) => {
  const S = HAND_S;
  const e = 7 * loose;
  const m = 1.3;
  const cut = (f: { x0: number; w: number }) => {
    const X = (x: number) => n1(at[0] + S * x);
    const Y = (y: number) => n1(at[1] + S * y);
    return (
      `M-4000,-4000H5000V5000H-4000Z` +
      `M${X(f.x0 - m)},${Y(-9)}L${X(f.x0 + f.w + m)},${Y(-9)}L${X(f.x0 + f.w + m)},${Y(18)}Q${X(f.x0 + f.w + m)},${Y(31 + m)} ${X(f.x0 + f.w / 2)},${Y(31 + m)}Q${X(f.x0 - m)},${Y(31 + m)} ${X(f.x0 - m)},${Y(18)}Z`
    );
  };
  const h = BAR_HALF;
  const shared = FINGERS.reduce<React.ReactNode>(
    (inner, f) => <g clipPath={`url(#${uid}-cut${f.j})`}>{inner}</g>,
    <CaptorHand bar={0} tilt={0} at={at} tone={1} uid={`${uid}-h`} />,
  );
  return (
    <g>
      {FINGERS.map((f) => (
        <clipPath key={f.j} id={`${uid}-cut${f.j}`}>
          <path d={cut(f)} clipRule="evenodd" />
        </clipPath>
      ))}
      {/* the cross-bar (the shared bar at bar = 1), free to dip */}
      <g transform={`translate(${at[0].toFixed(2)} ${(at[1] + dip).toFixed(2)})`}>
        <path d={`M${-h},2L${h},2L${h + 3},14L${h},26L${-h},26L${-h - 3},14Z`} fill={C_DEEP} {...OUT} />
        <path d={`M${-h + 8},8Q${-h * 0.4},5.5 0,8T${h - 8},7.5M${-h + 14},13.5Q${-h * 0.5},16 ${-h * 0.1},13T${h - 10},14M${-h + 6},19Q0,21 ${h - 6},19`} {...ln(0.95, 0.6)} />
        <path d={BAR_HATCH} {...ln(0.85, 0.5)} />
        {[-1, 1].map((sg) => (
          <path key={sg} d={[-3.4, 0, 3.4].map((o) => `M${sg * (h - 12) + o},1L${sg * (h - 12) + o},27`).join("")} {...ln(1.5, 0.9)} />
        ))}
      </g>
      {shared}
      <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) scale(${S})`}>
        {FINGERS.map((f, j) => {
          const cy = (c: number) => n1(c * (1 + e / 31));
          return (
            <g key={j} transform={`rotate(${((j - 1.5) * 2.6 * loose).toFixed(2)} ${n1(f.x0 + f.w / 2)} -11)`}>
              <path d={`M${f.x0},-11L${f.x0 + f.w},-11L${f.x0 + f.w},${n1(18 + e)}Q${f.x0 + f.w},${n1(31 + e)} ${f.x0 + f.w / 2},${n1(31 + e)}Q${f.x0},${n1(31 + e)} ${f.x0},${n1(18 + e)}Z`} fill={INK} {...OUT} strokeWidth={2} />
              <path
                d={`M${f.x0},${cy(0)}Q${f.x0 + f.w / 2},${n1(+cy(0) + 4.4)} ${f.x0 + f.w},${cy(0)}M${f.x0},${cy(10)}Q${f.x0 + f.w / 2},${n1(+cy(10) + 4.4)} ${f.x0 + f.w},${cy(10)}M${f.x0 + 1},${cy(20)}Q${f.x0 + f.w / 2},${n1(+cy(20) + 4)} ${f.x0 + f.w - 1},${cy(20)}`}
                {...ln(1.05, 0.75)}
              />
              <path d={FINGER_HATCH[j]} {...ln(0.8, 0.6)} />
            </g>
          );
        })}
        {FINGERS.map((f, j) => (
          <g key={j}>
            <path d={`M${f.x0 + 1},-9Q${f.x0 + f.w / 2},-27 ${f.x0 + f.w - 1},-9Z`} fill={INK} {...OUT} strokeWidth={1.9} />
            <path d={`M${f.x0 + f.w * 0.55},-17.4q5,2 6.6,7.6M${f.x0 + f.w * 0.7},-13.6q2.6,1.6 3.2,4`} {...ln(0.8, 0.55)} />
          </g>
        ))}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE TABLEAU: room, heap, line, Atahualpa, the three strings, the gauntlet,
// the label. Children of a StringsPage.
// ---------------------------------------------------------------------------
export const RansomTableau: React.FC<{ state: RansomState; cam: Cam; frame?: number; uid?: string }> = ({ state: s, cam, frame = 0, uid = "rt" }) => {
  const k = cam.k;
  const geom = ransomStrings(s);
  const levelY = ROOM.floorY - s.fill * HEAP_H;
  return (
    <>
      <WorldSvg cam={cam}>
        <Room draw={s.room} uid={`${uid}-room`} />
        <Heap fill={s.fill} uid={`${uid}-heap`} />
        {s.dim > 0.003 && s.fill > 0.01 ? (
          <g>
            {/* his silhouette in the page colour, between heap and figure: a 7 px casing + the heap down to 0.72 in a soft ~45 px margin */}
            <filter id={`${uid}-soft`} filterUnits="userSpaceOnUse" x={EMPEROR_AT[0] - 240} y={EMPEROR_AT[1] - 460} width={480} height={520}>
              <feMorphology in="SourceAlpha" operator="dilate" radius={30} result="wide" />
              <feGaussianBlur in="wide" stdDeviation={9} result="margin" />
              <feFlood floodColor={LAND} floodOpacity={0.28} />
              <feComposite in2="margin" operator="in" result="dimmed" />
              <feMorphology in="SourceAlpha" operator="dilate" radius={6.5} result="near" />
              <feGaussianBlur in="near" stdDeviation={0.7} result="edge" />
              <feFlood floodColor={mixColor(LAND, DARK, 0.25)} floodOpacity={1} />
              <feComposite in2="edge" operator="in" result="casing" />
              <feMerge>
                <feMergeNode in="dimmed" />
                <feMergeNode in="casing" />
              </feMerge>
            </filter>
            <clipPath id={`${uid}-lvl`}>
              <rect x={ROOM.x0} y={levelY} width={ROOM.x1 - ROOM.x0} height={ROOM.floorY - levelY + 12} />
            </clipPath>
            <g clipPath={`url(#${uid}-lvl)`} opacity={Math.min(1, s.dim / 0.5)}>
              <g filter={`url(#${uid}-soft)`}>
                <Emperor pose={s.pose} variant="inca" tone={1} uid={`${uid}-ec`} />
              </g>
            </g>
          </g>
        ) : null}
        <ChalkLine p={s.line} k={k} />
        <Emperor pose={s.pose} variant="inca" tone={1} uid={`${uid}-e`} />
        {WHICH.map((w, i) => {
          const st = s.strings[w];
          const taut = st.slack[0] <= 0.12 && st.slack[1] <= 0.12;
          return <PuppetString key={w} {...geom[w]} base={st.base} live={st.live} highlight={taut && st.live ? glintAt(frame, 7 + i) : null} k={k} />;
        })}
        <RansomHand loose={s.loose} dip={s.dip} uid={`${uid}-hand`} />
      </WorldSvg>
      {s.labelF0 !== null ? <Label text={RANSOM_LABEL.text} x={RANSOM_LABEL.x} y={RANSOM_LABEL.y} cam={cam} frame={frame} f0={s.labelF0} size={RANSOM_LABEL.size} /> : null}
    </>
  );
};

// ---------------------------------------------------------------------------
// CHECKS (module scope: a broken layout fails before a frame is rendered)
// ---------------------------------------------------------------------------
(() => {
  if (LINE_Y < ROOM.topY + 60 || LINE_Y > EMPEROR_AT[1] - 330) throw new Error(`FillThatRoom: the line at y ${LINE_Y} is not above his head and under the wall top`);
  // nothing of the heap above the line (it is clipped there) and it reaches it
  if (!PIECES.some((q) => !q.back && Math.abs(q.y - LINE_Y) < 40)) throw new Error("FillThatRoom: the heap's top course is missing");
  if (PIECES.some((q) => q.p + FILL_WINDOW > 1.0001)) throw new Error("FillThatRoom: a piece is still arriving at fill 1");
  for (let f = 0; f < DURATION; f++) {
    const cam = ransomCamAt(f);
    // from the wide on, the floor stays above the caption band and both walls in frame
    if (f >= GLIDE[1]) {
      const fy = screenOf([ROOM_CX, ROOM.floorY + 16], cam)[1];
      if (fy >= CAPTION_TOP) throw new Error(`FillThatRoom: the floor in the caption band at f${f} (y ${fy.toFixed(0)})`);
      const xl = screenOf([ROOM.x0 - ROOM.wall - ROOM.batter, 0], cam)[0];
      const xr = screenOf([ROOM.x1 + ROOM.wall + ROOM.batter, 0], cam)[0];
      if (xl < 40 || xr > 1040) throw new Error(`FillThatRoom: a wall within 40 px of the edge at f${f} (${xl.toFixed(0)}, ${xr.toFixed(0)})`);
    }
  }
  // the end: slack, not released
  const e = RANSOM_END;
  for (const w of WHICH) {
    if (!e.strings[w].live || e.strings[w].slack[1] < 0.3 || e.strings[w].slack[1] > 0.45) throw new Error(`FillThatRoom: string ${w} is not hanging slack and orange on the last frame`);
  }
})();

const FillThatRoom: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  const cam = ransomCamAt(frame);
  return (
    <StringsPage cam={cam} vignette={vignette}>
      <RansomTableau state={ransomStateAt(frame)} cam={cam} frame={frame} uid="ftr" />
    </StringsPage>
  );
};

export default FillThatRoom;
