// ---------------------------------------------------------------------------
// newsShared (caro-firing-moses): builder C's parts for the two NEW silhouette-pictogram cuts, Forfeit (cut 71.083)
// and FrontPages (cut 93.667). The look is the show's hydra graphic (COMMON.md look 1): the sister clip's ground,
// grain and white bloom are imported read-only from robert-graft-machine/graftShared.tsx; everything here is drawn
// in WORLD px (1080 x 1920 frame) in the same manner: flat near-black silhouettes, near-white details that the
// bloom lifts, no colour.
//
// Parts: the resignation slip (the same words as ResignForm's form) and its ACCEPTED imprint, the rubber stamp,
// the three half-built Moses projects (suspension bridge, elevated parkway, Jones Beach-style water tower) with
// their plans as white dash lists, the cranes, the winged money sack, the front page (masthead shapes, headline,
// picture box, grey text bars) and the small hunched politician.
// Fonts: Old Standard TT 400/700 (the slip, the headline: the closest Google face to the form's Century-style
// serif); labels come from A's firingShared when the Mayor's hand is in.
// ---------------------------------------------------------------------------
import React from "react";
import { random } from "remotion";
import { loadFont as loadOldStandard } from "@remotion/google-fonts/OldStandardTT";
import { F_INK, F_WHITE } from "./firingShared";
import { LABEL_FONT } from "../robert-graft-machine/graftShared";

// the clip's own hydra tones (builder A measured them on the show's 4K frames; grain sits on the ground only, so
// these are the rendered values)
export const INK = F_INK;
export const WHITE = F_WHITE;

const { fontFamily: OLD_STANDARD } = loadOldStandard("normal", { weights: ["400", "700"], subsets: ["latin"] });
export const SERIF = OLD_STANDARD;

export const lift = (v: number) => `rgb(${v},${v},${v})`;
export const PAPER = lift(216); // the slip and the newspapers: a shade under the hand's white, so the hand reads on them
export const n = (v: number) => Math.round(v * 1000) / 1000;
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const prog = (f: number, a: number, b: number, ease: (t: number) => number = (t) => t) =>
  ease(clamp01((f - a) / (b - a)));
export type Pt = [number, number];

export const BAR_GREY = lift(150); // body-text bars on the front page
export const PAPER_SHADE = lift(176); // the paper's shaded underside / stacked edges
export const DASH_WHITE = WHITE;

// ---------------------------------------------------------------------------------------------------------------
// The resignation slip: a flat white sheet, 560 x 280 at s 1, anchored at its CENTRE. Local layout (centre origin):
// "CITY OF NEW YORK" small caps, "RESIGNATION" big (the readable part), a short rule, the typed line "I, Robert Moses,
// do hereby resign" (the words of the form the viewer has just seen), a blank line. The ACCEPTED imprint sits on the
// lower right (IMPRINT_LOCAL) when `inked`.
// ---------------------------------------------------------------------------------------------------------------
export const SLIP_W = 560;
export const SLIP_H = 240;
// the imprint's centre in slip units; it is drawn at the STAMP's size (imprintS = stamp scale / slip scale)
export const IMPRINT_LOCAL: Pt = [-84, 82];
export const IMPRINT_ROT = -5;
// the imprint scale (slip units) used in Forfeit (stamp 0.86 on a 640 px slip): FrontPages reuses it, same artwork
export const SLIP_IMPRINT_S = 0.86 / (640 / 560);
export const IMPRINT_W = 236;
export const IMPRINT_H = 74;

export const AcceptedMark: React.FC<{ x: number; y: number; rot?: number; s?: number }> = ({ x, y, rot = IMPRINT_ROT, s = 1 }) => (
  <g transform={`translate(${n(x)} ${n(y)}) rotate(${n(rot)}) scale(${n(s)})`}>
    <rect x={-IMPRINT_W / 2} y={-IMPRINT_H / 2} width={IMPRINT_W} height={IMPRINT_H} rx={6} fill="none" stroke={INK} strokeWidth={6} />
    <rect
      x={-IMPRINT_W / 2 + 9}
      y={-IMPRINT_H / 2 + 9}
      width={IMPRINT_W - 18}
      height={IMPRINT_H - 18}
      rx={3}
      fill="none"
      stroke={INK}
      strokeWidth={2.2}
    />
    <text
      x={0}
      y={17}
      fontFamily={SERIF}
      fontWeight={700}
      fontSize={47}
      fill={INK}
      textAnchor="middle"
      textLength={190}
      lengthAdjust="spacingAndGlyphs"
    >
      ACCEPTED
    </text>
  </g>
);

