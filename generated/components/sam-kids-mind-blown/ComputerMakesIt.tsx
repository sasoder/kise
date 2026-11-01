// ---------------------------------------------------------------------------
// ComputerMakesIt (sam-kids-mind-blown, cut 49). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 100 frames. The last shot of the whole clip.
//
// CHECK LINE: "Whatever a kid can imagine, the computer just makes real, and to the kid that's simply normal."
//
// THE LINE: "(any) ideas they can come up with, anything they want to create, the computer's supposed to make it."
// WORD -> FRAME: ideas 4 · they 17 · can 23 · come 26 · up 30 · with 33 · anything 37 · they 45 · want 51 · to 55 ·
//   create 58 · the 67 · computer's 75 · supposed 83 · to 85 · make 90 · it 93
// DURATION: the slot 49.841 -> 54.012 s (sequence frames 1195 -> 1295) = 100 frames (f0..f99).
//
// THE MOTION: one slow pull-back, one amber wave. Close on the kid at the laptop, a dashed cream dragon drawing itself
// above their head, face first; as the camera eases back, five more ideas are drawn one after another by a moving crayon tip. On "the
// computer's" the screen flares and one soft light front spreads from it: whatever it touches goes from cream dashes to a
// solid amber card object with a cream top edge and its own shadow landing on the board. Every state comes from the
// front's radius (a mask at the front, the shadow's landing from where the front stands on the object); the furthest
// object is reached on f93 ("make it"). Then it lives: flame, wing, robot arm, ship, flag. On "make it" the kid's head lifts a little, the eye glances at the room
// for a beat and goes straight back to the screen; the smile never changes, the typing and the swinging foot never stop.
// The dashed versions are outer silhouettes plus at most one interior feature; the detail arrives with the fill.
// AMBER = what gets made. Before the wave the only amber is on the laptop screen; cream dashes before, amber after.
// Cause before effect: first flare f64 -> the front leaves the screen f67; the far reach (F_REACH) is f93.
//
// SOURCES: the blossom on the laptop comes from kidsShared (Commons "OpenAI logo 2025 (symbol)"). No figures.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, StoutStage, bloomFilter, clamp01, lerp, mixHex, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { UnionShadow, makeClockCam, makePoolTrack, type SilItem } from "../kits/cheeky-pint/museShared";
import { CHILD, Desk, Kid, Laptop, SKIN, Stool, blinkAt, deskSil, laptopFrame, laptopSil, personSil, stoolSil, swingAt, worldToLocal, type P2 } from "./kidsShared";

export const FPS = 24000 / 1001;
export const DURATION = 100;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const D2R = Math.PI / 180;

// ---------------------------------------------------------------------------
// THE CRAYON: a thick marker line, cut into real dashes along the arc, each grown by the moving tip
// ---------------------------------------------------------------------------
const LINE_W = 10.5;
const DASH = 44;
const GAP = 16.5;
const STEP = 2.5;
const RIM = 5;

type Pt = [number, number] | [number, number, 1];
type Tone = "amber" | "deep" | "ink" | "hot" | "cream";
type Live = "wing" | "flame" | "arm" | "flag";
type PartSpec = {
  pts: Pt[];
  open?: boolean;
  tone?: Tone;
  /** a stroked part (rails, masts, a track), its solid width */
  sw?: number;
  live?: Live;
  /** a panel printed on its part: no cream edge */
  flat?: boolean;
};
const midOf = (a: Pt, b: Pt): P2 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const quad = (out: P2[], a: P2, c: P2, b: P2) => {
  const n = Math.max(2, Math.ceil((Math.hypot(c[0] - a[0], c[1] - a[1]) + Math.hypot(b[0] - c[0], b[1] - c[1])) / 2));
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]);
  }
};
/** through the midpoints with quadratics (soft, like a crayon); a point with a third value 1 is a real corner */
const flatten = (pts: Pt[], open: boolean): P2[] => {
  const out: P2[] = [];
  const n = pts.length;
  if (open) {
    out.push([pts[0][0], pts[0][1]]);
    for (let i = 1; i < n - 1; i++) {
      const b = i === n - 2 ? ([pts[n - 1][0], pts[n - 1][1]] as P2) : midOf(pts[i], pts[i + 1]);
      if (pts[i][2]) {
        out.push([pts[i][0], pts[i][1]], b);
      } else quad(out, out[out.length - 1], [pts[i][0], pts[i][1]], b);
    }
    if (n === 2) out.push([pts[1][0], pts[1][1]]);
    return out;
  }
  out.push(midOf(pts[n - 1], pts[0]));
  for (let i = 0; i < n; i++) {
    const b = midOf(pts[i], pts[(i + 1) % n]);
    if (pts[i][2]) {
      out.push([pts[i][0], pts[i][1]], b);
    } else quad(out, out[out.length - 1], [pts[i][0], pts[i][1]], b);
  }
  return out;
};
/** uniform arc samples, `STEP` apart */
const resample = (poly: P2[]): { s: P2[]; len: number } => {
  let len = 0;
  for (let i = 1; i < poly.length; i++) len += Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]);
  const n = Math.max(1, Math.round(len / STEP));
  const s: P2[] = [poly[0]];
  let seg = 1;
  let acc = 0;
  let segLen = Math.hypot(poly[1][0] - poly[0][0], poly[1][1] - poly[0][1]);
  for (let i = 1; i <= n; i++) {
    const want = (i / n) * len;
    while (acc + segLen < want - 1e-6 && seg < poly.length - 1) {
      acc += segLen;
      seg++;
      segLen = Math.hypot(poly[seg][0] - poly[seg - 1][0], poly[seg][1] - poly[seg - 1][1]);
    }
    const t = segLen > 0 ? clamp01((want - acc) / segLen) : 0;
    s.push([lerp(poly[seg - 1][0], poly[seg][0], t), lerp(poly[seg - 1][1], poly[seg][1], t)]);
  }
  return { s, len };
};
const polyPath = (p: P2[], close: boolean) => `${p.map((q, i) => `${i ? "L" : "M"}${f3(q[0])} ${f3(q[1])}`).join("")}${close ? "Z" : ""}`;

