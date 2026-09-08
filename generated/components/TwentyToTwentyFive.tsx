import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  DOT_RADIUS,
  FRAME_H,
  FRAME_W,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_READ,
  OP_UNREAD,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  camEase,
  camMove,
  clamp01,
  hash,
  iconShadow,
  makeTone,
  runCamera,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
// Cut 3 is this piece's world. Its treasury, its hundred, its tier, its pile of
// bills and its camera geometry are imported, never re-typed: the two cuts are
// six seconds apart in one edit and a value that drifts between them is a cut.
import {
  BILL_D,
  BLK_N,
  BLK_X,
  BLK_Y,
  CAM_WARP,
  CONTENT_CY,
  CX_FINAL,
  CX_OPEN,
  K_FINAL,
  K_OPEN,
  STEP_X,
  STEP_Y,
  TIER_Y,
  TREASURY,
  TREASURY_PEDIMENT,
  TREASURY_RECTS,
  WORLD_H,
  WORLD_W,
  arcAt,
  runCameraX,
  BILLS,
  type P,
} from "./debtPileLegacy";

export const FPS = 24;
// Dylan Patel, clip `Dylan_Debt_Crisis`, cut 4 (cut 3 is `TwentyPercentServicing`,
// six seconds earlier in the same edit): "Then over a five-year basis, the
// fraction of tax revenue that goes towards servicing the debt basically goes
// from 20 to 25."
//
// The SRT chunk "then over a" runs 43.420-45.159; the word "then" itself is
// estimated at 44.40, which is where this composition starts. Speech ends at
// 50.780.
// round((50.780 - 44.40) * 24) = round(6.38 * 24) = round(153.12) = 153 frames
// of speech, plus a 16 frame tail so the resolved state holds = 169.
export const DURATION = 169;

// ---------------------------------------------------------------------------
// "Five more out of the hundred."
//
// THE SAME WORLD AS CUT 3, SIX SECONDS LATER, and it opens on cut 3's f40 held:
// the treasury at (540, -140), the hundred under it as EIGHTY deep dots (rows
// 0-7 of the 10 x 10 block) plus the TWENTY already dropped into their tier at
// y +178 and +200, ripe. Off to the right, out of frame at k 1.5, the pile of
// bills — cut 3's lattice, feather, wobble, culling and per-bill shadow,
// imported whole.
//
// The only new thing in the piece is a THIRD ROW under the tier: five DASHED
// SEATS at y +222, columns 0-4. Dashed means "a position in a sequence", so
// five of them is the five-year basis, drawn one per year. Then, on "goes from
// 20 to 25", five dots drop out of the block into those seats, one per year:
// the tier goes 20 -> 25, the block 80 -> 75, and the percentage is the count.
//
// Nothing streams to the bills in this cut. The bills are where the money goes,
// revealed by the pull-back, and that is all they do.
//
// Every gesture is one word. Nothing else happens.
//   open on the held state: the treasury, the eighty
//     deep, the twenty ripe in their tier. Breath and
//     sway only; no seats yet                        — "then over a"        f0
//   the FIVE DASHED SEATS appear left to right, one
//     every five frames, each drawn head-led around
//     its ring over five frames with a small white
//     tip, so the fifth closes at f43. Five years,
//     five positions                                 — "five-year basis"   f18-43
//   hold. The block and the tier ARE the fraction;
//     there is nothing to add to them                — "the fraction of
//                                                      tax revenue"        f45-65
//   the ONE camera move, and the only one: pull back
//     k 1.5 -> 0.8 and pan cx 540 -> 800 together,
//     keyed f68-86 warp 0.72, cut 3's move. Traced
//     through the damper it settles (|dk| < 0.5%/f,
//     |dcx| < 1px/f) at f94 — four frames ahead of
//     "the debt". It reveals the pile of bills
//     bleeding off the top, the right and the bottom.
//     Nothing else moves while it runs               — "that goes towards
//                                                      servicing"          f68-86
//   hold at k 0.8, the whole comparison in frame     — "the debt,
//                                                      basically"          f98-115
//   FIVE DOTS LEAVE THE BLOCK, one per year, left
//     seat first: launches f118, 123, 128, 133, 138,
//     five frames of travel each on its own shallow
//     arc, so the landings are f123, 128, 133, 138,
//     143 and the fifth lands on "25". Each one is
//     the bottom-right-most dot still in the eighty
//     (row 7, columns 9, 8, 7, 6, 5), goes deep ->
//     ripe as it travels, and seats exactly on its
//     ring; the ring's dash fades over four frames
//     on seating, leaving a solid ripe dot           — "goes from 20 to 25" f118-143
//   hold resolved: seventy-five deep under the
//     treasury, twenty-five ripe in three rows of
//     10 + 10 + 5, the pile on the right. Breath and
//     sway only                                      — tail                f143-169
//
// There is no ambient layer beyond breath and sway, and no dead air: the two
// long holds are carried by the breath on a hundred dots and the camera's sway.
//
// orange dwarkesh style: ACCENT / ACCENT_DEEP, solid dots with no stroke, the
// deep -> ripe ladder carried by tone, white ink at OP_READ for the treasury and
// the bills, BG_DIM 0.45, one global drop-shadow 2/7/0.12, a per-icon
// drop-shadow 2/3/0.38 on the treasury and every bill, one eased camera move
// (warp 0.72) with cy taken off the eased k. The dashed seat rings at stroke 1.5
// are the only lines in the piece and carry no icon shadow — they are ink, not
// an icon. No text, no springs, no flashes, no ripples, no boxes.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(), // the treasury, the bills and the seat rings
  accent: z.string(), // ripe: money that has gone to servicing the debt
  accentDeep: z.string(), // deep: money still in the block
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
  dotRadius: z.number(),
  dotOpacity: z.number(), // a dot is solid; the ladder is tone
  beats: z.object({
    thenOverA: z.number(), // "then over a"
    fiveYear: z.number(), // "five year"
    basisThe: z.number(), // "basis the"
    fractionOfTax: z.number(), // "fraction of tax"
    revenue: z.number(), // "revenue"
    thatGoes: z.number(), // "that goes"
    towards: z.number(), // "towards"
    servicing: z.number(), // "servicing"
    theDebt: z.number(), // "the debt"
    basically: z.number(), // "basically"
    goesFrom: z.number(), // "goes from"
    twenty: z.number(), // "20"
    to: z.number(), // "to"
    twentyFive: z.number(), // "25"
    end: z.number(), // speech ends; tail to 169
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
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
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  dotRadius: DOT_RADIUS,
  dotOpacity: OP_UNREAD_DOT,
  beats: {
    thenOverA: 0,
    fiveYear: 18,
    basisThe: 26,
    fractionOfTax: 45,
    revenue: 58,
    thatGoes: 65,
    towards: 73,
    servicing: 84,
    theDebt: 98,
    basically: 107,
    goesFrom: 115,
    twenty: 126,
    to: 137,
    twentyFive: 143,
    end: 153,
  },
});

