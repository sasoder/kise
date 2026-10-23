// ---------------------------------------------------------------------------
// npsColumnsPlan — the pure plan of cut 3, MinusSixtyToPlusSixty (scott-radar-map): geometry in the cut's world
// px (= the resolved frame's screen px at k 1, look (540, 960)), the beat frames, the two columns' length curves,
// the radar phone's arrival and the camera glides. No React, so a planner script can import it.
// The chart-plane <-> AirCam mapping follows scott-aircraft-order/returnsHugePlan.ts (copied, not imported).
// ---------------------------------------------------------------------------

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ss = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};

/** ZERO on the NPS scale: the apron slab's near cut edge, at the frame's true middle in the resolved frame. */
export const GROUND = 964;
/** One rung = 10 NPS on both columns; 6 rungs = 60 NPS each way. */
export const RUNG = 76;
export const NPS_PER_RUNG = 10;
/** 60 NPS in world px */
export const SPAN = 6 * RUNG;
/** Column width and the two slots (left = the plain text, right = the radar picture); symmetric about x 540. */
export const COL_W = 130;
export const LEFT_X = 375;
export const RIGHT_X = 705;
/** The +60 column: glass `SPAN + headroom` tall, its amber fill exactly SPAN. */
export const UP = { x: RIGHT_X, w: COL_W, headroom: 20, H: SPAN + 20 } as const;
/** The −60 column: glass `SPAN + gap` deep, its umber fill exactly SPAN. */
export const DOWN = { x: LEFT_X, w: COL_W, gap: 12, D: SPAN + 12 } as const;

/** The phones (radarPhone), standing on the apron just behind the cut edge, outside each column. `w` = body
 *  width in world px, sized so the body is ~434 px tall at rest (radarPhone's 780 x 1820 body: 186 x 434), the
 *  height the layout was approved with; each phone stays centred in a 200 px stand-place `place` beside its column.
 *  The left (plain) one is there from f0, the right (radar) one slides in lifted from the right frame edge and settles. */
export const PHONE = { w: 186, place: 200, gapToCol: 26 } as const;
export const PHONE_L_X = LEFT_X - COL_W / 2 - PHONE.gapToCol - PHONE.place / 2;
export const PHONE_R_X = RIGHT_X + COL_W / 2 + PHONE.gapToCol + PHONE.place / 2;
/** the phones' feet stand a hair behind the cut edge */
export const PHONE_FOOT = GROUND - 4;

/** United's 787-10 far back on the apron, in the clear stretch between the left phone and the right column. */
export const JET = { cx: 440, len: 290 } as const;

/** The "0" tick and the "NPS" label at the left margin (world px): a short cream tick on the cut edge and "0 NPS" on
 *  one line on the soil just below the zero line (out of the caption bands: its baseline sits above y 1080). */
export const ZERO_TICK = { x: 64, len: 40, zeroPx: 56, npsPx: 40, baseline: GROUND + 102, gap: 14 } as const;

/** Beats (frames at 24000/1001, the brief's word table). */
export const BEAT = {
  think: 2,
  numbers: 9,
  were: 16,
  negative: 20,
  sixty1: 32,
  nps: 44,
  on: 57,
  normal: 69,
  sending: 83,
  it: 88,
  plus: 98,
  sixty2: 108,
  when: 118,
  picture: 138,
  map: 146,
} as const;

// --- the −60 column -----------------------------------------------------------------------------------------
/** its slot parts on "numbers", the column sinks from "negative" and lands at −60 before "NPS" */
export const SLOT_DOWN = { f0: 9, f1: 19 } as const;
export const SINK = { f0: 20, f1: 43 } as const;
/** ease: a soft start, a long even middle, a weighty settle */
const travel = (u: number) => {
  const x = clamp01(u);
  const quad = x < 0.5 ? 2 * x * x : 1 - 2 * (1 - x) * (1 - x);
  return 0.55 * ss(x) + 0.45 * quad;
};
/** glass depth below zero at frame f */
export const downD = (f: number) => DOWN.D * travel((f - SINK.f0) / (SINK.f1 - SINK.f0));
/** the fill's length (the NPS reading) for a glass depth d: the mirror of the reference's headroom rule */
export const downFill = (d: number) => Math.max(0, d - DOWN.gap * Math.min(1, d / (DOWN.gap * 4)));

