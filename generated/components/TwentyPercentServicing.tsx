import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  DOT_RADIUS,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_READ,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  clamp01,
  hash,
  iconShadow,
  makeTone,
  sway,
  worldTransform,
} from "./fieldShared";
// This cut IS the first act of `DebtExplainer`: the same column, the same five
// bonds, the same bar, the same type. Every number that decides where anything
// sits comes from `explainerShared` and is not restated here.
import {
  BAR_ROWS,
  BAR_TOP,
  BILL_D,
  BOND_CY,
  COLUMN_CX,
  DEBT_LABEL_Y,
  LABEL_FADE,
  LABEL_OP,
  PAY_ARC,
  READOUT_Y,
  REVENUE_LABEL_Y,
  SCENE_CY,
  SCENE_K,
  SUBLABEL_Y,
  TRAVEL_DUR,
  arcAt,
  barDotR,
  barX,
  barY,
  couponAt,
  litIndex,
  litSeat,
  makeLabel,
  makeReadout,
  rankBy,
  rowX,
  travellerR,
} from "./explainerShared";

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
// "Twenty of a hundred, to the debt." The FIRST ACT of the explainer.
//
// harmony pass, 2026-09-08. This cut used to be its own world — a treasury over
// a 10x10 block, a tier dropping out of it, an endless pile of bills off to the
// right, a pull-back and a pan. Six seconds later in the edit, cut 4
// (`DebtExplainer`) said the same two things — tax revenue, and the debt — with
// a different object for each: a 20x5 bar with a readout, and five bonds with
// coupons. Two shapes for one fact, six seconds apart, is a cut. So this piece
// is rebuilt as cut 4's opening: the audience learns the column here and cut 4
// starts on the frame this one ends on.
//
// The model is cut 4's, minus the rate:
//   DEBT         five bonds — the bill glyph — in a row centred on x 540 at
//                y 690. They are there from the first frame: the debt is not
//                news, it is the thing the line is about. No coupons yet.
//   TAX REVENUE  the hundred as a WIDE BAR, twenty columns of five at y 980,
//                deep and 0.85x at rest. Twenty of them light — ripe, 1.2x,
//                column by column from the left — and the readout under the
//                bar says the same number as a percentage.
//   the RATE     nothing. That zone stays empty; cut 4 puts the line in it.
// Everything else about the frame is cut 4's frame: k 1.0, cx 540, cy 960,
// sway and nothing else, so the two cuts join without a jump.
//
// Every gesture is one word, and there are four of them.
//  1. the column, already assembled: five bonds in the
//     debt zone, the bar unlit in the revenue zone, no
//     labels, no coupons, no readout. Breath + sway   — "currently"        f0
//  2. the bar LIGHTS column-major from the left, one
//     column every 4 frames from f12, each dot on its
//     own 6-frame deep -> ripe ramp: four columns, so
//     twenty of the hundred. The readout `20%` HARD
//     TICKS in at f30, the frame the fourth column
//     finishes — no fade, because a counter that
//     clicks reads as a count                        — "twenty percent"   f12-30
//  3. `TAX REVENUE` fades in over 8 frames. The bar is
//     the revenue; the label only names it            — "of tax revenue"  f48-56
//  4. hold. Breath and sway                          — "spending goes
//                                                       towards"         f56-99
//  5. THE PAYMENT. Twenty travellers, one per lit dot,
//     leave on a hashed order one every 2.16 frames
//     from f99 — the lit dots STAY lit, a ripe copy
//     travels — each on its own shallow arc up to a
//     coupon slot under a bond, ten frames of travel.
//     On arrival the traveller BECOMES the coupon: it
//     seats at its slot, its radius has eased from a
//     lit bar dot's to a coupon's, and it stays. The
//     slots fill bond by bond left to right, A1..A4
//     each, so the first landing is f109 and the last
//     is f150, on "debt". `DEBT` fades in at f112 and
//     `TO INTEREST PAYMENTS` at f130                 — "servicing the debt,
//                                                       basically paying
//                                                       interest payments
//                                                       on the debt"     f99-150
//  6. hold resolved: cut 4's frame 0, minus the rate
//     line. Breath and sway                          — tail             f150-172
//
// There is no camera move, no ambient layer beyond breath and sway, and no
// gesture without a word.
//
// orange dwarkesh style: ACCENT / ACCENT_DEEP, solid dots with no stroke and
// the lit ladder carried by tone plus the lit/unlit radius rule, white ink at
// OP_READ, BG_DIM 0.45, one global drop-shadow 2/7/0.12, a per-icon
// drop-shadow 2/3/0.38 on the bonds, text in Söhne only.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(), // the bonds and all the type
  accent: z.string(), // ripe: a lit revenue dot, a traveller, a coupon
  accentDeep: z.string(), // deep: a revenue dot that is not going to interest
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
    currently: z.number(), // "currently"
    twenty: z.number(), // "20"              -> the bar starts lighting
    percent: z.number(), // "percent"
    ofTax: z.number(), // "of tax"           -> `TAX REVENUE`
    revenue: z.number(), // "revenue"
    spendingGoes: z.number(), // "spending goes"
    towards: z.number(), // "towards"
    servicing: z.number(), // "servicing"    -> the first traveller launches
    theDebt: z.number(), // "the debt"       -> `DEBT`
    basically: z.number(), // "basically"
    payingInterest: z.number(), // "paying interest" -> `TO INTEREST PAYMENTS`
    paymentsOnThe: z.number(), // "payments on the"
    debt: z.number(), // "debt"              -> the last traveller lands
    end: z.number(), // speech ends; tail to 172
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

