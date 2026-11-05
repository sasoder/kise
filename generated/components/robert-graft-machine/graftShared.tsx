// ---------------------------------------------------------------------------
// graftShared: the parts of the show's own Robert Moses pictogram (robert-graft-machine), redrawn as vectors from
// the 4K frames of the original 16:9 graphic (notes/reference/picto_src*.png in the clip's working folder) so the
// 9:16 cuts and any later continuation read as the same drawing.
//
// Every part draws in the ORIGINAL'S 4K PIXEL UNITS and is anchored at its bottom centre: pass the world position
// of that point as (x, y) and a scale s (world px per 4K px). Silhouettes (Moses, the worker, the top hat) are the
// traced outlines of the 4K frames (median 7, threshold, approxPolyDP eps 2 px); the vault, scales, coins, bond,
// scissors and policy are rebuilt from measured radii/lengths (vault: picto_src52.6 / 55.0; scales: 59.0; coin:
// 59.0 lapel; bond and scissors: 54.0).
//
// Look (sampled from the 4K PNGs): neutral mid-grey ground 74/255 with fine grain (std ~7.7 at 4K, multiplicative:
// ~6 % on black, ~8-10 % on grey and white), flat black 6/255, whites 195 (vault) to 225 (scales, hats), a soft
// white bloom around white parts (+~12 on the ground at the edge, gone by ~100 px at 4K), no vignette to speak of
// (corners -1.5). Label: "ROBERT MOSES" in a bold high-contrast serif, caps; closest Google face: Frank Ruhl Libre
// 800.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, spring } from "remotion";
import { loadFont } from "@remotion/google-fonts/FrankRuhlLibre";

const { fontFamily: LABEL_FONT_FAMILY } = loadFont("normal", { weights: ["800"], subsets: ["latin"] });
export const LABEL_FONT = LABEL_FONT_FAMILY;

// Grain: the noise layer multiplies the picture by GRAIN_MEAN on average, so every base colour is lifted by
// 1 / GRAIN_MEAN and lands on the sampled value after the grain.
export const GRAIN_MEAN = 0.9;
const lift = (v: number) => {
  const c = Math.min(255, Math.round(v / GRAIN_MEAN));
  return `rgb(${c},${c},${c})`;
};
export const GROUND = lift(74);
export const INK = lift(6);
export const WHITE = lift(222); // scales, hard hat, hat band, coins
export const VAULT_WHITE = lift(196); // the vault door's light parts
export const PAPER = lift(208); // bonds, the policy sheet
export const LABEL_WHITE = lift(214);
export const RIM = lift(120); // the vault door's edge when it swings

const n = (v: number) => Math.round(v * 1000) / 1000;
const anchor = (x: number, y: number, s: number, rot = 0) =>
  `translate(${n(x)} ${n(y)}) rotate(${n(rot)}) scale(${n(s)})`;

// ---------------------------------------------------------------------------------------------------------------
// Ground, grain, bloom
// ---------------------------------------------------------------------------------------------------------------

export const GraftGround: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: GROUND }}>
    <AbsoluteFill
      style={{ background: "radial-gradient(ellipse 75% 60% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.05) 100%)" }}
    />
  </AbsoluteFill>
);

// Screen-space film grain, a new pattern every frame (seed = frame). Multiplies the picture: n = GRAIN_MEAN +
// GRAIN_K * (turbulence - 0.5).
export const GRAIN_K = 0.42;
export const GraftGrain: React.FC<{ frame: number; width?: number; height?: number }> = ({
  frame,
  width = 1080,
  height = 1920,
}) => {
  const off = n(GRAIN_MEAN - 0.5 * GRAIN_K);
  const row = `${GRAIN_K} 0 0 0 ${off}`;
  return (
    <svg
      width={width}
      height={height}
      style={{ position: "absolute", left: 0, top: 0, mixBlendMode: "multiply", pointerEvents: "none" }}
    >
      <filter id={`graftGrain${frame}`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={1} seed={frame + 1} result="t" />
        <feColorMatrix in="t" type="matrix" values={`${row}  ${row}  ${row}  0 0 0 0 1`} />
      </filter>
      <rect x={0} y={0} width={width} height={height} filter={`url(#graftGrain${frame})`} />
    </svg>
  );
};

// The white bloom: alpha from luminance, two blurs under the source. Put <GlowDefs/> in the world <svg> and wrap
// the world in <g filter={`url(#${GLOW_ID})`}>.
export const GLOW_ID = "graftGlow";
export const GlowDefs: React.FC<{ width?: number; height?: number }> = ({ width = 1080, height = 1920 }) => (
  <defs>
    <filter
      id={GLOW_ID}
      filterUnits="userSpaceOnUse"
      x={-200}
      y={-200}
      width={width + 400}
      height={height + 400}
      colorInterpolationFilters="sRGB"
    >
      <feColorMatrix
        in="SourceGraphic"
        type="matrix"
        values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.12 0.12 0.12 0 -0.22"
        result="lum"
      />
      <feGaussianBlur in="lum" stdDeviation={5} result="tight" />
      <feGaussianBlur in="lum" stdDeviation={20} result="wide" />
      <feMerge>
        <feMergeNode in="wide" />
        <feMergeNode in="tight" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------------------------------------------
// Robert Moses: the traced bust (816 x 942 at 4K) and his label
// ---------------------------------------------------------------------------------------------------------------

export const MOSES_W = 816;
export const MOSES_H = 942;
const MOSES_BODY =
  "M-185 -450 L-213 -423 L-225 -400 L-229 -375 L-229 -333 L-216 -276 L-190 -190 L-171 -150 L-150 -94 L-163 -74 L-279 -22 L-336 17 L-343 24 L-366 69 L-388 189 L-396 261 L-398 307 L-406 375 L-407 468 L-41 470 L15 467 L403 470 L406 467 L407 361 L404 155 L396 60 L373 12 L326 -23 L300 -37 L96 -125 L91 -104 L83 -27 L43 70 L9 165 L2 171 L-1 162 L6 136 L-12 27 L-7 -14 L-24 -17 L-33 -15 L-36 -11 L-28 25 L-25 109 L-29 112 L-81 19 L-132 -50 L-129 -53 L-92 -35 L-63 -30 L-43 -30 L13 -37 L20 -42 L45 -90 L57 -133 L64 -141 L64 -145 L49 -165 L51 -181 L69 -201 L87 -244 L86 -283 L80 -301 L75 -307 L62 -310 L53 -325 L56 -371 L51 -402 L39 -427 L9 -452 L-24 -467 L-101 -471 L-157 -465 Z";
const MOSES_SHIRT =
  "M91 -150 L60 -135 L45 -85 L24 -42 L16 -34 L-61 -27 L-91 -32 L-128 -49 L-80 17 L-30 109 L-27 106 L-31 24 L-39 -15 L-31 -19 L-4 -18 L-9 25 L8 136 L1 162 L3 169 L6 167 L41 69 L81 -29 L94 -148 Z";
// the tie, filled under the shirt so no ground shows through the seams
const MOSES_TIE = "M-36 -11 L-28 25 L-25 109 L-29 112 L2 171 L9 165 L6 136 L-12 27 L-7 -14 L-24 -17 L-33 -15 Z";

export const MosesBust: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`${anchor(x, y, s)} translate(0 -470)`}>
    <path d={MOSES_SHIRT} fill={INK} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d={MOSES_BODY} fill={INK} />
    <path d={MOSES_SHIRT} fill={WHITE} />
    <path d={MOSES_TIE} fill={INK} />
  </g>
);

