import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  CAM_DAMP,
  CAM_LIFT,
  CAM_STIFF,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  camEase,
  clamp,
  clamp01,
  hash,
  iconShadow,
  runCamera,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
// The one V4 world: the kraft backdrop, the mark, the eight companies standing
// on the ground, their price lines, the thread constants and the pile geometry.
// Imported, never restated.
import {
  CARD_SIZE,
  COIN_R,
  CompanyCard,
  D1Mark,
  GROUND_OP,
  GROUND_W,
  GROUND_X0,
  GROUND_X1,
  KRAFT_BASE,
  KRAFT_BLUR,
  KRAFT_DIM,
  KRAFT_SRC,
  KraftBackground,
  MARK_BOTTOM,
  MARK_SIZE,
  MARK_TOP,
  MARK_X,
  MARK_Y,
  PriceLine,
  SECTOR_SET,
  THREAD_IDLE,
  THREAD_LIVE,
  THREAD_W,
  V4,
  cardX,
  originX,
  priceTip,
  returnCoinPosV4,
} from "./d1Shared";
// THE HANDOFF. This cut is the OPENER of the clip and its last frame is the
// frame the next cut opens on, so the next cut's opening camera and the set's
// coin speed are IMPORTED from it rather than copied. If `BackIntoItV4` ever
// re-frames its f0, this cut re-frames its f80 with it and the edit stays cut-
// proof. (`K_OPEN` 1.15, `CONTENT_OPEN` 668, `CENTRE_X` 540, `COIN_SPEED` 26.)
import {
  CENTRE_X as NEXT_CX,
  COIN_SPEED,
  CONTENT_OPEN as NEXT_CONTENT,
  K_OPEN as NEXT_K,
} from "./BackIntoItV4";

export const FPS = 24;
// Dan Sundheim, D1 Capital, on the year after the 2021 squeeze:
// "After GameStop we took about a year off of short selling."
//
// SRT span 0:00.000 -> 0:02.700 at 24fps.
// round(2.700 * 24) = round(64.8) = 65 frames of speech, plus a 16 frame tail
// so the resolved state — the frame the next cut opens on — holds = 81.
export const DURATION = 81;

