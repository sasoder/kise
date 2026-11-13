// ---------------------------------------------------------------------------
// OnceAYear (nik-managers-underperformers, cut 6), revision 1. Cheeky Pint style, the picture-book setting
// (styles/cheeky-pint.md): the office wall and its year planner (plannerShared.tsx, officeTokens.ts).
// Opaque 1080x1920, 23.976 fps, 81 frames.
//
// CHECK LINE: "Most companies mark exactly one performance review in the whole year: one amber sticker at the far end
// of twelve months, with eleven empty months in front of it."
//
// THE LINE: "because the majority of companies do it once a year. I think it's too long."
// WORD -> FRAME (brief A, 23.976 fps): because 0 · majority 10 · companies 20 · do 27 · it 32 · once 34 · a 39 ·
//   year 44 · (pause 49-58) · I think 58 · it's 63 · too 66 · long 69 (ends 76) · cut 81.
//   The press lands on "do it" (contact f24, push held to f29, release f30); the sticker is alone by "year" (the hand
//   gone by f39); the whole planner in frame from "too" (f66); "long" on the full year with its one dot.
// DURATION: the slot 6.840 -> 10.219 s = 3.379 s x 23.976 = 81 frames (f0..f80).
//
// THE MOTION: one continuous move. Close on the DEC sheet (85 % of the frame width, a day cell ~118 px). From f0 a
// card hand carries a lifted amber dot sticker in from the lower right (the sticker ~320 px from its cell at f0) along
// one gentle arc, decelerating, never holding; over its last four frames it sinks to the paper (the sticker shrinks to
// flat size, its shadow closes to contact). Contact f24, the finger pushes in (f24-26) and holds the push to f29, then
// lifts (release f30) and pulls away down its own forearm, accelerating, out by the bottom edge. Under the lifting
// hand (f28) the camera pulls back as ONE eased move (log-zoom; the look travels on the zoom's own progress, so the
// sticker stays above the caption band) revealing the eleven blank sheets above and to the left, then the header; a
// slow creep runs under it from f0 and carries on to the last frame (PLANNER_WIDE at f80) while the window light drifts.
// CONTACT: f24 (fingertip and sticker on the paper); FIRST REACTION: f25 (the finger pushes in, the hand shrinks into
// the wall, the stuck sticker's shadow tightens); release f30; the hand out of frame (and its shadow) by f39.
// AMBER = the performance decision (the review date); cream = the planner (the subject), the caramel wall = context.
// The hand and press are timed here (cut level); plannerShared's Hand, Planner and geometry are used as they are.
//
// SOURCES: none (no figures; the planner's title and month names are the artefact's own text).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { amberBandFor } from "../kits/cheeky-pint/stoutShared";
import { restToRest } from "../kits/cheeky-pint/museShared";
import {
  DEC,
  HAND_HULL,
  Hand,
  PLANNER,
  PLANNER_WIDE,
  Planner,
  SHEET,
  STICKER_R,
  WallStage,
  camToScreen,
  carriedCenter,
  handPoint,
  handScale,
  sheetRect,
  stickerCenter,
  type Cam,
  type HandPose,
  type P2,
} from "./plannerShared";
import { HAND } from "./plannerShared";

export const FPS = 24000 / 1001;
export const DURATION = 81;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- the camera ---------------------------------------------------------------------------------------------------
/** the close: the DEC sheet across 85 % of the frame */
export const K_CLOSE = (0.85 * 1080) / SHEET.w;
const TARGET = stickerCenter(DEC);
/** the sticker's screen point in the close (the DEC sheet's left edge at x 58, NOV off frame); high enough that the
 *  carried sticker can come in from the lower right and stay above the caption band */
const S_CLOSE: P2 = [540 + (TARGET[0] - (sheetRect(DEC).x + (540 - 58) / K_CLOSE)) * K_CLOSE, 720];
/** the close's look (the world point on the frame's centre) */
const LOOK_CLOSE: P2 = [TARGET[0] - (S_CLOSE[0] - 540) / K_CLOSE, TARGET[1] - (S_CLOSE[1] - 960) / K_CLOSE];
const PULL = [28, 76] as const;
const PULL_P = 3.5;
/** the creep share of ln k: a slow pull running from f0 to f80 under the main move (never a dead hold) */
const CREEP = 0.22;
const LN_CLOSE = Math.log(K_CLOSE / PLANNER_WIDE.k);
export const camAt = (f: number): Cam => {
  const t = (f - PULL[0]) / (PULL[1] - PULL[0]);
  const lnk = (LN_CLOSE - CREEP) * (1 - restToRest(t, PULL_P)) + CREEP * Math.max(0, 1 - f / (DURATION - 1));
  const k = PLANNER_WIDE.k * Math.exp(lnk);
  // the look (the frame's centre) travels from the close's to PLANNER_WIDE's on the zoom's own progress
  const s = 1 - lnk / LN_CLOSE;
  return { x: LOOK_CLOSE[0] + (PLANNER_WIDE.x - LOOK_CLOSE[0]) * s, y: LOOK_CLOSE[1] + (PLANNER_WIDE.y - LOOK_CLOSE[1]) * s, k };
};

