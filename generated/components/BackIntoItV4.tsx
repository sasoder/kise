import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  CAM_LIFT,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  camMove,
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
// Imported, never restated. V3's DEPTH_* are not used here — in V4 a card never
// leaves the ground and the short is the END OF ITS PRICE LINE being dragged
// down.
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
  N_CARDS,
  PriceLine,
  SECTOR_SET,
  SUBJECT,
  THREAD_IDLE,
  THREAD_LIVE,
  THREAD_W,
  V4,
  cardX,
  originX,
  priceTip,
  returnCoinPosV4,
} from "./d1Shared";

export const FPS = 24;
// Dan Sundheim, D1 Capital, on coming back to shorting after a year out:
// "When we got back into it I said, look, we're going to have to be more
//  diverse, we're going to have to be less aggressive."
//
// SRT span 0:15.480 -> 0:21.339 at 24fps.
// round((21.339 - 15.480) * 24) = round(5.859 * 24) = round(140.6) = 141
// frames of speech, plus a 16 frame tail so the resolved state holds = 157.
export const DURATION = 157;

// Word onsets, in frames from the composition's start (= 15.480):
//   f0 when · f3 we · f7 got · f10 back · f15 into · f22 it · f28 i · f33 said
//   · f38 look · f45 we're · f52 going · f53 to · f57 have · f60 to · f62 be
//   · f64 more · f84 diverse · f84 we're · f91 going · f95 to · f99 have
//   · f110 to · f113 be · f115 less · f120 aggressive · f141 end · tail to f157
//
// The inflections that actually bend the motion:
//   f10 back  — the thread touches the phone's price tip and starts pulling
//   f22 it    — the tip is at DROP_DEEP; the one ink click in the cut
//   f38 look  — nothing new starts: the strain and the coins already running
//   f64 more  — the pull is spreading outward across the row (started f58)
//   f84 diverse — all eight tips level at DROP_MEDIUM
//   f115 less / f120 aggressive — the eight tips easing back up to SHALLOW
//   f141 end  — speech ends; the held state runs to f157
//
// ---------------------------------------------------------------------------
// "Back into it", V4 — ONE ARC WITH THREE INFLECTIONS.
//
// V3 put the short under a line and the user said the short itself was only
// implied, and that the cuts were built as a checklist of the transcript. So
// this is not five gestures on five words. It is ONE motion — D1 reaching out,
// pulling, and then easing off — that runs f2 to f141 without ever stopping,
// and the words are places where that motion bends.
//
//   PHASE 1 · REACH AND DRAG (f0 -> f26)
//     f0 is the market at rest: the mark, the ground, eight companies, eight
//     untouched price lines, NO threads. From f2 one thread grows head-led out
//     of `originX(SUBJECT)` on the mark's bottom edge, touches the phone's tip
//     on "back" (f10) — the tip turns accent — and from that same frame drags
//     it down to `V4.DROP_DEEP` on "it" (f22). The chart's last leg falls to
//     the card: that is the short, and it reads with the sound off. ONE object
//     arrives, so it takes the cut's one full ink click (4 frames on the
//     thread). Four coins launch as the tip crosses each 36 px of NEW LOW
//     (f13.8, f15.8, f17.8, f20.1) and climb the thread; the pile on the mark
//     appears coin by coin from f24. The camera pushes k 1.15 -> 1.26 with its
//     centre following the midpoint of mark and tip, lands on f26, and then
//     creeps on — f28-42 — down onto the working half, so "I said, look" is
//     one continuous 7 px/frame drift rather than a parked wide. Ink packets
//     start drifting DOWN the thread at f30, one every ten frames, and never
//     stop for the rest of the cut.
//
//   PHASE 2 · THE PULL SPREADS (f22 -> f86, bending on "more diverse")
//     The phone's thread never goes slack: from f22 the tip strains +/- 4 px
//     against it, continuously, for the rest of the cut. From f58 the same pull
//     spreads — seven more threads grow out of the mark at one tip speed, so
//     the nearest company is caught first (f68.5) and the outermost last
//     (f75.8) and the wave is centre-outward without a stagger being authored
//     on top of it; each drags its tip to `V4.DROP_MEDIUM` on an 11-frame press
//     and pays out two coins on the way. AT THE SAME TIME, from f62, the
//     phone's tip eases UP DEEP -> MEDIUM (the pull is being shared out) and
//     launches nothing — a rise is not a new low. All eight are level at MEDIUM
//     by f86.8, on "diverse". The camera holds its breath f46-52 and is then
//     released k 1.30 -> 1.00, keyed f52-72 and landed f76, so the fan opens
//     into a frame that is already opening for it.
//
//   PHASE 3 · THE PULL RELAXES (f86 -> f141, bending on "less aggressive")
//     Money is still arriving until f103 — the fourteen coins from the spread
//     are strung out along seven threads — and the eight tips strain +/- 3 px
//     on hashed periods, so nothing is ever still. From f110 all eight ease UP
//     together MEDIUM -> `V4.DROP_SHALLOW` over 20 frames (0-4 frame hash), the
//     threads shortening with them and dimming 0.95 -> 0.40 across f118-140. No
//     coins: a rise is not a new low, and that is the whole point of the word.
//     The camera creeps with the row (cy -30, k 1.00 -> 1.03, warp 1) f108-130
//     and then holds on `sway`.
//
//   TAIL (f141 -> f157)
//     Eight companies, eight price lines each pulled a little way down, eight
//     idle threads, and a pile of COIN_TOTAL coins on the mark. The ink packet
//     every ~10 frames is still running, so the lines are never dead and the
//     direction is unmistakable: amber climbs (money), ink falls (the pull
//     being maintained).
//
// THE NUMBERS THAT DEVIATE FROM THE BRIEF AND ALL THREE ARE ARGUED WHERE THEY ARE
// FROM THE BRIEF ARE ALL ARGUED WHERE THEY ARE SET: the seven threads leave
// together at f58 (+/- 0.6 frames) rather than 3
// frames apart across f58-76 — see WAVE_F0 — and their press is 11 frames
// rather than 14 at a tip speed of 25 rather than the subject's 29.3, all three
// out of "all eight level at MEDIUM by f86" plus the 45 screen px/frame cap;
// and the ink packets start at f30 rather than in the tail — see AMBIENT_F0 —
// because the velocity scan found f45-53 dead.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: every thread, every tip that is held, every coin
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
    when: z.number(), // "when"
    we: z.number(), // "we"
    got: z.number(), // "got"
    back: z.number(), // "back" — the thread touches the phone's price tip
    into: z.number(), // "into"
    it: z.number(), // "it" — the tip is at DROP_DEEP, the ink click
    i: z.number(), // "I"
    said: z.number(), // "said"
    look: z.number(), // "look" — the strain and the money already running
    were1: z.number(), // "we're"
    going1: z.number(), // "going"
    to1: z.number(), // "to"
    have1: z.number(), // "have"
    to2: z.number(), // "to"
    be1: z.number(), // "be" — the spread is already four frames old
    more: z.number(), // "more"
    diverse: z.number(), // "diverse" — all eight tips level at DROP_MEDIUM
    were2: z.number(), // "we're"
    going2: z.number(), // "going"
    to3: z.number(), // "to"
    have2: z.number(), // "have"
    to4: z.number(), // "to"
    be2: z.number(), // "be"
    less: z.number(), // "less" — the eight are already easing up
    aggressive: z.number(), // "aggressive" — the threads start to dim
    end: z.number(), // speech ends; tail to 157
  }),
});