const WORLD_W = 1080;
const WORLD_H = 1920;

// -- the column --------------------------------------------------------------
// Cut 4's geometry, imported whole. The five bonds land on 316..764 and the bar
// on 293..787 x 980..1084, which is exactly where cut 4 opens them.
const N_BONDS = 5;
const BOND_X = rowX(N_BONDS, COLUMN_CX);
const BAR_X = barX(COLUMN_CX);
const BAR_Y = barY(BAR_TOP);

// -- the twenty --------------------------------------------------------------
// Four columns of five. The lit region fills COLUMN-MAJOR FROM THE LEFT, so its
// length is the number: `litIndex` and `litSeat` are cut 4's, and a dot lit here
// is the same dot cut 4 finds lit at its frame 0.
const LIT_N = 20;
const LIT_COLS = LIT_N / BAR_ROWS; // 4
const COL_GAP = 4; // frames between columns
const DOT_LIGHT = 6; // frames, deep -> ripe, per dot

// -- the payment -------------------------------------------------------------
// One traveller per lit dot, one coupon slot per traveller: twenty of each, and
// the slots are the first row (A1..A4) under each of the five bonds, filled
// bond by bond left to right. The launch order is a hashed permutation of the
// lit dots, so the bar does not empty left to right while the coupons fill left
// to right — but the LANDINGS are in slot order, so the coupons still arrive as
// a readable sweep across the row.
const PAY_N = LIT_N;
const PAY_ORDER = rankBy(PAY_N, 41); // lit dot t lands in slot PAY_ORDER[t]