// Word onsets, in frames from the composition's start (= 0.000):
//   f0 after · f7 GameStop (0.300) · f23 we (0.940) · f34 year (1.399)
//   · f38 off (1.600) · f45 of (1.860) · f51 short (2.120) · f60 selling
//   · f65 speech ends (2.700) · tail to f81
//
// The inflections that actually bend the motion:
//   f0-f7  after / GameStop — the squeeze is already under way at frame 0
//   f14    the cart's tip crosses its own untouched height (mid-rise)
//   f23 we — the tip has overshot and is straining at its ceiling
//   f30    ("year" -4) D1 LETS GO: the tip whitens, the thread starts reeling
//   f45 of — the thread is most of the way home, the price is settling
//   f56    the price is back on its untouched chart; nothing is held
//   f60 selling / f65 end — the resolved market, held to f81
//
// ---------------------------------------------------------------------------
// "After GameStop", V4 — THE OPENER, AND ONE ARC: RISE, RELEASE, RETREAT.
//
// This is the establishing shot of the whole V4 world AND the only cut in the
// set where D1 LOSES. It opens mid-disaster — D1 already short the retail cart
// (index 7), the cart's price line dragged to `V4.DROP_DEEP`, eight coins of
// profit piled on the mark — and it ends on eight untouched, rising price
// lines with D1 holding nothing. That end frame is `BackIntoItV4` frame 0,
// down to the camera, so the two cuts butt together with no jump.
//
// It is ONE motion with two inflections, not a list of beats:
//
//   PHASE 1 · THE SQUEEZE (f0 -> f26, "after GameStop")
//     One continuous rise. The cart's tip climbs 220 px on a single warped
//     smoothstep: it crosses its own UNTOUCHED height at f14 and keeps going
//     to 70 px ABOVE it (`drop` -70) by f26, three px past and settling. The
//     thread stays attached and stretches with it, live and straight, so the
//     picture is a price getting away from the thing holding it down. Every
//     `COIN_RISE_STEP` of rise from f4 pays one coin OUT of the pile, top row
//     first and right to left; it falls down the thread and vanishes where the
//     line ends. Eight coins leave between f5 and f20 and the pile is empty
//     before D1 lets go. The camera rides the tip: k 1.20 -> 1.28 with its
//     content centre literally keyed to the midpoint of the mark's top and the
//     tip, so the frame tilts up with the price.
//
//   PHASE 2 · THE RELEASE (f26 -> f56, "we took about a year off")
//     f26-f30 is the held breath: the tip is at its ceiling and the only thing
//     moving is its strain against the thread (+/- 3 px) and the camera's own
//     settle. At f30 — four frames ahead of "year" — D1 lets go. The tip
//     crossfades accent -> white over four frames and stops straining; the
//     thread reels in head-led, its far end running up the line into the
//     mark's bottom edge across f30-f46 while its opacity falls 0.95 -> 0.40,
//     and any coin still on the line is taken with it. The cart's tip sinks
//     -70 -> 0 on `flow` across f30-f56: not a fall, a price settling back
//     onto its own rising chart. Under all of it the camera runs ONE pull-back
//     and re-centre, keyed f28-f52 and landed by f58, onto the next cut's
//     opening camera exactly.
//
//   PHASE 3 · THE RETREAT (f56 -> f81, "of short selling" + tail)
//     Eight companies, eight untouched rising price lines, no threads, no
//     coins, the mark's dot the only accent. Nothing moves but `sway` and the
//     paper's own drift. This is deliberate and it is the brief: it is the
//     frame `BackIntoItV4` opens on, and the two cuts are seconds apart in one
//     edit, so anything still moving here would have to stop at the cut.
//
// DEVIATIONS FROM THE BRIEF, ALL ARGUED WHERE THEY ARE SET:
//   * COIN_RISE_STEP is 21 px of rise per coin, not 36 — see the constant: the
//     whole rise is 220 px and eight coins have to leave it.
//   * a coin vanishes at the thread's LIVE END rather than at the tip — see
//     `coinAt`: after f30 there is no tip on the line to arrive at, and this
//     is what stops a coin being orphaned in mid-air by the reel-in.
//   * the opening camera (k 1.20, cx 722) leaves the two left-hand companies
//     off frame for the first ~20 frames. That is the opener's whole job: it
//     starts on the disaster and pulls back to reveal the market. Every piece
//     of content still lives inside the world band x 60-1020 / y 200-1450.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: the thread, the held tip, every coin, the mark's dot
  accentDeep: z.string(), // the set's shared palette
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  // the per-icon shadow, in SCREEN px; divided by the camera's k at draw time
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  markSize: z.number(),
  cardSize: z.number(),
  coinRadius: z.number(),
  beats: z.object({
    after: z.number(), // "after" — the squeeze is already running
    gamestop: z.number(), // "GameStop"
    we: z.number(), // "we" — the tip is at its ceiling, straining
    year: z.number(), // "year" — D1 let go four frames ago
    off: z.number(), // "off" — the thread is reeling in
    of: z.number(), // "of"
    short: z.number(), // "short"
    selling: z.number(), // "selling" — the market is resolved
    end: z.number(), // speech ends; the handoff frame holds to 81
  }),
});

export type Props = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// THE WORLD. Identical to the other two V4 cuts, because it IS the other two
// cuts' world: the mark at (540, 430), the ground at 960, eight companies at
// `cardX(i)` standing on it, a price line on each. Nothing is placed by eye.
// ---------------------------------------------------------------------------
export const WORLD_W = 1080;
export const WORLD_H = 1400;
export const CENTRE_X = MARK_X;

// The company playing GameStop: index 7, the retail cart, x 904 — the far
// right of the row, which is what gives the opener somewhere to pull back FROM.
export const SUBJ = 7;

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(bx - ax, by - ay);

// ---------------------------------------------------------------------------
// THE TIP'S TRACK. One number, `drop`, from frame 0 to frame 80, and it is the
// spine of the cut: 150 (deeply shorted) -> -70 (70 px ABOVE its untouched
// height) -> 0 (back on its own chart).
//
// The settle lobe and the flat-topped travel are lifted verbatim from
// `BackIntoItV4` — same set, same hand.
// ---------------------------------------------------------------------------
export const SETTLE_PX = 3;
const SETTLE_U0 = 4 / 7;
// A settle that goes a few px past the target and comes back, flat to SECOND
// order at both ends so it adds neither a step in speed nor one in
// acceleration (the `max(0, backOut(u) - 1)` it replaces adds both).
const overshoot = (u: number) => {
  const w = clamp01((clamp01(u) - SETTLE_U0) / (1 - SETTLE_U0));
  return 64 * w ** 3 * (1 - w) ** 3;
};