export type Props = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// THE WORLD. Every placement comes from d1Shared's V4 block: the mark at
// (540, 430), the ground at 960, eight companies at `cardX(i)` standing on it,
// a price line on each rising PRICE_H above the card, and the three drops.
// Nothing is placed by eye and nothing is restated here.
// ---------------------------------------------------------------------------
export const WORLD_W = 1080;
export const WORLD_H = 1400;
export const CENTRE_X = MARK_X;

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

// The landing shape, shared by every press and every rise: a few px past and
// easing back, never a spring, and never on a hold.
export const LAND_BACK = 0.75;
export const SETTLE_PX = 3;

// `overshoot(u)`: the settle, as a single lobe that goes past the target and
// comes back, normalised to peak at 1 so it can be scaled in world px along a
// travel's own direction.
//
// V3 took this straight off the back-out ease — `max(0, EASE_LAND(u) - 1)` —
// and the velocity scan caught what that costs. Easing.out(Easing.back(0.75))
// only climbs past 1 from u = 4/7, and it crosses with a SLOPE of 0.32, so the
// `max(0, ...)` is a corner: 3 px of settle divided by that corner is a
// 2.4 px/frame step in the tip's speed, arriving out of nowhere two thirds of
// the way through every press. On the subject's 150 px drag it is 14% of the
// peak speed; on the seven's 75 px press it is 30%, and it was the single
// biggest discontinuity in the cut.
//
// `64 w^3 (1-w)^3` over the same window is the same shape — nothing for the
// first 4/7, a few px past the target, back to exactly the target at u = 1 —
// but it is flat to SECOND order at both ends, so it adds neither a step in
// speed nor a step in acceleration. (`sin(pi w)^2` fixes the speed step but
// still lands its acceleration as a jump, which the scan sees as a 19% jerk;
// the cubic-cubic lobe takes that to under 10%.)
const SETTLE_U0 = 4 / 7; // where the back-out ease used to cross 1
const overshoot = (u: number) => {
  const w = clamp01((clamp01(u) - SETTLE_U0) / (1 - SETTLE_U0));
  return 64 * w ** 3 * (1 - w) ** 3;
};

