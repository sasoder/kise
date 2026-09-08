import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_DAMP,
  CAM_LIFT,
  CAM_STIFF,
  DOT_RADIUS,
  FRAME_H,
  FRAME_W,
  GridBackground,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  camEase,
  camMove,
  clamp,
  clamp01,
  feather,
  hash,
  makeTone,
  runCamera,
  smoothstep,
  sway,
  wobble,
  worldTransform,
} from "./fieldShared";

export const FPS = 24;
// Dylan Patel, clip `Dylan_Debt_Crisis`, cut 3 (cuts 1-2 are `TenTimesTheCost`
// and `RateOfInterestHigher`): "Currently 20% of tax revenue spending goes
// towards servicing the debt, basically paying interest payments on the debt".
//
// SRT span 0:31.800 -> 0:38.299 at 24fps.
// round((38.299 - 31.800) * 24) = round(6.499 * 24) = round(155.976) = 156
// frames of speech, plus a 16 frame tail so the resolved state holds = 172.
export const DURATION = 172;

// ---------------------------------------------------------------------------
// "Twenty of a hundred". Money is the field's dots, as in cut 1. Tax revenue is
// ONE countable block of 100 solid dots, 10 x 10 at a 22px step, deep at rest.
// The twenty percent is its top two rows: they light to ripe and lift out into
// their own tier above the block, so the count in the line is a thing you can
// see and count. The debt is a FIELD of deep dots that runs off the top, the
// right and the bottom of the frame at every camera position — bigger than
// anything the frame can hold — with its left edge dissolved over 12 columns.
// Servicing the debt is the twenty streaming one by one out of the tier into
// that edge, each seating in an empty edge seat and going deep: absorbed, the
// field no bigger for it, the block now eighty.
//
// No text, no people, no building, no lines: this piece is dots and a camera.
//
// Every gesture is one word. Nothing else happens.
//   open on the hundred: one 10 x 10 block of deep
//     dots at world (540, 0), breathing, k 1.5.
//     Nothing else is in frame — at k 1.5 the frame
//     reaches world x 900 and the debt field starts
//     at 920                                        — "currently"          f0
//   the top two rows LIFT OUT: each of the twenty
//     goes ripe as it leaves and rises to its tier
//     seat (y -200 / -178) on its own shallow arc,
//     ease-out, launch order hashed within the two
//     rows, travel 12 frames each, the last seated
//     by f40. The eighty stay deep and do not move   — "twenty percent"     f12-40
//   hold. The block IS the revenue; there is nothing
//     to add to it. Breath and sway only            — "of tax revenue"     f48-60
//   the ONE camera move, and the only one: pull back
//     k 1.5 -> 0.8 and pan cx 540 -> 800 together,
//     keyed f70-88 warp 0.72, settled (|dk| < 0.5%/f
//     and |dcx| < 1px/f) at f96 — three frames ahead
//     of "servicing". It reveals the debt: a field
//     bleeding off the top, the right and the bottom
//     with a dissolved left edge. Nothing else moves
//     while it runs                                 — "spending goes
//                                                      towards"            f70-88
//   the STREAM: the twenty leave the tier one at a
//     time, hashed order, each on its own shallow
//     arc into an EMPTY seat in the field's
//     feathered edge. Travel 11 frames, departures
//     f88 -> f139 at ~2.7 frames apart, so the first
//     lands on "servicing" (f99) and the last on
//     "debt" (f150). On seating each ramps ripe ->
//     deep over 6 frames and shrinks to that seat's
//     own radius: absorbed. Nothing refills the tier — "servicing the debt,
//                                                      basically paying
//                                                      interest payments on
//                                                      the debt"           f88-150
//   hold resolved: eighty deep dots in an 8 x 10
//     block on the left, the field unchanged on the
//     right, the tier gone. Breath and sway only    — tail                 f150-172
//
// There is no ambient layer beyond breath and sway, and there is nothing in
// this piece that is not a dot: no threads, no rings, no ink, no strokes, so no
// per-icon shadow either (it is for icons, and a shadow on ten thousand dots is
// a haze). The two holds are carried by the breath and the camera's sway.
//
// orange dwarkesh style: ACCENT / ACCENT_DEEP, solid dots with no stroke, the
// unread -> lit ladder carried by tone, BG_DIM 0.45, one global drop-shadow
// 2/7/0.12, `feather` + `wobble` on the field's one visible edge, one eased
// camera move (warp 0.72) with cy taken off the eased k.
// ---------------------------------------------------------------------------