export const Slip: React.FC<{
  x: number;
  y: number;
  s?: number;
  rot?: number;
  inked?: boolean;
  imprintS?: number;
  id: string;
}> = ({ x, y, s = 1, rot = 0, inked = false, imprintS = 1 }) => (
  <g transform={`translate(${n(x)} ${n(y)}) rotate(${n(rot)}) scale(${n(s)})`}>
    <rect x={-SLIP_W / 2} y={-SLIP_H / 2} width={SLIP_W} height={SLIP_H} fill={PAPER} />
    <text
      x={0}
      y={-84}
      fontFamily={SERIF}
      fontWeight={700}
      fontSize={17}
      fill={INK}
      textAnchor="middle"
      letterSpacing={5}
    >
      CITY OF NEW YORK
    </text>
    <text
      x={0}
      y={-24}
      fontFamily={SERIF}
      fontWeight={700}
      fontSize={62}
      fill={INK}
      textAnchor="middle"
      textLength={440}
      lengthAdjust="spacingAndGlyphs"
    >
      RESIGNATION
    </text>
    <rect x={-60} y={-6} width={120} height={2.6} fill={INK} />
    <text x={-236} y={32} fontFamily={SERIF} fontWeight={400} fontSize={23} fill={INK}>
      I, Robert Moses, do hereby resign
    </text>
    <rect x={118} y={30} width={118} height={2} fill={INK} />
    {inked && <AcceptedMark x={IMPRINT_LOCAL[0]} y={IMPRINT_LOCAL[1]} s={imprintS} />}
  </g>
);

// ---------------------------------------------------------------------------------------------------------------
// The rubber stamp (black silhouette, a fine white seam between block and rubber). Anchored at the CENTRE OF THE
// RUBBER FACE; the knob's centre is STAMP_KNOB above it (where the hand pinches it).
// ---------------------------------------------------------------------------------------------------------------
export const STAMP_KNOB = 146;
// the block is as tall as the imprint, so on contact (face on the imprint's bottom edge) it covers the imprint
export const RubberStamp: React.FC<{ x: number; y: number; rot?: number; s?: number }> = ({ x, y, rot = 0, s = 1 }) => (
  <g transform={`translate(${n(x)} ${n(y)}) rotate(${n(rot)}) scale(${n(s)})`}>
    <rect x={-122} y={-9} width={244} height={9} rx={2} fill={INK} />
    <rect x={-118} y={-82} width={236} height={74} rx={5} fill={INK} />
    <rect x={-116} y={-11} width={232} height={2.6} fill={WHITE} />
    <path d="M-17 -82 L-11 -124 L11 -124 L17 -82 Z" fill={INK} />
    <ellipse cx={0} cy={-STAMP_KNOB} rx={29} ry={25} fill={INK} />
  </g>
);

// ---------------------------------------------------------------------------------------------------------------
// Plans: dashed white outlines of what is not built yet, as explicit dash lists so each dash can break off and fall.
// ---------------------------------------------------------------------------------------------------------------
export type Poly = { pts: Pt[]; closed?: boolean; w?: number };
export type Dash = { a: Pt; b: Pt; c: Pt; w: number; along: number; key: number };

export const dashify = (polys: Poly[], dash = 13, gap = 9, seed = 0): Dash[] => {
  // each straight segment gets its own whole pattern, centred so both ends look alike
  const out: Dash[] = [];
  polys.forEach((p, pi) => {
    const pts = p.closed ? [...p.pts, p.pts[0]] : p.pts;
    let along = 0;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const L = Math.hypot(x1 - x0, y1 - y0);
      const ux = (x1 - x0) / (L || 1);
      const uy = (y1 - y0) / (L || 1);
      const count = Math.max(1, Math.floor((L + gap) / (dash + gap)));
      const used = count * dash + (count - 1) * gap;
      const start = (L - used) / 2;
      for (let k = 0; k < count; k++) {
        const s0 = Math.max(0, start + k * (dash + gap));
        const s1 = Math.min(L, s0 + dash);
        if (s1 - s0 < 2.5) continue;
        const a: Pt = [x0 + ux * s0, y0 + uy * s0];
        const b: Pt = [x0 + ux * s1, y0 + uy * s1];
        out.push({ a, b, c: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], w: p.w ?? 4.2, along: along + s0, key: seed * 1000 + pi * 100 + out.length });
      }
      along += L;
    }
  });
  return out;
};