// A travel curve with a flat middle. Eases in over the first `a` and out over
// the last `a` and runs at one speed in between, so the peak is 1/(1-a) times
// the average and both ends still have zero velocity — which is what keeps a
// mass reading as one body rather than as n thrown objects.
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

// One segment of a drop track: `delta` px of travel between f0 and f1, on
// `flow`, with the landing overshoot applied ALONG the travel. A segment that
// has not started contributes exactly 0, so the tracks simply add up — which is
// what makes "one authored track per moving thing, spanning the whole cut"
// something you can actually write down.
const seg = (f: number, f0: number, f1: number, delta: number) => {
  const u = clamp01((f - f0) / (f1 - f0));
  return delta * flow(u) + Math.sign(delta) * Math.min(SETTLE_PX, 0.1 * Math.abs(delta)) * overshoot(u);
};

// ---------------------------------------------------------------------------
// PHASE 1. THE REACH.
//
// THE THREAD'S TIP RUNS AT ONE SPEED and that speed is derived, not chosen:
// the subject's thread has 234 px to cover between the mark's bottom edge and
// the phone's price tip, it leaves at f2 and it has to be THERE on "back" at
// f10 — 29.3 world px a frame, which at the k of that moment is 34 screen px,
// comfortably under the 45 the house allows. The same speed then drives the
// seven in phase 2, and because a nearer company is a shorter thread the
// centre-outward wave comes out of the geometry rather than being authored as
// a stagger on top of it.
// ---------------------------------------------------------------------------
export const THREAD_F0 = 2; // the first thread leaves; f0 and f1 have no thread
export const SUBJ_TOUCH = 10; // "back"
export const SUBJ_LEN = Math.hypot(
  priceTip(SUBJECT, 0).x - originX(SUBJECT),
  priceTip(SUBJECT, 0).y - MARK_BOTTOM,
); // 234.27
export const THREAD_SPEED = SUBJ_LEN / (SUBJ_TOUCH - THREAD_F0); // 29.28 world px/frame
export const DRAW_A = 0.1; // the head's own ease: peak 1.111x its average
export const HEAD_R = 3;

export const PRESS1_F0 = SUBJ_TOUCH; // it pulls from the frame it touches
export const PRESS1_F1 = 22; // "it" — the tip is at DROP_DEEP

export const CLICK_F = PRESS1_F1;
export const CLICK_DUR = 4; // the cut's ONE single-object ink click

