import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  BG_BASE,
  BG_DIM,
  FRAME_H,
  FRAME_W,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_READ,
  OP_UNREAD,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camMove,
  clamp,
  feather,
  hash,
  iconShadow,
  runCamera,
  sway,
  wobble,
  worldTransform,
} from "./fieldShared";

export const FPS = 24;
// Dylan Patel, clip `Dylan_Debt_Crisis`, cut 2 (cut 1 is `TenTimesTheCost`):
// "that raises the rate of interest higher. Now, if the rate of interest goes
// higher, and if it does that for the entire economy, then that's just making
// it basically more expensive for everybody else to borrow".
//
// SRT span 0:21.079 -> 0:29.120 at 24fps.
// round((29.120 - 21.079) * 24) = round(8.041 * 24) = round(192.98) = 193
// frames of speech, plus a 16 frame tail so the resolved state holds = 209.
export const DURATION = 209;

// ---------------------------------------------------------------------------
// "The level". The rate of interest is a HEIGHT: one horizontal ink line
// running edge to edge above a crowd of people. Borrowing is a thread from a
// person up to that line — the message-board mechanism, accent, head-led, with
// a small white tip. When the rate goes higher the line steps up and leaves a
// DASHED rung at the height it was (dashed = a position in a sequence). "The
// entire economy" is the crowd seen whole: a shallow BAND of `person.png`
// glyphs, five rows deep, bleeding off the left and the right of the frame at
// every camera position and dissolving at both its top and its bottom edge so
// that no straight line of heads survives. "More expensive for everybody else
// to borrow" is every person in the frame threading up to the high line, past
// the old rungs, on one accelerating curve.
//
// pass 2: crowd 24 rows -> 5-row band, glyphs over threads, hold 0.45, c1 60
// (director review 2026-09-08: the 573-thread curtain buried the crowd). The
// band is five rows at world y +40 +112 +184 +256 +328, so the threads read as
// a picket standing ABOVE the crowd rather than a wall drawn across it, and
// every glyph draws over every thread — a back-row person's thread passes
// behind the people in front of it.
//
// No data center in this cut, no dots, no text. One stroke weight (3) for
// every line: the level solid at OP_READ, the rungs dashed 9/7 at OP_UNREAD,
// the threads accent 0.95 live and 0.45 held.
//
// Every gesture is one word. Nothing else happens.
//   open ALIVE: the crowd at k 1.4 with the level
//     above it and idle borrowing already running —
//     one thread from a random visible seat every 6
//     frames, each drawing 8, holding 24, fading 10,
//     the first one already mid-draw at f0          — "that raises the"    f0
//   the level STEPS UP -140 -> -240 on one ease-out
//     ramp; the rung it leaves fades in at -140 over
//     4 frames; every live thread stretches with it
//     (its top endpoint is the level, every frame)   — "rate of interest
//                                                      higher"            f12-22
//   the level steps again, -240 -> -340, the same
//     way; rung 2 fades in at -240; the live threads
//     stretch again                                  — "interest goes
//                                                      higher"            f42-51
//   the one camera move: pull back k 1.4 -> 0.7,
//     content centre 0 -> 60, keyed f70-92, warp
//     0.72, settled (|dk| < 0.5%/frame) at f98. The
//     crowd is seen whole. Nothing new appears while
//     it runs; the idle tempo holds at 1 per 6 and
//     reads sparser because the frame is wider       — "and if it does that
//                                                      for the entire
//                                                      economy"           f70-92
//   THE BORROW: from f136 the launch rate rides ONE
//     ease-in curve from one thread per 6 frames to
//     whatever it takes for every seat in the k 0.7
//     frame (plus one column of bleed each side) to
//     have a live thread by f174. Hashed order, not
//     a wipe. Same 8-frame head-led draw; these do
//     not fade — they settle 0.95 -> 0.45 over 6
//     frames and hold                                — "basically more
//                                                      expensive for
//                                                      everybody else to
//                                                      borrow"            f136-174
//   hold: every person threaded to the high line
//     past two dashed rungs, only sway and the tips
//     of the last arrivals                           — tail               f174-209
//
// orange dwarkesh style: ACCENT threads, BG_DIM 0.45, global drop-shadow
// 2/7/0.12, per-icon drop-shadow 2/3/0.38 on every person glyph and on the
// level and the rungs, one eased camera move with cy taken off the eased k.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
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
  personSize: z.number(), // world px, the glyph's box
  beats: z.object({
    thatRaises: z.number(), // "that raises the"
    rateOf1: z.number(), // "rate of"
    interestHigher: z.number(), // "interest higher"
    higher1: z.number(), // "higher" itself
    nowIfThe: z.number(), // "now if the"
    rateOf2: z.number(), // "rate of"
    interestGoes: z.number(), // "interest goes"
    higher2: z.number(), // "higher"
    andIfIt: z.number(), // "and if it"
    doesThat: z.number(), // "does that"
    forTheEntire: z.number(), // "for the entire"
    economyThen: z.number(), // "economy then"
    thatsJust: z.number(), // "that's just"
    makingIt: z.number(), // "making it"
    basicallyMore: z.number(), // "basically more"
    expensiveFor: z.number(), // "expensive for"
    everybody: z.number(), // "everybody"
    elseToBorrow: z.number(), // "else to borrow"
    end: z.number(), // speech ends; tail to 209
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: ACCENT,
  backgroundBase: BG_BASE,
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: BG_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  personSize: 56,
  beats: {
    thatRaises: 0,
    rateOf1: 11,
    interestHigher: 15,
    higher1: 22,
    nowIfThe: 28,
    rateOf2: 36,
    interestGoes: 42,
    higher2: 51,
    andIfIt: 58,
    doesThat: 73,
    forTheEntire: 86,
    economyThen: 98,
    thatsJust: 115,
    makingIt: 124,
    basicallyMore: 136,
    expensiveFor: 158,
    everybody: 169,
    elseToBorrow: 174,
    end: 193,
  },
});