// A travel with a flat middle: eases in over the first `a`, out over the last
// `a`, one speed in between. Peak 1/(1-a) times the average.
const FLOW_A = 0.28;
const flow = (u: number, a: number = FLOW_A) => {
  const x = clamp01(u);
  const area = 1 - a;
  if (x < a) {
    const g = x / a;
    return (a * (g * g * g - (g * g * g * g) / 2)) / area;
  }
  if (x <= 1 - a) return (a * 0.5 + (x - a)) / area;
  const g = (1 - x) / a;
  return (area - a * (g * g * g - (g * g * g * g) / 2)) / area;
};

// One segment of the track: `delta` px between f0 and f1 on `ease`, with the
// settle applied ALONG the travel. A segment that has not started contributes
// exactly 0, so the segments simply add and the track is one expression.
const seg = (
  f: number,
  f0: number,
  f1: number,
  delta: number,
  ease: (u: number) => number,
  settle = true,
) => {
  const u = clamp01((f - f0) / (f1 - f0));
  const s = settle
    ? Math.sign(delta) * Math.min(SETTLE_PX, 0.1 * Math.abs(delta)) * overshoot(u)
    : 0;
  return delta * ease(u) + s;
};

export const RISE_F0 = 0;
export const RISE_F1 = 26;
export const DROP_START = V4.DROP_DEEP; // 150: where the short already had it
export const RISE_ABOVE = 70; // how far past untouched the squeeze takes it
export const RISE_TOTAL = DROP_START + RISE_ABOVE; // 220 px of tip travel

// RISE_WARP 0.755 IS DERIVED, NOT PICKED. The brief asks for two things at
// once: the tip crosses its untouched height (drop 0) at f14, and it reaches
// drop -70 at f26 — and it must do both as ONE curve, because a rise that
// re-eases at f14 is two gestures and the whole point of V4 is that it is one.
// `camEase(u, warp) = smoothstep(u^warp)` has zero slope at both ends for any
// warp > 0.5, and warp 0.755 puts smoothstep(u^warp) = 0.6886 at u = 14/26,
// i.e. 151.5 of the 220 px done — drop -1.5, which is the crossing, on the
// frame asked for. Front-loaded is also simply what a squeeze looks like: it
// gets away fast and then runs out of buyers.
export const RISE_WARP = 0.755;
const riseEase = (u: number) => camEase(u, RISE_WARP);

export const SINK_F0 = 30; // D1 lets go; the price starts settling back
export const SINK_F1 = 56; // it is on its own untouched chart again

// The authored track, strain excluded (new lows are read off this, and a wobble
// must never pay out).
export const dropTrack = (f: number) =>
  DROP_START +
  seg(f, RISE_F0, RISE_F1, -RISE_TOTAL, riseEase) +
  seg(f, SINK_F0, SINK_F1, RISE_ABOVE, flow);

// The rise with no settle on it, for the coin schedule: monotone, so "a NEW
// low" (here, a new HIGH — the loss side of exactly the same rule) can be read
// off it without a 3 px lobe re-triggering a launch.
const riseOnly = (f: number) => DROP_START + seg(f, RISE_F0, RISE_F1, -RISE_TOTAL, riseEase, false);

// THE STRAIN. A tip held against a thread never sits still. It ramps in as the
// rise tops out (f18-f26), carries the four frames of held breath before the
// release, and tapers to nothing by f42 — so the tip is dead still from f42,
// which is what the handoff needs.
export const STRAIN_AMP = 3;
export const STRAIN_PERIOD = 26;
export const STRAIN_IN0 = 18;
export const STRAIN_IN1 = 26;
export const STRAIN_OUT0 = 30;
export const STRAIN_OUT1 = 42;
export const strainAt = (f: number) => {
  const amp =
    STRAIN_AMP *
    smoothstep((f - STRAIN_IN0) / (STRAIN_IN1 - STRAIN_IN0)) *
    (1 - smoothstep((f - STRAIN_OUT0) / (STRAIN_OUT1 - STRAIN_OUT0)));
  return amp * Math.sin((2 * Math.PI * (f - STRAIN_IN0)) / STRAIN_PERIOD);
};

