// HeBuiltTheMap layout and camera (robert-power-drug, cut 9). Pure data, no React, so a check script can import it.
// WORLD units = px of the sister clip's 4K map frame (robert-graft-machine HighwaysHeBuilt, highwaysData HW): the
// plate covers world x 560..3840, y -700..2860; the source frame itself is y 0..2160. Screen = 540 + (x - cx) * k,
// FOCUS_Y + (y - cy) * k.

export const DUR = 288;
export const FOCUS_Y = 900;

// ---- hero cut-outs: base-centre anchor (x, y) on the map, drawn size w x h (world px, already x sc), drawing scale
// sc, pop START frame (the pop crosses full size ~5 frames later, on the word). Spots read off the plate's own
// geography (roads_48 / coastline): Randall's Island at Hell Gate (the bridge stands a little east of it so the Cross
// Bronx strip clears its towers), the Narrows where the Verrazano's grey road crosses, the Upper West Side (Manhattan
// land here runs x 1645-1765 at y 760), the south end of Flushing Bay, the barrier island where the Wantagh Parkway
// ends (the Jones Beach water tower). Array order = layer order (newest on top).
export type Hero = { id: string; x: number; y: number; w: number; h: number; sc: number; pop: number; rot0: number };
export const HEROES: Hero[] = [
  { id: "tri", x: 1990, y: 650, w: 420, h: 177, sc: 1.5, pop: 3, rot0: -9 },
  { id: "ver", x: 1525, y: 1357, w: 570, h: 248, sc: 1.5, pop: 21, rot0: 8 },
  { id: "jones", x: 3200, y: 1386, w: 132, h: 618, sc: 1.5, pop: 88, rot0: -6 },
  { id: "umb", x: 3350, y: 1404, w: 225, h: 262, sc: 1.5, pop: 97, rot0: 10 },
  { id: "lin", x: 1690, y: 760, w: 375, h: 231, sc: 1.25, pop: 115, rot0: 8 },
  { id: "shea", x: 2170, y: 895, w: 450, h: 228, sc: 1.5, pop: 139, rot0: -8 },
];
export const POP_D = 8; // frames of a pop (easeOutBack: crosses 1.0 at ~0.6, i.e. 5 frames in)
export const PARK_SC = 1.05; // parks and pools drawing scale
export const PARK_KIND_SC = [1, 1.1, 1.05]; // per kind: tree, lane pool, kidney pool (the pools are wider)

// ---- the Cross Bronx strip: the plate's own Cross Bronx line (roads_48 centreline), GWB shore -> Bruckner
export const STRIP: [number, number][] = [
  [1850, 389],
  [1900, 390],
  [1950, 393],
  [2000, 404],
  [2050, 427],
  [2100, 446],
  [2150, 462],
  [2200, 478],
  [2250, 500],
  [2270, 510],
];
export const STRIP_HALF = 26;
export const ROLL_POP = 52; // the paper roll pops on at the GWB end
export const STRIP_RUN: [number, number] = [57, 79]; // unrolls east: "Cross" 58 -> done in "Expressway" (72-80)

// ---- labels: top centre of the first line's caps, cap height (world px), lines, word frame
export type Lbl = { id: string; x: number; y: number; cap: number; lines: string[]; word: number; stay?: boolean; hold?: number };
export const LABELS: Lbl[] = [
  { id: "tri", x: 1990, y: 676, cap: 56, lines: ["TRIBOROUGH", "BRIDGE"], word: 8 },
  { id: "ver", x: 1525, y: 915, cap: 68, lines: ["VERRAZANO", "BRIDGE"], word: 26, hold: 14 },
  { id: "cb", x: 2060, y: 214, cap: 56, lines: ["CROSS BRONX", "EXPRESSWAY"], word: 58, hold: 20 },
  { id: "jones", x: 3230, y: 598, cap: 60, lines: ["JONES", "BEACH"], word: 93, hold: 20 },
  { id: "lin", x: 1650, y: 786, cap: 80, lines: ["LINCOLN", "CENTER"], word: 120, hold: 18 },
  { id: "shea", x: 2170, y: 921, cap: 60, lines: ["SHEA", "STADIUM"], word: 144, hold: 10 },
  { id: "nia", x: 2088, y: -340, cap: 70, lines: ["NIAGARA"], word: 171, stay: true },
  { id: "stl", x: 2600, y: -880, cap: 70, lines: ["ST. LAWRENCE"], word: 186, stay: true },
];
export const PITCH = 1.36; // line pitch / cap height (the original: 114 / 84)

// ---- the two dams, far upstate: never on the plate, they hang in the dark ground north of the city
export type DamSpec = { id: string; x: number; y: number; w: number; h: number; land: number; arrowRot: number };
export const DAM_SC = 1.25; // drawing scale; w, h below are the drawing's own units
export const DAMS: DamSpec[] = [
  { id: "nia", x: 2088, y: -360, w: 480, h: 165, land: 171, arrowRot: -38 },
  { id: "stl", x: 2600, y: -900, w: 580, h: 128, land: 186, arrowRot: -8 },
];
export const DAM_DROP = 10; // frames from the top edge to rest
export const DAM_DROP_DIST = 1100; // world px
export const ARROW_LEN = 330;
// as the camera comes back down the dams are lifted away north, off the top edge (they never sit as a sliver there)
export const DAM_LIFT: [number, number] = [196, 228];
export const damLift = (frame: number) => {
  const t = Math.min(1, Math.max(0, (frame - DAM_LIFT[0]) / (DAM_LIFT[1] - DAM_LIFT[0])));
  return -1000 * t * t;
};