const WORLD_W = 1080;
const WORLD_H = 2200;
const CX = 540;

// ---------------------------------------------------------------------------
// The camera. ONE move: the pull-back off "and if it does that for the entire
// economy", keyed f70-92 with warp 0.72 so the speed is early in the move. cy
// comes from the eased k at every frame, so the content centre sits at screen
// y 835 at every camera position and not only at the ends of the ramp.
//
//   f0-70   k 1.4, content centre 0    close on the band: the level at screen
//                                      639, the band's rows at 891 and 1294
//                                      (its ink 834..1351), the band off the
//                                      left and the right
//   f70-92  -> k 0.7, centre 60        the crowd seen whole. The level (by
//                                      then at -340) sits at screen 555, the
//                                      -240 rung at 625, the -140 rung at 695,
//                                      the band's rows at 821 and 1023 (ink
//                                      793..1051). Composition centre — the
//                                      midpoint of the level and the bottom of
//                                      the band — is screen ~803.
//
// (pass 2: c1 was 110, which put the level at 520 and the band at 786..988;
// dropping it to 60 lets everything down 35px onto the caption-safe centre.)
//
// Traced through `runCamera` frame by frame: the zoom's |dk| falls under
// 0.5%/frame at f98 — "economy" — and under 0.1%/frame at f102, and the pan
// under 0.5px/frame at f101, so the frame has stopped before the borrow starts
// at f136. Peak speed is 3.92%/frame at f85. Nothing else moves the camera;
// `sway` runs throughout.
//
// The lowest the level or either rung ever sits on screen, sway included, is
// y 699 — clear of the 700 floor at every camera position.
// ---------------------------------------------------------------------------
const K_OPEN = 1.4;
const K_FINAL = 0.7;
const C1 = 60;
const CAM = camMove({ f0: 70, f1: 92, k0: K_OPEN, k1: K_FINAL, c0: 0, c1: C1, warp: 0.72 });
const CAM_F = [0, ...CAM.F, DURATION];
const CAM_K = [K_OPEN, ...CAM.K, K_FINAL];
const CAM_CY = [125 / K_OPEN, ...CAM.CY, C1 + 125 / K_FINAL];

// The whole track, precomputed once, so a launch can ask what was on screen at
// the frame it fired without re-running the damper inside the render loop.
const TRACK = Array.from({ length: DURATION + 1 }, (_, f) => runCamera(f, CAM_F, CAM_CY, CAM_K));
const viewAt = (f: number) => {
  const t = TRACK[Math.max(0, Math.min(DURATION, Math.round(f)))];
  const hw = FRAME_W / 2 / t.k;
  const hh = FRAME_H / 2 / t.k;
  return { x0: CX - hw, x1: CX + hw, y0: t.cy - hh, y1: t.cy + hh };
};