// ---------------------------------------------------------------------------
// PHASE 2. THE SPREAD.
//
// WAVE_F0 IS ONE START, NOT SEVEN 3 FRAMES APART. The brief asks for starts at
// f58, 61, 64 ... 76 AND for all eight tips level at DROP_MEDIUM by f86, and
// those two cannot both be true. The seven threads are 248 to 434 px long, so
// at the one tip speed above their travels already span 8.5 to 14.8 frames —
// a 6.3 frame centre-outward wave for free. A 13 frame press on top of that
// puts the first landing at f79.5 and the last at f85.8, which is exactly the
// f86 the brief asks for and two frames ahead of "diverse". Adding the brief's
// 18 frame start ramp as well would push the outermost landing to f104, nine
// frames past "diverse" and most of the way through "we're going to have to
// be", and the word the row is supposed to be illustrating would land on a row
// that is still only half pulled. The ordering the brief cares about — nearest
// first, outer last — survives untouched, because it IS the geometry; only the
// spacing is the geometry's rather than the brief's. A +/- 0.6 frame hash
// keeps seven starts from being literally one start.
//
// SPREAD_SPEED IS 25, NOT THE SUBJECT'S 29.3, AND IT IS THE SPEED CAP THAT SETS
// IT. The camera's pull-back is running underneath this whole wave — it has to
// be, the fan needs a frame that is already opening — and a thread head is the
// one thing in the cut moving in the SAME direction the camera is opening, so
// the two add. Measured at the subject's speed: head2 hits 49.2 screen px a
// frame at f60, over the house's 45. 25 world px a frame takes the worst head
// to 43 and the fan reads calmer for it, which is right — the first grab is a
// decision made and this is a book being spread out.
//
// PRESS_DUR IS 11, NOT THE BRIEF'S 14, and it is the same f86 arithmetic: at 25
// px a frame the travels run 9.9 to 17.4 frames, so a 14 frame press would put
// the outermost landing at f89.8. At 11 it lands f86.8, and 75 px in 11 frames
// peaks at 9.5 world px a frame — a third of the first grab's speed, which is
// what "less aggressive" is going to need to still have somewhere to go.
// ---------------------------------------------------------------------------
export const WAVE_F0 = 58;
export const WAVE_JITTER = 0.6;
export const SPREAD_SPEED = 25;
export const PRESS_DUR = 11;
export const RISE_F0 = 62; // the phone's tip eases up as the pull is shared
export const RISE_F1 = 84; // "diverse"

// ---------------------------------------------------------------------------
// PHASE 3. THE RELAX. One group ease, no click, no coins — a rise is not a new
// low, which is the entire content of "less aggressive".
// ---------------------------------------------------------------------------
export const EASE_F0 = 110;
export const EASE_HASH = 4;
export const EASE_DUR = 20;
export const DIM_F0 = 118;
export const DIM_F1 = 140;

// The strain. A tip that is being held never sits still: it pulls back against
// the thread. The subject is held hardest so it strains hardest (+/- 4), and it
// tapers to the row's +/- 3 across f90-110 as the whole book is eased off.
export const STRAIN_SUBJ = 4;
export const STRAIN_ROW = 3;
export const STRAIN_IN = 8; // frames to ramp in once that tip has landed
export const STRAIN_TAPER0 = 90;
export const STRAIN_TAPER1 = 110;

// ---------------------------------------------------------------------------
// THE MONEY. COIN_SPEED is the set's constant: cut 2 (`IsItEvenWorthItV4`)
// owns it in the brief, but cut 2 did not exist when this file reached its
// coins, so it is defined and exported here at the briefed ~26 world px/frame.
// Cut 2 has since landed on 26 as well — the two are pinned together by that
// number and neither may move it alone. It is NOT imported across the two
// cuts: a render of this file should not depend on a sibling that is still
// being iterated, and one number is not worth that coupling.
// ---------------------------------------------------------------------------
export const COIN_SPEED = 26; // world px per frame, constant, every coin
export const COIN_STEP = 1 / V4.COIN_PER_PX; // 36 px of NEW low buys one coin
export const COIN_GROW = 5; // frames a coin scales in as it joins the pile
const EASE_LAND = Easing.out(Easing.back(LAND_BACK));