export const schema = z.object({
  // no `ink` prop: there is nothing white in this piece. Every mark is a dot,
  // and a dot is either the deep tone or the ripe one.
  accent: z.string(), // ripe: the twenty, lit and in flight
  accentDeep: z.string(), // deep: money at rest, and the debt
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  dotRadius: z.number(),
  dotOpacity: z.number(), // a dot is solid; the ladder is tone
  beats: z.object({
    currently: z.number(), // "currently"
    twenty: z.number(), // "20"
    percent: z.number(), // "percent"
    ofTax: z.number(), // "of tax"
    revenue: z.number(), // "revenue"
    spendingGoes: z.number(), // "spending goes"
    towards: z.number(), // "towards"
    servicing: z.number(), // "servicing"
    theDebt: z.number(), // "the debt"
    basically: z.number(), // "basically"
    payingInterest: z.number(), // "paying interest"
    paymentsOnThe: z.number(), // "payments on the"
    debt: z.number(), // "debt"
    end: z.number(), // speech ends; tail to 172
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  backgroundBase: BG_BASE,
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: BG_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  dotRadius: DOT_RADIUS,
  dotOpacity: OP_UNREAD_DOT,
  beats: {
    currently: 0,
    twenty: 12,
    percent: 26,
    ofTax: 48,
    revenue: 60,
    spendingGoes: 68,
    towards: 88,
    servicing: 99,
    theDebt: 112,
    basically: 120,
    payingInterest: 130,
    paymentsOnThe: 138,
    debt: 150,
    end: 156,
  },
});

type P = { x: number; y: number };

const WORLD_W = 1080;
const WORLD_H = 2200;

// ---------------------------------------------------------------------------
// The camera. ONE move, and it is the only one: the pull-back on "spending goes
// towards", keyed f70-88, warp 0.72 so the speed is early in it. This is the
// first piece in the set whose camera also PANS, because the two things it has
// to hold — the block on the left and the debt's edge on the right — do not
// share a centre: the block stays where it opened and the frame widens to the
// right of it.
//
// `camMove` writes k and cy as one key per frame off a warped smoothstep, and
// `runCamera` damps them. The x track is the same curve (`camEase`, the same
// f0..f1 and the same warp) run through a copy of that damper below with the
// same CAM_STIFF / CAM_DAMP, so the pan and the zoom settle on the same frame
// and the move reads as one hand.
//
//   f0-70   k 1.5, cx 540, content centre 0. The block's centre sits at screen
//           (540, 835). The frame reaches world x 900; the debt field starts at
//           920, so none of it is visible, sway included.
//   f70-88  -> k 0.8, cx 800, content centre 0. Traced through the damper:
//           |dk| < 0.5%/frame and |dcx| < 1px/frame from f96 — the settle frame,
//           three frames before "servicing" (f99) and eleven before the first
//           arrival lands. At rest the block's centre is at screen x 332, the
//           field's left edge (world 920) at screen 636, and the frame spans
//           world x 125..1475 and world y -1044..1356, so the field bleeds off
//           the top, the right and the bottom.
//
// Content centre stays at screen y 835 the whole way (world y 0 through the
// eased-k cy). At the resolved frame the eighty run screen y 791..914 and
// screen x 253..411, with the edge band beside them: margins well over 60 and
// nothing below 1480.
// ---------------------------------------------------------------------------
const BLOCK_CX = 540;
const K_OPEN = 1.5;
const K_FINAL = 0.8;
const CX_OPEN = 540;
const CX_FINAL = 800;
const CAM_F0 = 70;
const CAM_F1 = 88;
const CAM_WARP = 0.72;

const CAM = camMove({
  f0: CAM_F0,
  f1: CAM_F1,
  k0: K_OPEN,
  k1: K_FINAL,
  c0: 0,
  c1: 0,
  warp: CAM_WARP,
});
const CAM_FR = [0, ...CAM.F, DURATION];
const CAM_K = [K_OPEN, ...CAM.K, K_FINAL];
const CAM_CY = [CAM_LIFT / K_OPEN, ...CAM.CY, CAM_LIFT / K_FINAL];

// The x track: the same eased curve, one key per frame, over the same span.
const CAM_CX = (() => {
  const F: number[] = [0];
  const X: number[] = [CX_OPEN];
  const span = CAM_F1 - CAM_F0;
  for (let i = 0; i <= span; i++) {
    F.push(CAM_F0 + i);
    X.push(CX_OPEN + (CX_FINAL - CX_OPEN) * camEase(i / span, CAM_WARP));
  }
  F.push(DURATION);
  X.push(CX_FINAL);
  return { F, X };
})();

// A copy of `runCamera`'s spring for the x track — same stiffness, same
// damping, so the pan has the same weight as the zoom it travels with.
// fieldShared is shared with three delivered cuts and is not touched for this.
const runCameraX = (upto: number, F: number[], CX: number[]) => {
  let cx = CX[0];
  let vx = 0;
  for (let f = 1; f <= upto; f++) {
    const tx = interpolate(f, F, CX, clamp);
    vx += (tx - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
  }
  return cx;
};

// ---------------------------------------------------------------------------
// Tax revenue: ONE block of a hundred solid dots, 10 x 10 at a 22px step,
// centred on world (540, 0), deep at rest. A hundred is the whole point — the
// line says a percentage, so the thing the percentage is of has to be countable
// without being counted for you.
//
// The tier is where the top two rows go: the same ten columns, at y -200 and
// -178, a 123px gap above the eight rows that stay (their top row is at -55).
// The gap is 5.6x the step inside the block, so twenty separated dots read as
// twenty and not as the top of a taller block.
// ---------------------------------------------------------------------------
const BLK_N = 10;
const BLK_STEP = 22;
const BLK_X = Array.from({ length: BLK_N }, (_, j) => BLOCK_CX - 99 + BLK_STEP * j);
const BLK_Y = Array.from({ length: BLK_N }, (_, i) => -99 + BLK_STEP * i);
const TIER_ROWS = 2;
const TIER_Y = [-200, -178];
const TWENTY = BLK_N * TIER_ROWS;

// ---------------------------------------------------------------------------
// The debt. The field's own step (940/39 x 440/29), jitter 0.9, radius spread
// 0.75-1.25 — the standard from "The field" — laid over world x 920..3740 and
// world y -2200..+2200, so at k 0.8 it runs off the top, the right and the
// bottom of the frame and at k 1.5 it is entirely outside it.
//
// Its LEFT edge is the only one anything ever sees, and it is not a ruled line:
// its nominal x undulates along y by `wobble`, and the field dissolves into it
// over EDGE_FEATHER = 12 columns — a seat only exists if its hash falls under
// `feather`, and what survives out there is drawn smaller (radius to 0.6x).
// Twelve columns is 289 world px, 231 screen px at the resolved camera: the
// outermost two or three columns keep a few percent of their seats, the middle
// of the band is sparse, and it is only twelve columns in that the field is
// solid. Four columns still reads as a line, which is what the shared
// FEATHER_STEPS default would give.
//
// Only the seats inside the current frame plus a bleed are drawn — the field is
// 34,338 cells and the frame never holds more than a few thousand of them.
// ---------------------------------------------------------------------------
const STEP_X = 940 / 39;
const STEP_Y = 440 / 29;
const FIELD_X0 = BLOCK_CX + 380;
const FIELD_X1 = BLOCK_CX + 3200;
const FIELD_Y0 = -2200;
const FIELD_Y1 = 2200;
const EDGE_FEATHER = 12; // columns, this edge only; the shared default is 4
const EDGE_R_MIN = 0.6; // a surviving seat's radius at the outermost columns
const EDGE_SEED = 2.1;
const BLEED = 60;

export const FIELD_COLS = Math.round((FIELD_X1 - FIELD_X0) / STEP_X) + 1;
export const FIELD_ROWS = Math.round((FIELD_Y1 - FIELD_Y0) / STEP_Y) + 1;

// the nominal left edge at world y, in world px
const edgeAt = (y: number) => FIELD_X0 + wobble(y, EDGE_SEED) * STEP_X;

// One cell of the field's lattice, hashed off its seat exactly as every other
// crowd in this set is. `fe` is the feather at that cell: the chance the seat
// exists, and the taper on its radius.
type Cell = { x: number; y: number; r: number; rs: number; fe: number; live: boolean };
const cellAt = (gc: number, gr: number): Cell => {
  const i = gr * FIELD_COLS + gc;
  const x = FIELD_X0 + gc * STEP_X + (hash(i, 11) - 0.5) * STEP_X * 0.9;
  const y = FIELD_Y0 + gr * STEP_Y + (hash(i, 12) - 0.5) * STEP_Y * 0.9;
  const fe = feather((x - edgeAt(y)) / STEP_X, EDGE_FEATHER);
  return {
    x,
    y,
    r: 0.75 + 0.5 * hash(i, 13),
    rs: EDGE_R_MIN + (1 - EDGE_R_MIN) * fe,
    fe,
    live: hash(i, 71) < fe,
  };
};

type Seat = { x: number; y: number; r: number; rs: number; seed: number };
// exported so the geometry can be traced without re-deriving it in a script
export const SEATS: Seat[] = (() => {
  const out: Seat[] = [];
  for (let gr = 0; gr < FIELD_ROWS; gr++) {
    for (let gc = 0; gc < FIELD_COLS; gc++) {
      const c = cellAt(gc, gr);
      if (!c.live) continue;
      out.push({ x: c.x, y: c.y, r: c.r, rs: c.rs, seed: gr * FIELD_COLS + gc });
    }
  }
  return out;
})();

// ---------------------------------------------------------------------------
// Where the twenty land: EMPTY seats of that feathered edge — cells the feather
// left vacant — inside its first 6 columns and inside world y -260..+260, which
// is the band of the edge that is on screen at k 0.8 either side of the content
// centre. Twenty bands of 26 world px across that range, and in each band the
// vacant cell with the lowest hash: deterministic, spread down the edge, and
// scattered across six columns so the twenty never line up.
//
// A landed dot takes that seat's own radius and taper, so once it has gone deep
// it is indistinguishable from the field it joined. That is what "servicing"
// looks like: the money is not spent on a thing, it disappears into a debt that
// is not visibly any bigger for it.
// ---------------------------------------------------------------------------
const LAND_COLS = 6;
const LAND_Y0 = -260;
const LAND_Y1 = 260;
export const LANDING: Seat[] = (() => {
  const out: Seat[] = [];
  const bandH = (LAND_Y1 - LAND_Y0) / TWENTY;
  // the lattice rows that can fall inside the landing band at all
  const gr0 = Math.max(0, Math.floor((LAND_Y0 - FIELD_Y0) / STEP_Y) - 2);
  const gr1 = Math.min(FIELD_ROWS - 1, Math.ceil((LAND_Y1 - FIELD_Y0) / STEP_Y) + 2);
  for (let b = 0; b < TWENTY; b++) {
    const y0 = LAND_Y0 + b * bandH;
    const y1 = y0 + bandH;
    let best: Seat | null = null;
    let bestKey = Infinity;
    for (let gr = gr0; gr <= gr1; gr++) {
      for (let gc = 0; gc < LAND_COLS; gc++) {
        const c = cellAt(gc, gr);
        if (c.live) continue; // it has to be an EMPTY seat
        if (c.y < y0 || c.y >= y1) continue;
        const key = hash(gr * FIELD_COLS + gc, 77);
        if (key < bestKey) {
          bestKey = key;
          best = { x: c.x, y: c.y, r: c.r, rs: c.rs, seed: gr * FIELD_COLS + gc };
        }
      }
    }
    if (!best) {
      throw new Error(`TwentyPercentServicing: no vacant edge seat in band ${b}`);
    }
    out.push(best);
  }
  return out;
})();

// ---------------------------------------------------------------------------
// The two flights. Both are the same mechanism — a dot leaves on its own
// shallow arc, eases in and never overshoots — at two different scales.
//
// The LIFT, f12-40 on "twenty percent": twenty launches in a hashed order, one
// every 16/19 of a frame from f12, twelve frames of travel each, so the last of
// them is seated at f40 and the tier is complete well before "of tax revenue".
// The brief's ~1.4 frame spacing would have put the last landing at f50.6,
// inside that hold; the window won.
//
// The STREAM, f88-150 on "servicing … the debt": twenty departures in a
// different hashed order, eleven frames of travel each, spaced 51/19 = 2.68
// frames so the FIRST lands on "servicing" (f99) and the LAST on "debt" (f150).
// Both numbers come off the beats, not off a parallel timer.
// ---------------------------------------------------------------------------
const LIFT_END = 40;
const LIFT_DUR = 12;
const LIFT_ARC = 36; // +/- 18px of sway across a 101px rise: shallow
const STREAM_ARC = 90;
const ABSORB = 6; // frames from seating to fully deep, at the seat's own radius

// launch order inside the two rows, and departure order out of the tier: two
// different hashes, so the tier does not empty in the order it filled
const LIFT_RANK = (() => {
  const idx = Array.from({ length: TWENTY }, (_, t) => t);
  idx.sort((a, b) => hash(a, 51) - hash(b, 51));
  const rank = new Array<number>(TWENTY);
  idx.forEach((t, r) => {
    rank[t] = r;
  });
  return rank;
})();
const STREAM_RANK = (() => {
  const idx = Array.from({ length: TWENTY }, (_, t) => t);
  idx.sort((a, b) => hash(a, 61) - hash(b, 61));
  const rank = new Array<number>(TWENTY);
  idx.forEach((t, r) => {
    rank[t] = r;
  });
  return rank;
})();

// A dot travelling from A to B on its own shallow arc: eased in, bowed
// perpendicular to its own path, never overshooting.
const arcAt = (a: P, b: P, lin: number, arc: number): P => {
  const e = Easing.out(Easing.cubic)(lin);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const L = Math.hypot(dx, dy) || 1;
  const bow = Math.sin(Math.PI * e) * arc;
  return { x: a.x + dx * e + (-dy / L) * bow, y: a.y + dy * e + (dx / L) * bow };
};

const TwentyPercentServicing: React.FC<Props> = ({
  accent,
  accentDeep,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
  dotRadius,
  dotOpacity,
  beats,
}) => {
  const frame = useCurrentFrame();
  // 0 = at rest (deep), 1 = lit (ripe). Built once per frame, read per dot.
  const tone = makeTone(accentDeep, accent);

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_FR, CAM_CY, CAM_K);
  const camX = runCameraX(frame, CAM_CX.F, CAM_CX.X);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = camX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  // -- the debt: only the seats this frame can actually see -------------------
  const halfW = FRAME_W / 2 / k + BLEED;
  const halfH = FRAME_H / 2 / k + BLEED;
  const vx0 = cx - halfW;
  const vx1 = cx + halfW;
  const vy0 = cy - halfH;
  const vy1 = cy + halfH;
  const visible: Seat[] = [];
  for (let i = 0; i < SEATS.length; i++) {
    const s = SEATS[i];
    if (s.x < vx0 || s.x > vx1 || s.y < vy0 || s.y > vy1) continue;
    visible.push(s);
  }

  // -- the twenty ------------------------------------------------------------
  // Each one's whole life in three numbers: how far it has lifted, how far it
  // has streamed, and how long it has been seated. Nothing runs on a timer that
  // the visible thing cannot be derived from.
  const liftGap = (LIFT_END - LIFT_DUR - beats.twenty) / (TWENTY - 1);
  const streamDur = beats.servicing - beats.towards; // 11
  const streamGap = (beats.debt - streamDur - beats.towards) / (TWENTY - 1);

  const twenty = Array.from({ length: TWENTY }, (_, t) => {
    const row = Math.floor(t / BLK_N);
    const col = t % BLK_N;
    const home: P = { x: BLK_X[col], y: BLK_Y[row] };
    const tier: P = { x: BLK_X[col], y: TIER_Y[row] };
    const seat = LANDING[STREAM_RANK[t]];

    const l = clamp01((frame - (beats.twenty + LIFT_RANK[t] * liftGap)) / LIFT_DUR);
    const sDep = beats.towards + STREAM_RANK[t] * streamGap;
    const s = clamp01((frame - sDep) / streamDur);
    const settled = clamp01((frame - (sDep + streamDur)) / ABSORB);

    let p: P;
    if (s > 0) {
      p = arcAt(tier, { x: seat.x, y: seat.y }, s, (hash(t, 53) - 0.5) * STREAM_ARC);
    } else {
      p = arcAt(home, tier, l, (hash(t, 52) - 0.5) * LIFT_ARC);
    }
    // ripe as it leaves the block, ripe all the way, deep once it is absorbed
    const lit = smoothstep(l / 0.4) * (1 - settled);
    const seatR = seat.r * seat.rs;
    const rScale = 1 + (seatR - 1) * settled;
    return { p, lit, rScale, seed: t };
  });

  const dotFor = (key: string, x: number, y: number, r: number, fill: string) => (
    <circle key={key} cx={x} cy={y} r={r} fill={fill} opacity={dotOpacity} />
  );

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
        cx={cx}
        cxRest={CX_OPEN}
        k={k}
        parallax={parallax}
      />

      <AbsoluteFill
        style={{
          filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))`,
        }}
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
            {/* the debt: the field, deep, dissolving into its left edge */}
            {visible.map((s) =>
              dotFor(
                `f${s.seed}`,
                s.x,
                s.y,
                dotRadius * s.r * s.rs * breath(frame, hash(s.seed, 9)),
                tone(0),
              ),
            )}

            {/* tax revenue: the eighty that never move */}
            {BLK_Y.map((y, row) =>
              row < TIER_ROWS
                ? null
                : BLK_X.map((x, col) =>
                    dotFor(
                      `b${row}-${col}`,
                      x,
                      y,
                      dotRadius * breath(frame, hash(row * BLK_N + col, 9)),
                      tone(0),
                    ),
                  ),
            )}

            {/* the twenty: in the block, in the air, in the tier, in the debt */}
            {twenty.map((d) =>
              dotFor(
                `t${d.seed}`,
                d.p.x,
                d.p.y,
                dotRadius * d.rScale * breath(frame, hash(d.seed, 9)),
                tone(d.lit),
              ),
            )}
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default TwentyPercentServicing;
