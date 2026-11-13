// ---------------------------------------------------------------------------
// AsFastAsPossible (nik-managers-underperformers, cut 23). Cheeky Pint style (stout) (styles/cheeky-pint.md),
// picture-book office. Opaque 1080x1920, 23.976 fps, 83 frames. Built on builder A's plannerShared.tsx (the wall,
// the year planner, the sticker, the hand), imported and never edited; cut 6 OnceAYear ends on PLANNER_WIDE and
// this cut opens on it (the same object in the same place at the same size; two speaker shots lie between).
//
// CHECK LINE: "Done properly, the review does not wait for the end of the year: it comes round every quarter, four
// amber stickers down the year instead of one at the bottom."
//
// THE LINE: "In reality, you need to do it as fast as possible, right? You"
// WORD -> FRAME: In 1 · reality 5 · you 12 · need 15 · to 18 · do 20 · it 24 · as 27 · fast 30 · as 36 ·
//   possible 54 (ends 63) · right? 66 · You 70 · cut 83.
// DURATION: the slot 23.440 -> 26.902 s = 3.462 s x 23.976 = 83 frames (f0..f82).
//
// THE MOTION: f0 is PLANNER_WIDE (the whole year, the single amber dot in December) with the hand already coming in
// from the right edge and a slow push in on the board (k 1 -> 1.08, centred) already under way. In one brisk run down the right
// column the same card hand taps a sticker onto the same day in MAR (contact f14, "need"), JUN (f30, "fast") and SEP
// (f46, before "possible"): a real touch-down, a short press, a lift and one smooth arc to the next quarter. It leaves
// by the right edge (out of frame, shadow too, by f60). f60-82: four amber dots in one column, one per row, the push
// still creeping and the window light drifting.
// The hand: A's Hand component at HAND.angle, drawn HAND_G x larger about its fingertip (a hand nearer the camera
// than the wall; at PLANNER_WIDE's scale A's hand reads too small on a phone). It does not carry: its fingertip
// covers the day cell and the sticker is there under it on the contact frame (cause before effect), settling over
// the press (Planner's press 0 -> 1) and staying lit after the lift.
// REVISION 1 (director): the approach into MAR is one decelerating move that arrives on f14 still moving (no hover on
// the cell), and each new sticker grows out from under the fingertip, finger-width to full size over the 5 settle frames.
// CONTACT FRAMES (first reaction = the sticker under the fingertip on the same frame): MAR f14, JUN f30, SEP f46.
// AMBER = the performance review (the stickers only); cream = the planner (the subject), the wall = context.
//
// SOURCES: none (no real figures).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { amberBandFor, clamp01, smoothstep } from "../kits/cheeky-pint/stoutShared";
import {
  DEC,
  HAND,
  HAND_HULL,
  Hand,
  PLANNER,
  PLANNER_WIDE,
  Planner,
  SHEET,
  STICKER_R,
  Sticker,
  WallStage,
  camToScreen,
  handPoint,
  sheetRect,
  stickerCenter,
  type Cam,
  type HandPose,
  type P2,
} from "./plannerShared";

export const FPS = 24000 / 1001;
export const DURATION = 83;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const D2R = Math.PI / 180;
const rot = (p: P2, deg: number): P2 => [p[0] * Math.cos(deg * D2R) - p[1] * Math.sin(deg * D2R), p[0] * Math.sin(deg * D2R) + p[1] * Math.cos(deg * D2R)];

// --- the clock: OnceAYear's last frame used S = 80 (light patch, grain); carry on from there ----------------------------
const S0 = 80;