// shape helpers (object-local px, y down)
const circ = (cx: number, cy: number, r: number): Pt[] => {
  const n = 10;
  const R = r / Math.cos(Math.PI / n);
  return Array.from({ length: n }, (_, i): Pt => [cx + R * Math.cos((i / n) * 2 * Math.PI + Math.PI / 2), cy + R * Math.sin((i / n) * 2 * Math.PI + Math.PI / 2)]);
};
const box = (x0: number, y0: number, x1: number, y1: number): Pt[] => [
  [x1, y1, 1],
  [x0, y1, 1],
  [x0, y0, 1],
  [x1, y0, 1],
];
/** soft-cornered box: reads as cut card */
const rbox = (x0: number, y0: number, x1: number, y1: number, r = 10): Pt[] => [
  [x1, y1 - r],
  [x1, y1],
  [x1 - r, y1],
  [x0 + r, y1],
  [x0, y1],
  [x0, y1 - r],
  [x0, y0 + r],
  [x0, y0],
  [x0 + r, y0],
  [x1 - r, y0],
  [x1, y0],
  [x1, y0 + r],
];
const battlements = (x0: number, x1: number, y: number, n: number, h: number): Pt[] => {
  const out: Pt[] = [];
  const w = (x1 - x0) / (2 * n - 1);
  for (let i = 0; i < 2 * n - 1; i++) {
    const a = x0 + i * w;
    const top = i % 2 === 0 ? y - h : y;
    out.push([a, top, 1], [a + w, top, 1]);
  }
  return out;
};

// ---------------------------------------------------------------------------
// THE IDEAS. `spec` is the solid object (back to front, with all its detail); `crayon` is the dashed drawing, in the order
// the tip draws it: the outer silhouette and at most one interior feature, so no two lines ever run side by side.
// ---------------------------------------------------------------------------
const flipPart = (q: PartSpec): PartSpec => ({ ...q, pts: q.pts.map((v): Pt => (v[2] ? [-v[0], v[1], 1] : [-v[0], v[1]])) });
const corners = (pts: [number, number][]): Pt[] => pts.map(([x, y]): Pt => [x, y, 1]);

// the dragon is authored facing right and mirrored: its face sits over the kid's head, its body over the laptop
const DRAGON: PartSpec[] = (
  [
    {
      live: "wing",
      tone: "deep",
      pts: [
        [14, -26, 1],
        [-4, -84],
        [-40, -126, 1],
        [-46, -86],
        [-86, -104, 1],
        [-76, -66],
        [-114, -66, 1],
        [-84, -40],
        [-46, -18, 1],
      ],
    },
    {
      pts: [
        [-146, -10, 1],
        [-116, 20],
        [-98, 18],
        [-90, -4, 1],
        [-72, 8],
        [-62, -14, 1],
        [-46, -8],
        [-20, -24],
        [12, -28],
        [34, -34],
        [44, -46],
        [28, -62, 1],
        [54, -66],
        [40, -88, 1],
        [66, -92],
        [88, -118],
        [122, -120],
        [152, -106],
        [168, -84],
        [160, -66],
        [126, -60],
        [106, -54],
        [100, -30],
        [100, 10],
        [94, 40],
        [92, 60],
        [100, 94, 1],
        [56, 94, 1],
        [54, 66],
        [10, 72],
        [-20, 68],
        [-22, 94, 1],
        [-68, 94, 1],
        [-68, 62],
        [-100, 54],
        [-140, 46, 1],
        [-172, 24, 1],
      ],
    },
    {
      tone: "deep",
      pts: [
        [76, -110, 1],
        [58, -148, 1],
        [100, -120, 1],
      ],
    },
    { tone: "ink", pts: circ(124, -94, 8) },
    {
      open: true,
      tone: "ink",
      sw: 4.5,
      pts: [
        [160, -74],
        [146, -72],
        [128, -76],
      ],
    },
  ] as PartSpec[]
).map(flipPart);
const DRAGON_LINE: PartSpec[] = (
  [
    // the face first: from under the jaw round the snout, over the head and horn, down the neck's spikes
    {
      open: true,
      pts: [
        [106, -54],
        [126, -60],
        [160, -66],
        [168, -84],
        [152, -106],
        [122, -120],
        [100, -120, 1],
        [58, -148, 1],
        [76, -110, 1],
      ],
    },
    { pts: circ(124, -94, 9) },
    {
      open: true,
      pts: [
        [76, -110, 1],
        [66, -92],
        [40, -88, 1],
        [54, -66],
        [28, -62, 1],
        [44, -46],
        [34, -34],
        [14, -26, 1],
      ],
    },
    // then the wing, the tail, the belly and legs, back up the chest to the jaw
    {
      open: true,
      pts: [
        [14, -26, 1],
        [-4, -84],
        [-40, -126, 1],
        [-46, -86],
        [-86, -104, 1],
        [-76, -66],
        [-114, -66, 1],
        [-84, -40],
        [-62, -14, 1],
        ],
    },
    // the wing closes on the back, so it reads as a wing and not as the back's spikes
    { open: true, pts: [[-62, -14], [-24, -28], [14, -26]] },
    {
      open: true,
      pts: [
        [-62, -14, 1],
        [-72, 8],
        [-90, -4, 1],
        [-98, 18],
        [-116, 20],
        [-146, -10, 1],
        [-172, 24, 1],
        [-140, 46, 1],
        [-100, 54],
        [-68, 62],
        [-68, 94, 1],
        [-22, 94, 1],
        [-20, 68],
        [10, 72],
        [54, 66],
        [56, 94, 1],
        [100, 94, 1],
        [92, 60],
        [94, 40],
        [100, 10],
        [100, -30],
        [106, -54],
      ],
    },
  ] as PartSpec[]
).map(flipPart);