// --- the radar phone ----------------------------------------------------------------------------------------
/** slides in from beyond the right frame edge, lifted one level, on "sending it", and settles by f90 */
export const PHONE_IN = { f0: 70, f1: 88, settle: 92, fromX: 1240, lift: 26 } as const;
export const phoneRX = (f: number) => {
  const u = clamp01((f - PHONE_IN.f0) / (PHONE_IN.f1 - PHONE_IN.f0));
  // constant-ish speed in, decelerating into place (a real thing slows as it is set down)
  const e = 1 - Math.pow(1 - u, 2.4);
  return PHONE_IN.fromX + (PHONE_R_X - PHONE_IN.fromX) * e;
};
/** 1 = lifted, 0 = resting on the apron (settles over the last frames of the travel) */
export const phoneRLift = (f: number) => 1 - ss((f - (PHONE_IN.f1 - 6)) / (PHONE_IN.settle - (PHONE_IN.f1 - 6)));

// --- the +60 column -----------------------------------------------------------------------------------------
/** its slot parts once the phone has settled, the column rises from "Plus" and lands at +60 by ~"when" */
export const SLOT_UP = { f0: 89, f1: 97 } as const;
export const RISE = { f0: 97, f1: 116 } as const;
export const upH = (f: number) => UP.H * travel((f - RISE.f0) / (RISE.f1 - RISE.f0));
export const upFill = (h: number) => Math.max(0, h - UP.headroom * Math.min(1, h / (UP.headroom * 4)));

// --- the numerals -------------------------------------------------------------------------------------------
/** Söhne Dreiviertelfett at TYPE.SECONDARY in world px at k 1 (so it scales with the world under the camera);
 *  `cap` = its cap height (measured on the render), `gap` = world px between the column's end and the numeral.
 *  Each numeral enters WHOLE (no count: the column is the count) the frame its column lands, with the stout
 *  entrance (blur-in + a 24 px slide toward its column's end) over `enterF` frames. */
export const NUM = { px: 136, cap: 98, gap: 36, minusIn: 43, plusIn: 116, enterF: 10, slide: 24 } as const;

// --- the NPS note --------------------------------------------------------------------------------------------
/** "*Net Promoter Score": one line in WORLD space on the dark soil just under the slab's cut face, LEFT-aligned 34 px
 *  right of the −60 column's glass, on the same baseline as "0 NPS*" (ZERO_TICK.baseline), so the two labels flank
 *  the column and move with the earth. Left-aligned (not at the right margin) so the whole line is inside the frame
 *  when it enters during the dip (f44: the frame's right edge is at world x ~853). Söhne Kräftig in sentence case
 *  (stoutShared loads no text weight), cream-lo; it enters on "NPS" (f44) with the stout entrance and stays. */
export const NPS_NOTE = { text: "*Net Promoter Score", x: 474, px: 38, in: 44, enterF: 10 } as const;

// --- the camera ---------------------------------------------------------------------------------------------
/** makeClockCam LOOK + k. Opens pushed in on the plain phone and its slot (the apron edge at mid-frame, the radar
 *  slot empty), creeping; dips with the sinking column to frame the whole −60 column and its numeral; rises back
 *  past zero as the radar phone arrives and climbs with the +60 cap; then one blended pull-back to the whole
 *  picture (look (540, 960), k 1) and the living creep. */
export const CAM_START = { x: 318, y: 958, k: 1.27 } as const;
export const CAM_GLIDES = [
  { f0: -36, f1: 24, dx: 22, dy: 4, k: 1.4 },
  { f0: 10, f1: 52, dx: 70, dy: 520, k: 1.14 },
  { f0: 54, f1: 100, dx: 250, dy: -540, k: 1.16 },
  { f0: 86, f1: 118, dx: -10, dy: -330, k: 1.12 },
  { f0: 102, f1: 140, dx: -110, dy: 348, k: 1.0 },
  { f0: 132, f1: 190, k: 1.05 },
] as const;

// ---------------------------------------------------------------------------
// THE CHART PLANE IN THE WORLD (aircraftShared's pinhole, side mode, yaw 0, pitch 0), as returnsHugePlan.ts:
// the columns and the earth section live on the plane Z = ZC (the apron's cut front edge), drawn as a 2D overlay
// in the cut's px; a plane of constant Z projects flat, so the 2D look maps exactly onto a side AirCam.
// ---------------------------------------------------------------------------
export const F0 = 2310;
export const ZC = 330;
export const ZJ = 544;
export const EYE = 18;
export const S0 = F0 / ZC;
export const airCamOf = (c: { x: number; y: number; k: number }) => ({
  mode: "side" as const,
  x: (c.x - 540) / S0,
  y: EYE,
  z: 0,
  f: F0 * c.k,
  horizon: 960 + c.k * (GROUND - c.y - S0 * EYE),
});
export const JET_AT: [number, number] = [((JET.cx - 540) * ZJ) / F0, ZJ];