const TwentyPercentServicing: React.FC<Props> = ({
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
  const tone = makeTone(accentDeep, accent);

  // -- camera: none. The identity plus the hand, exactly as cut 4. ------------
  const drift = sway(frame);
  const cx = COLUMN_CX + drift.dx;
  const cy = SCENE_CY + drift.dy;
  const k = SCENE_K;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- the bar ---------------------------------------------------------------
  // A dot's lit ramp is read off its own column's start frame, so the fill and
  // the readout cannot drift apart when the beats move.
  const litStart = (n: number) => (n >= LIT_N ? Infinity : beats.twenty + COL_GAP * litSeat(n).col);
  const litAt = (n: number) => clamp01((frame - litStart(n)) / DOT_LIGHT);
  // the readout ticks the frame the last column finishes: f12 + 4*3 + 6 = f30
  const readoutTick = beats.twenty + COL_GAP * (LIT_COLS - 1) + DOT_LIGHT;

  // -- the payment -----------------------------------------------------------
  // Departures are spaced so the FIRST lands on "servicing" and the LAST on
  // "debt": twenty launches from f99, ten frames of travel, the last landing on
  // f150. Both numbers come off the beats, not off a parallel timer.
  const payGap = (beats.debt - TRAVEL_DUR - beats.servicing) / (PAY_N - 1); // 2.16
  const depAt = (rank: number) => beats.servicing + rank * payGap;
  const arriveAt = (rank: number) => depAt(rank) + TRAVEL_DUR;
  /** slot m, m = 0..19: coupon m % 4 under bond floor(m / 4) */
  const slotAt = (m: number) => couponAt(BOND_X[Math.floor(m / 4)], m % 4);

  const travellers: { key: string; x: number; y: number; r: number }[] = [];
  for (let t = 0; t < PAY_N; t++) {
    const rank = PAY_ORDER[t];
    const u = (frame - depAt(rank)) / TRAVEL_DUR;
    if (u <= 0 || u >= 1) continue;
    const seat = litSeat(t);
    const from = { x: BAR_X[seat.col], y: BAR_Y[seat.row] };
    const p = arcAt(from, slotAt(rank), u, (hash(t, 53) - 0.5) * PAY_ARC);
    travellers.push({
      key: `p${t}`,
      x: p.x,
      y: p.y,
      // it leaves as a lit bar dot and arrives the size of a coupon
      r: travellerR(u, dotRadius) * breath(frame, hash(t, 9)),
    });
  }

  const label = makeLabel(ink);
  const readout = makeReadout(ink);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={SCENE_CY}
        cx={cx}
        cxRest={COLUMN_CX}
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
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              overflow: "visible",
            }}
          >
            {/* the debt: five bonds, there from the first frame */}
            {BOND_X.map((x, s) => (
              <g key={`b${s}`} style={{ filter: icon }}>
                <path
                  d={BILL_D}
                  fill={ink}
                  fillRule="evenodd"
                  opacity={OP_READ}
                  transform={`translate(${x} ${BOND_CY})`}
                />
              </g>
            ))}

            {/* the coupons the payment seats, one per arrival, and they stay */}
            {Array.from({ length: PAY_N }, (_, m) => {
              if (frame < arriveAt(m)) return null;
              const p = slotAt(m);
              const s = Math.floor(m / 4);
              return (
                <circle
                  key={`c${m}`}
                  cx={p.x}
                  cy={p.y}
                  r={dotRadius * breath(frame, hash(s * 8 + (m % 4), 9))}
                  fill={accent}
                  opacity={dotOpacity}
                />
              );
            })}

            {/* the two zone labels */}
            {label(
              "l-debt",
              COLUMN_CX,
              DEBT_LABEL_Y,
              "DEBT",
              LABEL_OP * clamp01((frame - beats.theDebt) / LABEL_FADE),
            )}
            {label(
              "l-rev",
              COLUMN_CX,
              REVENUE_LABEL_Y,
              "TAX REVENUE",
              LABEL_OP * clamp01((frame - beats.ofTax) / LABEL_FADE),
            )}

            {/* the hundred, as a bar: tax revenue, and the share that is interest */}
            {BAR_Y.map((y, row) =>
              BAR_X.map((x, col) => {
                const t = litAt(litIndex(row, col));
                return (
                  <circle
                    key={`h${row}-${col}`}
                    cx={x}
                    cy={y}
                    r={barDotR(t) * breath(frame, hash(col * BAR_ROWS + row, 9))}
                    fill={tone(t)}
                    opacity={dotOpacity}
                  />
                );
              }),
            )}

            {/* the readout: the same count, said as a percentage. A hard tick. */}
            {frame < readoutTick ? null : readout("readout", COLUMN_CX, READOUT_Y, "20%", 1)}
            {label(
              "l-sub",
              COLUMN_CX,
              SUBLABEL_Y,
              "TO INTEREST PAYMENTS",
              LABEL_OP * clamp01((frame - beats.payingInterest) / LABEL_FADE),
            )}

            {/* the payment: one traveller per lit dot, one coupon slot each */}
            {travellers.map((t) => (
              <circle key={t.key} cx={t.x} cy={t.y} r={t.r} fill={accent} opacity={dotOpacity} />
            ))}
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default TwentyPercentServicing;