export const dropAt = (f: number) => dropTrack(f) + strainAt(f);
export const tipAt = (f: number) => priceTip(SUBJ, dropAt(f));
// The camera tracks the AUTHORED tip, never the strain: a 3 px wobble is not
// something a camera should chase (MEMORY: "never chase the subject").
export const tipPureY = (f: number) => priceTip(SUBJ, dropTrack(f)).y;

// ---------------------------------------------------------------------------
// THE THREAD. It leaves `originX(7)` on the mark's bottom edge and it is on the
// cart's tip from frame 0 — this cut opens mid-short, nothing is drawn on.
// At RELEASE_F it lets go and reels in head-led: the FAR end runs up the line
// into the mark while the near end stays put, along the direction the line had
// at the moment of release (it is not attached to anything any more, so it must
// not keep following the tip down).
// ---------------------------------------------------------------------------
export const THREAD_X0 = originX(SUBJ); // 574
export const THREAD_Y0 = MARK_BOTTOM; // 484
export const RELEASE_F = 30; // "year" - 4
export const REEL_F1 = 46;
export const TIP_WHITEN = 4; // frames the tip crossfades accent -> white

const RELEASE_TIP = priceTip(SUBJ, dropTrack(RELEASE_F) + 0); // the frozen geometry
export const RELEASE_LEN = dist(THREAD_X0, THREAD_Y0, RELEASE_TIP.x, RELEASE_TIP.y);
export const RELEASE_DIR = {
  x: (RELEASE_TIP.x - THREAD_X0) / RELEASE_LEN,
  y: (RELEASE_TIP.y - THREAD_Y0) / RELEASE_LEN,
};

// The thread's live length at a frame, and its far end.
export const threadLen = (f: number) => {
  if (f < RELEASE_F) {
    const t = tipAt(f);
    return dist(THREAD_X0, THREAD_Y0, t.x, t.y);
  }
  if (f >= REEL_F1) return 0;
  return RELEASE_LEN * (1 - flow((f - RELEASE_F) / (REEL_F1 - RELEASE_F)));
};
export const threadEnd = (f: number) => {
  if (f < RELEASE_F) return tipAt(f);
  const L = threadLen(f);
  return { x: THREAD_X0 + RELEASE_DIR.x * L, y: THREAD_Y0 + RELEASE_DIR.y * L };
};

// ---------------------------------------------------------------------------
// THE MONEY GOING THE WRONG WAY. Same coin, same `COIN_SPEED` as the rest of
// the set, same thread — the direction is the only difference, and it is the
// whole content of the cut: in cuts 2 and 3 amber climbs, here amber falls.
//
// COIN_RISE_STEP IS 21 PX OF RISE, NOT THE WORLD'S 36. The rule in d1Shared is
// one coin per 36 px of new low, and it is the right rule for a cut where the
// tip has 150 px to fall and the pile only has to GROW. Here the pile has
// exactly `PILE_START` = 8 coins, all eight have to be gone before D1 lets go
// at f30, and the whole rise is 220 px of which the part that can pay (f4 ->
// f20, before the rise tops out) is 169. 169 / 8 = 21.1. At 36 px the pile
// would still hold three coins at the release and the cut would not read.
// ---------------------------------------------------------------------------
export const PILE_START = 8; // the profit D1 opens the clip holding
export const COIN_PAY_F0 = 4; // the first frame a coin can leave
export const COIN_PAY_F1 = 20; // the last: past here the rise is topping out
export const COIN_RISE_STEP = (riseOnly(COIN_PAY_F0) - riseOnly(COIN_PAY_F1)) / PILE_START;
export const COIN_FADE = 30; // px of remaining line over which a coin shrinks out
// COIN_MIN_GAP. The rise is fast enough in the middle that two launches can fall
// on consecutive frames, and at COIN_SPEED 26 that puts two 18 px coins 26 px
// apart — they read as one smeared blob rather than two coins. Two frames is
// 52 px, three diameters, which is the same spacing the rest of the stream has.
export const COIN_MIN_GAP = 2;

