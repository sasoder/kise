import { loadFont } from "@remotion/fonts";
import { Easing, staticFile } from "remotion";
import { DOT_RADIUS, OP_UNREAD, clamp01, hash } from "./fieldShared";

// ---------------------------------------------------------------------------
// What cut 3 (`TwentyPercentServicing`) and cut 4 (`DebtExplainer`) share.
//
// The two are six seconds apart in one edit and cut 3's last frame IS cut 4's
// first frame, so they are not two graphics that happen to look alike: they are
// one composition, opened in one piece and finished in the other. Everything
// that decides WHERE something sits, HOW BIG the type is and WHAT the debt and
// the revenue are made of lives here. A piece decides what happens; this file
// decides what it is made of.
//
// Cut 3 is the first act: the column, the bar lighting to twenty, the payment
// that seats the first row of coupons. Cut 4 is the same column with the rate
// line added on top and the arithmetic run through it. Neither restates a
// number below.
//
// `fieldShared.tsx` is still the layer under this one — palette, ladder, grid,
// vignette, camera, breath, hash. This file is the debt explainer's own
// vocabulary on top of it.
// ---------------------------------------------------------------------------

// -- type --------------------------------------------------------------------
// Söhne, the two weights this explainer needs, at module scope so a font failure
// surfaces before a single frame is drawn. Two families rather than two weights
// of one family: the numeral must be Dreiviertelfett and the labels Kräftig,
// and a browser asked for "Sohne 700" with only one face loaded will happily
// synthesise a bold instead of telling us. There is no fallback stack on
// purpose — if these do not load, the render is wrong and should look wrong.
export const NUMERAL_FONT = "SohneDreiviertelfett";
export const LABEL_FONT = "SohneKraftig";
loadFont({
  family: NUMERAL_FONT,
  url: staticFile("Sohne-Dreiviertelfett.otf"),
  weight: "700",
});
loadFont({
  family: LABEL_FONT,
  url: staticFile("Sohne-Kraftig.otf"),
  weight: "500",
});

export const LABEL_SIZE = 30;
export const LABEL_TRACK = "0.08em";
export const LABEL_OP = OP_UNREAD + 0.25; // 0.70
export const LABEL_FADE = 8; // frames, the one fade length for every label

// A zone label: uppercase Kräftig, white ink, anchored middle unless it has to
// ride the end of something. `makeLabel(ink)` closes over the piece's ink prop
// so the helper itself keeps the flat signature every call site uses.
export const makeLabel =
  (ink: string) =>
  (
    key: string,
    x: number,
    y: number,
    text: string,
    opacity: number,
    anchor: "start" | "middle" | "end" = "middle",
  ) => (
    <text
      key={key}
      x={x}
      y={y}
      fill={ink}
      opacity={opacity}
      textAnchor={anchor}
      style={{
        fontFamily: LABEL_FONT,
        fontWeight: 500,
        fontSize: LABEL_SIZE,
        letterSpacing: LABEL_TRACK,
      }}
    >
      {text}
    </text>
  );

// -- the readout -------------------------------------------------------------
// The percentage, said as a numeral, directly under the bar so the count and
// the number are one element. It changes by HARD TICK and never by a crossfade:
// a crossfade of any shape left a ghost numeral on the frame the word lands on,
// and a counter that clicks reads as a count where one that fades reads as a
// smear. SUBLABEL_DY is numeral baseline -> sublabel baseline.
export const READOUT_SIZE = 150;
export const SUBLABEL_DY = 45;

export const makeReadout =
  (ink: string) => (key: string, x: number, y: number, text: string, opacity: number) => (
    <text
      key={key}
      x={x}
      y={y}
      fill={ink}
      opacity={opacity}
      textAnchor="middle"
      style={{
        fontFamily: NUMERAL_FONT,
        fontWeight: 700,
        fontSize: READOUT_SIZE,
      }}
    >
      {text}
    </text>
  );