// ---------------------------------------------------------------------------
// The level, and the rungs it leaves behind. An ink line from world x -2500 to
// +2500 relative to the centre, so it never ends on screen. It starts at -140
// and steps twice; each step leaves a dashed rung at the height it was.
// ---------------------------------------------------------------------------
const LEVELS = [-140, -240, -340];
const STEP1 = { f0: 12, f1: 22 }; // "rate of interest higher"
const STEP2 = { f0: 42, f1: 51 }; // "interest goes higher"
const RUNGS = [
  { y: LEVELS[0], t0: STEP1.f0 },
  { y: LEVELS[1], t0: STEP2.f0 },
];
const RUNG_FADE = 4;
const LINE_X0 = CX - 2500;
const LINE_X1 = CX + 2500;
const DASH = "9 7";
const STROKE = 3;

// ---------------------------------------------------------------------------
// The crowd. `person.png` white, 56 world px tall, on a grid step 64 x 72,
// every seat jittered off its cell by up to 0.35 of the step and sized
// 0.9-1.1 by its own hash, so it is a crowd and not a lattice — a smaller
// jitter than a dot field gets, because a person glyph is 47 world px of ink
// and two of them must not sit on top of each other.
//
// It is a BAND, not a field: exactly five rows, world y +40 +112 +184 +256
// +328, columns running world x -1500..+1500 from the centre. It bleeds off
// the left and the right at every camera position and nowhere else, so BOTH
// the top and the bottom are visible edges and both are dissolved the same
// way: the edge undulates along x by `wobble` (±0.32 of a row, so the fringe
// never eats into the three solid rows) and the outermost row is a feather row
// — a seat there only exists if its hash falls under `feather`, which puts it
// at ~0.5 density, and what survives is drawn down to 0.85 scale. 235 cells
// are laid out and 189 seats survive: 26 / 46 / 47 / 47 / 23 by row.
//
// Five rows is the whole point of pass 2. At 24 rows deep the borrow put 573
// threads over the crowd and the people vanished behind an orange curtain; at
// five the threads stand clear ABOVE the heads and you can still count the
// people in a column.
// ---------------------------------------------------------------------------
const STEP_X = 64;
const STEP_Y = 72;
const CROWD_HALF_W = 1500;
const CROWD_TOP = 40;
const CROWD_ROWS = 5;
const CROWD_BOT = CROWD_TOP + (CROWD_ROWS - 1) * STEP_Y; // +328
const EDGE_FEATHER = 1; // rows: the top row and the bottom row
const EDGE_WOBBLE = 0.32; // rows of undulation on each visible edge
const EDGE_R_MIN = 0.85; // a surviving seat's scale on a feather row
const EDGE_SEED_T = 1.7;
const EDGE_SEED_B = 4.3;
const JITTER = 0.35;
const COLS = Math.floor((2 * CROWD_HALF_W) / STEP_X) + 1;
const GRID_X0 = CX - ((COLS - 1) * STEP_X) / 2;
// the two nominal edges at world x, half a row outside the outermost seats
const topEdgeAt = (x: number) =>
  CROWD_TOP - STEP_Y / 2 + wobble(x, EDGE_SEED_T) * EDGE_WOBBLE * STEP_Y;
const botEdgeAt = (x: number) =>
  CROWD_BOT + STEP_Y / 2 + wobble(x, EDGE_SEED_B) * EDGE_WOBBLE * STEP_Y;

type Seat = { i: number; x: number; y: number; s: number };
const SEATS: Seat[] = (() => {
  const out: Seat[] = [];
  for (let gr = 0; gr < CROWD_ROWS; gr++) {
    for (let gc = 0; gc < COLS; gc++) {
      const i = gr * COLS + gc;
      const x = GRID_X0 + gc * STEP_X + (hash(i, 11) - 0.5) * STEP_X * JITTER;
      const y = CROWD_TOP + gr * STEP_Y + (hash(i, 12) - 0.5) * STEP_Y * JITTER;
      // how far inside the band this seat is, in rows, from whichever edge is
      // nearer — 0.5 on the outermost row, 1 (solid) on the three inside it
      const fe = Math.min(
        feather((y - topEdgeAt(x)) / STEP_Y, EDGE_FEATHER),
        feather((botEdgeAt(x) - y) / STEP_Y, EDGE_FEATHER),
      );
      if (hash(i, 71) >= fe) continue;
      out.push({
        i,
        x,
        y,
        s: (0.9 + 0.2 * hash(i, 13)) * (EDGE_R_MIN + (1 - EDGE_R_MIN) * fe),
      });
    }
  }
  return out;
})();
const NSEAT = SEATS.length;