const ROBOT: PartSpec[] = [
  { tone: "deep", pts: rbox(-46, 66, -12, 124, 4) },
  { tone: "deep", pts: rbox(12, 66, 46, 124, 4) },
  { pts: rbox(-58, 124, -4, 152, 9) },
  { pts: rbox(4, 124, 58, 152, 9) },
  { tone: "deep", pts: rbox(-108, -28, -72, 44, 10) },
  {
    live: "arm",
    tone: "deep",
    pts: corners([
      [60, -14],
      [60, -36],
      [82, -44],
      [104, -112],
      [136, -102],
      [112, -14],
    ]),
  },
  { pts: rbox(-68, -34, 68, 64, 14) },
  { tone: "ink", pts: circ(0, 14, 17) },
  {
    open: true,
    tone: "deep",
    sw: 7,
    pts: [
      [0, -110],
      [0, -142],
    ],
  },
  { tone: "hot", pts: circ(0, -150, 11) },
  { pts: rbox(-56, -112, 56, -38, 14) },
  { tone: "ink", pts: circ(-24, -82, 11) },
  { tone: "ink", pts: circ(24, -82, 11) },
  {
    open: true,
    tone: "ink",
    sw: 6,
    pts: [
      [-22, -55],
      [22, -55],
    ],
  },
];
const ROBOT_LINE: PartSpec[] = [
  {
    pts: corners([
      [58, 152],
      [10, 152],
      [10, 92],
      [-10, 92],
      [-10, 152],
      [-58, 152],
      [-58, 124],
      [-46, 124],
      [-46, 64],
      [-68, 64],
      [-68, 44],
      [-108, 44],
      [-108, -28],
      [-68, -28],
      [-68, -36],
      [-56, -36],
      [-56, -112],
      [56, -112],
      [56, -36],
      [82, -44],
      [104, -112],
      [136, -102],
      [112, -14],
      [68, -14],
      [68, 64],
      [46, 64],
      [46, 124],
      [58, 124],
    ]),
  },
  { open: true, pts: [[0, -112], [0, -140]] },
  { pts: circ(0, -150, 11) },
  { pts: circ(0, 14, 17) },
];
const ENVELOPE: Pt[] = [
  [30, 62, 1],
  [70, 24],
  [112, -26],
  [124, -86],
  [102, -150],
  [44, -188],
  [-44, -188],
  [-102, -150],
  [-124, -86],
  [-112, -26],
  [-70, 24],
  [-30, 62, 1],
];
const GORE: Pt[] = [
  [0, -178, 1],
  [30, -122],
  [38, -60],
  [24, 8],
  [0, 58, 1],
  [-24, 8],
  [-38, -60],
  [-30, -122],
];
const sideGore = (m: 1 | -1): Pt[] =>
  (
    [
      [24, -176, 1],
      [76, -132],
      [94, -80],
      [78, -20],
      [18, 54, 1],
      [54, -20],
      [66, -80],
      [52, -132],
    ] as Pt[]
  ).map((v): Pt => (v[2] ? [m * v[0], v[1], 1] : [m * v[0], v[1]]));