// -- the column --------------------------------------------------------------
// Both pieces are the identity camera — k 1.0, cx 540, cy 960, `sway` and
// nothing else — so every coordinate below is a SCREEN coordinate and the two
// cuts cannot land the same object on two different pixels. The column runs
// y 264..1290, clear of the caption band from ~1450.
//
//   RATE_Y          the rate line, cut 4 only (cut 3's rate zone is empty)
//   RATE_LABEL_Y    `INTEREST RATE`, under the line's ORIGINAL height
//   DEBT_LABEL_Y    `DEBT`
//   BOND_CY         the bond row's centre
//   COUNTER_Y       `YEAR n OF 5` / `+ $2T / YEAR`, one slot under the bonds
//   REVENUE_LABEL_Y `TAX REVENUE`
//   BAR_TOP         the bar's top row
//   READOUT_Y       the numeral's baseline
//   SUBLABEL_Y      `TO INTEREST PAYMENTS`
export const COLUMN_CX = 540;
export const SCENE_K = 1;
export const SCENE_CY = 960;
export const RATE_Y = 480;
export const RATE_LABEL_Y = 518;
export const DEBT_LABEL_Y = 600;
export const BOND_CY = 690;
export const COUNTER_Y = 850;
export const REVENUE_LABEL_Y = 950;
export const BAR_TOP = 980;
export const READOUT_Y = 1230;
export const SUBLABEL_Y = READOUT_Y + SUBLABEL_DY; // 1275

// -- the rate line -----------------------------------------------------------
// One stroke weight for the line and for every rung it leaves behind; the line
// is read (OP_READ at the call site), a rung is a height it has left (dashed,
// OP_UNREAD).
export const RATE_STROKE = 3;
export const RATE_DASH = "9 7";

// -- the bar: tax revenue ----------------------------------------------------
// The hundred as a WIDE BAR, twenty columns of five. A ten-by-ten block read as
// a square of dots you had to count; twenty by five read left to right is a bar
// with a fill level, and on a phone the lit fraction is legible at a glance.
// Lit = ripe at 1.2x, unlit = deep at 0.85x, and the lit region fills
// COLUMN-MAJOR FROM THE LEFT — column 0 top to bottom, then column 1 — so its
// length IS the number: twenty is four columns, twenty-five five, forty eight,
// sixty-four twelve columns and four dots of the thirteenth.
export const BAR_COLS = 20;
export const BAR_ROWS = 5;
export const BAR_STEP = 26;
export const BAR_R = 7; // the bar's own base radius; a coupon stays at DOT_RADIUS
export const HUNDRED = BAR_COLS * BAR_ROWS;
export const BAR_LIT_R = 1.2; // a lit dot
export const BAR_UNLIT_R = 0.85; // ...and one that is not

/** a bar dot's radius at lit-ness t: deep at 0.85x, ripe at 1.2x */
export const barDotR = (t: number) => BAR_R * (BAR_UNLIT_R + (BAR_LIT_R - BAR_UNLIT_R) * t);

/** the twenty column centres for a bar centred on `cx`: 293..787 at cx 540 */
export const barX = (cx: number) =>
  Array.from({ length: BAR_COLS }, (_, j) => cx + (j - (BAR_COLS - 1) / 2) * BAR_STEP);
/** the five row centres for a bar whose top row is at `top`: 980..1084 */
export const barY = (top: number) => Array.from({ length: BAR_ROWS }, (_, i) => top + BAR_STEP * i);

export const litSeat = (n: number) => ({
  row: n % BAR_ROWS,
  col: Math.floor(n / BAR_ROWS),
});
export const litIndex = (row: number, col: number) => col * BAR_ROWS + row;