// ---------------------------------------------------------------------------
// Threads. From the top of a person's head (seat y - 28, half the glyph) to
// the CURRENT level, so a thread that is alive while the level steps stretches
// with it. Head-led over 8 frames with a small white tip, as `MessageBoardV2`.
//
// Idle borrowing: one thread from a random visible seat every 6 frames, drawn
// 8, held 24, faded 10 — 42 frames of life, so a handful are alive at once.
// The schedule starts well before f0 so the piece opens mid-draw.
// ---------------------------------------------------------------------------
const HEAD_UP = 28; // half the glyph: the top of the head
const TH_DRAW = 8;
const TH_HOLD = 24;
const TH_FADE = 10;
const TH_LIFE = TH_DRAW + TH_HOLD + TH_FADE;
const OP_LIVE = 0.95;
const OP_HELD = 0.45; // pass 2: was 0.6 — a picket, not a curtain
const SETTLE = 6; // a borrow thread's 0.95 -> 0.45 after it arrives
const IDLE_PERIOD = 6;
const IDLE_T0 = -40; // ... -4, 2, 8 ...: one is mid-draw at f0
const F_BORROW = 136; // "basically more"
const F_ARRIVED = 174; // "else to borrow": every thread is up by here

// ---------------------------------------------------------------------------
// The borrow. Every seat in the resolved k 0.7 frame, plus one column of bleed
// each side, gets a thread, and they are all up by f174. There is no row bleed
// any more: the band is five rows and every one of them is on screen, so the
// borrow set is a horizontal span, 108 seats of the 189. The launch order is
// hashed — not by row, not left to right — so it reads as a crowd all reaching
// up rather than a wipe crossing the frame.
//
// The rate is ONE curve: it leaves the idle tempo of 1 per 6 frames at f136
// and accelerates as u^2 to whatever the last frames need, which is exactly
// the rate whose integral over f136..f166 is the seat count (the last launch
// is 8 frames before f174, so its own draw lands on the word).
// ---------------------------------------------------------------------------
const BORROW_VIEW = (() => {
  const v = viewAt(DURATION);
  return { x0: v.x0 - STEP_X, x1: v.x1 + STEP_X };
})();
const BORROW: { seat: number; t0: number }[] = (() => {
  const picked = SEATS.map((s, n) => ({ s, n })).filter(
    ({ s }) => s.x >= BORROW_VIEW.x0 && s.x <= BORROW_VIEW.x1,
  );
  // hashed order, so the crowd reaches up all over at once
  picked.sort((a, b) => hash(a.s.i, 55) - hash(b.s.i, 55));
  const N = picked.length;
  const f0 = F_BORROW;
  const f1 = F_ARRIVED - TH_DRAW;
  const span = f1 - f0;
  const R0 = 1 / IDLE_PERIOD; // the idle tempo it leaves from
  const A = 3 * (N / span - R0); // so the rate curve integrates to N
  const cum = (u: number) => span * (R0 * u + (A * u * u * u) / 3);
  return picked.map((p, n) => {
    let lo = 0;
    let hi = 1;
    for (let it = 0; it < 40; it++) {
      const mid = (lo + hi) / 2;
      if (cum(mid) < n + 1) lo = mid;
      else hi = mid;
    }
    return { seat: p.n, t0: f0 + ((lo + hi) / 2) * span };
  });
})();
// seat -> the frame its borrow thread launches, for the idle stream to avoid
const BORROW_AT = new Float32Array(NSEAT).fill(Infinity);
BORROW.forEach((b) => {
  BORROW_AT[b.seat] = b.t0;
});

type Th = { key: string; x: number; y1: number; y2: number; op: number; head: boolean };