// One launch per coin: the frame the tip's rise since f4 crosses (n + 0.5)
// steps, the pile slot it empties (top row first, right to left => 7, 6, 5 …)
// and the length of its first leg, pile -> the mark's bottom edge.
export const LAUNCHES = (() => {
  const out: { n: number; f0: number; slot: number; px: number; py: number; legA: number }[] = [];
  let next = 0.5 * COIN_RISE_STEP;
  let lastF = -COIN_MIN_GAP;
  for (let f = COIN_PAY_F0; f <= COIN_PAY_F1 + 8 && out.length < PILE_START; f++) {
    const rise = riseOnly(COIN_PAY_F0) - riseOnly(f);
    if (rise >= next && f - lastF >= COIN_MIN_GAP && out.length < PILE_START) {
      lastF = f;
      const slot = PILE_START - 1 - out.length;
      const p = returnCoinPosV4(slot);
      out.push({
        n: out.length,
        f0: f,
        slot,
        px: p.x,
        py: p.y,
        legA: dist(p.x, p.y, THREAD_X0, THREAD_Y0),
      });
      next += COIN_RISE_STEP;
    }
  }
  return out;
})();

// Where coin `n` is at frame `f`, or null once the line has taken it. The path
// is the polyline pile -> the mark's bottom edge -> down the thread, walked at
// a constant COIN_SPEED; the corner is inside the mark's own tile, so it is
// never seen (coins are drawn under the mark, exactly as in the other cuts).
export const coinAt = (n: number, f: number) => {
  const L = LAUNCHES[n];
  if (!L || f < L.f0) return null;
  const s = COIN_SPEED * (f - L.f0);
  if (s < L.legA) {
    const u = s / L.legA;
    return { x: lerp(L.px, THREAD_X0, u), y: lerp(L.py, THREAD_Y0, u), scale: 1 };
  }
  const d = s - L.legA;
  const len = threadLen(f);
  if (d >= len) return null;
  const e = threadEnd(f);
  const ux = (e.x - THREAD_X0) / (len || 1);
  const uy = (e.y - THREAD_Y0) / (len || 1);
  return {
    x: THREAD_X0 + ux * d,
    y: THREAD_Y0 + uy * d,
    scale: clamp01((len - d) / COIN_FADE),
  };
};
export const COIN_LAST_F = (() => {
  let last = 0;
  for (let n = 0; n < LAUNCHES.length; n++) {
    for (let f = LAUNCHES[n].f0; f <= DURATION; f++) if (coinAt(n, f)) last = Math.max(last, f);
  }
  return last;
})();

// ---------------------------------------------------------------------------
// THE CAMERA. ONE arc in two moves through one damped `runCamera`, plus a
// second damped channel for the pan (fieldShared's camera tilts and zooms; this
// is the only cut in the set that also travels sideways, because it is the only
// one that opens off-centre).
//
//   RIDE f0-f26   k 1.20 -> 1.28, cx parked at 722, and the content centre
//                 KEYED TO THE TIP: c(f) = midpoint(MARK_TOP, tipPureY(f)).
//                 That is not a camera move with a number on each end, it is
//                 the camera holding the mark and the price in frame while the
//                 price runs away, which is the only reason to move at all.
//   PULL f28-f52  k 1.28 -> 1.15, cx 722 -> 540, c 512 -> 668, warp 0.72 so
//                 the speed is early and the landing is long. Lands f58 by
//                 measurement — the damper (CAM_STIFF .09 / CAM_DAMP .468)
//                 costs about four frames on a move this size, so it is keyed
//                 to f52 to land on f58 and then hold dead flat to f80.
//
// K_OPEN 1.20 AND CX_OPEN 722 ARE THE CART'S FRAME, and 722 is not eyeballed:
// it is the midpoint of the mark (540) and the cart (904). At that framing the
// two left-hand companies are outside the frame for the first ~20 frames. That
// is the establishing move: the cut opens on the thing that went wrong and the
// pull-back is what turns it into a market.
//
// THE LANDING IS IMPORTED. `NEXT_K` / `NEXT_CONTENT` / `NEXT_CX` are
// `BackIntoItV4`'s own `K_OPEN` / `CONTENT_OPEN` / `CENTRE_X`, so f80 of this
// cut and f0 of that one are the same camera by construction rather than by
// two numbers agreeing.
// ---------------------------------------------------------------------------
export const K_OPEN = 1.2;
export const K_TIGHT = 1.28;
export const CX_OPEN = (MARK_X + cardX(SUBJ)) / 2; // 722
export const TIP_DEEP_Y = priceTip(SUBJ, DROP_START).y; // 868
export const TIP_HIGH_Y = priceTip(SUBJ, -RISE_ABOVE).y; // 648
export const CONTENT_RIDE0 = (MARK_TOP + TIP_DEEP_Y) / 2; // 622
export const CONTENT_RIDE1 = (MARK_TOP + TIP_HIGH_Y) / 2; // 512
export const PULL_F0 = 28;
export const PULL_F1 = 52;
export const PULL_WARP = 0.72;