// --- the press (cut level) -----------------------------------------------------------------------------------------
export const CONTACT_F = 24;
/** the finger's push: in over f24-26, held to f29 */
const PUSH = { in: 26, hold: 29, depth: -0.25 } as const;
/** the release (the finger lifts off the paper) and the leave: down the forearm, accelerating, f30 -> f39 */
export const RELEASE_F = 30;
const OUT = { f0: 30, f1: 39, dist: 600 } as const;
const FOREARM: P2 = [Math.cos(((HAND.angle - 180) * Math.PI) / 180), Math.sin(((HAND.angle - 180) * Math.PI) / 180)];
/** the carried sticker's start: ~320 screen px down and right of its cell at f0 (world px at the close's k) */
const START_OFF: P2 = [270 / K_CLOSE, 175 / K_CLOSE];
/** the fingertip pad that puts the flat sticker on its cell */
const PAD: P2 = (() => {
  const c = carriedCenter({ tip: [0, 0], angle: HAND.angle, lift: 0, carry: true });
  return [TARGET[0] - c[0], TARGET[1] - c[1]];
})();
const easeOut3 = (u: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, u)), 3);
const sstep = (u: number) => {
  const x = Math.max(0, Math.min(1, u));
  return x * x * (3 - 2 * x);
};
/** the hand at frame f (null once it has left) and the stuck sticker's press for Planner (-1 while carried) */
export const handAt = (f: number): { hand: HandPose | null; press: number } => {
  if (f < CONTACT_F) {
    const u = Math.max(0, f) / CONTACT_F;
    // the carried sticker's centre along one gentle arc (a quadratic bulging up and right), decelerating
    const e = 1 - Math.pow(1 - u, 1.45);
    const P0: P2 = [TARGET[0] + START_OFF[0], TARGET[1] + START_OFF[1]];
    const len = Math.hypot(START_OFF[0], START_OFF[1]);
    const n: P2 = [START_OFF[1] / len, -START_OFF[0] / len]; // perpendicular, up and to the right
    const C: P2 = [(P0[0] + TARGET[0]) / 2 + n[0] * 0.3 * len, (P0[1] + TARGET[1]) / 2 + n[1] * 0.3 * len];
    const q = (a: number, b: number, c: number) => (1 - e) * (1 - e) * a + 2 * (1 - e) * e * b + e * e * c;
    const centre: P2 = [q(P0[0], C[0], TARGET[0]), q(P0[1], C[1], TARGET[1])];
    // lifted all the way in (a gentle settle), then sinking to the paper over the last four frames, landing with speed
    const sink = Math.max(0, Math.min(1, (f - (CONTACT_F - 4)) / 4));
    const lift = (1 - 0.12 * u) * (1 - sink * sink);
    const angle = HAND.angle + 6 * (1 - e);
    const c0 = carriedCenter({ tip: [0, 0], angle, lift, carry: true });
    return { hand: { tip: [centre[0] - c0[0], centre[1] - c0[1]], angle, lift, carry: true }, press: -1 };
  }
  if (f > OUT.f1) return { hand: null, press: 1 };
  const press = Math.min(1, (f - CONTACT_F) / (RELEASE_F - CONTACT_F));
  let lift: number;
  if (f <= PUSH.in) lift = PUSH.depth * easeOut3((f - CONTACT_F) / (PUSH.in - CONTACT_F));
  else if (f <= PUSH.hold) lift = PUSH.depth;
  else lift = PUSH.depth + (1.3 - PUSH.depth) * sstep((f - PUSH.hold) / 5);
  const e = Math.pow(Math.max(0, Math.min(1, (f - OUT.f0) / (OUT.f1 - OUT.f0))), 2.2);
  return { hand: { tip: [PAD[0] + FOREARM[0] * OUT.dist * e, PAD[1] + FOREARM[1] * OUT.dist * e], angle: HAND.angle, lift, carry: false }, press };
};