// --- the camera -------------------------------------------------------------------------------------------------------
// One slow eased push from PLANNER_WIDE, centred on the board (the whole board in frame). The ease runs over [PUSH0, PUSH1], wider than
// the cut, so it is already moving at f0 and still creeping at f82. ln k and the look share one progress.
const PUSH0 = -26;
const PUSH1 = 120;
/** where the push heads (reached at PUSH1, off the end of the cut) */
// revision 1 (director, blind review): the whole board stays in frame on every frame, >= 24 px of wall each side,
// centred on the board (no x drift): k reaches ~1.08 at f82 (u(82) = 0.889 of the way to CAM_END)
const CAM_END: Cam = { x: 540, y: 960, k: 1.0905 };
const pushU = (f: number) => {
  const t = clamp01((f - PUSH0) / (PUSH1 - PUSH0));
  const t0 = -PUSH0 / (PUSH1 - PUSH0);
  const sm = (v: number) => v * v * v * (v * (6 * v - 15) + 10);
  // renormalised so f0 is exactly PLANNER_WIDE
  return (sm(t) - sm(t0)) / (1 - sm(t0));
};
export const camAt = (f: number): Cam => {
  const u = pushU(f);
  const k = PLANNER_WIDE.k * Math.exp(Math.log(CAM_END.k / PLANNER_WIDE.k) * u);
  return { x: lerp(PLANNER_WIDE.x, CAM_END.x, u), y: lerp(PLANNER_WIDE.y, CAM_END.y, u), k };
};

// --- the hand ---------------------------------------------------------------------------------------------------------
/** the hand drawn this much larger about its fingertip: nearer the camera than the wall */
export const HAND_G = 1.6;
const MAR = 2;
const JUN = 5;
const SEP = 8;
export const PRESSES = [
  { month: MAR, contact: 14 },
  { month: JUN, contact: 30 },
  { month: SEP, contact: 46 },
] as const;
/** frames the finger stays down (press in and release) */
const HOLD = 5;
/** the fingertip pad sits this far past the sticker's centre along the finger (local px x HAND.size): the finger's
 *  end covers the dot */
const PAD_PAST = 14;
const padFor = (m: number): P2 => {
  const [cx, cy] = stickerCenter(m);
  const o = rot([PAD_PAST * HAND.size * HAND_G, 0], HAND.angle);
  return [cx + o[0], cy + o[1]];
};
/** frames of the approach into MAR (it starts before f0, so the hand is already moving on f0) */
const APPROACH = 17;
/** f0: the fingertip just inside the right edge, the hand behind it off frame, heading for MAR */
const ENTRY_FROM: P2 = [220, 240];
/** the exit after SEP: lift, then out to the right (and a little down, along the forearm) */
const EXIT = { f0: PRESSES[2].contact + HOLD, f1: 60, dir: [0.82, 0.57] as P2, dist: 560 };