// Label: the original sets two lines of caps, cap height 84 and line pitch 114 at 4K, 82 below the bust.
// (x, y) is the top centre of the first line's caps.
export const LABEL_CAP = 84;
export const LABEL_PITCH = 114;
export const LABEL_GAP = 82;
const CAP_RATIO = 0.69; // Frank Ruhl Libre cap height / font size
export const MosesLabel: React.FC<{ x: number; y: number; s: number; opacity?: number }> = ({
  x,
  y,
  s,
  opacity = 1,
}) => {
  const fs = (LABEL_CAP * s) / CAP_RATIO;
  return (
    <g opacity={opacity} fontFamily={LABEL_FONT} fontWeight={800} fontSize={n(fs)} fill={LABEL_WHITE} textAnchor="middle">
      <text x={n(x)} y={n(y + LABEL_CAP * s)}>
        ROBERT
      </text>
      <text x={n(x)} y={n(y + (LABEL_CAP + LABEL_PITCH) * s)}>
        MOSES
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// The bank vault (844 square at 4K): body and door drawn apart so the door can swing on its left hinge
// ---------------------------------------------------------------------------------------------------------------

export const VAULT_SIZE = 844;
const VR = 362; // door outer radius; the jamb ring of the opening is the same r 338-362
const HINGE_X = -VR;

// Body: the black box, the hinge tabs and (seen when the door is open) the light jamb ring and the dark inside.
export const VaultBody: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`${anchor(x, y, s)} translate(0 -422)`}>
    <rect x={-422} y={-422} width={844} height={844} fill={INK} />
    <circle cx={0} cy={0} r={350} fill="none" stroke={VAULT_WHITE} strokeWidth={24} />
    <rect x={-378} y={-207} width={58} height={55} fill={VAULT_WHITE} />
    <rect x={-378} y={152} width={58} height={55} fill={VAULT_WHITE} />
  </g>
);

const DoorFace: React.FC = () => {
  const bolts = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
    bolts.push(<circle key={i} cx={n(302 * Math.cos(a))} cy={n(302 * Math.sin(a))} r={10} fill={INK} />);
  }
  const spokes = [];
  for (let i = 0; i < 6; i++) {
    const a = ((-103 + i * 60) * Math.PI) / 180;
    const ex = 182 * Math.cos(a);
    const ey = 182 * Math.sin(a);
    spokes.push(
      <g key={i}>
        <line x1={0} y1={0} x2={n(ex)} y2={n(ey)} stroke={INK} strokeWidth={13} />
        <circle cx={n(ex)} cy={n(ey)} r={24} fill={INK} />
      </g>,
    );
  }
  return (
    <g>
      <circle cx={0} cy={0} r={VR} fill={VAULT_WHITE} />
      <circle cx={0} cy={0} r={332.5} fill="none" stroke={INK} strokeWidth={11} />
      <circle cx={0} cy={0} r={267} fill="none" stroke={INK} strokeWidth={17} />
      {bolts}
      {spokes}
      <circle cx={0} cy={0} r={46} fill={INK} />
    </g>
  );
};

// open: 0 shut .. 1 swung 80 deg toward the viewer (the original's open state at src 55.0 shows ~130 px of door).
export const VaultDoor: React.FC<{ x: number; y: number; s: number; open: number }> = ({ x, y, s, open }) => {
  const th = (Math.max(0, Math.min(1, open)) * 80 * Math.PI) / 180;
  const c = Math.cos(th);
  const rimShift = -46 * Math.sin(th);
  return (
    <g transform={`${anchor(x, y, s)} translate(0 -422)`}>
      {open > 0.001 && (
        <g transform={`translate(${n(HINGE_X + rimShift)} 0) scale(${n(c)} 1) translate(${-HINGE_X} 0)`}>
          <circle cx={0} cy={0} r={VR} fill={RIM} />
        </g>
      )}
      <g transform={`translate(${HINGE_X} 0) scale(${n(c)} 1) translate(${-HINGE_X} 0)`}>
        <DoorFace />
      </g>
    </g>
  );
};

