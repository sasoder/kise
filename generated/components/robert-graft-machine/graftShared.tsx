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
import { AbsoluteFill } from "remotion";
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
// Scissors (black, side view as the original's): pivot at the origin, blades pointing to -x, one handle and ring
// to +x. open 0..1 = blades 2..18 deg off the axis. Anchored at the pivot.
// ---------------------------------------------------------------------------------------------------------------

export const SCISSOR_BLADE = 267;
export const Scissors: React.FC<{ x: number; y: number; s: number; rot?: number; open: number }> = ({
  x,
  y,
  s,
  rot = 0,
  open,
}) => {
  const half = 2 + 16 * Math.max(0, Math.min(1, open));
  const blade = `30,-13 30,13 ${-SCISSOR_BLADE},0`;
  return (
    <g transform={anchor(x, y, s, rot)}>
      <polygon points={blade} fill={INK} transform={`rotate(${n(-half)})`} />
      <polygon points={blade} fill={INK} transform={`rotate(${n(half)})`} />
      <rect x={0} y={-24} width={160} height={48} fill={INK} />
      <path
        d="M203 -53 A53 53 0 1 1 202.9 -53 Z M203 -30 A30 30 0 1 0 203.1 -30 Z"
        fill={INK}
        fillRule="evenodd"
      />
      <circle cx={0} cy={0} r={11} fill={WHITE} />
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