// -- the bond row: the debt --------------------------------------------------
// One bill glyph is 88 x 96 world px — a rounded top, a torn receipt bottom of
// eleven teeth, and four cut-out lines taken out of it by `fillRule="evenodd"`
// so the field shows through them. White, with one `iconShadow(k)` each. It is
// the same object in both cuts: cut 3 calls it the debt and cut 4 rolls it.
export const BOND_W = 88;
export const BOND_H = 96;
export const BOND_PITCH = 112;
export const BILL_D = [
  // the body: rounded top corners, straight sides, a torn bottom
  "M-36,-48 h72 a8,8 0 0 1 8,8 v82 l-8,6 l-8,-6 l-8,6 l-8,-6 l-8,6 l-8,-6 l-8,6 l-8,-6 l-8,6 l-8,-6 l-8,6 v-88 a8,8 0 0 1 8,-8 z",
  // four cut-out lines, the last one short
  "M-22,-32 h44 a4,4 0 0 1 4,4 v2 a4,4 0 0 1 -4,4 h-44 a4,4 0 0 1 -4,-4 v-2 a4,4 0 0 1 4,-4 z",
  "M-22,-12 h44 a4,4 0 0 1 4,4 v2 a4,4 0 0 1 -4,4 h-44 a4,4 0 0 1 -4,-4 v-2 a4,4 0 0 1 4,-4 z",
  "M-22,8 h44 a4,4 0 0 1 4,4 v2 a4,4 0 0 1 -4,4 h-44 a4,4 0 0 1 -4,-4 v-2 a4,4 0 0 1 4,-4 z",
  "M-22,28 h24 a4,4 0 0 1 4,4 v2 a4,4 0 0 1 -4,4 h-24 a4,4 0 0 1 -4,-4 v-2 a4,4 0 0 1 4,-4 z",
].join(" ");

/** the centres of `n` bonds centred on `cx`: five land on 316..764 at cx 540 */
export const rowX = (n: number, cx: number) =>
  Array.from({ length: n }, (_, i) => cx + (i - (n - 1) / 2) * BOND_PITCH);

// The coupons: what a bond costs per year, as solid ripe dots under it. Rows of
// four, filled A1..A4 then B1..B4 on a 22px pitch, both rows inside the bond's
// own 88px width so five bonds carrying eight coupons still read as five groups
// rather than one bar — which matters because the revenue block below IS one
// bar. A coupon's radius is DOT_RADIUS, not BAR_R: it is a unit, not a fraction.
export const COUPON_X = [-33, -11, 11, 33];
export const COUPON_ROW_DY = [80, 102]; // from the bond's centre
export const COUPON_Y = COUPON_ROW_DY.map((dy) => BOND_CY + dy); // 770, 792
export const COUPON_R = DOT_RADIUS;
export const couponAt = (bx: number, c: number) => ({
  x: bx + COUPON_X[c % 4],
  y: COUPON_Y[Math.floor(c / 4)],
});

// -- the payment -------------------------------------------------------------
// A revenue dot flying to a coupon, in both cuts: it leaves the bar as a lit
// dot and arrives the size of a coupon, on its own shallow arc, eased in and
// never overshooting. Ten frames of travel and a bow of up to +/- 45px, so a
// group of them never travels in unison.
export const TRAVEL_DUR = 10;
export const PAY_ARC = 90;

export type P = { x: number; y: number };

export const arcAt = (a: P, b: P, lin: number, arc: number): P => {
  const e = Easing.out(Easing.cubic)(lin);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const L = Math.hypot(dx, dy) || 1;
  const bow = Math.sin(Math.PI * e) * arc;
  return {
    x: a.x + dx * e + (-dy / L) * bow,
    y: a.y + dy * e + (dx / L) * bow,
  };
};

/** a deterministic permutation: `rankBy(n, seed)[t]` is t's place in the order */
export const rankBy = (n: number, seed: number) => {
  const idx = Array.from({ length: n }, (_, i) => i);
  idx.sort((a, b) => hash(a, seed) - hash(b, seed));
  const rank = new Array<number>(n);
  idx.forEach((t, r) => {
    rank[t] = r;
  });
  return rank;
};

/** a traveller's radius: a lit bar dot at launch, a coupon on arrival */
export const travellerR = (u: number, dotRadius: number) =>
  BAR_R * BAR_LIT_R + (dotRadius - BAR_R * BAR_LIT_R) * clamp01(u);