export const Vault: React.FC<{ x: number; y: number; s: number }> = (p) => (
  <g>
    <VaultBody {...p} />
    <VaultDoor {...p} open={0} />
  </g>
);

// ---------------------------------------------------------------------------------------------------------------
// The bond certificate (420 x 275 card), whole, with its top-right corner snipped off, or just that corner
// ---------------------------------------------------------------------------------------------------------------

export const BOND_W = 420;
export const BOND_H = 275;
// the snip takes the top-LEFT corner: from the top edge at x -40 to the left edge at y -10 (card-local, centre origin)
export const BOND_CUT_A: [number, number] = [-40, -137.5];
export const BOND_CUT_B: [number, number] = [-210, -10];
export const BOND_CORNER: [number, number] = [-210, -137.5];
const BondArt: React.FC = () => (
  <g>
    <rect x={-210} y={-137.5} width={420} height={275} fill={PAPER} />
    <rect x={-188} y={-115.5} width={376} height={231} fill="none" stroke={INK} strokeWidth={8} />
    <rect x={-160} y={-88} width={150} height={20} fill={INK} />
    <rect x={-160} y={-56} width={100} height={9} fill={INK} />
    <circle cx={140} cy={68} r={26} fill="none" stroke={INK} strokeWidth={10} />
  </g>
);

