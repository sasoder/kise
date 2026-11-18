// ---------------------------------------------------------------------------
// WorthMoreThanAYearAgo (toto-worth-twelve, cut 49). Cheeky Pint style (stout) (styles/cheeky-pint.md), the stout
// board, palette B1. Opaque 1080x1920, 25 fps, 82 frames. Builder A. The clip's last frame. World: ./worthShared,
// the TALL value scale (VALUE_PX_PER_B_TALL 21 world px per $1B), as cut 29.
//
// CHECK LINE: "Mercedes is worth much more today than it was a year ago."
//
// THE LINE: "but | we could value the business today much more than it was a year ago. yeah"
// WORD -> FRAME: we 3 · could 7 · value 12 · the 20 · business 25 · today 30 · much 37 · more 45 · than 51 · it 55 ·
//   was 58 · a 61 · year 64 · ago 68 · yeah 73.
// DURATION: the slot 49.640 -> 52.920 s = 3.28 s x 25 = 82 frames (f0..f81).
//
// THE MOTION: the Mercedes tile and its amber column from cut 29's world, opening at the $6B level (a year ago; no
// numeral) under a slow push. On "today" a board notch slides out from behind the column's left side at that level,
// and on "much more" the amber climbs out of it to $12B (glass and fill together, rest to rest), the camera easing
// back so the whole column and the notch far below it stay in. On "a year ago" a cream card with "A YEAR AGO" in ink
// slides up beside the notch. Resolved: the tall amber column, the notch at its middle with its card, a gentle creep.
//   Gestures -> word -> frames:
//     $6B column, slow push in, light pool on it                    -> "we could value the business" f0-30
//     the notch slides out from behind the column (out of an occluder) -> "today"                     f30-40
//     the amber climbs $6B -> $12B (the $6B notch at half its height) -> "much more"                  f37-55
//     the camera eases back and left, making room for the card        -> "more than it was"           f30-66
//     "A YEAR AGO" card slides up + fades in at the notch            -> "a year ago"                  f60-70
//     creep                                                           -> "ago yeah"                    f70-81
// AMBER = Mercedes' value (the clip: Mercedes' money). board = the past (the notch); cream card = the one label.
//
// SOURCES: $6B = the George Kurtz deal, Nov 2025 (GBP 4.57B / $5.97B; CNBC 20 Nov 2025). Today's height = $12B, the
// top of Toto's "10, 12 billion" (cut 29). No numerals on screen. Logo: the Mercedes-AMG PETRONAS F1 lockup.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  COLOR,
  ElevationShadow,
  FONT_LABEL,
  GEO,
  METRIC,
  StoutStage,
  TRACK,
  amberBandFor,
  clamp01,
  easeOutCubic,
  labelWidth,
  lerp,
  rectPath,
  snapLen,
} from "../kits/cheeky-pint/stoutShared";
import { makeClockCam, makePoolTrack, restToRest, type Cam } from "../kits/cheeky-pint/museShared";
import {
  DATA,
  DY,
  FIG,
  FLOOR,
  TILE_TALL,
  VALUE_TALL_RUNG,
  ValueColumn,
  X_MERC,
  keepInMiss,
  restCam,
  sxOf,
  syOf,
  valueHTall,
} from "./worthShared";

export const FPS = 25;
export const DURATION = 82;
/** The tall-scale tile (as cut 29): columns leave its top edge. */
const TILE_TOP = FLOOR - TILE_TALL;
export const schema = z.object({
  // a "TODAY" card at the top of the column (the brief: only if the read fails without it)
  todayLabel: z.boolean().default(false),
});
export const defaultProps = schema.parse({});

// --- beats ---------------------------------------------------------------------------------------------
const NOTCH = [30, 40] as const;
const CLIMB = [37, 55] as const;
const CARD = [60, 70] as const;
const TODAY = [44, 54] as const;

// --- heights (world) --------------------------------------------------------------------------------------
const K_END = 2.02;
const H12 = snapLen(valueHTall(DATA.MERC_VALUE_HI), K_END); // ~252
const H6 = H12 * (DATA.MERC_VALUE_YEAR_AGO / DATA.MERC_VALUE_HI); // ~126: exactly half
const colH = (f: number) => lerp(H6, H12, restToRest(clamp01((f - CLIMB[0]) / (CLIMB[1] - CLIMB[0])), 2.5));

// --- the notch and the card (screen px sizes, drawn in world) ---------------------------------------------
const NOTCH_LEN = 30; // world px out of the column's left side
const NOTCH_TH = 9; // world px thick
const CARD_PX = 52; // type in the card (a label that must be read: inside its card, in ink, larger)
const CARD_PAD_X = 24;
const CARD_PAD_Y = 20;
const CARD_GAP = 6; // screen px, notch tip to card
const cardW = (text: string) => labelWidth(text, CARD_PX) + 2 * CARD_PAD_X;
const CARD_H = CARD_PX * METRIC.cap + 2 * CARD_PAD_Y;

// --- camera: open close on the $6B column, ease back and left as it climbs and the card arrives -----------
const K_OPEN = 2.66;
const CAM_OPEN = restCam(X_MERC, 540, 1050, K_OPEN);
// the end: the column right of centre so the card at its left and the column balance about x 540
const END_COL_SX = 540 + (cardW("A YEAR AGO") + CARD_GAP + NOTCH_LEN * K_END) / 2;
const CAM_END = restCam(X_MERC, END_COL_SX, 1062, K_END);
const CAM = makeClockCam(
  { x: CAM_OPEN.x, y: CAM_OPEN.y, k: K_OPEN },
  [
    { f0: -20, f1: 26, k: 2.72 }, // the slow push on the year-ago column
    { f0: 22, f1: 60, k: K_END * 1.012, dy: CAM_END.y - CAM_OPEN.y, warp: 0.8 },
    { f0: 40, f1: 72, dx: CAM_END.x - CAM_OPEN.x },
    { f0: 66, f1: 140, k: K_END }, // the creep
  ],
  DURATION,
);
export const camAt = (f: number): Cam => CAM.at(f);
const POOL = makePoolTrack({ x: X_MERC, y: TILE_TOP - 60 }, [{ f0: 34, f1: 70, x: X_MERC - 30, y: TILE_TOP - 130 }], DURATION);

