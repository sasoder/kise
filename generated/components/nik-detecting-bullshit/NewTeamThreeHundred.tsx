// ---------------------------------------------------------------------------
// NewTeamThreeHundred (nik-detecting-bullshit, cut 46). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 130 frames. Palette B1 (the stoutShared default).
// World: ./wealthWorld.tsx rev 2 (cut B's, read only). This cut opens on B's last frame pixel for pixel: the
// story clock continues as S = B_LAST_S + f (WEALTH_READY.md rev 2); the camera and light pool are B's tracks
// with this cut's glide / keys appended (all at S >= 101, so B's track is untouched).
//
// CHECK LINE: "they swapped the product's team, and the next bar shot up to four times the last one: +300 %,
// dwarfing the old +60–80 %."
//
// THE LINE (sequence 46.004-51.426 s): "Yeah, then we changed the team and now it's growing 300%. So,"
// WORD -> FRAME: yeah f8 · then f32 · we f34 · changed f38 · the f47 · team f57 · and f63 · now f67 · it's f72 ·
// growing f76 · 300 % f84 (said to ~f105-113) · So f127 · slot ends f130.
// DURATION: the slot 46.004 -> 51.426 s = 5.422 s x 23.976 = 130 frames (f0..f129).
//
// THE MOTION (rev 2: one centred composition shared with B): f0 = B's last frame (the centred tile, the team
// as three board-tone busts in the window on its face, last year's cream bar left, this year's bar centre with
// its amber +60–80 % slice and label, the empty right slot). ONE gentle eased pull-back + tilt up on x 540
// (f0-92, k 1.98 -> 1.55 = 0.78 x B's end zoom) runs through the whole cut. On "then we changed the team" the
// old busts slide down one by one out of the window's bottom edge (f34-50) and a new team of CREAM busts (the
// line is about them) slides up into the same places (f44-61): one swap wave left to right inside the window
// mask, nothing fades or scales. Then the old growth recedes by tone (the +60–80 % slice amber -> board, its
// label amber -> lo at the same 80 px, still centred over its bar, f56-70) and the third bar rises out of the
// right slot in ONE decelerating rise (f64-98): cream to this year's 1.7 units, then on as an amber growth
// slice to 6.8 units (= 4x, +300 %). "+300%" (the same 80 px as "+60–80%") comes in whole on the stout
// entrance centred over the bar, riding its top, landed on f90 (after "300" f84, before the f92 limit), and a
// light sweep clicks across the tall slice as it settles (f95-105). Living hold to f129 (creep, sway, grain).
// Contacts: each old bust is in the window until it is wholly below its bottom edge (old i gone at f44+3i);
// its successor starts up from below that edge on that frame (new i from f44+3i). The third bar is in its
// slot from its first frame (the open pocket closes over its first 6 screen px); the amber starts where its
// top passes this year's height (1.7 units).
// AMBER = growth / the KPI going up (COMMON.md): here the +300 % slice and its label; the old +60–80 % amber
// dims to board / lo. Cream = the subject (the product, its bars, the new team); board = context.
//
// SOURCES: the 300 % is the speaker's own figure about his company; Revolut's 2024 annual report (CFO review,
// p13, "wealth revenues grew 298% YoY"; note 6: Wealth £506.3m vs £127.1m) bears it out (director's data note
// animation_source/notes/revolut_wealth_data.md). The bar is drawn at exactly 4x this year's (6.8 vs 1.7
// units). "+60–80%" is his own recollection (cut B). Revolut R: revolutMark.ts (via wealthWorld).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { LightSweep, METRIC, SPACE, StoutStage, amberBandFor, clamp01, numeralWidth, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { camCheck, type Glide, type PoolKey } from "../kits/cheeky-pint/museShared";
import {
  BAR_CREAM,
  BAR_H,
  BAR_W,
  BLabel,
  B_END,
  B_LABEL,
  B_LAST_S,
  CENTRE_X,
  FACE_MAX_Y,
  FLOOR,
  FPS as WORLD_FPS,
  GrowthLabel,
  KEEP_IN,
  LABEL_PX,
  SLOT_X,
  SX,
  SY,
  TEAM_NEW,
  TEAM_OLD,
  TILE,
  TILE_X0,
  TILE_X1,
  WEALTH_REST,
  WealthBoard,
  bLabelY,
  faceLayout,
  makeWealthCam,
  makeWealthPool,
  riseCurve,
  riseLift,
  type BarSpec,
  type BustSpec,
  SHIFT_Y,
} from "./wealthWorld";