const RateOfInterestHigher: React.FC<Props> = ({
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
  personSize,
  beats,
}) => {
  const frame = useCurrentFrame();

  // -- the level and its rungs -----------------------------------------------
  const step1 = interpolate(frame, [STEP1.f0, STEP1.f1], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const step2 = interpolate(frame, [STEP2.f0, STEP2.f1], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const levelY =
    LEVELS[0] + (LEVELS[1] - LEVELS[0]) * step1 + (LEVELS[2] - LEVELS[1]) * step2;
  const rungOp = RUNGS.map((r) =>
    interpolate(frame, [r.t0, r.t0 + RUNG_FADE], [0, OP_UNREAD], clamp),
  );

  // -- the threads -----------------------------------------------------------
  // A thread is a vertical line from a head up to the level, drawn head-led.
  // Both streams — the idle traffic and the borrow — are the same mechanism;
  // only the schedule and what happens after arrival differ.
  const threads: Th[] = [];
  const line = (key: string, seat: Seat, age: number, op: number) => {
    const d = interpolate(age, [0, TH_DRAW], [0, 1], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    });
    const y1 = seat.y - HEAD_UP;
    threads.push({ key, x: seat.x, y1, y2: y1 + (levelY - y1) * d, op, head: d < 1 });
  };

  // idle: one launch every 6 frames from a seat that was on screen when it
  // fired, until the borrow takes the tempo over at f136
  for (let n = 0; ; n++) {
    const lf = IDLE_T0 + n * IDLE_PERIOD;
    if (lf >= F_BORROW || lf > frame) break;
    const age = frame - lf;
    if (age >= TH_LIFE) continue;
    const v = viewAt(lf);
    let si = -1;
    for (let t = 0; t < 40; t++) {
      const c = Math.floor(hash(n * 7 + t, 33) * NSEAT);
      const s = SEATS[c];
      if (s.x >= v.x0 && s.x <= v.x1 && s.y >= v.y0 && s.y <= v.y1) {
        si = c;
        break;
      }
    }
    if (si < 0) continue;
    if (BORROW_AT[si] <= frame) continue; // it is borrowing for good now
    const op =
      OP_LIVE * interpolate(age, [TH_DRAW + TH_HOLD, TH_LIFE], [1, 0], clamp);
    if (op <= 0.02) continue;
    line(`i${n}`, SEATS[si], age, op);
  }

  // the borrow: every seat in the resolved frame, hashed order, never fades
  for (const b of BORROW) {
    const age = frame - b.t0;
    if (age < 0) continue;
    const op = interpolate(age, [TH_DRAW, TH_DRAW + SETTLE], [OP_LIVE, OP_HELD], clamp);
    line(`b${b.seat}`, SEATS[b.seat], age, op);
  }

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = CX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  // only the seats inside this frame are drawn: 47 x 5 cells are laid out and
  // 189 seats survive the feather, but only 51 are on screen at k 1.4 and 100
  // at k 0.7
  const hw = FRAME_W / 2 / k + 100;
  const hh = FRAME_H / 2 / k + 100;
  const vx0 = cx - hw;
  const vx1 = cx + hw;
  const vy0 = cy - hh;
  const vy1 = cy + hh;

  // -- the per-icon shadow ---------------------------------------------------
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
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
            {/* the rungs the level left behind, at the bottom of the stack:
                a hundred threads cross this band and each one hides 3px of a
                dashed line 15 world px from its neighbour, which is nothing.
                Pass 1 put them on top because 573 threads did bury them. */}
            <g style={{ filter: icon }}>
              {RUNGS.map((r, i) =>
                rungOp[i] <= 0 ? null : (
                  <line
                    key={`r${i}`}
                    x1={LINE_X0}
                    y1={r.y}
                    x2={LINE_X1}
                    y2={r.y}
                    stroke={ink}
                    strokeWidth={STROKE}
                    strokeDasharray={DASH}
                    opacity={rungOp[i]}
                  />
                ),
              )}
            </g>

            {/* the threads, above the rungs and below everything else */}
            {threads.map((t) => (
              <g key={t.key}>
                <line
                  x1={t.x}
                  y1={t.y1}
                  x2={t.x}
                  y2={t.y2}
                  stroke={accent}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  opacity={t.op}
                />
                {t.head ? <circle cx={t.x} cy={t.y2} r={4} fill={ink} opacity={t.op} /> : null}
              </g>
            ))}

            {/* the level itself, OVER the threads: every thread ends on it, so
                the line is the thing they arrive at and has to stay unbroken */}
            <g style={{ filter: icon }}>
              <line
                x1={LINE_X0}
                y1={levelY}
                x2={LINE_X1}
                y2={levelY}
                stroke={ink}
                strokeWidth={STROKE}
                opacity={OP_READ}
              />
            </g>
          </svg>

          {/* everybody else, ON TOP of everything. A pure white glyph with the
              same small shadow the level carries, so the crowd reads as people
              standing in front of the threads: a back-row person's thread
              passes behind the heads in front of it. */}
          {SEATS.map((s) => {
            if (s.x < vx0 || s.x > vx1 || s.y < vy0 || s.y > vy1) return null;
            const size = personSize * s.s;
            return (
              <Img
                key={s.i}
                src={staticFile("person.png")}
                style={{
                  position: "absolute",
                  left: s.x - size / 2,
                  top: s.y - size / 2,
                  width: size,
                  height: size,
                  filter: `brightness(0) invert(1) ${icon}`,
                  opacity: OP_READ,
                }}
              />
            );
          })}
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default RateOfInterestHigher;