// ---------------------------------------------------------------------------
// THE THREAD TRAFFIC. Ink, faint, and DOWNWARD — the opposite direction to the
// money, so a packet and a coin can never be confused: amber climbs (the
// return), ink falls (the pull being kept on).
//
// AMBIENT_F0 IS 30, NOT THE BRIEF'S TAIL. The brief only asks for this in the
// tail, but the velocity scan found the real hole in the cut at f45-53: the
// subject's four coins have all landed by f34.5, the spread does not start
// until f58, and between them "I said, look, we're going to have to be" runs
// over a picture whose only motion is a +/- 4 px strain at 0.6 px a frame. The
// fix is the two things already in the cut rather than a new gesture: this same
// packet system, started at f30, and the camera creep below. Before f58 only
// the subject's thread exists, so every packet up to then rides it — which is
// exactly the run of packets down the deep thread that carried "look" in V3.
// ---------------------------------------------------------------------------
export const AMBIENT_F0 = 30;
export const AMBIENT_GAP = 10;
export const AMBIENT_TRAVEL = 22;
export const AMBIENT_OP = 0.38;
export const PACKET_R = 3;
// a fixed order rather than a hash, so two packets never leave on the same
// thread back to back
export const AMBIENT_ORDER = [3, 0, 5, 2, 7, 4, 1, 6];

// ---------------------------------------------------------------------------
// THE THREADS. Origin on the mark's bottom edge, target the price tip where it
// stands untouched, duration = length / speed.
// ---------------------------------------------------------------------------
export type ThreadPlan = {
  i: number;
  x0: number;
  y0: number;
  tx: number;
  ty: number;
  len: number;
  start: number;
  touch: number;
  land: number; // when that tip reaches the drop this thread pulls it to
};

export const THREADS: ThreadPlan[] = Array.from({ length: N_CARDS }, (_, i) => {
  const x0 = originX(i);
  const y0 = MARK_BOTTOM;
  const tip = priceTip(i, 0);
  const len = Math.hypot(tip.x - x0, tip.y - y0);
  const dur = len / (i === SUBJECT ? THREAD_SPEED : SPREAD_SPEED);
  if (i === SUBJECT) {
    return { i, x0, y0, tx: tip.x, ty: tip.y, len, start: THREAD_F0, touch: SUBJ_TOUCH, land: PRESS1_F1 };
  }
  const start = WAVE_F0 + WAVE_JITTER * (hash(i, 17) * 2 - 1);
  const touch = start + dur;
  return { i, x0, y0, tx: tip.x, ty: tip.y, len, start, touch, land: touch + PRESS_DUR };
});

export const easeStart = (i: number) => EASE_F0 + EASE_HASH * hash(i, 23);

// Which thread the nth packet rides. A packet can only ride a thread that is
// already attached, so everything before the spread rides the subject's.
export const ambientThread = (n: number) => {
  const i = AMBIENT_ORDER[n % AMBIENT_ORDER.length];
  return AMBIENT_F0 + n * AMBIENT_GAP >= THREADS[i].touch ? i : SUBJECT;
};

// A tip's AUTHORED drop at a frame — its press, its rise if it is the subject,
// and the group's ease at the end, added together. The strain is deliberately
// NOT in here: new lows are read off this track, so a tip wobbling back down to
// a depth it has already been to pays out nothing.
export const dropTrack = (i: number, f: number) => {
  const t = THREADS[i];
  let d = 0;
  if (i === SUBJECT) {
    d += seg(f, PRESS1_F0, PRESS1_F1, V4.DROP_DEEP);
    d += seg(f, RISE_F0, RISE_F1, V4.DROP_MEDIUM - V4.DROP_DEEP);
  } else {
    d += seg(f, t.touch, t.land, V4.DROP_MEDIUM);
  }
  d += seg(f, easeStart(i), easeStart(i) + EASE_DUR, V4.DROP_SHALLOW - V4.DROP_MEDIUM);
  return d;
};

export const strainPeriod = (i: number) => 34 + 12 * hash(i, 11);
export const strainAt = (i: number, f: number) => {
  const t = THREADS[i];
  const landed = i === SUBJECT ? PRESS1_F1 : t.land;
  const base =
    i === SUBJECT
      ? interpolate(f, [STRAIN_TAPER0, STRAIN_TAPER1], [STRAIN_SUBJ, STRAIN_ROW], clamp)
      : STRAIN_ROW;
  const amp = base * smoothstep((f - landed) / STRAIN_IN);
  const p = strainPeriod(i);
  return amp * Math.sin((2 * Math.PI * (f - hash(i, 5) * p)) / p);
};