const BALLOON: PartSpec[] = [
  { open: true, tone: "deep", sw: 5, pts: [[-27, 60], [-22, 112]] },
  { open: true, tone: "deep", sw: 5, pts: [[27, 60], [22, 112]] },
  { tone: "deep", pts: rbox(-32, 110, 32, 158, 7) },
  { pts: ENVELOPE },
  { tone: "deep", flat: true, pts: GORE },
  { tone: "deep", flat: true, pts: sideGore(1) },
  { tone: "deep", flat: true, pts: sideGore(-1) },
];
const BALLOON_LINE: PartSpec[] = [
  { pts: rbox(-32, 110, 32, 158, 7) },
  { open: true, pts: [[-22, 110], [-27, 62]] },
  { pts: ENVELOPE },
  { open: true, pts: [[27, 62], [22, 110]] },
  { pts: [[0, -158], [28, -112], [36, -60], [22, -6], [0, 34], [-22, -6], [-36, -60], [-28, -112]] },
];
const CASTLE_WALL: Pt[] = [
  [144, 106, 1],
  [-144, 106, 1],
  [-144, -46, 1],
  ...battlements(-144, -72, -46, 2, 26),
  [-72, 12, 1],
  [-38, 12, 1],
  [-38, -76, 1],
  ...battlements(-38, 38, -76, 2, 26),
  [38, 12, 1],
  [72, 12, 1],
  [72, -46, 1],
  ...battlements(72, 144, -46, 2, 26),
  [144, -46, 1],
];
const CASTLE: PartSpec[] = [
  { open: true, tone: "deep", sw: 6, pts: [[0, -80], [0, -132]] },
  { live: "flag", tone: "hot", pts: corners([[2, -132], [52, -116], [2, -100]]) },
  { pts: CASTLE_WALL },
  { tone: "ink", pts: [[26, 106, 1], [-26, 106, 1], [-26, 62], [-20, 36], [0, 28], [20, 36], [26, 62]] },
  { tone: "ink", pts: rbox(-116, -12, -96, 30, 7) },
  { tone: "ink", pts: rbox(96, -12, 116, 30, 7) },
  { tone: "ink", pts: circ(0, -28, 13) },
];
const CASTLE_LINE: PartSpec[] = [
  { pts: CASTLE_WALL },
  { open: true, pts: [[26, 106], [26, 62], [20, 36], [0, 28], [-20, 36], [-26, 62], [-26, 106]] },
  { open: true, pts: corners([[0, -76], [0, -132], [52, -116], [1, -100]]) },
];
const ROCKET: PartSpec[] = [
  {
    live: "flame",
    tone: "hot",
    pts: [
      [24, 114, 1],
      [34, 152],
      [14, 146],
      [0, 188, 1],
      [-14, 146],
      [-34, 152],
      [-24, 114, 1],
    ],
  },
  { tone: "deep", pts: box(-30, 86, 30, 114) },
  { tone: "deep", pts: [[-56, 8, 1], [-100, 76], [-106, 126, 1], [-46, 92, 1]] },
  { tone: "deep", pts: [[56, 8, 1], [100, 76], [106, 126, 1], [46, 92, 1]] },
  {
    pts: [
      [46, 94, 1],
      [62, 40],
      [66, -48],
      [42, -122],
      [0, -172, 1],
      [-42, -122],
      [-66, -48],
      [-62, 40],
      [-46, 94, 1],
    ],
  },
  { tone: "ink", pts: circ(0, -46, 28) },
];
const ROCKET_LINE: PartSpec[] = [
  {
    pts: [
      [0, 188, 1],
      [-14, 146],
      [-34, 152],
      [-24, 114, 1],
      [-30, 114, 1],
      [-30, 94, 1],
      [-46, 92, 1],
      [-106, 126, 1],
      [-100, 76],
      [-58, 8, 1],
      [-66, -48],
      [-42, -122],
      [0, -172, 1],
      [42, -122],
      [66, -48],
      [58, 8, 1],
      [100, 76],
      [106, 126, 1],
      [46, 92, 1],
      [30, 94, 1],
      [30, 114, 1],
      [24, 114, 1],
      [34, 152],
      [14, 146],
    ],
  },
  { pts: circ(0, -46, 28) },
];
const SAIL: Pt[] = [
  [-92, -96, 1],
  [72, -96, 1],
  [88, -42],
  [72, 18, 1],
  [-92, 18, 1],
  [-76, -40],
];
const HULL: Pt[] = [
  [96, 104],
  [122, 72],
  [156, 6, 1],
  [66, 38],
  [-92, 38],
  [-154, 14, 1],
  [-138, 72],
  [-108, 104],
];
const SHIP: PartSpec[] = [
  { open: true, tone: "deep", sw: 8, pts: [[-8, 40], [-8, -122]] },
  { tone: "ink", pts: box(-8, -152, 50, -118) },
  { tone: "cream", pts: circ(20, -135, 8) },
  { tone: "hot", pts: SAIL },
  { open: true, tone: "deep", sw: 8, pts: [[-8, -96], [-8, -124]] },
  { pts: HULL },
  { tone: "ink", pts: circ(-64, 68, 10) },
  { tone: "ink", pts: circ(0, 68, 10) },
  { tone: "ink", pts: circ(64, 68, 10) },
];
const SHIP_LINE: PartSpec[] = [
  { pts: HULL },
  { open: true, pts: [[-8, 38], [-8, 18]] },
  { pts: SAIL },
  { open: true, pts: corners([[-8, -96], [-8, -152], [50, -152], [50, -118], [-8, -118]]) },
];

type Part = PartSpec & { d: string; s: P2[]; len: number; closed: boolean };
type Idea = {
  id: string;
  x: number;
  y: number;
  rot: number;
  scale: number;
  f0: number;
  f1: number;
  parts: Part[];
  crayon: Part[];
  y0: number;
  y1: number;
  /** nearest and farthest point from the screen, world */
  near: number;
  far: number;
};
type IdeaSpec = Pick<Idea, "id" | "x" | "y" | "rot" | "scale" | "f0" | "f1"> & { spec: PartSpec[]; line: PartSpec[] };

const WORLD = {
  kid: { x: 398, y: 1009, scale: 1.114 },
  lap: { x: 615, y: 907, w: 241, yaw: 30, pitch: 14, tilt: 14 },
};
const LAP_F = laptopFrame(WORLD.lap);
const FRONT_O = LAP_F.screenPoint(0.5, 0.5);