export const FPS = 24000 / 1001;
export const DURATION = 130;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- beats (this cut's frames f; S = B_LAST_S + f) -------------------------------------------------------------
export const C_T = {
  OLD_DROP: (i: number) => [34 + 3 * i, 44 + 3 * i] as const, // "then we changed": bust i slides down out of the window
  NEW_RISE: (i: number) => [44 + 3 * i, 55 + 3 * i] as const, // "... the team": its successor slides up into its place
  RECEDE: [56, 70] as const, // the old slice and label recede by tone (same size)
  RISE3: [64, 98] as const, // the third bar, ONE rise ("and now it's growing 300")
  LABEL_IN: 78, // "+300%" enters over 12 f, landed f90
  SWEEP: [95, 105] as const, // the click, on the tall amber slice once it has settled
} as const;
const ENTER_F = 12;
const S_OF = (f: number) => B_LAST_S + f;

// --- the camera: B's track + ONE gentle pull-back and tilt, on x 540 ---------------------------------------------
// End framing: k = 0.78 x B's end zoom (C_END_K), the tile's foot at screen y ~1054 (clear of the 1060 face limit
// with the sway), the 6.8-unit bar's top at ~y 389 and "+300%" from ~y 307; the tile spans x ~220-860 (59 %).
// Solved from the stack's height: (FLOOR - tall bar top) * k + CLEAR + figure height fits y ~307..1054.
export const C_END_K = 0.78 * B_END.cam.k;
export const C_END_LOOK = { x: CENTRE_X, y: FLOOR - (1054 - 960) / C_END_K, k: C_END_K } as const;
const B_TARGET_Y = 1331 - 42 + 1.6; // B_CAM_START.y + B's glide deltas (wealthWorld rev 2): where B's track heads
export const C_GLIDES: Glide[] = [
  // ONE eased glide from B's end (its creep still running) to the wide; it starts on f0 so the creep in never
  // carries the tile past the button column, and leads the third bar (checked below)
  { f0: S_OF(0), f1: S_OF(92), dy: C_END_LOOK.y - B_TARGET_Y, k: C_END_LOOK.k, warp: 1 },
  { f0: S_OF(90), f1: S_OF(190), dy: -4, k: C_END_LOOK.k * 1.006, warp: 1 }, // the living creep through the hold
];
export const C_CAM = makeWealthCam(C_GLIDES, S_OF(DURATION + 2));

// --- the light pool: B's keys + onto the window during the swap, then up the tall bar -------------------------------
const FACE_L = faceLayout();
export const C_POOL_KEYS: PoolKey[] = [
  { f0: S_OF(18), f1: S_OF(54), x: FACE_L.win.x + FACE_L.win.w / 2 + 30, y: TILE.TOP + 10 }, // onto the team window
  { f0: S_OF(60), f1: S_OF(100), x: (SLOT_X[1] + SLOT_X[2]) / 2, y: TILE.TOP - 190, strength: 1.6 }, // up the tall bar
];
export const C_POOL = makeWealthPool(C_POOL_KEYS, S_OF(DURATION + 2));

// --- what is where, at this cut's frame f ------------------------------------------------------------------------
const winT = (f: number, [a, b]: readonly number[]) => (f - a) / (b - a);
/** The third bar's height (world px above the tile top). */
export const bar3H = (f: number) => BAR_H.next * riseCurve(winT(f, C_T.RISE3));
/** The old growth receding: 0 = as in B, 1 = board / lo (same size, same place). */
export const recede = (f: number) => smoothstep(winT(f, C_T.RECEDE));
/** "+300%" rides the third bar's top: baseline CLEAR screen px above it. */
export const NEW_LABEL = { text: "+300%", px: LABEL_PX } as const;
export const newLabelY = (f: number, k: number) => TILE.TOP - bar3H(f) - SPACE.CLEAR / k;
/** The swap in the window: old bust i's drop (0 seated .. 1 gone below the edge), new bust i's drop (1 .. 0). */
export const oldDrop = (f: number, i: number) => smoothstep(winT(f, C_T.OLD_DROP(i)));
export const newDrop = (f: number, i: number) => 1 - smoothstep(winT(f, C_T.NEW_RISE(i)));
/** The team at frame f: old and new busts together (the window masks both). */
export const teamAt = (f: number): BustSpec[] => [
  ...TEAM_OLD.map((b) => ({ ...b, drop: oldDrop(f, b.place) })),
  ...TEAM_NEW.map((b) => ({ ...b, drop: newDrop(f, b.place) })),
];

// ===========================================================================
// THE CUT
// ===========================================================================
const NewTeamThreeHundred: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const S = S_OF(f);
  const cam = C_CAM.at(S);
  const k = cam.k;
  const band = amberBandFor(cam);
  const r = recede(f);
  const h3 = bar3H(f);
  const bars: BarSpec[] = [
    B_END.bars[0],
    { ...B_END.bars[1], dim: r },
    { key: "next", x: SLOT_X[2], h: h3, cream: BAR_CREAM.next, lift: riseLift(f, C_T.RISE3) },
  ];
  return (
    <StoutStage dy={SHIFT_Y} S={S} cam={cam} rest={WEALTH_REST} pool={C_POOL(S)}>
      <WealthBoard k={k} band={band} bars={bars} team={teamAt(f)} />
      <BLabel k={k} dim={r} />
      {/* the click on the tall slice, once it has settled */}
      <LightSweep x={SLOT_X[2] - BAR_W / 2} y={TILE.TOP - h3} w={BAR_W} h={h3 - BAR_CREAM.next} k={k} t={winT(f, C_T.SWEEP)} on="amber" r={4} />
      <GrowthLabel x={SLOT_X[2]} y={newLabelY(f, k)} k={k} text={NEW_LABEL.text} px={NEW_LABEL.px} enter={clamp01((f - C_T.LABEL_IN) / ENTER_F)} />
    </StoutStage>
  );
};