export const dropAt = (i: number, f: number) => dropTrack(i, f) + strainAt(i, f);
export const tipAt = (i: number, f: number) => priceTip(i, dropAt(i, f));

// Where a thread's far end is: its own head while it is drawing, its tip —
// strain and all — from the frame it touches.
export const threadEnd = (i: number, f: number) => {
  const t = THREADS[i];
  if (f >= t.touch) return { ...tipAt(i, f), drawing: false };
  const u = clamp01((f - t.start) / (t.touch - t.start));
  const g = flow(u, DRAW_A);
  return { x: t.x0 + (t.tx - t.x0) * g, y: t.y0 + (t.ty - t.y0) * g, drawing: true };
};

// ---------------------------------------------------------------------------
// THE LAUNCHES. Not keyed: every card's authored drop track is scanned at
// quarter-frame resolution and a coin is issued at the exact frame the tip
// crosses each COIN_STEP of NEW low. The subject's press pays four (it goes to
// DROP_DEEP = 150 and 150 / 36 = 4.17); each of the seven pays two (75 / 36 =
// 2.08); the rises pay nothing. Each coin flies the straight line from the tip
// where it was born to the thread's origin on the mark, at one constant speed,
// so arrivals fall out of the geometry as well.
// ---------------------------------------------------------------------------
export type Launch = { i: number; f0: number; x: number; y: number; dist: number; f1: number };
export const LAUNCHES: Launch[] = (() => {
  const out: Launch[] = [];
  for (let i = 0; i < N_CARDS; i++) {
    let next = COIN_STEP;
    let prevF = 0;
    let prevD = dropTrack(i, 0);
    for (let f = 0.25; f <= DURATION; f += 0.25) {
      const d = dropTrack(i, f);
      while (d >= next && prevD < next) {
        const u = (next - prevD) / (d - prevD);
        const f0 = prevF + u * 0.25;
        const tip = priceTip(i, next);
        const dist = Math.hypot(originX(i) - tip.x, MARK_BOTTOM - tip.y);
        out.push({ i, f0, x: tip.x, y: tip.y, dist, f1: f0 + dist / COIN_SPEED });
        next += COIN_STEP;
      }
      prevF = f;
      prevD = d;
    }
  }
  out.sort((a, b) => a.f1 - b.f1);
  return out;
})();
export const COIN_TOTAL = LAUNCHES.length; // exported: the pile cut 2 opens on

// ---------------------------------------------------------------------------
// THE CAMERA. Four moves and one held breath, all through one damped
// `runCamera`. `cy = c + CAM_LIFT / k` off the same eased k, so the content
// centre sits on screen y 835 — above the burnt-in captions — at every zoom.
//
//   PUSH     f4-22   riding the drag; lands f26, four frames past "it"
//   CREEP_IN f28-42  the long even creep before the payoff, warp 1; lands f46
//   (held breath f46-52: the camera is the only still thing, and the strain,
//    the packets and the kraft's own drift are still running under it)
//   PULL     f52-72  released six frames before the spread; lands f76
//   CREEP    f108-130 riding the row back up; lands f130
//
// EVERY f0 IS FOUR FRAMES AHEAD OF ITS AUTHORED LANDING, because the damper
// (CAM_STIFF 0.09 / CAM_DAMP 0.468) costs about four frames on a move this
// size — measured, not guessed: the first pass authored PUSH f6-26 and PULL
// f54-80 and they settled at f30 and f84, four frames past their words.
//
// K_PUSH IS 1.30 AND THAT IS THE ROW'S OWN LIMIT: the eight charts span x
// 140..940 and a camera at k sees 540 +/- 540/k, so anything tighter than 1.34
// starts slicing the end companies. 1.30 leaves 15 world px of margin with the
// sway at its worst, and the cut only sits there for the six frames of the
// held breath: the push itself stops at K_HOLD 1.26.
//
// CONTENT_HOLD IS THE CREEP'S WHOLE POINT. A 1.26 -> 1.30 zoom on its own is
// 0.25% a frame, which the house calls a stall. What carries the creep is the
// CENTRE: it walks from the midpoint of mark and tip down to the midpoint of
// the mark's bottom edge and the ground, so the frame settles on the working
// half — the thread, the fallen chart, the card — over the sixteen frames of
// "I said, look". That is 7.5 screen px a frame of even, motivated drift, and
// it is what the back of "look" is actually made of.
// ---------------------------------------------------------------------------
export const K_OPEN = 1.15;
export const K_HOLD = 1.26;
export const K_PUSH = 1.3;
export const K_WIDE = 1.0;
export const K_FINAL = 1.03;