/** the hand's pose at f (null once it is gone); a lift of 0 = the fingertip on the paper */
export const handAt = (f: number): HandPose | null => {
  const ang = HAND.angle;
  const [p1, p2, p3] = PRESSES;
  const pad1 = padFor(p1.month);
  // approach (revision 1): ONE decelerating move from ENTRY_FROM (offset from MAR's pad) that arrives on the contact
  // frame still moving (a gentle ease-out blended with a linear share, so the last steps are small but never zero),
  // sinking to the paper all the way down
  if (f < p1.contact) {
    const u = clamp01((f - (p1.contact - APPROACH)) / APPROACH);
    const e = 0.8 * (1 - Math.pow(1 - u, 2)) + 0.2 * u;
    const lift = 0.9 * (1 - u) * (1 - 0.4 * u);
    return { tip: [pad1[0] + ENTRY_FROM[0] * (1 - e), pad1[1] + ENTRY_FROM[1] * (1 - e)], angle: ang + 4 * (1 - e), lift, carry: false };
  }
  // the presses and the hops between them
  const seq = [p1, p2, p3];
  for (let i = 0; i < seq.length; i++) {
    const c = seq[i].contact;
    const pad = padFor(seq[i].month);
    if (f <= c + HOLD) {
      const v = (f - c) / HOLD;
      return { tip: pad, angle: ang, lift: -0.2 * Math.sin(Math.PI * Math.min(1, v * 1.25)), carry: false };
    }
    const next = seq[i + 1];
    if (next && f < next.contact) {
      // one smooth arc: lift up and over, the pad gliding down to the next quarter, bowing out to the right
      const t = (f - (c + HOLD)) / (next.contact - (c + HOLD));
      const to = padFor(next.month);
      const e = smoothstep(t);
      const bow = 34 * Math.sin(Math.PI * e);
      // lift: up fast, down with a little speed at the touch
      const lift = 0.55 * Math.sin(Math.PI * Math.pow(t, 0.85));
      return { tip: [lerp(pad[0], to[0], e) + bow, lerp(pad[1], to[1], e)], angle: ang + 2 * Math.sin(Math.PI * t), lift, carry: false };
    }
  }
  // the exit
  if (f > EXIT.f1 + 0.5) return null;
  const pad = padFor(p3.month);
  const u = clamp01((f - EXIT.f0) / (EXIT.f1 - EXIT.f0));
  const lift = 1.1 * smoothstep(u / 0.5);
  const e = Math.pow(u, 1.4);
  return { tip: [pad[0] + EXIT.dir[0] * EXIT.dist * e, pad[1] + EXIT.dir[1] * EXIT.dist * e], angle: ang - 4 * smoothstep(u), lift, carry: false };
};
/** a sticker's press: -1 before its contact, 0 on it .. 1 as the finger lifts */
const pressOf = (contact: number, f: number) => (f < contact ? -1 : clamp01((f - contact) / HOLD));
/** revision 1: a new sticker grows out from under the fingertip, from the finger's width (hand-local 44 px x HAND.size x
 *  HAND_G) to full size over the HOLD settle frames (ease-out); Planner draws it once it is settled */
const GROW0 = (44 * HAND.size * HAND_G) / (2 * STICKER_R);
const growOf = (press: number) => GROW0 + (1 - GROW0) * (1 - Math.pow(1 - clamp01(press), 2));

/** a world point of the drawn (HAND_G-enlarged) hand at local point q */
const bigHandPoint = (p: HandPose, q: P2, withShadow = false): P2 => {
  const w = handPoint(p, q, withShadow);
  return [p.tip[0] + (w[0] - p.tip[0]) * HAND_G, p.tip[1] + (w[1] - p.tip[1]) * HAND_G];
};