// One dash, intact or falling. fall: frames since it broke off (<= 0 = intact).
export const FallingDash: React.FC<{ d: Dash; fall: number; seed: string }> = ({ d, fall, seed }) => {
  let dx = 0;
  let dy = 0;
  let rot = 0;
  if (fall > 0) {
    const vx = (random(`${seed}vx${d.key}`) - 0.5) * 3.2;
    const vy = -1.2 - random(`${seed}vy${d.key}`) * 1.6;
    const g = 4.6;
    const w = (random(`${seed}w${d.key}`) - 0.5) * 26;
    dx = vx * fall;
    dy = vy * fall + 0.5 * g * fall * fall;
    rot = w * fall;
  }
  const hx = (d.b[0] - d.a[0]) / 2;
  const hy = (d.b[1] - d.a[1]) / 2;
  return (
    <g transform={`translate(${n(d.c[0] + dx)} ${n(d.c[1] + dy)}) rotate(${n(rot)})`}>
      <line x1={n(-hx)} y1={n(-hy)} x2={n(hx)} y2={n(hy)} stroke={DASH_WHITE} strokeWidth={d.w} strokeLinecap="round" />
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// The crane hook: a cable from (x, top) down to the hook at (x + swayX, hookY), the hook block and a small load.
// ---------------------------------------------------------------------------------------------------------------
export const Hook: React.FC<{ x: number; top: number; hookY: number; sway?: number; load?: "beam" | "pallet" | "none" }> = ({
  x,
  top,
  hookY,
  sway = 0,
  load = "none",
}) => {
  const L = hookY - top;
  return (
    <g transform={`translate(${n(x)} ${n(top)}) rotate(${n(sway)})`}>
      <line x1={0} y1={0} x2={0} y2={n(L)} stroke={INK} strokeWidth={2.4} />
      <rect x={-6} y={n(L - 2)} width={12} height={9} rx={2} fill={INK} />
      <path
        d={`M0 ${n(L + 6)} L0 ${n(L + 14)} A6 6 0 1 1 -6 ${n(L + 20)}`}
        fill="none"
        stroke={INK}
        strokeWidth={3}
        strokeLinecap="round"
      />
      {load === "beam" && (
        <g>
          <path d={`M-1 ${n(L + 21)} L-26 ${n(L + 36)} M1 ${n(L + 21)} L26 ${n(L + 36)}`} stroke={INK} strokeWidth={1.8} />
          <rect x={-46} y={n(L + 36)} width={92} height={4} fill={INK} />
          <rect x={-46} y={n(L + 47)} width={92} height={4} fill={INK} />
          <rect x={-46} y={n(L + 38)} width={92} height={11} fill={INK} />
        </g>
      )}
      {load === "pallet" && (
        <g>
          <path d={`M-1 ${n(L + 21)} L-16 ${n(L + 33)} M1 ${n(L + 21)} L16 ${n(L + 33)}`} stroke={INK} strokeWidth={1.8} />
          <rect x={-20} y={n(L + 33)} width={40} height={20} fill={INK} />
          <rect x={-20} y={n(L + 42)} width={40} height={1.8} fill={lift(60)} />
        </g>
      )}
    </g>
  );
};

// A tower crane (side view): mast from the ground to the slewing ring, a jib to one side and a counter-jib with its
// counterweight to the other, the apex with its two tie lines. dir = +1 jib to the right, -1 to the left. The
// trolley rides the jib; the hook hangs from it (drawn by the caller with <Hook>, top = JIB_Y + 6).
export const TowerCrane: React.FC<{
  x: number;
  ground: number;
  top: number;
  jib: number;
  counter: number;
  dir: 1 | -1;
  trolley: number;
  children?: React.ReactNode;
}> = ({ x, ground, top, jib, counter, dir, trolley, children }) => {
  const jx = x + dir * jib;
  const cx = x - dir * counter;
  const apex = top - 30;
  // the mast as a lattice: two chords and X bracing (black on grey, open between)
  const mw = 12;
  const lattice: React.ReactNode[] = [];
  const step = 14;
  for (let yy = ground; yy > top + 4; yy -= step) {
    const y0 = yy;
    const y1 = Math.max(top + 4, yy - step);
    lattice.push(
      <path
        key={yy}
        d={`M${n(x - mw / 2)} ${n(y0)} L${n(x + mw / 2)} ${n(y1)} M${n(x + mw / 2)} ${n(y0)} L${n(x - mw / 2)} ${n(y1)} M${n(x - mw / 2)} ${n(y1)} L${n(x + mw / 2)} ${n(y1)}`}
        stroke={INK}
        strokeWidth={1.6}
      />,
    );
  }
  return (
    <g>
      <rect x={n(x - mw / 2 - 1.5)} y={n(top)} width={3} height={n(ground - top)} fill={INK} />
      <rect x={n(x + mw / 2 - 1.5)} y={n(top)} width={3} height={n(ground - top)} fill={INK} />
      {lattice}
      {/* apex and ties */}
      <path d={`M${n(x - 4)} ${n(top)} L${n(x)} ${n(apex)} L${n(x + 4)} ${n(top)} Z`} fill={INK} />
      <line x1={n(x)} y1={n(apex)} x2={n(x + dir * jib * 0.92)} y2={n(top + 1)} stroke={INK} strokeWidth={1.6} />
      <line x1={n(x)} y1={n(apex)} x2={n(x - dir * counter * 0.9)} y2={n(top + 1)} stroke={INK} strokeWidth={1.6} />
      {/* jib and counter-jib as one beam */}
      <rect x={n(Math.min(jx, cx))} y={n(top)} width={n(Math.abs(jx - cx))} height={6} fill={INK} />
      {/* counterweight */}
      <rect x={n(cx - (dir > 0 ? 0 : 16))} y={n(top + 6)} width={16} height={16} fill={INK} />
      {/* cab */}
      <rect x={n(x + dir * 7 - (dir > 0 ? 0 : 12))} y={n(top + 6)} width={12} height={11} fill={INK} />
      {/* trolley */}
      <rect x={n(trolley - 7)} y={n(top + 5)} width={14} height={5} fill={INK} />
      {children}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// The money sack (black, a white "$" with the bloom) anchored at its bottom centre, ~56 px tall at s 1. wings 0..1
// slides two white wings out from behind it; flap is the wing angle in degrees.
// ---------------------------------------------------------------------------------------------------------------
const SACK_BODY =
  "M-9 -44 C-14 -40 -20 -36 -23 -30 C-30 -18 -31 -6 -27 -1 C-22 3 22 3 27 -1 C31 -6 30 -18 23 -30 C20 -36 14 -40 9 -44 Z";
const SACK_NECK = "M-9 -44 L-15 -54 C-10 -51 -4 -56 0 -52 C4 -56 10 -51 15 -54 L9 -44 Z";
const WING = "M0 0 C10 -8 26 -20 44 -22 C40 -16 42 -12 36 -8 C38 -4 34 0 28 2 C28 6 20 8 14 6 C8 6 3 4 0 0 Z";

export const MoneySack: React.FC<{ x: number; y: number; s?: number; rot?: number; wings?: number; flap?: number }> = ({
  x,
  y,
  s = 1,
  rot = 0,
  wings = 0,
  flap = 0,
}) => {
  const w = clamp01(wings);
  return (
    <g transform={`translate(${n(x)} ${n(y)}) rotate(${n(rot)}) scale(${n(s)})`}>
      {w > 0.001 && (
        <g>
          <g transform={`translate(${n(10 + 8 * w)} -30) rotate(${n(-flap)}) scale(${n(0.35 + 0.65 * w)})`}>
            <path d={WING} fill={WHITE} />
          </g>
          <g transform={`translate(${n(-10 - 8 * w)} -30) scale(-1 1) rotate(${n(-flap)}) scale(${n(0.35 + 0.65 * w)})`}>
            <path d={WING} fill={WHITE} />
          </g>
        </g>
      )}
      <path d={SACK_BODY} fill={INK} />
      <path d={SACK_NECK} fill={INK} />
      <rect x={-10} y={-46} width={20} height={3.2} rx={1.5} fill={WHITE} />
      <text x={0} y={-8} fontFamily={SERIF} fontWeight={700} fontSize={31} fill={WHITE} textAnchor="middle">
        $
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// The three half-built projects (world px, ground line GROUND_Y). Each has its solid silhouette, its plan as
// polylines (dashed by the caller) and the rig that works on it.
// ---------------------------------------------------------------------------------------------------------------
export const GROUND_Y = 1085;

// Suspension bridge: two towers, the main cable, the deck built in from both ends with the middle span missing
// (its deck outline and hangers are the plan). A lifting gantry rides the cable at mid-span and hoists the next
// deck section up from below (as the big bridges were decked).
export const BRIDGE = {
  x0: 110,
  x1: 400,
  towerL: 158,
  towerR: 352,
  towerTop: 740,
  deckTop: 940,
  deckH: 18,
  gapL: 200,
  gapR: 310,
};
export const bridgeCable = (x: number) => {
  const { towerL, towerR, towerTop, deckTop, x0, x1 } = BRIDGE;
  const mid = (towerL + towerR) / 2;
  const sagLow = deckTop - 52;
  if (x < towerL) return lerp(deckTop, towerTop + 6, (x - x0) / (towerL - x0));
  if (x > towerR) return lerp(towerTop + 6, deckTop, (x - towerR) / (x1 - towerR));
  const u = (x - mid) / (towerR - mid);
  return sagLow - (sagLow - towerTop - 6) * u * u;
};
export const BRIDGE_MID = (BRIDGE.towerL + BRIDGE.towerR) / 2;
export const bridgePlan = (): Poly[] => {
  const { deckTop, deckH, gapL, gapR } = BRIDGE;
  const polys: Poly[] = [
    {
      pts: [
        [gapL, deckTop],
        [gapR, deckTop],
        [gapR, deckTop + deckH],
        [gapL, deckTop + deckH],
      ],
      closed: true,
    },
  ];
  for (let x = gapL + 13; x < gapR - 6; x += 16) {
    if (Math.abs(x - BRIDGE_MID) < 14) continue; // the gantry's own hoist line runs there
    const top = bridgeCable(x) + 4;
    if (deckTop - top > 12) polys.push({ pts: [[x, top], [x, deckTop - 3]], w: 2.8 });
  }
  return polys;
};
export const BridgeSolid: React.FC = () => {
  const { x0, x1, towerL, towerR, towerTop, deckTop, deckH, gapL, gapR } = BRIDGE;
  const cablePts: string[] = [];
  for (let x = x0; x <= x1; x += 3) cablePts.push(`${n(x)} ${n(bridgeCable(x))}`);
  const hangers: React.ReactNode[] = [];
  for (let x = x0 + 13; x < x1 - 8; x += 16) {
    if (x > gapL - 2 && x < gapR + 2) continue;
    if (Math.abs(x - towerL) < 6 || Math.abs(x - towerR) < 6) continue;
    const top = bridgeCable(x) + 3;
    if (deckTop - top > 9) hangers.push(<line key={x} x1={x} y1={n(top)} x2={x} y2={deckTop} stroke={INK} strokeWidth={2} />);
  }
  const tower = (cx: number) => (
    <g key={cx}>
      <path
        d={`M${cx - 12} ${GROUND_Y} L${cx - 8} ${towerTop + 4} L${cx + 8} ${towerTop + 4} L${cx + 12} ${GROUND_Y} Z`}
        fill={INK}
      />
      <rect x={cx - 14} y={towerTop - 4} width={28} height={10} fill={INK} />
      <rect x={cx - 3} y={towerTop - 16} width={6} height={13} fill={INK} />
      <rect x={cx - 3} y={towerTop + 40} width={6} height={30} fill={lift(74)} />
      <rect x={cx - 3} y={towerTop + 94} width={6} height={30} fill={lift(74)} />
      <rect x={cx - 3} y={towerTop + 148} width={6} height={26} fill={lift(74)} />
    </g>
  );
  return (
    <g>
      <polyline points={cablePts.join(" ")} fill="none" stroke={INK} strokeWidth={4} />
      {hangers}
      {tower(towerL)}
      {tower(towerR)}
      <rect x={x0} y={deckTop} width={gapL - x0} height={deckH} fill={INK} />
      <rect x={gapR} y={deckTop} width={x1 - gapR} height={deckH} fill={INK} />
      <rect x={x0 - 8} y={deckTop - 4} width={20} height={GROUND_Y - deckTop + 4} fill={INK} />
      <rect x={x1 - 12} y={deckTop - 4} width={20} height={GROUND_Y - deckTop + 4} fill={INK} />
    </g>
  );
};
// the lifting gantry on the cable at mid-span: an A-frame straddling the cable, the hoist line hanging from it
export const BRIDGE_GANTRY_Y = bridgeCable(BRIDGE_MID);
export const Gantry: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g>
    <path d={`M${n(x - 16)} ${n(y + 3)} L${n(x - 3)} ${n(y - 24)} L${n(x + 3)} ${n(y - 24)} L${n(x + 16)} ${n(y + 3)} L${n(x + 11)} ${n(y + 3)} L${n(x)} ${n(y - 15)} L${n(x - 11)} ${n(y + 3)} Z`} fill={INK} />
    <rect x={n(x - 18)} y={n(y - 2)} width={36} height={7} fill={INK} />
    <rect x={n(x - 6)} y={n(y - 28)} width={12} height={8} fill={INK} />
  </g>
);

// Elevated parkway: a deck on piers from an abutment on the left that stops in mid-air at `end` (bare rebar); the
// plan carries the deck on to `planEnd`.
export const PARKWAY = { x0: 434, deckTop: 868, deckH: 26, end: 604, planEnd: 704, piers: [464, 534, 594] };
export const parkwayPlan = (): Poly[] => {
  const { deckTop, deckH, end, planEnd } = PARKWAY;
  return [
    {
      pts: [
        [end, deckTop - 7],
        [planEnd, deckTop - 7],
        [planEnd, deckTop + deckH],
        [end, deckTop + deckH],
      ],
    },
  ];
};
export const ParkwaySolid: React.FC = () => {
  const { x0, deckTop, deckH, end, piers } = PARKWAY;
  return (
    <g>
      <rect x={x0} y={deckTop} width={end - x0} height={deckH} fill={INK} />
      <rect x={x0} y={deckTop - 7} width={end - x0} height={4} fill={INK} />
      {[0.25, 0.5, 0.75].map((t) => (
        <rect key={t} x={n(x0 + (end - x0) * t - 1.5)} y={deckTop - 7} width={3} height={7} fill={INK} />
      ))}
      {/* the abutment it starts from */}
      <path d={`M${x0 - 14} ${GROUND_Y} L${x0 - 14} ${deckTop + 10} L${x0 + 4} ${deckTop - 2} L${x0 + 4} ${GROUND_Y} Z`} fill={INK} />
      {piers.map((px) => (
        <g key={px}>
          <rect x={px - 8} y={deckTop + deckH} width={16} height={GROUND_Y - deckTop - deckH} fill={INK} />
          <rect x={px - 13} y={deckTop + deckH} width={26} height={7} fill={INK} />
        </g>
      ))}
      {/* bare rebar out of the unfinished end */}
      <path
        d={`M${end} ${deckTop + 5} L${end + 9} ${deckTop + 4} M${end} ${deckTop + 11} L${end + 11} ${deckTop + 11} M${end} ${deckTop + 17} L${end + 8} ${deckTop + 18}`}
        stroke={INK}
        strokeWidth={2}
      />
    </g>
  );
};

// A truck crane on the ground: cab, bed, wheels (white hubs), outriggers, a lattice boom from its turntable to
// `tip`, the luffing line. The hook is drawn by the caller from the tip.
export const TruckCrane: React.FC<{ x: number; ground: number; tip: Pt }> = ({ x, ground, tip }) => {
  const pivot: Pt = [x - 4, ground - 40];
  const L = Math.hypot(tip[0] - pivot[0], tip[1] - pivot[1]);
  const ang = (Math.atan2(tip[1] - pivot[1], tip[0] - pivot[0]) * 180) / Math.PI;
  const lattice: React.ReactNode[] = [];
  for (let d = 0; d < L - 10; d += 12) {
    lattice.push(<path key={d} d={`M${n(d)} -5 L${n(d + 6)} 5 L${n(d + 12)} -5`} fill="none" stroke={INK} strokeWidth={1.6} />);
  }
  return (
    <g>
      {/* outriggers */}
      <rect x={x - 44} y={ground - 12} width={88} height={4} fill={INK} />
      <rect x={x - 46} y={ground - 10} width={6} height={10} fill={INK} />
      <rect x={x + 40} y={ground - 10} width={6} height={10} fill={INK} />
      {/* bed and cab */}
      <rect x={x - 36} y={ground - 30} width={68} height={16} fill={INK} />
      <path d={`M${x + 32} ${ground - 14} L${x + 32} ${ground - 40} L${x + 44} ${ground - 40} L${x + 50} ${ground - 28} L${x + 50} ${ground - 14} Z`} fill={INK} />
      <rect x={x + 36} y={ground - 36} width={7} height={7} fill={lift(74)} />
      {/* turntable + operator house */}
      <rect x={x - 22} y={ground - 46} width={30} height={16} fill={INK} />
      {/* wheels */}
      {[-24, 0, 38].map((wx) => (
        <g key={wx}>
          <circle cx={x + wx} cy={ground - 9} r={9} fill={INK} />
          <circle cx={x + wx} cy={ground - 9} r={3} fill={WHITE} />
        </g>
      ))}
      {/* boom */}
      <g transform={`translate(${n(pivot[0])} ${n(pivot[1])}) rotate(${n(ang)})`}>
        <rect x={0} y={-6} width={n(L)} height={2.4} fill={INK} />
        <rect x={0} y={3.6} width={n(L)} height={2.4} fill={INK} />
        {lattice}
        <rect x={n(L - 6)} y={-7} width={10} height={14} fill={INK} />
      </g>
      {/* luffing line from the house top to the tip */}
      <line x1={x - 18} y1={ground - 50} x2={n(tip[0])} y2={n(tip[1])} stroke={INK} strokeWidth={1.5} />
    </g>
  );
};

// The water tower (Jones Beach's, simplified), centred cx: the base and the lower shaft are built to builtTop; the
// rest of the shaft, the lantern and the pyramid roof are the plan.
export const TOWER = { cx: 852, baseW: 100, shaftW: 60, builtTop: 912, shaftTop: 806, lanternTop: 780, roofTop: 740 };
export const towerPlan = (): Poly[] => {
  const { cx, shaftW, builtTop, shaftTop, lanternTop, roofTop } = TOWER;
  const h = shaftW / 2;
  return [
    {
      pts: [
        [cx - h, builtTop],
        [cx - h, shaftTop],
        [cx - h - 7, shaftTop],
        [cx - h - 7, lanternTop],
        [cx - h - 11, lanternTop],
        [cx, roofTop],
        [cx + h + 11, lanternTop],
        [cx + h + 7, lanternTop],
        [cx + h + 7, shaftTop],
        [cx + h, shaftTop],
        [cx + h, builtTop],
      ],
    },
  ];
};
export const TowerSolid: React.FC = () => {
  const { cx, baseW, shaftW, builtTop } = TOWER;
  const h = shaftW / 2;
  const b = baseW / 2;
  const top = builtTop;
  return (
    <g>
      <path
        d={`M${cx - b} ${GROUND_Y} L${cx - b} ${GROUND_Y - 40} L${cx - h - 10} ${GROUND_Y - 62} L${cx - h} ${GROUND_Y - 70} L${cx - h} ${top + 6} L${cx - h + 9} ${top} L${cx - 6} ${top + 7} L${cx + 6} ${top + 1} L${cx + h - 7} ${top + 8} L${cx + h} ${top + 3} L${cx + h} ${GROUND_Y - 70} L${cx + h + 10} ${GROUND_Y - 62} L${cx + b} ${GROUND_Y - 40} L${cx + b} ${GROUND_Y} Z`}
        fill={INK}
      />
      <path d={`M${cx - 10} ${GROUND_Y} L${cx - 10} ${GROUND_Y - 22} A10 10 0 0 1 ${cx + 10} ${GROUND_Y - 22} L${cx + 10} ${GROUND_Y} Z`} fill={lift(74)} />
      <rect x={cx - 3} y={GROUND_Y - 120} width={6} height={20} fill={lift(74)} />
      <rect x={cx - 3} y={top + 32} width={6} height={18} fill={lift(74)} />
      {/* scaffold round the unfinished top */}
      <rect x={cx - h - 14} y={top + 12} width={shaftW + 28} height={4} fill={INK} />
      <rect x={cx - h - 14} y={top + 12} width={3} height={52} fill={INK} />
      <rect x={cx + h + 11} y={top + 12} width={3} height={52} fill={INK} />
    </g>
  );
};

export const Ground: React.FC<{ x0: number; x1: number }> = ({ x0, x1 }) => (
  <rect x={x0} y={GROUND_Y} width={x1 - x0} height={7} fill={INK} />
);

// ---------------------------------------------------------------------------------------------------------------
// The front page. Anchored at its CENTRE, PAGE_W x PAGE_H at s 1. Masthead: abstract blackletter-ish strokes
// (seeded, no real name, no letters), a double rule with a dateline bar, the headline "MOSES QUITS" in the slip's
// serif, the picture box (`picture` renders inside a clip at PIC_X/PIC_Y/PIC_W/PIC_H, page-local), and grey text
// columns. The optional sub-head sits under the headline.
// ---------------------------------------------------------------------------------------------------------------
export const PAGE_W = 600;
export const PAGE_H = 800;
export const PIC = { x: -250, y: -110, w: 500, h: 380 };
export const HEAD_Y = -165; // baseline of the headline

const Masthead: React.FC<{ seed: string; y: number; w: number }> = ({ seed, y, w }) => {
  // a run of narrow black "letters": a vertical stem with a diamond foot and a pointed, slanted head, some with a
  // hairline join; heights vary a little, a taller capital-like first stroke at each word start.
  const marks: React.ReactNode[] = [];
  const words = 2 + Math.floor(random(`${seed}words`) * 2);
  const glyphW = 15;
  const per = [] as number[];
  for (let i = 0; i < words; i++) per.push(4 + Math.floor(random(`${seed}len${i}`) * 4));
  const total = per.reduce((a, b) => a + b, 0) * glyphW + (words - 1) * 18;
  const scale = Math.min(1, w / total);
  let x = -(total * scale) / 2;
  per.forEach((len, wi) => {
    for (let j = 0; j < len; j++) {
      const cap = j === 0;
      const h = cap ? 50 : 34 + random(`${seed}h${wi}${j}`) * 6;
      const asc = !cap && random(`${seed}a${wi}${j}`) > 0.75 ? 10 : 0;
      const sx = x;
      const top = y - h - asc;
      const stemW = cap ? 9 : 7;
      marks.push(
        <g key={`${wi}-${j}`}>
          <path
            d={`M${n(sx)} ${n(top + 6)} L${n(sx + stemW / 2)} ${n(top)} L${n(sx + stemW + 3)} ${n(top + 4)} L${n(sx + stemW)} ${n(y - 6)} L${n(sx + stemW / 2)} ${n(y)} L${n(sx - 2)} ${n(y - 4)} Z`}
            fill={INK}
          />
          {j < len - 1 && (
            <line
              x1={n(sx + stemW)}
              y1={n(y - 10 - (j % 2) * 14)}
              x2={n(sx + glyphW * scale)}
              y2={n(top + 10 + asc)}
              stroke={INK}
              strokeWidth={2.4}
            />
          )}
          {cap && <path d={`M${n(sx - 8)} ${n(top + 16)} C${n(sx - 12)} ${n(top + 4)} ${n(sx + 4)} ${n(top - 6)} ${n(sx + 14)} ${n(top + 2)}`} fill="none" stroke={INK} strokeWidth={3} />}
        </g>,
      );
      x += glyphW * scale;
    }
    x += 18 * scale;
  });
  return <g>{marks}</g>;
};

const TextColumns: React.FC<{ x0: number; x1: number; y0: number; y1: number; cols: number; seed: string }> = ({
  x0,
  x1,
  y0,
  y1,
  cols,
  seed,
}) => {
  const gut = 16;
  const cw = (x1 - x0 - gut * (cols - 1)) / cols;
  const bars: React.ReactNode[] = [];
  for (let c = 0; c < cols; c++) {
    const cx = x0 + c * (cw + gut);
    let i = 0;
    for (let y = y0; y + 6 <= y1; y += 13) {
      const last = random(`${seed}p${c}${i}`) > 0.82;
      const w = last ? cw * (0.35 + 0.4 * random(`${seed}q${c}${i}`)) : cw;
      bars.push(<rect key={`${c}-${i}`} x={n(cx)} y={n(y)} width={n(w)} height={6} fill={BAR_GREY} />);
      i++;
    }
  }
  return <g>{bars}</g>;
};

export const FrontPage: React.FC<{
  x: number;
  y: number;
  s?: number;
  rot?: number;
  seed: string;
  id: string;
  picture?: React.ReactNode;
  subhead?: boolean;
  shade?: boolean;
}> = ({ x, y, s = 1, rot = 0, seed, id, picture, subhead = false }) => {
  const W = PAGE_W;
  const H = PAGE_H;
  const L = -W / 2 + 32;
  const R = W / 2 - 32;
  return (
    <g transform={`translate(${n(x)} ${n(y)}) rotate(${n(rot)}) scale(${n(s)})`}>
      <rect x={-W / 2} y={-H / 2} width={W} height={H} fill={PAPER} />
      <Masthead seed={seed} y={-H / 2 + 86} w={W - 120} />
      <rect x={L} y={-H / 2 + 100} width={R - L} height={4} fill={INK} />
      <rect x={L} y={-H / 2 + 108} width={R - L} height={1.6} fill={INK} />
      <rect x={L} y={-H / 2 + 114} width={90} height={5} fill={BAR_GREY} />
      <rect x={R - 90} y={-H / 2 + 114} width={90} height={5} fill={BAR_GREY} />
      <rect x={L} y={-H / 2 + 125} width={R - L} height={1.6} fill={INK} />
      <text
        x={0}
        y={HEAD_Y}
        fontFamily={LABEL_FONT}
        fontWeight={800}
        fontSize={112}
        fill={INK}
        textAnchor="middle"
        textLength={R - L}
        lengthAdjust="spacingAndGlyphs"
      >
        MOSES QUITS
      </text>
      {subhead ? (
        <text
          x={0}
          y={HEAD_Y + 40}
          fontFamily={SERIF}
          fontWeight={700}
          fontSize={25}
          fill={INK}
          textAnchor="middle"
          textLength={R - L - 40}
          lengthAdjust="spacingAndGlyphs"
        >
          REFUSED TO COMPROMISE THE CITY
        </text>
      ) : (
        <g>
          <rect x={L + 40} y={HEAD_Y + 20} width={R - L - 80} height={6} fill={BAR_GREY} />
          <rect x={L + 100} y={HEAD_Y + 32} width={R - L - 200} height={6} fill={BAR_GREY} />
        </g>
      )}
      <defs>
        <clipPath id={`${id}pic`} clipPathUnits="userSpaceOnUse">
          <rect x={PIC.x} y={PIC.y} width={PIC.w} height={PIC.h} />
        </clipPath>
      </defs>
      <rect x={PIC.x} y={PIC.y} width={PIC.w} height={PIC.h} fill={lift(74)} />
      <g clipPath={`url(#${id}pic)`}>{picture}</g>
      <rect x={PIC.x} y={PIC.y} width={PIC.w} height={PIC.h} fill="none" stroke={INK} strokeWidth={4} />
      <TextColumns x0={L} x1={R} y0={PIC.y + PIC.h + 22} y1={H / 2 - 30} cols={3} seed={seed} />
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// The politician: a small hunched black figure in a fedora, side view facing RIGHT, anchored at his feet (bottom
// centre), ~150 px tall at s 1. arm: 0 = hand at his side, 1 = arm thrust out level (pointing / pushing).
// ---------------------------------------------------------------------------------------------------------------
const POL_BODY =
  "M-30 0 L-26 -48 L-30 -70 L-34 -96 L-30 -104 C-22 -112 -6 -114 6 -110 C14 -106 18 -100 18 -92 L16 -60 L20 -48 L14 0 L4 0 L2 -40 L-8 -40 L-14 0 Z";
const POL_HEAD = "M2 -110 C0 -122 6 -132 16 -132 C27 -132 32 -124 31 -115 C30 -108 25 -104 18 -104 C10 -104 4 -106 2 -110 Z";
const POL_HAT = "M-6 -126 L40 -122 L40 -119 L-6 -122 Z M2 -124 L6 -144 C14 -147 26 -147 33 -143 L35 -122 Z";
export const Politician: React.FC<{ x: number; y: number; s?: number; arm?: number; lean?: number }> = ({
  x,
  y,
  s = 1,
  arm = 0,
  lean = 0,
}) => {
  const a = clamp01(arm);
  // shoulder at (4, -96); the arm swings from hanging (-80 deg from horizontal) to level and slightly up
  const ang = lerp(80, -6, a);
  return (
    <g transform={`translate(${n(x)} ${n(y)}) scale(${n(s)}) rotate(${n(lean)})`}>
      <path d={POL_BODY} fill={INK} />
      <path d={POL_HEAD} fill={INK} />
      <path d={POL_HAT} fill={INK} />
      <g transform={`translate(6 -94) rotate(${n(ang)})`}>
        <path d="M-6 -6 L44 -5 L46 5 L-6 7 Z" fill={INK} />
        <path d="M44 -6 L58 -4 L60 -1 L52 0 L52 3 L45 6 Z" fill={INK} />
      </g>
    </g>
  );
};