// The content centre is always the midpoint of the two things the frame is
// about at that moment, so the framing follows the book down and back up.
export const TIP_DEEP_Y = V4.CARD_TOP - (V4.PRICE_H - V4.DROP_DEEP); // 868
export const PILE_TOP_Y = returnCoinPosV4(Math.max(0, COIN_TOTAL - 1)).y - COIN_R;
export const CONTENT_OPEN = (MARK_TOP + V4.GROUND_Y) / 2; // 668
export const CONTENT_DEEP = (MARK_TOP + TIP_DEEP_Y) / 2; // 622
export const CONTENT_HOLD = (MARK_BOTTOM + V4.GROUND_Y) / 2; // 722
export const CONTENT_WIDE = (PILE_TOP_Y + V4.GROUND_Y) / 2;
export const CONTENT_FINAL = CONTENT_WIDE - 30;

export const PUSH = camMove({
  f0: 4,
  f1: 22,
  k0: K_OPEN,
  k1: K_HOLD,
  c0: CONTENT_OPEN,
  c1: CONTENT_DEEP,
  warp: 1,
});
export const CREEP_IN = camMove({
  f0: 28,
  f1: 42,
  k0: K_HOLD,
  k1: K_PUSH,
  c0: CONTENT_DEEP,
  c1: CONTENT_HOLD,
  warp: 1,
});
export const PULL = camMove({
  f0: 52,
  f1: 72,
  k0: K_PUSH,
  k1: K_WIDE,
  c0: CONTENT_HOLD,
  c1: CONTENT_WIDE,
  warp: 0.72,
});
export const CREEP = camMove({
  f0: 108,
  f1: 130,
  k0: K_WIDE,
  k1: K_FINAL,
  c0: CONTENT_WIDE,
  c1: CONTENT_FINAL,
  warp: 1,
});
export const CY_FINAL = CONTENT_FINAL + CAM_LIFT / K_FINAL;
export const CAM_F = [0, ...PUSH.F, ...CREEP_IN.F, ...PULL.F, ...CREEP.F, DURATION];
export const CAM_K = [K_OPEN, ...PUSH.K, ...CREEP_IN.K, ...PULL.K, ...CREEP.K, K_FINAL];
export const CAM_CY = [PUSH.CY[0], ...PUSH.CY, ...CREEP_IN.CY, ...PULL.CY, ...CREEP.CY, CY_FINAL];

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
    when: 0,
    we: 3,
    got: 7,
    back: 10,
    into: 15,
    it: 22,
    i: 28,
    said: 33,
    look: 38,
    were1: 45,
    going1: 52,
    to1: 53,
    have1: 57,
    to2: 60,
    be1: 62,
    more: 64,
    diverse: 84,
    were2: 84,
    going2: 91,
    to3: 95,
    have2: 99,
    to4: 110,
    be2: 113,
    less: 115,
    aggressive: 120,
    end: 141,
  },
});