// --- screen boxes for the keep-in check --------------------------------------------------------------------
export const boxesAt = (f: number) => {
  const c = camAt(f);
  const out: { name: string; x0: number; x1: number; y0: number; y1: number }[] = [];
  out.push({ name: "merc", x0: sxOf(c, X_MERC - TILE_TALL / 2), x1: sxOf(c, X_MERC + TILE_TALL / 2), y0: syOf(c, TILE_TOP - colH(f)), y1: syOf(c, FLOOR) + 4 });
  if (f >= CARD[0] + 3) {
    const tip = sxOf(c, X_MERC - GEO.BAR / 2 - NOTCH_LEN) - CARD_GAP;
    const y = syOf(c, TILE_TOP - H6);
    out.push({ name: "card", x0: tip - cardW("A YEAR AGO"), x1: tip, y0: y - CARD_H / 2, y1: y + CARD_H / 2 });
  }
  return out;
};
export const keepInMisses = () => {
  const out: string[] = [];
  for (let f = 0; f < DURATION; f++) for (const b of boxesAt(f)) if (keepInMiss(b) > 2) out.push(`f${f} ${b.name} out by ${keepInMiss(b).toFixed(1)} px`);
  return out;
};

/** A cream card with an ink label, anchored by its right edge (anchor "end") or centre, in SCREEN px sizes. */
const InkCard: React.FC<{ x: number; y: number; k: number; text: string; enter: number; anchor: "end" | "middle" }> = ({ x, y, k, text, enter, anchor }) => {
  const a = easeOutCubic(enter);
  if (a <= 0.002) return null;
  const w = cardW(text) / k;
  const h = CARD_H / k;
  const x0 = anchor === "end" ? x - w : x - w / 2;
  const y0 = y - h / 2 + ((1 - a) * 24) / k;
  const fs = CARD_PX / k;
  const d = rectPath(x0, y0, w, h, GEO.RADIUS);
  return (
    <g opacity={a}>
      <ElevationShadow silhouette={[{ d }]} elevation="rest" />
      <path d={d} fill={COLOR.cream} />
      <path d={`M${x0 + GEO.RADIUS} ${y0 + 0.75 / k}H${x0 + w - GEO.RADIUS}`} stroke={COLOR.edge} strokeOpacity={0.6} strokeWidth={1.5 / k} />
      <text
        x={x0 + w / 2 + (TRACK.label * fs) / 2}
        y={y0 + h / 2 + (CARD_PX * METRIC.cap) / 2 / k}
        fontFamily={FONT_LABEL}
        fontWeight={500}
        fontSize={fs}
        letterSpacing={`${TRACK.label}em`}
        textAnchor="middle"
        fill={COLOR.inkDark}
        style={{ fontFeatureSettings: '"case" 1, "lnum" 1' }}
      >
        {text.toUpperCase()}
      </text>
    </g>
  );
};

const WorthMoreThanAYearAgo: React.FC<z.infer<typeof schema>> = ({ todayLabel }) => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const k = cam.k;
  const h = colH(f);
  // the notch slides out from behind the column's left side (out of an occluder), board tone
  const n = restToRest(clamp01((f - NOTCH[0]) / (NOTCH[1] - NOTCH[0])), 2.2);
  const colL = X_MERC - GEO.BAR / 2;
  const notchY = TILE_TOP - H6;
  const notchD = rectPath(colL - NOTCH_LEN * n, notchY - NOTCH_TH / 2, NOTCH_LEN + 2, NOTCH_TH, 2);
  const tipX = colL - NOTCH_LEN - CARD_GAP / k;
  return (
    <StoutStage S={f} cam={cam} rest={CAM.rest} pool={POOL(f)} dy={DY}>
      {n > 0 ? <path d={notchD} fill={COLOR.board} /> : null}
      <ValueColumn x={X_MERC} tile={TILE_TALL} k={k} figure={FIG.MERC} rung={VALUE_TALL_RUNG} glass={h} fill={h} glassHi={1} amberBand={amberBandFor(cam)} />
      <InkCard x={tipX} y={notchY} k={k} text="a year ago" enter={clamp01((f - CARD[0]) / (CARD[1] - CARD[0]))} anchor="end" />
      {todayLabel ? (
        <InkCard x={X_MERC} y={TILE_TOP - h - (CARD_H / 2 + 24) / k} k={k} text="today" enter={clamp01((f - TODAY[0]) / (TODAY[1] - TODAY[0]))} anchor="middle" />
      ) : null}
    </StoutStage>
  );
};

export default WorthMoreThanAYearAgo;

// --- load-time checks ------------------------------------------------------------------------------------
{
  const fail = (m: string) => {
    throw new Error(`WorthMoreThanAYearAgo: ${m}`);
  };
  if (Math.abs(H6 - valueHTall(DATA.MERC_VALUE_YEAR_AGO)) > 1) fail("the $6B notch must sit at half of the $12B column");
  const misses = keepInMisses();
  if (misses.length && !(globalThis as { __WORTH_PROBE__?: boolean }).__WORTH_PROBE__) fail(`${misses[0]} (+${misses.length - 1} more)`);
}