// --- load-time checks -------------------------------------------------------------------------------------------------
const BANDS: [number, number][] = [
  [1080, 1250],
  [1360, 1460],
];
(() => {
  // ONCE_PROBE=1 (probe scripts only): print instead of throwing
  const probe = typeof process !== "undefined" && !!process.env?.ONCE_PROBE;
  const fail = (m: string) => {
    if (probe) console.log(`CHECK: ${m}`);
    else throw new Error(`OnceAYear: ${m}`);
  };
  const inBand = (y0: number, y1: number) => BANDS.some(([a, b]) => y1 > a && y0 < b);
  let lone = 0;
  for (let f = 0; f < DURATION; f++) {
    const cam = camAt(f);
    const { hand, press } = handAt(f);
    // the amber (stuck or carried) clear of the caption bands
    let c: P2 = TARGET;
    let r = STICKER_R;
    if (hand && hand.carry) {
      c = carriedCenter(hand);
      r = STICKER_R * handScale(hand.lift);
    }
    if (hand || press >= 0) {
      const [, sy] = camToScreen(cam, c[0], c[1]);
      // + the bloom's reach
      if (inBand(sy - r * cam.k, sy + r * cam.k + 8)) fail(`the sticker in a caption band at f${f} (y ${sy.toFixed(0)})`);
    }
    // text (month labels, header) clear of the bands: every label baseline row
    for (let m = 0; m < 12; m++) {
      const s = sheetRect(m);
      const [lx, ly] = camToScreen(cam, s.x + SHEET.labelX, s.y + SHEET.labelBase);
      const [, ly0] = camToScreen(cam, 0, s.y + SHEET.labelBase - SHEET.labelPx * 0.75);
      if (lx > -40 && lx < 1080 && inBand(ly0, ly)) fail(`label ${m} in a caption band at f${f}`);
    }
    // the whole planner in frame from "too" (f66)
    if (f >= 66) {
      const [x0, y0] = camToScreen(cam, PLANNER.x0, PLANNER.y0);
      const [x1, y1] = camToScreen(cam, PLANNER.x1, PLANNER.y1);
      if (x0 < 8 || x1 > 1072 || y0 < 0 || y1 > 1080) fail(`the planner is cut at f${f} (${x0.toFixed(0)}-${x1.toFixed(0)}, ${y0.toFixed(0)}-${y1.toFixed(0)})`);
    }
    // the sticker ~300-350 px from its cell at f0, the hand moving on every frame up to contact
    if (f === 0 && hand) {
      const [a, b] = camToScreen(cam, ...carriedCenter(hand));
      const [ta, tb] = camToScreen(cam, TARGET[0], TARGET[1]);
      const d = Math.hypot(a - ta, b - tb);
      if (d < 300 || d > 360 || a < ta || b < tb) fail(`the f0 sticker is ${d.toFixed(0)} px from its cell`);
      const [, by] = [a, b + STICKER_R * handScale(hand.lift) * cam.k];
      if (a + STICKER_R * handScale(hand.lift) * cam.k > 1080 || by > 1080) fail("the f0 sticker is not fully in frame");
    }
    if (f > 0 && f <= CONTACT_F) {
      const p = handAt(f - 1).hand;
      if (p && hand && Math.hypot(hand.tip[0] - p.tip[0], hand.tip[1] - p.tip[1]) + Math.abs(hand.lift - p.lift) * 60 < 0.6) fail(`the hand holds at f${f}`);
    }
    // the lone finger: frames with the fingertip in frame and the fist out of it (at most 3)
    if (hand && f > RELEASE_F) {
      const inF = (q: P2) => {
        const [x, y] = camToScreen(cam, ...handPoint(hand, q));
        return x > -10 && x < 1090 && y > -10 && y < 1930;
      };
      if ([[22, 0], [0, -22], [0, 22]].some((q) => inF(q as P2)) && ![[-140, -78], [-264, -78], [-338, -64], [-338, 124], [-198, 130], [-104, 46]].some((q) => inF(q as P2))) lone++;
    }
    // the hand gone by f39, its shadow too (the sticker alone well before "year", f44)
    if (f >= 39 && hand) {
      for (const q of HAND_HULL)
        for (const sh of [false, true]) {
          const [hx, hy] = camToScreen(cam, ...handPoint(hand, q, sh));
          if (hx > -60 && hx < 1080 + 60 && hy > -60 && hy < 1920 + 60) fail(`the hand still in frame at f${f}`);
        }
    }
  }
  if (lone > 3) fail(`a lone finger for ${lone} frames`);
  // the last frame is PLANNER_WIDE
  const e = camAt(DURATION - 1);
  if (Math.abs(e.x - PLANNER_WIDE.x) > 0.01 || Math.abs(e.y - PLANNER_WIDE.y) > 0.01 || Math.abs(e.k - PLANNER_WIDE.k) > 1e-5) fail("the last frame is not PLANNER_WIDE");
})();

// --- the cut ----------------------------------------------------------------------------------------------------------
const OnceAYear: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const band = amberBandFor(cam);
  const { hand, press } = handAt(f);
  return (
    <WallStage S={f} cam={cam} front={hand ? <Hand pose={hand} k={cam.k} band={band} /> : null}>
      <Planner k={cam.k} band={band} stickers={[{ month: DEC, press }]} />
    </WallStage>
  );
};

export default OnceAYear;

/** probe scripts: the camera and hand per frame */
export const debugAt = (f: number) => ({ cam: camAt(f), ...handAt(f) });