export const CAM_F: number[] = [];
export const CAM_K: number[] = [];
export const CAM_CY: number[] = [];
export const CAM_CX: number[] = [];
{
  const push = (f: number, k: number, c: number, x: number) => {
    CAM_F.push(f);
    CAM_K.push(k);
    CAM_CY.push(c + CAM_LIFT / k);
    CAM_CX.push(x);
  };
  // RIDE: a key per frame, so the damper's target IS the eased curve and the
  // content centre comes off the tip rather than off a straight line.
  for (let f = RISE_F0; f <= RISE_F1; f++) {
    const g = camEase((f - RISE_F0) / (RISE_F1 - RISE_F0), 1);
    push(f, K_OPEN + (K_TIGHT - K_OPEN) * g, (MARK_TOP + tipPureY(f)) / 2, CX_OPEN);
  }
  // PULL
  for (let f = PULL_F0; f <= PULL_F1; f++) {
    const g = camEase((f - PULL_F0) / (PULL_F1 - PULL_F0), PULL_WARP);
    push(
      f,
      K_TIGHT + (NEXT_K - K_TIGHT) * g,
      CONTENT_RIDE1 + (NEXT_CONTENT - CONTENT_RIDE1) * g,
      CX_OPEN + (NEXT_CX - CX_OPEN) * g,
    );
  }
  push(DURATION, NEXT_K, NEXT_CONTENT, NEXT_CX);
}

// The pan, on the same damper as the tilt and the zoom so the three settle
// together. `runCamera` only carries two channels; this is its third.
export const runPan = (upto: number, F: number[], X: number[]) => {
  let x = X[0];
  let v = 0;
  for (let f = 1; f <= upto; f++) {
    const t = interpolate(f, F, X, clamp);
    v += (t - x) * CAM_STIFF - v * CAM_DAMP;
    x += v;
  }
  return x;
};

// THE HANDOFF FRAME. `BackIntoItV4` rests its background parallax on its own
// opening cy, so this cut has to rest on the SAME one — otherwise the paper
// sits somewhere else at the cut even though the camera matches. Everything
// but the paper's own `frame * 0.3` drift is then identical at f80.
export const HANDOFF_CY = NEXT_CONTENT + CAM_LIFT / NEXT_K;

// THE HAND ON THE CAMERA, PHASE-LOCKED TO THE CUT. `sway` is a continuous 5 px
// drift and the next cut starts its own at phase zero, so an unshifted sway
// would hand over 4.4 px off and the edit would show a jump on a frame where
// nothing else moves. Running it at `frame - (DURATION - 1)` puts phase zero on
// the LAST frame instead: the drift is unbroken all the way through this cut
// and arrives at exactly the next cut's frame 0.
export const SWAY_PHASE = -(DURATION - 1);

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  backgroundBase: KRAFT_BASE,
  backgroundSrc: KRAFT_SRC,
  backgroundBlur: KRAFT_BLUR,
  backgroundDim: KRAFT_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  markSize: MARK_SIZE,
  cardSize: CARD_SIZE,
  coinRadius: COIN_R,
  beats: {
    after: 0,
    gamestop: 7,
    we: 23,
    year: 34,
    off: 38,
    of: 45,
    short: 51,
    selling: 60,
    end: 65,
  },
});