// ---- camera: overlapping smoothstep moves on (cx, cy, log k), then the kits' damped follow (0.09 / 0.468)
type Key = { f0: number; f1: number; x: number; y: number; k: number };
const S0 = { x: 1900, y: 765, k: 0.85 };
const MOVES: Key[] = [
  { f0: 0, f1: 19, x: 1700, y: 1160, k: 0.68 }, // south: both bridges
  { f0: 16, f1: 48, x: 1750, y: 1150, k: 0.7 }, // a slow drift in while the Verrazano label reads
  { f0: 42, f1: 62, x: 1990, y: 560, k: 0.92 }, // in on the Bronx for the strip
  { f0: 60, f1: 82, x: 2600, y: 900, k: 0.62 }, // out and east along the strip and Long Island...
  { f0: 72, f1: 90, x: 2980, y: 1245, k: 0.8 }, // ...in on Jones Beach
  { f0: 100, f1: 117, x: 2400, y: 1010, k: 0.5 }, // hold for the label, then out and west: Manhattan enters
  { f0: 115, f1: 140, x: 1960, y: 850, k: 0.78 }, // in on Lincoln Center and Shea
  { f0: 154, f1: 188, x: 2330, y: -380, k: 0.66 }, // tilt north past the city into the dark ground
  { f0: 192, f1: 228, x: 2110, y: 950, k: 0.78 }, // back down onto the covered city (Lincoln Center whole at the left)
  { f0: 230, f1: 300, x: 2114, y: 955, k: 0.785 }, // closing creep
];
const smooth = (u: number) => {
  const t = Math.min(1, Math.max(0, u));
  return t * t * (3 - 2 * t);
};
const target = (f: number) => {
  let x = S0.x;
  let y = S0.y;
  let lk = Math.log(S0.k);
  let px = S0.x;
  let py = S0.y;
  let pk = Math.log(S0.k);
  for (const m of MOVES) {
    const e = smooth((f - m.f0) / (m.f1 - m.f0));
    x += (m.x - px) * e;
    y += (m.y - py) * e;
    lk += (Math.log(m.k) - pk) * e;
    px = m.x;
    py = m.y;
    pk = Math.log(m.k);
  }
  return { x, y, lk };
};
const STIFF = 0.09;
const DAMP = 0.468;
const CAM: { cx: number; cy: number; k: number }[] = [];
{
  const t0 = target(0);
  let x = t0.x;
  let y = t0.y;
  let lk = t0.lk;
  let vx = 0;
  let vy = 0;
  let vk = 0;
  // pre-roll so f0 already carries the first move's speed (the main move runs from f0)
  for (let f = -6; f <= DUR + 2; f++) {
    const t = target(Math.max(0, f));
    vx += (t.x - x) * STIFF - vx * DAMP;
    vy += (t.y - y) * STIFF - vy * DAMP;
    vk += (t.lk - lk) * STIFF - vk * DAMP;
    x += vx;
    y += vy;
    lk += vk;
    if (f >= 0) CAM.push({ cx: x, cy: y, k: Math.exp(lk) });
  }
}
export const camera = (frame: number) => {
  const i = Math.max(0, Math.min(CAM.length - 1, Math.floor(frame)));
  return CAM[i];
};
export const toScreen = (frame: number, x: number, y: number) => {
  const { cx, cy, k } = camera(frame);
  return { sx: 540 + (x - cx) * k, sy: FOCUS_Y + (y - cy) * k, k };
};

// ---- eases
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
export const backOut = (t: number, c1 = 1.70158) => {
  const u = clamp01(t);
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
};
export const popState = (frame: number, start: number, rot0: number, d = POP_D) => {
  const t = (frame - start) / d;
  if (t <= 0) return { s: 0, rot: rot0, on: false, lift: 1 };
  if (t >= 1) return { s: 1, rot: 0, on: true, lift: 0 };
  // lift: the piece is dropped onto the map, its shadow large and soft at first, tight as it lands (~0.85 of the pop)
  const lift = Math.pow(1 - clamp01(t / 0.85), 1.5);
  return { s: Math.max(0, backOut(t)), rot: rot0 * (1 - backOut(t, 2.2)), on: true, lift };
};
// label: slides up while fading in around its word, fades after ~1 s (stay = keeps until its dam is lifted away)
export const labelState = (frame: number, word: number, stay = false, hold = 26) => {
  const a = clamp01((frame - (word - 3)) / 7);
  const ein = 1 - Math.pow(1 - a, 3);
  // the dam labels (stay) fade while their dams are lifted away north, so they never clip at an edge on the way out
  const out = stay ? 1 - clamp01((frame - (DAM_LIFT[0] + 2)) / 10) : 1 - clamp01((frame - (word + hold)) / 8);
  return { o: ein * out, dy: (1 - ein) * 16 };
};