// --- load-time checks -------------------------------------------------------------------------------------------------
const BANDS: [number, number][] = [
  [1080, 1250],
  [1360, 1460],
];
(() => {
  const probe = typeof process !== "undefined" && !!process.env?.AFAP_PROBE;
  const fail = (m: string) => {
    if (probe) console.log(`CHECK: ${m}`);
    else throw new Error(`AsFastAsPossible: ${m}`);
  };
  const inBand = (y0: number, y1: number) => BANDS.some(([a, b]) => y1 > a && y0 < b);
  const c0 = camAt(0);
  if (Math.abs(c0.x - PLANNER_WIDE.x) > 1e-6 || Math.abs(c0.y - PLANNER_WIDE.y) > 1e-6 || Math.abs(c0.k - PLANNER_WIDE.k) > 1e-9) fail("f0 is not PLANNER_WIDE");
  for (let f = 0; f < DURATION; f++) {
    const cam = camAt(f);
    // every sticker (DEC and the three quarters) clear of the caption bands, with the bloom's reach
    for (const m of [2, 5, 8, DEC]) {
      const [, sy] = camToScreen(cam, ...stickerCenter(m));
      if (inBand(sy - STICKER_R * cam.k - 8, sy + STICKER_R * cam.k + 8)) fail(`sticker ${m} in a caption band at f${f}`);
    }
    // month labels clear of the bands
    for (let m = 0; m < 12; m++) {
      const s = sheetRect(m);
      const [lx, ly] = camToScreen(cam, s.x + SHEET.labelX, s.y + SHEET.labelBase);
      const [, ly0] = camToScreen(cam, 0, s.y + SHEET.labelBase - SHEET.labelPx * 0.75);
      if (lx > -40 && lx < 1080 && inBand(ly0, ly)) fail(`label ${m} in a caption band at f${f}`);
    }
    // the right column whole, the header in frame, the left column only a little off
    const [, y0] = camToScreen(cam, 0, PLANNER.y0);
    const [x1, y1] = camToScreen(cam, PLANNER.x1, PLANNER.y1);
    const [lc] = camToScreen(cam, sheetRect(0).x, 0);
    if (x1 > 1076 || y0 < 0 || y1 > 1080) fail(`the planner is cut at f${f}`);
    if (lc < -0.3 * SHEET.w * cam.k) fail(`the left column runs far off at f${f} (${lc.toFixed(0)})`);
    // revision 1: the whole board in frame, both side edges, with >= 24 px of wall each side
    const [bx0] = camToScreen(cam, PLANNER.x0, 0);
    if (bx0 < 24 || x1 > 1080 - 24) fail(`the board's side edges are not clear of the frame at f${f} (${bx0.toFixed(1)}-${x1.toFixed(1)})`);
    // no clipped month label: the left column's labels stay whole
    const [llx] = camToScreen(cam, sheetRect(0).x + SHEET.labelX, 0);
    if (llx < 6) fail(`a left-column label is clipped at f${f} (x ${llx.toFixed(0)})`);
    // the hand gone (shadow too) from f60
    const h = handAt(f);
    if (f >= 60 && h)
      for (const q of HAND_HULL)
        for (const sh of [false, true]) {
          const [hx, hy] = camToScreen(cam, ...bigHandPoint(h, q, sh));
          if (hx > -40 && hx < 1120 && hy > -40 && hy < 1960) fail(`the hand still in frame at f${f}`);
        }
    // f0: the hand already entering at the right edge (some of it in frame)
    if (f === 0) {
      if (!h) fail("no hand at f0");
      else {
        const [tx] = camToScreen(cam, ...h.tip);
        if (tx > 1060 || tx < 900) fail(`the fingertip at f0 is at x ${tx.toFixed(0)}`);
      }
    }
  }
  // the end: the four dots readable at 270 px wide (sticker >= 72 px across at full res)
  if (2 * STICKER_R * camAt(DURATION - 1).k < 72) fail("the stickers end small");
})();

// --- the cut ----------------------------------------------------------------------------------------------------------
const AsFastAsPossible: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const band = amberBandFor(cam);
  const hand = handAt(f);
  const pressed = PRESSES.map((p) => ({ month: p.month, press: pressOf(p.contact, f) }));
  // settled stickers: Planner; settling ones (0 <= press < 1): grown here, with Planner's lift (0.35 x (1 - press))
  const stickers = [{ month: DEC, press: 1 }, ...pressed.filter((p) => p.press >= 1)];
  const settling = pressed.filter((p) => p.press >= 0 && p.press < 1);
  const front = hand ? (
    <g transform={`translate(${hand.tip[0]} ${hand.tip[1]}) scale(${HAND_G}) translate(${-hand.tip[0]} ${-hand.tip[1]})`}>
      <Hand pose={hand} k={cam.k * HAND_G} band={band} />
    </g>
  ) : null;
  return (
    <WallStage S={S0 + f} cam={cam} front={front}>
      <Planner k={cam.k} band={band} stickers={stickers} />
      {settling.map((p) => {
        const [cx, cy] = stickerCenter(p.month);
        return <Sticker key={p.month} cx={cx} cy={cy} k={cam.k} band={band} lift={0.35 * (1 - p.press)} scale={growOf(p.press)} />;
      })}
    </WallStage>
  );
};

export default AsFastAsPossible;

/** for probe scripts */
export const debugAt = (f: number) => ({ cam: camAt(f), hand: handAt(f) });