const buildIdea = (q: IdeaSpec): Idea => {
  const make = (p: PartSpec): Part => {
    const closed = !p.open;
    const scaled: Pt[] = p.pts.map((v) => (v[2] ? [v[0] * q.scale, v[1] * q.scale, 1] : [v[0] * q.scale, v[1] * q.scale]));
    const poly = flatten(scaled, !closed);
    const full = closed ? [...poly, poly[0]] : poly;
    const r = resample(full);
    return { ...p, d: polyPath(poly, closed), s: r.s, len: r.len, closed };
  };
  const parts = q.spec.map(make);
  const crayon = q.line.map(make);
  const c = Math.cos(q.rot * D2R);
  const n = Math.sin(q.rot * D2R);
  let near = Infinity;
  let far = 0;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const p of [...parts, ...crayon]) {
    for (const v of p.s) {
      y0 = Math.min(y0, v[1]);
      y1 = Math.max(y1, v[1]);
      const d = Math.hypot(q.x + v[0] * c - v[1] * n - FRONT_O[0], q.y + v[0] * n + v[1] * c - FRONT_O[1]);
      near = Math.min(near, d);
      far = Math.max(far, d);
    }
  }
  return { id: q.id, x: q.x, y: q.y, rot: q.rot, scale: q.scale, f0: q.f0, f1: q.f1, parts, crayon, y0, y1, near, far };
};

const IDEAS: Idea[] = (
  [
    { id: "dragon", spec: DRAGON, line: DRAGON_LINE, x: 558, y: 578, rot: 0, scale: 0.88, f0: -6, f1: 30 },
    { id: "robot", spec: ROBOT, line: ROBOT_LINE, x: 558, y: 300, rot: -2, scale: 0.74, f0: 12, f1: 34 },
    { id: "balloon", spec: BALLOON, line: BALLOON_LINE, x: 900, y: 726, rot: 2, scale: 0.9, f0: 20, f1: 40 },
    { id: "castle", spec: CASTLE, line: CASTLE_LINE, x: 170, y: 757, rot: -1.5, scale: 0.9, f0: 28, f1: 46 },
    { id: "rocket", spec: ROCKET, line: ROCKET_LINE, x: 168, y: 400, rot: -7, scale: 0.98, f0: 34, f1: 54 },
    { id: "ship", spec: SHIP, line: SHIP_LINE, x: 890, y: 340, rot: 1.5, scale: 0.95, f0: 42, f1: 62 },
  ] as IdeaSpec[]
).map(buildIdea);

// ---------------------------------------------------------------------------
// THE FRONT: one radius, every state follows from it
// ---------------------------------------------------------------------------
const F_FLARE = 64;
const F_FRONT = 67;
const F_REACH = 93;
const FEATHER = 34;
const FAR_R = Math.max(...IDEAS.map((i) => i.far));
const FRONT_V = (FAR_R + FEATHER * 0.5) / (F_REACH - F_FRONT);
/** the front's radius at frame f: leaves the screen at f67, constant speed after a short start */
const frontR = (f: number) => {
  const u = f - F_FRONT;
  if (u <= 0) return 0;
  return FRONT_V * (u < 4 ? (u * u) / 8 : u - 2) * ((F_REACH - F_FRONT) / (F_REACH - F_FRONT - 2));
};
/** how far the front has crossed an idea, 0..1 */
const crossed = (i: Idea, R: number) => clamp01((R - i.near) / Math.max(1, i.far - i.near));
/** the frame the front touches an idea */
const hitFrame = (i: Idea) => {
  for (let f = F_FRONT; f < DURATION + 40; f += 0.25) if (frontR(f) >= i.near) return f;
  return DURATION;
};
const HIT: Record<string, number> = Object.fromEntries(IDEAS.map((i) => [i.id, hitFrame(i)]));

// ---------------------------------------------------------------------------
// THE LIFE OF THE SOLID THINGS (all after the front has been there)
// ---------------------------------------------------------------------------
const partTf = (i: Idea, p: PartSpec, f: number): string | undefined => {
  const h = f - HIT[i.id];
  if (p.live === "wing") {
    const a = 13 * smoothstep(clamp01(h / 34));
    return `rotate(${f3(a)} ${f3(16 * i.scale)} ${f3(-22 * i.scale)})`;
  }
  if (p.live === "arm") {
    const a = 6 * smoothstep(clamp01(h / 16)) * Math.sin(h / 6.5);
    return `rotate(${f3(a)} ${f3(88 * i.scale)} ${f3(-18 * i.scale)})`;
  }
  if (p.live === "flag") {
    const a = 4 * Math.sin(f / 5.2);
    return `rotate(${f3(a)} ${f3(2 * i.scale)} ${f3(-116 * i.scale)})`;
  }
  if (p.live === "flame") {
    const y = 1 + 0.13 * Math.sin(f * 1.31) + 0.08 * Math.sin(f * 2.57 + 1.2);
    const x = 1 + 0.05 * Math.sin(f * 1.93 + 0.6);
    const oy = 114 * i.scale;
    return `translate(0 ${f3(oy)}) scale(${f3(x)} ${f3(y)}) translate(0 ${f3(-oy)})`;
  }
  return undefined;
};
const ideaTf = (i: Idea, f: number, solid: boolean) => {
  const rock = solid && i.id === "ship" ? 1.5 * Math.sin((f - HIT.ship) / 8) * smoothstep(clamp01((f - HIT.ship) / 8)) : 0;
  return `translate(${f3(i.x)} ${f3(i.y)}) rotate(${f3(i.rot + rock)})`;
};