const BackIntoItV4: React.FC<Props> = ({
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

  // -- the threads -----------------------------------------------------------
  // One per company, all of them out of the mark's bottom edge, all of them
  // ending on a price tip. The settle at the end is carried by OPACITY alone:
  // an accent LINE is always the ripe tone in this house and carries its state
  // in its opacity, because the deep tone at 0.40 over kraft falls under 1.8:1.
  const dim = interpolate(frame, [DIM_F0, DIM_F1], [THREAD_LIVE, THREAD_IDLE], clamp);
  const clicked = frame >= CLICK_F && frame < CLICK_F + CLICK_DUR;
  const threads = THREADS.map((t) => {
    const end = threadEnd(t.i, frame);
    const isClick = t.i === SUBJECT && clicked;
    return {
      key: t.i,
      on: frame >= t.start,
      held: frame >= t.touch,
      x0: t.x0,
      y0: t.y0,
      x2: end.x,
      y2: end.y,
      head: end.drawing,
      stroke: isClick ? ink : accent,
      op: isClick ? 1 : dim,
    };
  });

  // -- the money in flight, and the pile it builds ---------------------------
  const coins: { key: number; x: number; y: number; r: number }[] = [];
  for (let n = 0; n < LAUNCHES.length; n++) {
    const L = LAUNCHES[n];
    if (frame < L.f0 || frame >= L.f1) continue;
    const u = (frame - L.f0) / (L.f1 - L.f0);
    coins.push({
      key: n,
      x: lerp(L.x, originX(L.i), u),
      y: lerp(L.y, MARK_BOTTOM, u),
      r: coinRadius * breath(frame, hash(n, 9)),
    });
  }
  let arrived = 0;
  for (let n = 0; n < LAUNCHES.length; n++) if (frame >= LAUNCHES[n].f1) arrived = n + 1;
  const arriving = arrived > 0 ? clamp01((frame - LAUNCHES[arrived - 1].f1) / COIN_GROW) : 1;

  // -- the tail traffic ------------------------------------------------------
  // Ink, faint, downward: D1 keeping the pull on, after the money has stopped.
  type Pk = { key: string; x: number; y: number };
  const packets: Pk[] = [];
  for (let n = 0; ; n++) {
    const s = AMBIENT_F0 + n * AMBIENT_GAP;
    if (s > frame) break;
    const u = (frame - s) / AMBIENT_TRAVEL;
    if (u <= 0 || u >= 1) continue;
    const i = ambientThread(n);
    const t = THREADS[i];
    const end = threadEnd(i, frame);
    packets.push({ key: `a${n}`, x: lerp(t.x0, end.x, u), y: lerp(t.y0, end.y, u) });
  }

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = CENTRE_X + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <KraftBackground
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
        cx={cx}
        cxRest={CENTRE_X}
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

            {/* the threads, under the charts so a head never crosses a line */}
            <g style={{ filter: icon }}>
              {threads.map((t) =>
                t.on ? (
                  <line
                    key={t.key}
                    x1={t.x0}
                    y1={t.y0}
                    x2={t.x2}
                    y2={t.y2}
                    stroke={t.stroke}
                    strokeWidth={THREAD_W}
                    strokeLinecap="round"
                    opacity={t.op}
                  />
                ) : null,
              )}
              {threads.map((t) =>
                t.on && t.head ? (
                  <circle key={`h${t.key}`} cx={t.x2} cy={t.y2} r={HEAD_R} fill={ink} opacity={t.op} />
                ) : null,
              )}
            </g>

            {/* the tail traffic, on the same lines */}
            {packets.map((p) => (
              <circle key={p.key} cx={p.x} cy={p.y} r={PACKET_R} fill={ink} opacity={AMBIENT_OP} />
            ))}

            {/* the eight price lines. Only the tip moves, and a tip that has
                been dragged down turns the chart's last leg into a fall. */}
            {SECTOR_SET.map((_, i) => (
              <PriceLine key={`p${i}`} i={i} drop={dropAt(i, frame)} held={threads[i].held} k={k} />
            ))}

            {/* the eight companies. They never move and never change colour:
                what is happening to them is happening to their price. */}
            {SECTOR_SET.map((sector, i) => (
              <CompanyCard key={i} x={cardX(i)} y={V4.CARD_Y} sector={sector} size={cardSize} k={k} />
            ))}

            {/* the money on its way up the thread */}
            {coins.map((c) => (
              <circle key={c.key} cx={c.x} cy={c.y} r={c.r} fill={accent} />
            ))}

            {/* D1, the one pulling. It never moves. */}
            <D1Mark x={MARK_X} y={MARK_Y} size={markSize} k={k} dotColor={accent} />

            {/* the return, piled on top of it. No per-icon shadow: a coin is a
                dot, and dots take the global shadow only. */}
            {Array.from({ length: arrived }, (_, n) => {
              const p = returnCoinPosV4(n);
              const s = n === arrived - 1 ? EASE_LAND(clamp01(arriving)) : 1;
              return <circle key={`r${n}`} cx={p.x} cy={p.y} r={coinRadius * s} fill={accent} />;
            })}
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default BackIntoItV4;