const AfterGameStopV4: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
  iconShadowY,
  iconShadowBlur,
  iconShadowOpacity,
  markSize,
  cardSize,
  coinRadius,
}) => {
  const frame = useCurrentFrame();

  // -- the one thread --------------------------------------------------------
  const tLen = threadLen(frame);
  const tEnd = threadEnd(frame);
  const threadOn = tLen > 0.5;
  const threadOp = interpolate(frame, [RELEASE_F, REEL_F1], [THREAD_LIVE, THREAD_IDLE], clamp);
  const held = frame < RELEASE_F;
  // the tip's colour, crossfaded rather than switched: the accent circle the
  // `PriceLine` draws while held is re-drawn here on top of the white one and
  // faded out over four frames, so the release has no step in it.
  const tipAccent = interpolate(
    frame,
    [RELEASE_F, RELEASE_F + TIP_WHITEN],
    [1, 0],
    clamp,
  );
  const subjDrop = dropAt(frame);
  const subjTip = priceTip(SUBJ, subjDrop);

  // -- the money draining out of the pile ------------------------------------
  const coins: { key: number; x: number; y: number; r: number }[] = [];
  for (let n = 0; n < LAUNCHES.length; n++) {
    const c = coinAt(n, frame);
    if (!c) continue;
    coins.push({
      key: n,
      x: c.x,
      y: c.y,
      r: coinRadius * c.scale * breath(frame, hash(n, 9)),
    });
  }
  let gone = 0;
  for (let n = 0; n < LAUNCHES.length; n++) if (frame >= LAUNCHES[n].f0) gone = n + 1;
  const remaining = PILE_START - gone;

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const drift = sway(frame + SWAY_PHASE);
  const cy = cam.cy + drift.dy;
  const cx = runPan(frame, CAM_F, CAM_CX) + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <KraftBackground
        frame={frame}
        cy={cy}
        cyRest={HANDOFF_CY}
        cx={cx}
        cxRest={NEXT_CX}
        k={k}
        parallax={parallax}
      />

      <AbsoluteFill
        style={{ filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))` }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: WORLD_W,
            height: WORLD_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* the ground: one floor, and every company stands on it */}
            <line
              x1={GROUND_X0}
              y1={V4.GROUND_Y}
              x2={GROUND_X1}
              y2={V4.GROUND_Y}
              stroke={ink}
              strokeWidth={GROUND_W}
              strokeLinecap="round"
              opacity={GROUND_OP}
              style={{ filter: icon }}
            />

            {/* the thread, under the charts so it never crosses a line */}
            {threadOn ? (
              <line
                x1={THREAD_X0}
                y1={THREAD_Y0}
                x2={tEnd.x}
                y2={tEnd.y}
                stroke={accent}
                strokeWidth={THREAD_W}
                strokeLinecap="round"
                opacity={threadOp}
                style={{ filter: icon }}
              />
            ) : null}

            {/* the eight price lines. Seven are untouched all the way through —
                they are the market, and the market went UP. Only the cart's
                tip moves, and only because D1 has hold of it. */}
            {SECTOR_SET.map((_, i) => (
              <PriceLine
                key={`p${i}`}
                i={i}
                drop={i === SUBJ ? subjDrop : 0}
                held={i === SUBJ && held}
                k={k}
              />
            ))}
            {/* the release: the held tip's accent faded out over the white one */}
            {tipAccent > 0 && !held ? (
              <circle
                cx={subjTip.x}
                cy={subjTip.y}
                r={V4.TIP_R}
                fill={accent}
                opacity={tipAccent}
                style={{ filter: icon }}
              />
            ) : null}

            {/* the eight companies. They never move and never change colour:
                what is happening to them is happening to their price. */}
            {SECTOR_SET.map((sector, i) => (
              <CompanyCard key={i} x={cardX(i)} y={V4.CARD_Y} sector={sector} size={cardSize} k={k} />
            ))}

            {/* the money on its way DOWN the thread. Drawn under the mark, so
                the first leg out of the pile is hidden by D1's own tile. */}
            {coins.map((c) => (
              <circle key={c.key} cx={c.x} cy={c.y} r={c.r} fill={accent} />
            ))}

            {/* D1, the one holding on. It never moves. */}
            <D1Mark x={MARK_X} y={MARK_Y} size={markSize} k={k} dotColor={accent} />

            {/* what is left of the profit, piled on top of it. The top row
                empties right to left, so the pile visibly comes apart from the
                top rather than shrinking as a block. */}
            {Array.from({ length: Math.max(0, remaining) }, (_, n) => {
              const p = returnCoinPosV4(n);
              return <circle key={`r${n}`} cx={p.x} cy={p.y} r={coinRadius} fill={accent} />;
            })}
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default AfterGameStopV4;