// Bond anchored at its CENTRE (it flies and tilts). part: whole card, the card minus the corner, or the corner.
// cut: the cut line in card-local units (default BOND_CUT_A -> BOND_CUT_B); the corner is the side holding the
// card's top-left corner. A stack is cut along one world line by passing each card that line in its own units.
export const Bond: React.FC<{
  x: number;
  y: number;
  s: number;
  rot?: number;
  part?: "whole" | "cut" | "corner";
  cut?: { a: [number, number]; b: [number, number] };
  id: string;
}> = ({ x, y, s, rot = 0, part = "whole", cut, id }) => {
  const a = cut ? cut.a : BOND_CUT_A;
  const b = cut ? cut.b : BOND_CUT_B;
  const L = 900;
  const ul = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1;
  const u = [(a[0] - b[0]) / ul, (a[1] - b[1]) / ul];
  let nx = -u[1];
  let ny = u[0];
  if (nx * (BOND_CORNER[0] - b[0]) + ny * (BOND_CORNER[1] - b[1]) < 0) {
    nx = -nx;
    ny = -ny;
  }
  const side = part === "corner" ? 1 : -1;
  const p1 = [a[0] + L * u[0], a[1] + L * u[1]];
  const p2 = [b[0] - L * u[0], b[1] - L * u[1]];
  const pts = [p1, p2, [p2[0] + side * L * nx, p2[1] + side * L * ny], [p1[0] + side * L * nx, p1[1] + side * L * ny]]
    .map(([px, py]) => `${n(px)},${n(py)}`)
    .join(" ");
  return (
    <g transform={anchor(x, y, s, rot)}>
      {part !== "whole" && (
        <defs>
          <clipPath id={id} clipPathUnits="userSpaceOnUse">
            <polygon points={pts} />
          </clipPath>
        </defs>
      )}
      <g clipPath={part !== "whole" ? `url(#${id})` : undefined}>
        <BondArt />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// Scissors (black, side view): two mirrored halves crossing at a pivot screw. Each half is one rigid piece: a blade
// to -x on one side of the axis and, across the pivot, a shank to +x ending in a hollow finger ring on the other
// side (half A: blade below the axis, ring above; half B mirrored). open 0..1 = each half 2..18 deg off the axis,
// so the blades open in a V and the rings spread. Anchored at the pivot; 4K units (blade 270, ring centre 205 out).
// ---------------------------------------------------------------------------------------------------------------

export const SCISSOR_BLADE = 270;
const SCISSOR_RING: [number, number] = [205, -64];
const SCISSOR_RING_R = 58;
const SCISSOR_HOLE_R = 37;
// blade body below the axis (cutting edge on y ~0), a slight belly, a fine point
const SCISSOR_BLADE_PATH = "M-270 0 L-210 9 L-120 19 L-30 24 L14 20 L22 6 L14 -6 L-40 -4 L-150 -2 Z";
const ScissorHalf: React.FC = () => {
  const [rx, ry] = SCISSOR_RING;
  const d = Math.hypot(rx, ry);
  const ex = rx - (rx / d) * (SCISSOR_RING_R - 6);
  const ey = ry - (ry / d) * (SCISSOR_RING_R - 6);
  return (
    <g>
      <path d={SCISSOR_BLADE_PATH} fill={INK} />
      <path
        d={`M0 6 C 60 8, ${n(ex - 60)} ${n(ey + 30)}, ${n(ex)} ${n(ey)}`}
        fill="none"
        stroke={INK}
        strokeWidth={30}
        strokeLinecap="round"
      />
      <path
        d={`M${rx + SCISSOR_RING_R} ${ry} A${SCISSOR_RING_R} ${SCISSOR_RING_R} 0 1 1 ${rx - SCISSOR_RING_R} ${ry} A${SCISSOR_RING_R} ${SCISSOR_RING_R} 0 1 1 ${rx + SCISSOR_RING_R} ${ry} Z M${rx + SCISSOR_HOLE_R} ${ry} A${SCISSOR_HOLE_R} ${SCISSOR_HOLE_R} 0 1 0 ${rx - SCISSOR_HOLE_R} ${ry} A${SCISSOR_HOLE_R} ${SCISSOR_HOLE_R} 0 1 0 ${rx + SCISSOR_HOLE_R} ${ry} Z`}
        fill={INK}
        fillRule="evenodd"
      />
    </g>
  );
};
export const Scissors: React.FC<{ x: number; y: number; s: number; rot?: number; open: number }> = ({
  x,
  y,
  s,
  rot = 0,
  open,
}) => {
  const half = 2 + 16 * Math.max(0, Math.min(1, open));
  return (
    <g transform={anchor(x, y, s, rot)}>
      <g transform={`rotate(${n(half)}) scale(1 -1)`}>
        <ScissorHalf />
      </g>
      <g transform={`rotate(${n(-half)})`}>
        <ScissorHalf />
      </g>
      <circle cx={0} cy={0} r={15} fill={WHITE} />
      <circle cx={0} cy={0} r={5} fill={INK} />
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// The hard-hat worker (491 x 840 at 4K, traced)
// ---------------------------------------------------------------------------------------------------------------

export const WORKER_H = 840;
const WORKER_BODY = "M224 63 L102 -31 L-100 -30 L-224 65 L-246 415 L-242 418 L242 419 L244 413 Z";
const WORKER_HEAD =
  "M-134 -230 L-142 -204 L-142 -163 L-132 -126 L-114 -95 L-98 -77 L-70 -56 L-52 -48 L-24 -40 L18 -39 L54 -49 L74 -59 L98 -77 L116 -98 L132 -126 L140 -151 L142 -186 L138 -218 L132 -231 L128 -233 L-70 -234 L-130 -233 Z";
const WORKER_HAT =
  "M-224 -282 L-214 -239 L-204 -235 L208 -235 L214 -242 L224 -278 L222 -283 L168 -284 L164 -288 L146 -346 L86 -400 L2 -420 L-86 -400 L-148 -345 L-170 -285 Z";

export const Worker: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`${anchor(x, y, s)} translate(0 -419)`}>
    <path d={WORKER_BODY} fill={INK} />
    <path d={WORKER_HEAD} fill={INK} stroke={INK} strokeWidth={4} />
    <path d={WORKER_HAT} fill={WHITE} />
  </g>
);

// ---------------------------------------------------------------------------------------------------------------
// The scales of justice (1262 x 881 at 4K). Pivot P at the beam centre; the base's bottom is 769 below P.
// tilt in degrees, + = right pan down. Pans hang plumb from the beam ends (hangers at +-440 along the beam).
// rightPan / leftPan draw in pan-local units: origin at the hanger, the dish top at y 350.
// ---------------------------------------------------------------------------------------------------------------

export const SCALES_BASE = 769;
export const SCALES_HANGER = 440;
export const PAN_TOP = 350;
const Pan: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <g>
    <line x1={0} y1={0} x2={-150} y2={PAN_TOP + 2} stroke={WHITE} strokeWidth={12} />
    <line x1={0} y1={0} x2={150} y2={PAN_TOP + 2} stroke={WHITE} strokeWidth={12} />
    {children}
    <path d={`M-198 ${PAN_TOP} L198 ${PAN_TOP} L158 404 Q0 420 -158 404 Z`} fill={WHITE} />
  </g>
);

export const scalesHanger = (side: -1 | 1, tilt: number): [number, number] => {
  const a = (tilt * Math.PI) / 180;
  return [side * SCALES_HANGER * Math.cos(a), side * SCALES_HANGER * Math.sin(a)];
};

export const Scales: React.FC<{
  x: number;
  y: number;
  s: number;
  tilt?: number;
  rightPan?: React.ReactNode;
  leftPan?: React.ReactNode;
}> = ({ x, y, s, tilt = 0, rightPan, leftPan }) => {
  const [lx, ly] = scalesHanger(-1, tilt);
  const [rx, ry] = scalesHanger(1, tilt);
  return (
    <g transform={`${anchor(x, y, s)} translate(0 ${-SCALES_BASE})`}>
      <rect x={-15} y={-50} width={30} height={722} fill={WHITE} />
      <circle cx={0} cy={-77} r={35} fill={WHITE} />
      <polygon points="-175,670 175,670 205,722 -205,722" fill={WHITE} />
      <rect x={-271} y={721} width={542} height={48} fill={WHITE} />
      <g transform={`translate(${n(lx)} ${n(ly)})`}>
        <Pan>{leftPan}</Pan>
      </g>
      <g transform={`translate(${n(rx)} ${n(ry)})`}>
        <Pan>{rightPan}</Pan>
      </g>
      <g transform={`rotate(${n(tilt)})`}>
        <polygon points="-482,-1 -455,-13 455,-13 482,-1 455,10 -455,10" fill={WHITE} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// Coin (face-on, as on Moses' lapel at src 59.0): white disc r 50, dark ring r 30. Anchored at its centre.
// ---------------------------------------------------------------------------------------------------------------

export const COIN_R = 50;
export const Coin: React.FC<{ x: number; y: number; s: number; rot?: number }> = ({ x, y, s, rot = 0 }) => (
  <g transform={anchor(x, y, s, rot)}>
    <circle cx={0} cy={0} r={50} fill={WHITE} />
    <circle cx={0} cy={0} r={30} fill="none" stroke={INK} strokeWidth={7} />
  </g>
);

// ---------------------------------------------------------------------------------------------------------------
// The party boss's top hat (415 x 360 at 4K, traced). tuck draws between the crown and the band (hat-local units,
// origin at the hat's centre: crown top y -176, band y 56-102, brim bottom y 179).
// ---------------------------------------------------------------------------------------------------------------

export const TOPHAT_H = 360;
const TOPHAT_BRIM =
  "M206 138 L200 134 L104 148 L102 145 L100 102 L96 99 L-100 104 L-102 114 L-104 145 L-106 148 L-204 134 L-208 136 L-208 154 L-204 160 L-94 176 L-46 179 L60 178 L104 175 L200 160 L206 156 Z";
const TOPHAT_CROWN = "M108 -179 L-106 -176 L-110 -173 L-98 -2 L-100 53 L-96 56 L94 51 L98 48 L96 -7 L110 -171 Z";
const TOPHAT_BAND = "M100 56 L98 53 L-100 58 L-104 68 L-104 99 L-100 102 L100 97 L102 94 Z";

export const TopHat: React.FC<{ x: number; y: number; s: number; tuck?: React.ReactNode }> = ({ x, y, s, tuck }) => (
  <g transform={`${anchor(x, y, s)} translate(0 -179)`}>
    <path d={TOPHAT_CROWN} fill={INK} />
    <path d="M-100 50 L98 46 L101 104 L-103 106 Z" fill={INK} />
    {tuck}
    <path d={TOPHAT_BAND} fill={WHITE} stroke={WHITE} strokeWidth={3} />
    <path d={TOPHAT_BRIM} fill={INK} />
  </g>
);

// ---------------------------------------------------------------------------------------------------------------
// The insurance policy: a plain sheet with a folded corner and four dark rules, no readable text (150 x 200).
// Anchored at its centre.
// ---------------------------------------------------------------------------------------------------------------

export const Policy: React.FC<{ x: number; y: number; s: number; rot?: number }> = ({ x, y, s, rot = 0 }) => (
  <g transform={anchor(x, y, s, rot)}>
    <path d="M-75 -100 L40 -100 L75 -65 L75 100 L-75 100 Z" fill={PAPER} />
    <path d="M40 -100 L40 -65 L75 -65 Z" fill={lift(150)} />
    <rect x={-52} y={-60} width={80} height={10} fill={INK} />
    <rect x={-52} y={-30} width={104} height={8} fill={INK} />
    <rect x={-52} y={-6} width={104} height={8} fill={INK} />
    <rect x={-52} y={18} width={104} height={8} fill={INK} />
    <rect x={-52} y={58} width={50} height={8} fill={INK} />
  </g>
);

// ===============================================================================================================
// THE SHARED LAYOUT and the CONTINUATION PARTS (CallUpAnyone, cut 62). The desk parts are traced from
// notes/reference/picto_src70.0.png (borough president, phone) and picto_src76.2.png
// (the governor), both at the same 4K pixel scale (dial 116-117 px in both), by tools/trace_desk.py in the cut's
// animation_source folder (median 7, threshold, approxPolyDP eps 2 px).
// ===============================================================================================================

// ---------------------------------------------------------------------------------------------------------------
// THE SHARED LAYOUT (rev 1, Nov 5): one compact central column, read by BOTH GraftMachine and CallUpAnyone so the
// join (CallUpAnyone f0 = GraftMachine f285) is exact by construction. Safe area x 100-920, y 220-1520.
//   Moses: bust 0.52 x 4K = 424 x 490, x 540, y 222-712. Label: cap 40 (0.48), y 734-829.
//   Row of four (the collected beneficiaries): baseline y 955, icons ~102-108 tall, equal 55 px gaps, x ~239-841.
//   Stage (where each beneficiary is introduced): floor y 1160, icons ~180-200 tall (tops >= 970), centred near
//   x 540-620, right under the row; the lower part dips into caption band 1 (y 1080-1250), no text there.
// ---------------------------------------------------------------------------------------------------------------

export const GM_FINAL_FRAME = 285;
export const G_MX = 540;
export const G_S_M = 0.52;
export const G_MOSES_TOP = 222;
export const G_MOSES_BOTTOM = G_MOSES_TOP + MOSES_H * G_S_M;
export const G_S_LABEL = 0.48;
export const G_LABEL_TOP = G_MOSES_BOTTOM + 22;
export const G_ROW_BASE = 955;
export const G_STAGE_FLOOR = 1160;
// 4K heights of the four beneficiaries (bottom-centre anchored), and their 4K widths at rest
export const G_H = { vault: 844, worker: 840, scales: 881, hat: 360 };
const G_W = { vault: 844, worker: 492, scales: 1276, hat: 416 };
// row scales (target heights 105 / 108 / 102 / 105 px) and x positions with equal gaps about x 540
const ROW_GAP = 55;
const rowS = { vault: 105 / 844, worker: 108 / 840, scales: 102 / 881, hat: 105 / 360 };
const rowWidths = [G_W.vault * rowS.vault, G_W.worker * rowS.worker, G_W.scales * rowS.scales, G_W.hat * rowS.hat];
const rowTotal = rowWidths.reduce((a, b) => a + b, 0) + 3 * ROW_GAP;
const rowX = rowWidths.map(
  (w, i) => G_MX - rowTotal / 2 + rowWidths.slice(0, i).reduce((a, b) => a + b, 0) + i * ROW_GAP + w / 2,
);
export const G_SLOTS = {
  vault: { x: rowX[0], s: rowS.vault },
  worker: { x: rowX[1], s: rowS.worker },
  scales: { x: rowX[2], s: rowS.scales },
  hat: { x: rowX[3], s: rowS.hat },
};
// stage positions and scales (vault 190, worker 200, scales 180, hat 180 px tall)
export const G_STAGE = {
  vault: { x: 600, s: 190 / 844 },
  worker: { x: 540, s: 200 / 840 },
  scales: { x: 540, s: 180 / 881 },
  hat: { x: 620, s: 0.5 },
};
// the coins on the scales' right pan (pan-local units) and their scale on the pan (= the flying coin's world size)
export const G_COIN_S = 0.27;
export const G_COIN_PAN_S = G_COIN_S / G_STAGE.scales.s;
export const G_PAN_COIN_POS: [number, number][] = [
  [-66, PAN_TOP - 66],
  [66, PAN_TOP - 66],
  [0, PAN_TOP - 66 - 114],
];
// coins land on the pan on these frames (GraftMachine time); each landing tips the pan one sprung step
export const G_SCALE_COIN_LAND = [177, 181, 185];
const G_TILT_STEP = 3.2;
const gClamp01 = (v: number) => Math.max(0, Math.min(1, v));
const gInOut = Easing.inOut(Easing.cubic);
export const G_BREATHE_F0 = 274;
// the faint breathe of the finished row; F is GraftMachine time (a continuation goes on with F = 285 + f)
export const gmBreathe = (F: number) =>
  1 +
  0.012 * gInOut(gClamp01((F - G_BREATHE_F0) / 6)) * Math.sin(((F - G_BREATHE_F0) * 2 * Math.PI) / 30);
// the scales' tilt at GraftMachine time F (three landed coins, each sprung)
export const gmTilt = (F: number) =>
  G_SCALE_COIN_LAND.reduce(
    (acc, lf) =>
      acc +
      G_TILT_STEP * (F > lf ? spring({ frame: F - lf, fps: 24, config: { damping: 11, stiffness: 140, mass: 0.6 } }) : 0),
    0,
  );

// The finished row at GraftMachine time F. GraftMachine draws exactly this once every icon has landed; lift[i]
// (world px up) and bump[i] (extra scale) let a continuation animate a slot (both 0 = GraftMachine's picture).
export const GraftRowFinal: React.FC<{ F: number; lift?: number[]; bump?: number[] }> = ({
  F,
  lift = [0, 0, 0, 0],
  bump = [0, 0, 0, 0],
}) => {
  const br = gmBreathe(F);
  const tilt = gmTilt(F);
  const y = (i: number) => G_ROW_BASE - lift[i];
  const k = (i: number) => (bump[i] ? 1 + bump[i] : 1);
  const { vault, worker, scales, hat } = G_SLOTS;
  return (
    <g>
      <TopHat x={hat.x} y={y(3)} s={hat.s * br * k(3)} />
      <Scales
        x={scales.x}
        y={y(2)}
        s={scales.s * br * k(2)}
        tilt={tilt}
        rightPan={G_PAN_COIN_POS.map(([px, py], i) => <Coin key={`pc${i}`} x={px} y={py} s={G_COIN_PAN_S} />)}
      />
      <Worker x={worker.x} y={y(1)} s={worker.s * br * k(1)} />
      <VaultBody x={vault.x} y={y(0)} s={vault.s * br * k(0)} />
      <VaultDoor x={vault.x} y={y(0)} s={vault.s * br * k(0)} open={0} />
    </g>
  );
};
// Moses and his label at rest (pop = 1); GraftMachine scales the pair about the bust's centre for its first frames
export const G_MOSES_CY = G_MOSES_TOP + (MOSES_H * G_S_M) / 2;
export const GraftMosesFinal: React.FC<{ pop?: number }> = ({ pop = 1 }) => (
  <g
    transform={
      pop === 1 ? undefined : `translate(${G_MX} ${n(G_MOSES_CY)}) scale(${n(pop)}) translate(${-G_MX} ${n(-G_MOSES_CY)})`
    }
  >
    <MosesBust x={G_MX} y={G_MOSES_BOTTOM} s={G_S_M} />
    <MosesLabel x={G_MX} y={G_LABEL_TOP} s={G_S_LABEL} />
  </g>
);

// ---------------------------------------------------------------------------------------------------------------
// The desk scene. Anchor for the phone and both men: the phone dial's x and the top of the desk slab (the phone
// base stands on it; the men are cut off by it). The desk itself is a plain slab + front, sized freely.
// ---------------------------------------------------------------------------------------------------------------

export const DESK_SLAB = 43; // slab thickness at 4K
export const DESK_OVERHANG = 28; // the slab overhangs the front on each side
const BOSS_B_BODY =
  "M163 -70 L163 -1 L448 -1 L426 -25 L395 -186 L400 -191 L445 -166 L454 -158 L459 -130 L455 -125 L447 -15 L456 -1 L480 -1 L489 -13 L480 -121 L477 -128 L481 -157 L488 -165 L537 -191 L540 -188 L538 -168 L511 -23 L508 -17 L489 -1 L792 -1 L788 -39 L751 -113 L746 -118 L661 -163 L571 -182 L529 -213 L536 -242 L564 -261 L584 -293 L588 -329 L577 -339 L562 -389 L540 -423 L503 -448 L469 -456 L432 -450 L397 -424 L373 -389 L361 -344 L346 -330 L354 -292 L371 -263 L398 -241 L402 -214 L366 -182 L272 -163 L192 -118 L183 -110 Z";
const BOSS_B_SHIRT =
  "M536 -188 L488 -162 L483 -156 L481 -125 L491 -12 L483 -1 L493 -6 L509 -23 L538 -183 Z M400 -189 L397 -185 L429 -22 L453 -1 L445 -13 L454 -126 L452 -157 Z";
const BOSS_G_BODY =
  "M155 -215 L155 -156 L177 -148 L181 -143 L155 -93 L155 -1 L954 -1 L952 -80 L905 -174 L897 -183 L837 -217 L792 -238 L680 -261 L635 -301 L636 -336 L672 -364 L692 -395 L697 -409 L702 -449 L684 -465 L668 -526 L633 -572 L596 -596 L556 -605 L506 -597 L464 -568 L437 -528 L420 -472 L399 -448 L407 -402 L433 -361 L465 -336 L469 -304 L431 -268 L419 -260 L309 -240 L213 -188 L188 -190 Z";
const BOSS_G_SHIRT =
  "M462 -272 L501 -65 L525 -40 L551 -19 L599 -63 L638 -269 L631 -269 L571 -234 L567 -194 L580 -56 L557 -28 L549 -23 L522 -55 L534 -190 L531 -233 L511 -247 Z";
const PHONE_HANDSET =
  "M-245 -178 L-239 -166 L-131 -166 L-100 -177 L-95 -173 L-96 -166 L-82 -166 L-82 -178 L-78 -182 L1 -190 L77 -182 L81 -177 L81 -166 L94 -166 L96 -175 L126 -166 L237 -166 L243 -177 L240 -181 L187 -181 L148 -206 L77 -227 L13 -233 L-81 -228 L-145 -208 L-187 -182 L-242 -181 Z";
const PHONE_BASE =
  "M-184 -1 L162 -1 L162 -69 L156 -76 L127 -155 L123 -159 L98 -159 L94 -165 L81 -165 L77 -159 L-78 -157 L-82 -165 L-96 -165 L-100 -157 L-125 -155 Z";
const PHONE_DIAL =
  "M-12 -135 L-30 -128 L-47 -113 L-55 -99 L-58 -89 L-58 -66 L-51 -48 L-36 -31 L-18 -22 L-9 -20 L8 -20 L28 -27 L46 -43 L53 -55 L56 -65 L56 -91 L46 -112 L30 -127 L10 -135 Z M-17 -48 L-12 -47 L-8 -42 L-9 -38 L-14 -34 L-18 -35 L-22 -40 L-22 -43 Z M-33 -62 L-30 -61 L-25 -55 L-27 -50 L-32 -47 L-39 -52 L-39 -57 Z M36 -79 L41 -78 L45 -73 L44 -69 L39 -65 L36 -65 L31 -70 L31 -74 Z M-41 -82 L-38 -82 L-33 -77 L-33 -73 L-38 -68 L-42 -68 L-47 -74 L-45 -79 Z M-3 -96 L2 -96 L10 -92 L17 -82 L17 -74 L15 -69 L10 -63 L4 -60 L-8 -61 L-16 -68 L-19 -75 L-19 -80 L-16 -87 L-9 -94 Z M32 -100 L37 -100 L42 -94 L40 -89 L35 -86 L28 -92 L28 -95 Z M-36 -103 L-31 -101 L-29 -98 L-29 -93 L-34 -89 L-37 -89 L-42 -94 L-42 -98 Z M20 -117 L23 -117 L28 -112 L28 -108 L23 -103 L18 -104 L14 -109 L15 -113 Z M-23 -118 L-18 -118 L-14 -114 L-14 -109 L-20 -104 L-27 -109 L-27 -114 Z M0 -124 L5 -122 L8 -117 L3 -110 L-2 -110 L-6 -114 L-6 -119 Z";
// head tops above the slab at 4K (borough 767 -> 1223, governor 561 -> 1166) and right shoulder edges from the dial
export const BOSS_B_TOP = 456;
export const BOSS_G_TOP = 605;
export const BOSS_B_RIGHT = 836;
export const BOSS_G_RIGHT = 955;
export const HANDSET_LEFT = -245; // the handset's earpiece end, x from the dial
export const HANDSET_PIVOT: [number, number] = [0, -166]; // where it rests on the cradle prongs
export const RING_CENTRE: [number, number] = [0, -223]; // the ring marks' arc centre and radius
export const RING_R = 285;

// The desk: slab (with the faint light edge the original shows on its top) and front. (x, y) = the slab's top
// centre in world px, w = the front's world width, bottom = the front's world bottom.
export const Desk: React.FC<{ x: number; y: number; s: number; w: number; bottom: number; children?: React.ReactNode }> = ({
  x,
  y,
  s,
  w,
  bottom,
  children,
}) => {
  const o = DESK_OVERHANG * s;
  const t = DESK_SLAB * s;
  return (
    <g>
      <rect x={n(x - w / 2)} y={n(y + t - 1)} width={n(w)} height={n(bottom - y - t + 1)} fill={INK} />
      <rect x={n(x - w / 2 - o)} y={n(y)} width={n(w + 2 * o)} height={n(t)} fill={INK} />
      <rect x={n(x - w / 2 - o)} y={n(y + 0.2 * t)} width={n(w + 2 * o)} height={n(Math.max(1, 0.06 * t))} fill={lift(38)} />
      {children}
    </g>
  );
};

// A man at the desk: "borough" (picto_src70.0) or "governor" (the heavier man, picto_src76.2), cut at the slab.
export const Boss: React.FC<{ x: number; y: number; s: number; kind: "borough" | "governor" }> = ({ x, y, s, kind }) => {
  const body = kind === "borough" ? BOSS_B_BODY : BOSS_G_BODY;
  const shirt = kind === "borough" ? BOSS_B_SHIRT : BOSS_G_SHIRT;
  return (
    <g transform={anchor(x, y, s)}>
      <path d={shirt} fill={INK} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d={body} fill={INK} />
      <path d={shirt} fill={WHITE} />
    </g>
  );
};

// The rotary phone. lift (4K px up) and tilt (deg) move the handset off its cradle when it rings.
export const Phone: React.FC<{ x: number; y: number; s: number; lift?: number; tilt?: number }> = ({
  x,
  y,
  s,
  lift: up = 0,
  tilt = 0,
}) => (
  <g transform={anchor(x, y, s)}>
    <path d={PHONE_BASE} fill={INK} />
    <path d={PHONE_DIAL} fill={WHITE} fillRule="evenodd" />
    <g
      transform={`translate(${n(HANDSET_PIVOT[0])} ${n(HANDSET_PIVOT[1] - up)}) rotate(${n(tilt)}) translate(${n(-HANDSET_PIVOT[0])} ${n(-HANDSET_PIVOT[1])})`}
    >
      <path d={PHONE_HANDSET} fill={INK} />
    </g>
  </g>
);

// The ring marks: six short white strokes on an arc over the handset (three each side, as picto_src74.0), thin at
// the inner end. k scales their length, spread pushes them out (both 1 = the original); angles (deg, 0 = 3 o'clock,
// -90 = 12 o'clock) picks which marks to draw.
const RING_ANGLES = [-155, -132, -107, -73, -48, -25];
export const RingMarks: React.FC<{
  x: number;
  y: number;
  s: number;
  k?: number;
  spread?: number;
  opacity?: number;
  angles?: number[];
}> = ({ x, y, s, k = 1, spread = 1, opacity = 1, angles = RING_ANGLES }) => {
  const r0 = RING_R * spread - 32 * k;
  const r1 = RING_R * spread + 32 * k;
  return (
    <g transform={anchor(x, y, s)} opacity={opacity}>
      {angles.map((a) => {
        const c = Math.cos((a * Math.PI) / 180);
        const si = Math.sin((a * Math.PI) / 180);
        const px = -si;
        const py = c;
        const cx = RING_CENTRE[0];
        const cy = RING_CENTRE[1];
        const w0 = 3;
        const w1 = 7.5;
        const pts = [
          [cx + c * r0 + px * w0, cy + si * r0 + py * w0],
          [cx + c * r1 + px * w1, cy + si * r1 + py * w1],
          [cx + c * r1 - px * w1, cy + si * r1 - py * w1],
          [cx + c * r0 - px * w0, cy + si * r0 - py * w0],
        ];
        return (
          <path
            key={a}
            d={"M" + pts.map(([u, v]) => `${n(u)} ${n(v)}`).join(" L") + " Z"}
            fill={WHITE}
            stroke={WHITE}
            strokeWidth={5}
            strokeLinejoin="round"
          />
        );
      })}
    </g>
  );
};

// The desk's label, set like Moses' (same face, caps): lines centred on x, (x, y) = top centre of the first line's
// caps. shown = how many characters are typed so far (all lines in order); the layout never shifts as they type.
export const DeskLabel: React.FC<{ x: number; y: number; s: number; lines: string[]; shown?: number; opacity?: number }> = ({
  x,
  y,
  s,
  lines,
  shown = 1e9,
  opacity = 1,
}) => {
  const fs = (LABEL_CAP * s) / CAP_RATIO;
  let count = 0;
  return (
    <g opacity={opacity} fontFamily={LABEL_FONT} fontWeight={800} fontSize={n(fs)} fill={LABEL_WHITE} textAnchor="middle">
      {lines.map((line, li) => (
        <text key={li} x={n(x)} y={n(y + (LABEL_CAP + li * LABEL_PITCH) * s)}>
          {line.split("").map((ch, ci) => {
            count += 1;
            return (
              <tspan key={ci} fillOpacity={count <= shown ? 1 : 0}>
                {ch}
              </tspan>
            );
          })}
        </text>
      ))}
    </g>
  );
};

// The coiled phone cord: a loop-and-hook coil (prolate trochoid) laid along a base curve in WORLD px, drawn from
// its start to `drawn` (0..1) of its length. The base curve is the cubic p0-p1-p2-p3, or, when `via` is given, a
// Catmull-Rom spline through p0, via..., p3 (p1/p2 ignored). pitch = world px per turn, amp = coil half-height,
// width = stroke.
export const CoiledCord: React.FC<{
  p0: [number, number];
  p1?: [number, number];
  p2?: [number, number];
  p3: [number, number];
  via?: [number, number][];
  drawn?: number;
  pitch?: number;
  amp?: number;
  width?: number;
  side?: 1 | -1;
}> = ({ p0, p1, p2, p3, via, drawn = 1, pitch = 16, amp = 7, width = 3.4, side = 1 }) => {
  if (drawn <= 0) return null;
  const N = 240;
  const B: [number, number][] = [];
  if (via && via.length > 0) {
    const P = [p0, ...via, p3];
    const segs = P.length - 1;
    for (let i = 0; i <= N; i++) {
      const g = (i / N) * segs;
      const k = Math.min(segs - 1, Math.floor(g));
      const t = g - k;
      const a = P[Math.max(0, k - 1)];
      const b = P[k];
      const c = P[k + 1];
      const d = P[Math.min(segs, k + 2)];
      const t2 = t * t;
      const t3 = t2 * t;
      const cr = (q0: number, q1: number, q2: number, q3: number) =>
        0.5 * (2 * q1 + (-q0 + q2) * t + (2 * q0 - 5 * q1 + 4 * q2 - q3) * t2 + (-q0 + 3 * q1 - 3 * q2 + q3) * t3);
      B.push([cr(a[0], b[0], c[0], d[0]), cr(a[1], b[1], c[1], d[1])]);
    }
  } else {
    const c1 = p1 ?? p0;
    const c2 = p2 ?? p3;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const u = 1 - t;
      B.push([
        u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p3[0],
        u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p3[1],
      ]);
    }
  }
  const cum = [0];
  for (let i = 1; i <= N; i++) cum.push(cum[i - 1] + Math.hypot(B[i][0] - B[i - 1][0], B[i][1] - B[i - 1][1]));
  const L = cum[N];
  const Ld = L * Math.min(1, drawn);
  const at = (d: number) => {
    let i = 1;
    while (i < N && cum[i] < d) i++;
    const seg = cum[i] - cum[i - 1] || 1;
    const t = (d - cum[i - 1]) / seg;
    const x = B[i - 1][0] + (B[i][0] - B[i - 1][0]) * t;
    const y = B[i - 1][1] + (B[i][1] - B[i - 1][1]) * t;
    const tx = (B[i][0] - B[i - 1][0]) / seg;
    const ty = (B[i][1] - B[i - 1][1]) / seg;
    return { x, y, tx, ty };
  };
  const b = 0.2 * pitch; // along-track swing just over pitch / 2pi: big humps on one side, a small hook between
  const pts: string[] = [];
  const step = 1.2;
  for (let d = 0; d <= Ld; d += step) {
    const p = at(d);
    const th = (2 * Math.PI * d) / pitch;
    const nx = -p.ty * side;
    const ny = p.tx * side;
    const ax = p.x + p.tx * b * Math.sin(th) + nx * amp * Math.cos(th);
    const ay = p.y + p.ty * b * Math.sin(th) + ny * amp * Math.cos(th);
    pts.push(`${n(ax)} ${n(ay)}`);
  }
  if (pts.length < 2) return null;
  return (
    <path
      d={"M" + pts.join(" L")}
      fill="none"
      stroke={INK}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
};