// ---------------------------------------------------------------------------
// The camera. ONE move, cut 3's move, two frames earlier because this line
// reaches "that goes towards" two frames sooner: pull back k 1.5 -> 0.8 and pan
// cx 540 -> 800 together, keyed f68-86, warp 0.72 so the speed is early in it.
// The content centre stays at CONTENT_CY = -105 at both ends — the composition
// runs from the pediment at world y -410 to the seats at +222 — so the whole
// thing sits at screen y 835 under the captions at every camera position.
//
//   f0-68   k 1.5, cx 540. The frame spans world x 180..900 and y -662..618:
//           the treasury, the eighty, the tier and the five seats (screen y
//           1326) are in it and the nearest bill's left edge at world 928 is
//           not, sway included.
//   f68-86  -> k 0.8, cx 800. Traced through the damper: |dk| < 0.5%/frame from
//           f93 and |dcx| < 1px/frame from f94, four frames ahead of "the debt"
//           (f98). At rest the frame spans world x 125..1475 and y -1149..1251,
//           so the pile bleeds off the top, the right and the bottom, and the
//           treasury, block, tier and seats sit at screen x 196..468 and y
//           591..1097.
// ---------------------------------------------------------------------------
const CAM_F0 = 68;
const CAM_F1 = 86;

const CAM = camMove({
  f0: CAM_F0,
  f1: CAM_F1,
  k0: K_OPEN,
  k1: K_FINAL,
  c0: CONTENT_CY,
  c1: CONTENT_CY,
  warp: CAM_WARP,
});
const CAM_FR = [0, ...CAM.F, DURATION];
const CAM_K = [K_OPEN, ...CAM.K, K_FINAL];
const CAM_CY = [CONTENT_CY + CAM_LIFT / K_OPEN, ...CAM.CY, CONTENT_CY + CAM_LIFT / K_FINAL];