// ---------------------------------------------------------------------------
// DRAWING: the dashes grown by the tip
// ---------------------------------------------------------------------------
const AIR_K = 0.35;
type Stroke = { part: Part; idx: number; a: number; b: number };
const strokesOf = (i: Idea) => {
  const out: Stroke[] = [];
  let at = 0;
  let prev: P2 | null = null;
  i.crayon.forEach((p, idx) => {
    if (prev) at += Math.hypot(p.s[0][0] - prev[0], p.s[0][1] - prev[1]) * AIR_K;
    out.push({ part: p, idx, a: at, b: at + p.len });
    at += p.len;
    prev = p.s[p.s.length - 1];
  });
  return { strokes: out, total: at };
};
const STROKES = Object.fromEntries(IDEAS.map((i) => [i.id, strokesOf(i)]));
/** the dashes of an arc length `upto` along a stroke: real pieces of line, the last one still growing under the tip */
const dashPath = (p: Part, upto: number) => {
  if (p.len < 100) {
    const i1 = Math.max(1, Math.round(Math.min(upto, p.len) / STEP));
    return polyPath(p.s.slice(0, i1 + 1), false);
  }
  const n = Math.max(1, Math.round((p.len + (p.closed ? 0 : GAP)) / (DASH + GAP)));
  const period = (p.len + (p.closed ? 0 : GAP)) / n;
  const dash = period * (DASH / (DASH + GAP));
  let d = "";
  for (let j = 0; j < n; j++) {
    const a = j * period;
    if (a > upto) break;
    const b = Math.min(a + dash, upto, p.len);
    const i0 = Math.round(a / STEP);
    const i1 = Math.max(i0 + 1, Math.round(b / STEP));
    d += `M${f3(p.s[Math.min(i0, p.s.length - 1)][0])} ${f3(p.s[Math.min(i0, p.s.length - 1)][1])}`;
    for (let k = i0 + 1; k <= i1 && k < p.s.length; k++) d += `L${f3(p.s[k][0])} ${f3(p.s[k][1])}`;
  }
  return d;
};
const Drawing: React.FC<{ i: Idea; f: number }> = ({ i, f }) => {
  if (f < i.f0) return null;
  const { strokes, total } = STROKES[i.id];
  const u = clamp01((f - i.f0) / (i.f1 - i.f0));
  const s = total * u;
  let tip: P2 | null = null;
  const paths: React.ReactNode[] = [];
  for (let n = 0; n < strokes.length; n++) {
    const st = strokes[n];
    if (s < st.a) {
      if (!tip && n > 0) {
        const pv = strokes[n - 1];
        const e = pv.part.s[pv.part.s.length - 1];
        const t = clamp01((s - pv.b) / Math.max(1e-3, st.a - pv.b));
        tip = [lerp(e[0], st.part.s[0][0], t), lerp(e[1], st.part.s[0][1], t)];
      }
      break;
    }
    const upto = Math.min(s - st.a, st.part.len);
    paths.push(<path key={st.idx} d={dashPath(st.part, upto)} fill="none" stroke={COLOR.cream} strokeWidth={LINE_W} strokeLinecap="round" strokeLinejoin="round" />);
    if (s <= st.b) {
      tip = st.part.s[Math.min(st.part.s.length - 1, Math.round(upto / STEP))];
    }
  }
  const tipK = smoothstep((f - i.f0) / 2) * (1 - smoothstep((f - i.f1) / 3));
  return (
    <g transform={ideaTf(i, f, false)}>
      {paths}
      {tip && tipK > 0.01 ? <circle cx={f3(tip[0])} cy={f3(tip[1])} r={f3(LINE_W * 0.82 * tipK)} fill={COLOR.inkCream} /> : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// SOLID: chunky amber card with a cream top edge
// ---------------------------------------------------------------------------
const DEEP_T = mixHex(COLOR.amberTop, COLOR.amberFoot, 0.75);
const DEEP_F = mixHex(COLOR.amberFoot, "#8A4E12", 0.45);
const Solid: React.FC<{ i: Idea; f: number; k: number; R: number }> = ({ i, f, k, R }) => {
  const p = crossed(i, R);
  if (p <= 0) return null;
  const tf = ideaTf(i, f, true);
  const sil: SilItem[] = i.parts
    .filter((q) => q.tone !== "ink")
    .map((q) => {
      const t = partTf(i, q, f);
      return { d: q.d, stroke: q.sw, tf: t ? `${tf} ${t}` : tf };
    });
  // the shadow lands as the front crosses: from float down onto the board
  const land = smoothstep(clamp01((f - HIT[i.id]) / 14));
  return (
    <g>
      <UnionShadow sil={sil} s={2.5} elevation="rest" lift={1 - land} strength={smoothstep(p * 1.6)} />
      <g transform={tf} style={{ filter: bloomFilter(k) }}>
        <defs>
          <linearGradient id={`cmA${i.id}`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(i.y0)} x2="0" y2={f3(i.y1)}>
            <stop offset="0" stopColor={COLOR.amberTop} />
            <stop offset="1" stopColor={COLOR.amberFoot} />
          </linearGradient>
          <linearGradient id={`cmD${i.id}`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(i.y0)} x2="0" y2={f3(i.y1)}>
            <stop offset="0" stopColor={DEEP_T} />
            <stop offset="1" stopColor={DEEP_F} />
          </linearGradient>
          {i.parts.map((q, n) =>
            !q.sw && (q.tone ?? "amber") !== "ink" ? (
              <clipPath key={n} id={`cmC${i.id}${n}`}>
                <path d={q.d} />
              </clipPath>
            ) : null,
          )}
        </defs>
        {i.parts.map((q, n) => {
          const tone = q.tone ?? "amber";
          const t = partTf(i, q, f);
          const fill = tone === "amber" ? `url(#cmA${i.id})` : tone === "deep" ? `url(#cmD${i.id})` : tone === "hot" ? COLOR.amberHot : tone === "cream" ? COLOR.cream : COLOR.inkDark;
          if (q.sw) {
            const w = q.sw * i.scale;
            return (
              <g key={n} transform={t} fill="none" strokeLinecap="round" strokeLinejoin="round">
                {tone === "ink" ? (
                  <path d={q.d} stroke={fill} strokeWidth={w} />
                ) : (
                  <>
                    <path d={q.d} stroke={COLOR.cream} strokeWidth={w} />
                    {tone !== "cream" ? <path d={q.d} transform="translate(0 2.6)" stroke={fill} strokeWidth={Math.max(1, w - 2.4)} /> : null}
                  </>
                )}
              </g>
            );
          }
          if (tone === "ink" || q.flat) return <path key={n} d={q.d} transform={t} fill={fill} />;
          return (
            <g key={n} transform={t}>
              <path d={q.d} fill={COLOR.cream} />
              {tone !== "cream" ? (
                <g clipPath={`url(#cmC${i.id}${n})`}>
                  <path d={q.d} transform={`translate(0 ${RIM})`} fill={fill} />
                </g>
              ) : null}
            </g>
          );
        })}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE CAMERA (one pull-back), THE POOL
// ---------------------------------------------------------------------------
const CAM = makeClockCam(
  { x: 551, y: 745, k: 3.13 },
  [
    { f0: -28, f1: 74, dx: -11, dy: 215, k: 1.012 },
    { f0: 66, f1: 106, k: 1 },
  ],
  DURATION,
);
const POOL = makePoolTrack({ x: 540, y: 780, strength: 1.5 }, [{ f0: -10, f1: 70, x: 540, y: 640, strength: 1.5 }], DURATION);

// the screen before the flare: amber code being typed on a dark screen
const LINES = [46, 62, 30, 54, 38, 58, 24];
const ScreenCode: React.FC<{ f: number; fade: number }> = ({ f, fade }) => {
  const progress = 1.4 + (f + 6) * 0.075;
  return (
    <g opacity={f3(1 - fade)}>
      {LINES.map((w, n) => {
        const u = clamp01(progress - n);
        if (u <= 0) return null;
        return <rect key={n} x={8} y={6 + n * 6} width={f3(Math.max(2, w * u))} height={3.2} rx={1.4} fill={COLOR.amberTop} />;
      })}
    </g>
  );
};

// the glance. The rig's eye is a fixed dot, and kidsShared is read-only here, so for these few frames the same skin (the same
// two gradients, so nothing shows) covers the rig's eye and the same eye is drawn on it, moved. Head-local, as in Person.
// the screen's light on the kid is a small warm blush on the side facing it; the skin holds its normal tone
const KID_AMBER = 0.3;
const SKIN_LIT = mixHex(SKIN.light, COLOR.amberTop, 0.18 * KID_AMBER);
const GlanceEye: React.FC<{ pose: { x: number; y: number; scale: number; lean: number; headTilt: number }; gaze: number }> = ({ pose, gaze }) => {
  if (gaze <= 0.002) return null;
  const b = CHILD;
  const r = b.R;
  const ex = 0.5 * r;
  const ey = 0.04 * r;
  const er = 0.115 * r;
  const gx = ex - 0.13 * r * gaze;
  const gy = ey - 0.075 * r * gaze;
  return (
    <g transform={`translate(${f3(pose.x)} ${f3(pose.y)}) scale(${f3(pose.scale)}) rotate(${f3(pose.lean)}) rotate(${f3(pose.headTilt)} ${b.neck[0]} ${b.neck[1]}) translate(${b.head[0]} ${b.head[1]})`}>
      <defs>
        <linearGradient id="cmSk" gradientUnits="userSpaceOnUse" x1="0" y1={f3(-r)} x2="0" y2={f3(r)}>
          <stop offset="0" stopColor={mixHex(SKIN_LIT, "#FFF4E2", 0.14)} />
          <stop offset="1" stopColor={mixHex(SKIN_LIT, COLOR.shadow, 0.16)} />
        </linearGradient>
        <radialGradient id="cmFa" gradientUnits="userSpaceOnUse" cx={f3(1.3 * r)} cy={f3(0.3 * r)} r={f3(1.9 * r)}>
          <stop offset="0" stopColor={COLOR.amberTop} stopOpacity={0.4 * KID_AMBER} />
          <stop offset="1" stopColor={COLOR.amberTop} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={f3(ex)} cy={f3(ey)} r={f3(er + 1.5)} fill="url(#cmSk)" />
      <circle cx={f3(ex)} cy={f3(ey)} r={f3(er + 1.5)} fill="url(#cmFa)" />
      <ellipse cx={f3(gx)} cy={f3(gy)} rx={f3(er)} ry={f3(er)} fill={COLOR.inkDark} />
      <circle cx={f3(gx + er * 0.34)} cy={f3(gy - er * 0.36)} r={f3(er * 0.3)} fill="#FFF8EA" />
    </g>
  );
};

const ComputerMakesIt: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = CAM.at(f);
  const pool = POOL(f);
  const R = frontR(f);
  // the flare: the screen's own light, then it holds, fixed
  const flare = smoothstep((f - F_FLARE) / 5);
  // ---- the kid: types, one foot swinging. On "make it" (f90) the head lifts, the eye looks at the room and goes straight back
  const typeA = Math.sin(f * 0.95);
  const typeB = Math.sin(f * 0.95 + 2.1);
  const near = LAP_F.deck(0.3 + 0.03 * typeB, 0.7 - 0.05 * Math.max(0, typeA));
  const farH = LAP_F.deck(0.6 - 0.03 * typeA, 0.62 - 0.05 * Math.max(0, typeB));
  const lift = smoothstep((f - 84) / 6) * (1 - smoothstep((f - 93) / 6));
  const gaze = smoothstep((f - 87) / 3) * (1 - smoothstep((f - 94) / 3));
  const kid = WORLD.kid;
  const kidPose = {
    ...kid,
    hand: worldToLocal(near, kid),
    farHand: worldToLocal(farH, kid),
    lean: 9,
    headTilt: lerp(9, -3, lift),
    swing: swingAt(f, 17, 27, 4),
    swingFar: -4,
    blink: blinkAt(f, 2, 61),
    tongue: 1,
    smile: 0.28,
    amberLight: lerp(0.12, KID_AMBER, flare),
  };
  const stool = { x: kid.x - 10, seatY: kid.y, floorY: 1225, w: 174 };
  const desk = { x0: 483, x1: 794, y: 894, floorY: 1225, depth: 101, legInset: 34 };
  const groupSil: SilItem[] = [...stoolSil(stool), ...deskSil(desk), ...laptopSil(WORLD.lap), ...personSil({ ...kidPose, shadow: false })];
  // ---- the front on the board: a soft light, no ring
  const passed = smoothstep((R - FAR_R * 0.45) / (FAR_R * 0.75));
  const peak = 0.17 * (1 - passed);
  const resid = lerp(0.06, 0.018, smoothstep((f - 80) / 20));
  const outer = R + 150;
  return (
    <StoutStage S={f} cam={cam} rest={CAM.rest} pool={pool}>
      <defs>
        <radialGradient id="cmLight" gradientUnits="userSpaceOnUse" cx={f3(FRONT_O[0])} cy={f3(FRONT_O[1])} r={f3(Math.max(1, outer))}>
          <stop offset="0" stopColor={COLOR.amberTop} stopOpacity={f3(resid + peak * 0.3)} />
          <stop offset={f3(clamp01((R - 340) / outer))} stopColor={COLOR.amberTop} stopOpacity={f3(resid)} />
          <stop offset={f3(clamp01((R - 40) / outer))} stopColor={COLOR.amberTop} stopOpacity={f3(peak)} />
          <stop offset="1" stopColor={COLOR.amberTop} stopOpacity={f3(resid * passed)} />
        </radialGradient>
        {/* the front's edge: inside white for the solid, the inverse for the dashes */}
        <radialGradient id="cmIn" gradientUnits="userSpaceOnUse" cx={f3(FRONT_O[0])} cy={f3(FRONT_O[1])} r={f3(Math.max(1, R))}>
          <stop offset={f3(clamp01((R - FEATHER) / Math.max(1, R)))} stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <radialGradient id="cmOut" gradientUnits="userSpaceOnUse" cx={f3(FRONT_O[0])} cy={f3(FRONT_O[1])} r={f3(Math.max(1, R))}>
          <stop offset={f3(clamp01((R - FEATHER) / Math.max(1, R)))} stopColor="#000" />
          <stop offset="1" stopColor="#fff" />
        </radialGradient>
        <mask id="cmMaskIn" maskUnits="userSpaceOnUse" x={-600} y={-600} width={2400} height={2800}>
          <rect x={-600} y={-600} width={2400} height={2800} fill="url(#cmIn)" />
        </mask>
        <mask id="cmMaskOut" maskUnits="userSpaceOnUse" x={-600} y={-600} width={2400} height={2800}>
          <rect x={-600} y={-600} width={2400} height={2800} fill="url(#cmOut)" />
        </mask>
      </defs>
      {R > 0 ? <circle cx={f3(FRONT_O[0])} cy={f3(FRONT_O[1])} r={f3(outer)} fill="url(#cmLight)" /> : null}
      <g mask={R > 0 ? "url(#cmMaskOut)" : undefined}>
        {IDEAS.map((i) => (
          <Drawing key={i.id} i={i} f={f} />
        ))}
      </g>
      {R > 0 ? (
        <g mask="url(#cmMaskIn)">
          {IDEAS.map((i) => (
            <Solid key={i.id} i={i} f={f} k={cam.k} R={R} />
          ))}
        </g>
      ) : null}
      {/* the kid's corner: one object, one shadow */}
      <UnionShadow sil={groupSil} s={1.5} contact={{ x: (stool.x + desk.x1) / 2, y: stool.floorY, w: 390 }} />
      <Stool {...stool} />
      <Desk {...desk} />
      <Laptop
        {...WORLD.lap}
        shadow={false}
        k={cam.k}
        lit={flare * 0.92}
        glow={lerp(0.22, 1, flare)}
        screenColor={COLOR.amberTop}
        screen={<ScreenCode f={f} fade={flare} />}
      />
      <Kid {...kidPose} shadow={false} />
      <GlanceEye pose={kidPose} gaze={gaze} />
    </StoutStage>
  );
};

export default ComputerMakesIt;