export default NewTeamThreeHundred;

// --- load-time checks: the join, every frame, every camera state (with the house sway) ----------------------------
export const C_CHECK = (() => {
  const fail = (m: string) => {
    throw new Error(`NewTeamThreeHundred: ${m}`);
  };
  if (FPS !== WORLD_FPS) fail("FPS differs from wealthWorld's");
  if (DURATION !== Math.round((51.426 - 46.004) * FPS)) fail("DURATION is not the slot");
  // the join: f0 is B's last frame (camera, pool; bars and team as B_END; nothing has started)
  const c0 = C_CAM.at(S_OF(0));
  for (const key of ["x", "y", "k"] as const) if (Math.abs(c0[key] - B_END.cam[key]) > 1e-9) fail(`f0 camera ${key} differs from B_END_CAM`);
  const p0 = C_POOL(S_OF(0));
  if (Math.abs(p0.x - B_END.pool.x) > 1e-9 || Math.abs(p0.y - B_END.pool.y) > 1e-9) fail("f0 pool differs from B's");
  if (bar3H(0) !== 0 || recede(0) !== 0 || TEAM_OLD.some((b) => oldDrop(0, b.place) !== 0) || TEAM_NEW.some((b) => newDrop(0, b.place) !== 1)) fail("something has started on f0");
  // the swap: each place's successor rises only once its predecessor is wholly gone
  for (let i = 0; i < 3; i++) if (C_T.NEW_RISE(i)[0] < C_T.OLD_DROP(i)[1]) fail(`place ${i}: the new bust rises before the old one is gone`);
  const stats = { minTop: Infinity, maxFoot: 0, minX: Infinity, maxX: 0, minGap: Infinity, kEnd: 0, kRatio: 0, tileFrac: 0 };
  let prevTop = Infinity;
  for (let f = 0; f < DURATION; f++) {
    const S = S_OF(f);
    const c = C_CAM.at(S);
    const k = c.k;
    const sx = 3 * Math.sin(S / 23); // StoutStage's sway, SCREEN px
    const sy = 5 * Math.sin(S / 19);
    const h3 = bar3H(f);
    if (Math.abs(c.x - CENTRE_X) > 1e-6) fail(`f${f}: the camera leaves x 540`);
    // the tile in the keep-in box, clear of the button column below y 900; the face ends <= FACE_MAX_Y
    const tx0 = SX(c, TILE_X0) + sx;
    const tx1 = SX(c, TILE_X1) + sx;
    const foot = SY(c, FLOOR) + sy;
    if (tx0 < KEEP_IN.x0 || tx1 > 955.5) fail(`f${f}: the tile spans x ${tx0.toFixed(1)}-${tx1.toFixed(1)}`);
    if (foot > FACE_MAX_Y) fail(`f${f}: the tile's face ends at y ${foot.toFixed(1)}`);
    stats.maxFoot = Math.max(stats.maxFoot, foot);
    stats.minX = Math.min(stats.minX, tx0);
    stats.maxX = Math.max(stats.maxX, tx1);
    // the tall bar's top, and "+300%" once it is entering, inside the box (its top >= y 300, the brief's floor)
    const top3 = SY(c, TILE.TOP - h3) + sy;
    if (top3 < KEEP_IN.y0) fail(`f${f}: the third bar's top at y ${top3.toFixed(0)}`);
    stats.minTop = Math.min(stats.minTop, top3);
    if (f >= C_T.LABEL_IN) {
      const w = numeralWidth(NEW_LABEL.text, NEW_LABEL.px);
      const x = SX(c, SLOT_X[2]) + sx;
      const lt = SY(c, newLabelY(f, k)) + sy - NEW_LABEL.px * METRIC.fig;
      if (lt < 300 || x - w / 2 < KEEP_IN.x0 || x + w / 2 > KEEP_IN.x1) fail(`f${f}: "+300%" box x ${(x - w / 2).toFixed(0)}-${(x + w / 2).toFixed(0)}, top ${lt.toFixed(0)}`);
      stats.minTop = Math.min(stats.minTop, lt);
    }
    // growth outpaces the pull-back: the tall bar's top climbs on screen every frame of its rise
    if (f > C_T.RISE3[0] + 2 && f <= C_T.RISE3[1] - 6 && top3 - sy > prevTop - 0.5) fail(`f${f}: the third bar's top does not climb on screen (${prevTop.toFixed(1)} -> ${(top3 - sy).toFixed(1)})`);
    prevTop = top3 - sy;
    // the old label (fixed 80 px, centred on the centre bar): in the box, never over the tall bar
    const ow = numeralWidth(B_LABEL.text, B_LABEL.px);
    const oy = SY(c, bLabelY(k)) + sy;
    const ox1 = SX(c, SLOT_X[1]) + ow / 2;
    if (SX(c, SLOT_X[1]) - ow / 2 < KEEP_IN.x0 || oy - B_LABEL.px * METRIC.fig < KEEP_IN.y0) fail(`f${f}: the old label leaves the keep-in box`);
    if (TILE.TOP - h3 < bLabelY(k) + 4) {
      const gap = SX(c, SLOT_X[2] - BAR_W / 2) - ox1;
      stats.minGap = Math.min(stats.minGap, gap);
      if (gap < 10) fail(`f${f}: the old label is ${gap.toFixed(1)} px from the tall bar`);
    }
    if (f === DURATION - 1) {
      stats.kEnd = k;
      stats.kRatio = k / B_END.cam.k;
      stats.tileFrac = (TILE.W * k) / 1080;
      if (stats.kRatio < 0.75) fail(`the end zoom is ${stats.kRatio.toFixed(3)} x B's`);
      if (stats.tileFrac < 0.55) fail(`the tile is ${(100 * stats.tileFrac).toFixed(0)} % of the frame at the end`);
    }
  }
  const cc = camCheck((s) => C_CAM.at(s), S_OF(0), S_OF(DURATION - 1));
  return { ...stats, cam: cc };
})();