// The x track: the same eased curve, one key per frame, over the same span, run
// through cut 3's copy of the camera damper so the pan and the zoom settle
// together and the move reads as one hand.
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

// ---------------------------------------------------------------------------
// The block, as this cut inherits it. Cut 3 ended with its bottom two rows in a
// tier below it, so here rows 0-7 are the EIGHTY that stayed and rows 8-9 of the
// hundred are the TWENTY sitting at TIER_Y. Nothing about that state is
// animated: it is where cut 3 left it.
// ---------------------------------------------------------------------------
const STAY_ROWS = 8; // rows 0..7 of the block are still in it at f0
const LAST_ROW = STAY_ROWS - 1; // 7: the row the five leave from
const TIER_N = BLK_N * TIER_Y.length; // 20

// ---------------------------------------------------------------------------
// The five years. A third tier row at y +222 under the twenty, columns 0-4: five
// DASHED rings, radius DOT_RADIUS + 3, stroke 1.5, dash 4/3, ink at OP_UNREAD.
// Dashed is the set's word for "a position in a sequence", which is what a year
// is; they carry no icon shadow because they are ink, not an icon.
//
// They do not exist at f0. One appears every five frames from "five-year",
// each drawn head-led around its own ring over five frames with a small white
// tip at the head, so the fifth closes at f43 — two frames before "the
// fraction".
// ---------------------------------------------------------------------------
const SEAT_N = 5;
const SEAT_Y = 222;
const SEAT_R = DOT_RADIUS + 3;
const SEAT_STROKE = 1.5;
const SEAT_DASH = "4 3";
const SEAT_GAP = 5; // frames between one seat starting and the next
const SEAT_DRAW = 5; // frames to draw one ring
const SEAT_TIP_R = 2.5;
const SEAT_FADE = 4; // frames for a seated ring's dash to fade out

const SEATS: P[] = Array.from({ length: SEAT_N }, (_, j) => ({ x: BLK_X[j], y: SEAT_Y }));

// A ring drawn head-led from the top, clockwise. Below a full turn it is one
// SVG arc; at a full turn an arc cannot close on itself, so it becomes two.
const ringPath = (c: P, r: number, u: number) => {
  if (u <= 0) return "";
  if (u >= 1) {
    return `M ${c.x} ${c.y - r} A ${r} ${r} 0 1 1 ${c.x} ${c.y + r} A ${r} ${r} 0 1 1 ${c.x} ${
      c.y - r
    }`;
  }
  const a = -Math.PI / 2 + 2 * Math.PI * u;
  const ex = c.x + r * Math.cos(a);
  const ey = c.y + r * Math.sin(a);
  return `M ${c.x} ${(c.y - r).toFixed(2)} A ${r} ${r} 0 ${u > 0.5 ? 1 : 0} 1 ${ex.toFixed(
    2,
  )} ${ey.toFixed(2)}`;
};
const ringHead = (c: P, r: number, u: number): P => {
  const a = -Math.PI / 2 + 2 * Math.PI * clamp01(u);
  return { x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) };
};

// ---------------------------------------------------------------------------
// The drop: five dots out of the block into the five seats, one per year, left
// seat first. Each leaving dot is the bottom-right-most one still in the eighty
// — row 7, columns 9, 8, 7, 6, 5 — so the block loses its corner five times and
// row 7 is left with columns 0-4. Travel is five frames on its own shallow arc,
// eased out with no overshoot, and the launches are five frames apart, so
// exactly one dot is ever in the air and the last of them lands on "25".
//
// A leaving dot ramps deep -> ripe across its travel: it is money that has gone
// to servicing the debt by the time it seats.
// ---------------------------------------------------------------------------
const DROP_N = SEAT_N;
const DROP_GAP = 5;
const DROP_DUR = 5;
const DROP_ARC = 36; // +/- 18px across a 259px flight: shallow
const DROP_COL = [9, 8, 7, 6, 5]; // the bottom-right-most dot, five times over

const TwentyToTwentyFive: React.FC<Props> = ({
  ink,
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
  iconShadowY,
  iconShadowBlur,
  iconShadowOpacity,
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

  // -- the per-icon shadow ---------------------------------------------------
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- the pile: only the bills whose box this frame can actually touch -------
  const halfW = FRAME_W / 2 / k;
  const halfH = FRAME_H / 2 / k;
  const vx0 = cx - halfW - STEP_X;
  const vx1 = cx + halfW + STEP_X;
  const vy0 = cy - halfH - STEP_Y;
  const vy1 = cy + halfH + STEP_Y;
  const visible = BILLS.filter((b) => b.x >= vx0 && b.x <= vx1 && b.y >= vy0 && b.y <= vy1);

  // -- the five dots, and therefore the five rings ---------------------------
  // The last landing IS "25", so the whole flight is keyed off that beat rather
  // than off a timer that runs beside it.
  const dropT0 = beats.twentyFive - DROP_DUR - (DROP_N - 1) * DROP_GAP; // f118
  const drops = Array.from({ length: DROP_N }, (_, m) => {
    const col = DROP_COL[m];
    const home: P = { x: BLK_X[col], y: BLK_Y[LAST_ROW] };
    const seat = SEATS[m];
    const launch = dropT0 + m * DROP_GAP;
    const lin = clamp01((frame - launch) / DROP_DUR);
    const p = arcAt(home, seat, lin, (hash(m, 53) - 0.5) * DROP_ARC);
    // the same dot as the one it left the block as, so the same breath seed
    const seed = hash(LAST_ROW * BLK_N + col, 9);
    // 0 once it has landed, 1 while its ring is still a ring
    const seated = clamp01((frame - (launch + DROP_DUR)) / SEAT_FADE);
    return { p, lit: smoothstep(lin), seed, seated };
  });

  // -- the five seats --------------------------------------------------------
  const seats = SEATS.map((s, j) => {
    const t0 = beats.fiveYear + j * SEAT_GAP;
    const u = interpolate(frame, [t0, t0 + SEAT_DRAW], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
    return { s, u, op: OP_UNREAD * (1 - drops[j].seated) };
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
            {/* the debt: cut 3's pile of bills, each with its own small shadow */}
            {visible.map((b) => (
              <g key={`bl${b.i}`} style={{ filter: icon }}>
                <g
                  transform={`translate(${b.x.toFixed(2)} ${b.y.toFixed(2)}) scale(${b.s.toFixed(
                    4,
                  )})`}
                >
                  <path d={BILL_D} fill={ink} fillRule="evenodd" opacity={OP_READ} />
                </g>
              </g>
            ))}

            {/* the treasury: static, over the pile, under the money */}
            <g style={{ filter: icon }}>
              <g transform={`translate(${TREASURY.x} ${TREASURY.y})`}>
                {TREASURY_RECTS.map((r, i) => (
                  <rect
                    key={`tr${i}`}
                    x={r.x}
                    y={r.y}
                    width={r.w}
                    height={r.h}
                    rx={r.r}
                    fill={ink}
                    opacity={OP_READ}
                  />
                ))}
                <path d={TREASURY_PEDIMENT} fill={ink} opacity={OP_READ} />
              </g>
            </g>

            {/* the five years: dashed seats, drawn head-led, one per year */}
            {seats.map(({ s, u, op }, j) => {
              if (u <= 0 || op <= 0) return null;
              const d = ringPath(s, SEAT_R, u);
              if (!d) return null;
              const head = ringHead(s, SEAT_R, u);
              return (
                <g key={`sr${j}`}>
                  <path
                    d={d}
                    fill="none"
                    stroke={ink}
                    strokeWidth={SEAT_STROKE}
                    strokeLinecap="butt"
                    strokeDasharray={SEAT_DASH}
                    opacity={op}
                  />
                  {u < 1 ? <circle cx={head.x} cy={head.y} r={SEAT_TIP_R} fill={ink} /> : null}
                </g>
              );
            })}

            {/* tax revenue: the eighty, less the five that leave row 7 */}
            {BLK_Y.slice(0, STAY_ROWS).map((y, row) =>
              BLK_X.map((x, col) =>
                row === LAST_ROW && col >= BLK_N - DROP_N
                  ? null
                  : dotFor(
                      `b${row}-${col}`,
                      x,
                      y,
                      dotRadius * breath(frame, hash(row * BLK_N + col, 9)),
                      tone(0),
                    ),
              ),
            )}

            {/* the twenty already in the tier when this cut opens */}
            {Array.from({ length: TIER_N }, (_, t) =>
              dotFor(
                `t${t}`,
                BLK_X[t % BLK_N],
                TIER_Y[Math.floor(t / BLK_N)],
                dotRadius * breath(frame, hash(t, 9)),
                tone(1),
              ),
            )}

            {/* the five: in the block, in the air, in their seat */}
            {drops.map((d, m) =>
              dotFor(
                `d${m}`,
                d.p.x,
                d.p.y,
                dotRadius * breath(frame, d.seed),
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

export default TwentyToTwentyFive;
