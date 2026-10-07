// ---------------------------------------------------------------------------
// ransomV2Gold: the goldwork of the Ransom Room (FillThatRoomV2 and its
// sequel), drawn the way a 1596 plate drew treasure: few, large, clear
// vessels; a firm dark outline, the cream form, strokes that follow each
// piece's section so it reads round, a dark casing and a ring of short contact
// strokes where it sits on its neighbours. Twelve Andean forms:
//   kero (flared beaker), aryballos / urpu (pointed base, side lugs, flared
//   neck), sun disc with a face, tumi (crescent knife), standing figurine (the
//   Met's Inca gold figurine: the great capped head, hands on the breast),
//   llama figurine with its blanket, stacked plates, a pair of ear-spools, bars,
//   a wide bowl, a face-neck jar, a gold ear of maize.
// A piece is drawn in px at scale 1 about its base centre (0, 0), up negative.
// "silver" = the same form, paler, its faces left open (no hatching).
// Gold is NEVER orange here: orange is the live hold only (stringsShared).
// ---------------------------------------------------------------------------
import React from "react";
import { DARK, INK, hash, mixColor, pchip, type P2 } from "./incaShared";

const f1 = (n: number) => n.toFixed(1);
const P = (v: P2) => `${f1(v[0])},${f1(v[1])}`;
const poly = (pts: P2[], close = true) => `M${pts.map(P).join("L")}${close ? "Z" : ""}`;
const OUT = { stroke: DARK, strokeWidth: 2.3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const ln = (w = 1.1, a = 0.75) => ({ fill: "none", stroke: DARK, strokeWidth: w, strokeOpacity: a, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });

/** a piece's inks: the lit face, the turned-away face, the hollow; h = the hatching's opacity (0 on silver) */
export type Pal = { main: string; deep: string; hollow: string; h: number };
const GROUND = "#35291B";
export const palOf = (tone: number, silver = false): Pal => ({
  main: mixColor(GROUND, silver ? "#FBF6E6" : INK, silver ? Math.min(1, tone + 0.16) : tone),
  deep: mixColor(GROUND, silver ? "#ECE5D0" : "#D3C5A2", silver ? Math.min(1, tone + 0.16) : tone),
  hollow: mixColor(GROUND, "#5A4B37", tone),
  h: silver ? 0 : 1,
});

const smoothClosed = (pts: P2[]) => {
  const n = pts.length;
  let d = `M${P(pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    d += `C${P([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${P([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${P(p2)}`;
  }
  return `${d}Z`;
};
const ellipseD = (cx: number, cy: number, rx: number, ry: number) => `M${f1(cx - rx)},${f1(cy)}a${f1(rx)},${f1(ry)} 0 1,0 ${f1(2 * rx)},0a${f1(rx)},${f1(ry)} 0 1,0 ${f1(-2 * rx)},0Z`;
const circleD = (cx: number, cy: number, r: number) => ellipseD(cx, cy, r, r);

// ---- turned (lathe) forms ---------------------------------------------------
/** how flat a vessel's section is drawn (minor / major radius: seen a little from above) */
const E = 0.17;
type Lathe = { R: (y: number) => number; y0: number; y1: number; sil: string };
/** keys [height above the base, half-width], bottom to top */
const lathe = (keys: [number, number][]): Lathe => {
  const R = pchip(keys, false);
  const y0 = keys[0][0];
  const y1 = keys[keys.length - 1][0];
  const n = 30;
  const right: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const y = y0 + ((y1 - y0) * i) / n;
    right.push([R(y), -y]);
  }
  const left = right.map(([x, y]) => [-x, y] as P2).reverse();
  // the base is a section too: it bows toward us
  const r0 = R(y0);
  return { R, y0, y1, sil: `${poly([...right, ...left], false)}Q0,${f1(-y0 + 2 * E * r0)} ${P(right[0])}Z` };
};
/** the section's drop at x on a ring of radius r */
const drop = (x: number, r: number) => E * r * Math.sqrt(Math.max(0, 1 - (x * x) / (r * r)));
/** a ring round the vessel at height y, from angle a0 to a1 (deg, 0 = the middle, 90 = the right edge) */
const ring = (L: Lathe, y: number, a0 = -90, a1 = 90) => {
  const r = L.R(y);
  const pts: P2[] = [];
  for (let i = 0; i <= 14; i++) {
    const x = r * Math.sin(((a0 + ((a1 - a0) * i) / 14) * Math.PI) / 180);
    pts.push([x, -y + drop(x, r)]);
  }
  return poly(pts, false);
};
/** the shaded side: strokes that follow the section from `from` (x / r) out to the edge */
const turnHatch = (L: Lathe, ya: number, yb: number, gap: number, from: number, seed: number, side = 1) => {
  let d = "";
  let i = 0;
  for (let y = ya; y < yb; y += gap, i++) {
    const yy = y + (hash(i, seed) - 0.5) * gap * 0.4;
    const r = L.R(yy);
    if (r < 5) continue;
    const a = from + 0.22 * hash(i, seed + 3);
    const xs = [a * r, ((a + 1) / 2) * r, r - 1.3];
    d += `M${xs.map((x) => `${f1(side * x)},${f1(-yy + drop(x, r))}`).join("L")}`;
  }
  return d;
};
/** a point on the vessel's face at height y, angle a (deg) */
const onFace = (L: Lathe, y: number, a: number): P2 => {
  const r = L.R(y);
  const x = r * Math.sin((a * Math.PI) / 180);
  return [x, -y + drop(x, r)];
};
const Mouth: React.FC<{ L: Lathe; pal: Pal }> = ({ L, pal }) => {
  const r = L.R(L.y1);
  return (
    <>
      <path d={ellipseD(0, -L.y1, r, E * r)} fill={pal.hollow} {...OUT} strokeWidth={2} />
      <path d={`M${f1(-r * 0.8)},${f1(-L.y1 - E * r * 0.2)}Q0,${f1(-L.y1 - E * r * 0.95)} ${f1(r * 0.55)},${f1(-L.y1 - E * r * 0.55)}`} {...ln(1.4, 0.55)} />
    </>
  );
};
const Turned: React.FC<{ L: Lathe; pal: Pal; seed: number; from?: number; gap?: number; top?: number }> = ({ L, pal, seed, from = 0.4, gap = 3.3, top }) => (
  <>
    <path d={L.sil} fill={pal.main} {...OUT} />
    <path d={turnHatch(L, L.y0 + 3, top ?? L.y1 - 2, gap, from, seed)} {...ln(1, 0.62 * pal.h)} />
    <path d={turnHatch(L, L.y0 + 5, top ?? L.y1 - 2, gap * 1.9, 0.72, seed + 9)} {...ln(0.9, 0.42 * pal.h)} />
    <path d={turnHatch(L, L.y0 + 4, top ?? L.y1 - 2, gap * 2.6, 0.84, seed + 5, -1)} {...ln(0.85, 0.3 * pal.h)} />
  </>
);

// ---- the twelve forms -------------------------------------------------------
export type Piece = { w: number; h: number; sil: string; draw: (pal: Pal) => React.ReactNode };

const KERO = lathe([
  [0, 25],
  [10, 24.2],
  [46, 23],
  [88, 29.5],
  [118, 38],
]);
const kero: Piece = {
  w: 78,
  h: 124,
  sil: KERO.sil + ellipseD(0, -118, 38, E * 38),
  draw: (pal) => (
    <>
      <Turned L={KERO} pal={pal} seed={11} />
      <path d={ring(KERO, 50) + ring(KERO, 56) + ring(KERO, 84) + ring(KERO, 90)} {...ln(1.25, 0.8)} />
      {/* the incised band: a row of stepped lozenges */}
      <path
        d={[-64, -42, -21, 0, 21, 42, 64]
          .map((a) => {
            const q = (y: number, da: number) => onFace(KERO, y, a + da);
            return `${poly([q(59, 0), q(70, 9), q(81, 0), q(70, -9)])}${poly([q(65, 0), q(70, 4), q(75, 0), q(70, -4)])}`;
          })
          .join("")}
        {...ln(1.05, 0.78)}
      />
      <path d={ring(KERO, 108)} {...ln(1, 0.55)} />
      <Mouth L={KERO} pal={pal} />
    </>
  ),
};

const URPU = lathe([
  [0, 2.5],
  [9, 16],
  [30, 39],
  [58, 51],
  [84, 44],
  [100, 25],
  [108, 14.5],
  [134, 12.5],
  [149, 17],
  [158, 27],
]);
const lug = (s: number) => `M${s * 47},-52q${s * 15},-2 ${s * 14},8q${s * -1},9 ${s * -15},6`;
const aryballos: Piece = {
  w: 108,
  h: 164,
  sil: URPU.sil + ellipseD(0, -158, 27, E * 27) + lug(-1) + lug(1),
  draw: (pal) => (
    <>
      {[-1, 1].map((s) => (
        <g key={s}>
          <path d={lug(s)} fill="none" stroke={DARK} strokeWidth={8.4} strokeLinecap="round" />
          <path d={lug(s)} fill="none" stroke={s < 0 ? pal.main : pal.deep} strokeWidth={4.2} strokeLinecap="round" />
        </g>
      ))}
      <Turned L={URPU} pal={pal} seed={21} top={104} />
      <path d={turnHatch(URPU, 110, 150, 3.2, 0.3, 27)} {...ln(0.95, 0.6 * pal.h)} />
      <path d={ring(URPU, 36) + ring(URPU, 84) + ring(URPU, 104)} {...ln(1.2, 0.8)} />
      {/* the painted panel: a column of concentric lozenges between two ferns */}
      <path
        d={
          [44, 60, 76]
            .map((y) => `${poly([onFace(URPU, y - 7, 0), onFace(URPU, y, 12), onFace(URPU, y + 7, 0), onFace(URPU, y, -12)])}${poly([onFace(URPU, y - 3, 0), onFace(URPU, y, 5), onFace(URPU, y + 3, 0), onFace(URPU, y, -5)])}`)
            .join("") +
          [-22, 22].map((a) => poly([40, 50, 60, 70, 80].map((y) => onFace(URPU, y, a)), false)).join("") +
          [-38, 38]
            .map((a) =>
              [44, 52, 60, 68, 76]
                .map((y) => `M${P(onFace(URPU, y, a))}L${P(onFace(URPU, y + 5, a - 8))}M${P(onFace(URPU, y, a))}L${P(onFace(URPU, y + 5, a + 8))}`)
                .join(""),
            )
            .join("") +
          [-38, 38].map((a) => poly([40, 80].map((y) => onFace(URPU, y, a)), false)).join("")
        }
        {...ln(1, 0.72)}
      />
      {/* the little head under the neck */}
      <circle cx={0} cy={-93} r={4.6} fill={pal.main} {...OUT} strokeWidth={1.8} />
      <Mouth L={URPU} pal={pal} />
    </>
  ),
};

const SUN_C: P2 = [0, -70];
const sunRim = (() => {
  const pts: P2[] = [];
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * 2 * Math.PI;
    const r = i % 2 ? 56 : 69;
    pts.push([SUN_C[0] + r * Math.sin(a), SUN_C[1] - r * Math.cos(a)]);
  }
  return pts;
})();
const arcD = (c: P2, r: number, a0: number, a1: number) => {
  const pts: P2[] = [];
  const n = Math.max(4, Math.ceil(Math.abs(a1 - a0) / 9));
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    pts.push([c[0] + r * Math.sin(a), c[1] - r * Math.cos(a)]);
  }
  return poly(pts, false);
};
const sunDisc: Piece = {
  w: 138,
  h: 139,
  sil: poly(sunRim),
  draw: (pal) => (
    <>
      <path d={poly(sunRim)} fill={pal.main} {...OUT} />
      {/* every ray's ridge, and its shaded flank */}
      <path d={sunRim.map((p, i) => (i % 2 ? "" : `M${P(p)}L${P([SUN_C[0] + (p[0] - SUN_C[0]) * 0.74, SUN_C[1] + (p[1] - SUN_C[1]) * 0.74])}`)).join("")} {...ln(1.1, 0.7)} />
      <path
        d={sunRim
          .map((p, i) => {
            if (i % 2) return "";
            const q = sunRim[(i + 1) % 40];
            return [0.3, 0.55, 0.8].map((t) => `M${P([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t])}L${P([SUN_C[0] + (p[0] - SUN_C[0]) * (0.78 + 0.05 * t), SUN_C[1] + (p[1] - SUN_C[1]) * (0.78 + 0.05 * t)])}`).join("");
          })
          .join("")}
        {...ln(0.8, 0.45 * pal.h)}
      />
      <circle cx={0} cy={-70} r={50} fill={pal.main} {...OUT} strokeWidth={2} />
      <circle cx={0} cy={-70} r={44.5} {...ln(1.1, 0.7)} />
      {Array.from({ length: 28 }, (_, i) => {
        const a = (i / 28) * 2 * Math.PI;
        return <circle key={i} cx={47.3 * Math.sin(a)} cy={-70 - 47.3 * Math.cos(a)} r={1.25} fill={DARK} opacity={0.7} />;
      })}
      {/* the face is raised: the shade lies under and to the right of it */}
      <path d={[30, 33.5, 37, 40.5].map((r, i) => arcD(SUN_C, r, 62 + i * 5, 176 - i * 7)).join("")} {...ln(0.95, 0.58 * pal.h)} />
      <path d={[34, 38, 41.5].map((r, i) => arcD(SUN_C, r, 196 + i * 4, 236 - i * 4)).join("")} {...ln(0.85, 0.36 * pal.h)} />
      {/* brows running into the nose, almond eyes, the toothed mouth, the tears */}
      <path d="M-27,-88Q-15,-97 -5,-88L-5.5,-66Q-7,-60 -2.5,-59.4L2.5,-59.4Q7,-60 5.5,-66L5,-88Q15,-97 27,-88" {...ln(2.2, 0.9)} />
      <path d="M2.4,-84l3,1.6M2.6,-78l3,1.6M2.8,-72l3,1.6M3,-66l2.6,1.4" {...ln(0.85, 0.5 * pal.h)} />
      {[-1, 1].map((s) => (
        <g key={s}>
          <path d={`M${s * 25},-79Q${s * 16},-87 ${s * 8.5},-79Q${s * 16},-73 ${s * 25},-79Z`} fill={pal.deep} {...OUT} strokeWidth={1.7} />
          <circle cx={s * 16.5} cy={-79.6} r={2.4} fill={DARK} opacity={0.9} />
          <path d={`M${s * 17},-70l${s * 2},7l${s * -4},6M${s * 23},-71l${s * 3},6`} {...ln(1, 0.6)} />
        </g>
      ))}
      <path d="M-16,-52h32v9.5h-32Z" fill={pal.deep} {...OUT} strokeWidth={1.8} />
      <path d="M-9.6,-52v9.5M-3.2,-52v9.5M3.2,-52v9.5M9.6,-52v9.5M-16,-47.2h32" {...ln(1, 0.75)} />
      <path d="M-8,-36Q0,-32.5 8,-36" {...ln(1, 0.5)} />
    </>
  ),
};

const TUMI_BLADE = "M-47,-6Q0,9 47,-6Q45,-27 10,-36L-10,-36Q-45,-27 -47,-6Z";
const TUMI_SHAFT = "M-10,-33L-7,-94L7,-94L10,-33Z";
const TUMI_HEAD = "M-15,-124L15,-124Q17,-106 11,-95Q0,-88 -11,-95Q-17,-106 -15,-124Z";
const TUMI_CREST = "M-26,-122Q-25,-150 0,-151Q25,-150 26,-122Z";
const tumi: Piece = {
  w: 96,
  h: 152,
  sil: TUMI_BLADE + TUMI_SHAFT + TUMI_HEAD + TUMI_CREST,
  draw: (pal) => (
    <>
      <path d={TUMI_BLADE} fill={pal.main} {...OUT} />
      <path d="M-40,-9Q0,3 40,-9" {...ln(1.1, 0.6)} />
      <path d={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `M${f1(6 + i * 4)},${f1(-33 + i * 0.9)}Q${f1(13 + i * 3.6)},${f1(-17 + i * 0.4)} ${f1(9 + i * 3.6)},${f1(-2 - i * 0.55)}`).join("")} {...ln(0.9, 0.55 * pal.h)} />
      <path d={TUMI_SHAFT} fill={pal.main} {...OUT} />
      <path d={Array.from({ length: 17 }, (_, i) => `M${f1(1 + hash(i, 31) * 2)},${f1(-38 - i * 3.3)}q4,1.6 ${f1(6.4 - i * 0.12)},-0.6`).join("")} {...ln(0.9, 0.58 * pal.h)} />
      <path d="M-9.4,-42h18.8M-8.6,-56h17.2M-7.8,-86h15.6" {...ln(1.1, 0.7)} />
      {/* the crest: a half-moon of plumes */}
      <path d={TUMI_CREST} fill={pal.main} {...OUT} />
      <path d={[-70, -52, -35, -17, 0, 17, 35, 52, 70].map((a) => `M${f1(13 * Math.sin((a * Math.PI) / 180))},${f1(-124 - 8 * Math.cos((a * Math.PI) / 180))}L${f1(24.5 * Math.sin((a * Math.PI) / 180))},${f1(-123 - 26 * Math.cos((a * Math.PI) / 180))}`).join("")} {...ln(1, 0.7)} />
      <path d="M-21,-124Q-20,-144 0,-145Q20,-144 21,-124" {...ln(0.9, 0.5)} />
      <path d={[8, 12, 16, 20].map((x) => `M${x},-${f1(147 - x * 0.5)}l2.6,${f1(8 + x * 0.3)}`).join("")} {...ln(0.8, 0.45 * pal.h)} />
      <circle cx={-17.5} cy={-110} r={5.4} fill={pal.main} {...OUT} strokeWidth={1.8} />
      <circle cx={17.5} cy={-110} r={5.4} fill={pal.deep} {...OUT} strokeWidth={1.8} />
      <path d={TUMI_HEAD} fill={pal.main} {...OUT} />
      <path d="M-10.5,-114Q-6.5,-118 -2.5,-114Q-6.5,-111 -10.5,-114ZM10.5,-114Q6.5,-118 2.5,-114Q6.5,-111 10.5,-114Z" {...ln(1.2, 0.9)} />
      <path d="M0,-113L-2.4,-104h4.8M-5.6,-99.4h11.2" {...ln(1.2, 0.85)} />
      <path d="M6,-108l5,2.4M5.4,-103.6l5,2.6M5,-99l3.6,2" {...ln(0.8, 0.5 * pal.h)} />
    </>
  ),
};

const FIG_HULL = smoothClosed([
  [0, -152],
  [14, -148],
  [20, -132],
  [20, -114],
  [15, -101],
  [21.5, -96],
  [23, -80],
  [18.5, -66],
  [15.5, -58],
  [14.5, -30],
  [14.5, -7],
  [18, -5],
  [18, 0],
  [-18, 0],
  [-18, -5],
  [-14.5, -7],
  [-14.5, -30],
  [-15.5, -58],
  [-18.5, -66],
  [-23, -80],
  [-21.5, -96],
  [-15, -101],
  [-20, -114],
  [-20, -132],
  [-14, -148],
]);
const figurine: Piece = {
  w: 48,
  h: 152,
  sil: FIG_HULL,
  draw: (pal) => (
    <>
      <path d={FIG_HULL} fill={pal.main} {...OUT} />
      {/* the legs part; the little slab feet */}
      <path d="M0,-58L0,-2" stroke={DARK} strokeWidth={3.2} strokeLinecap="round" />
      <path d="M-17,-5.6h15.4M1.6,-5.6h15.4" {...ln(1.3, 0.8)} />
      <path d="M-9,-60Q0,-55 9,-60" {...ln(1.1, 0.7)} />
      <path d={Array.from({ length: 15 }, (_, i) => `M${f1(7.5 + hash(i, 41) * 2)},${f1(-9 - i * 3.3)}q4,1.4 6,-0.8`).join("")} {...ln(0.9, 0.58 * pal.h)} />
      <path d={Array.from({ length: 12 }, (_, i) => `M${f1(-7.4 + hash(i, 42))},${f1(-10 - i * 4)}q2.6,1.2 4.6,-0.4`).join("")} {...ln(0.8, 0.4 * pal.h)} />
      {/* the arms folded, both hands flat on the breast */}
      <path d="M-21,-95Q-25,-78 -17,-76L-3,-80L-3,-88L-12,-86Q-15,-90 -14,-98" {...ln(1.5, 0.85)} />
      <path d="M21,-95Q25,-78 17,-76L3,-80L3,-88L12,-86Q15,-90 14,-98" {...ln(1.5, 0.85)} />
      <path d="M-9,-86.6l-0.6,7.4M-6,-87.2l-0.4,7.6M9,-86.6l0.6,7.4M6,-87.2l0.4,7.6M0,-89v10" {...ln(0.9, 0.7)} />
      <path d={Array.from({ length: 6 }, (_, i) => `M${f1(15 + hash(i, 43))},${f1(-94 + i * 3.2)}q3.4,1 5.6,-1`).join("")} {...ln(0.85, 0.55 * pal.h)} />
      <path d="M-5,-70Q0,-67 5,-70M0,-66v3" {...ln(0.9, 0.5)} />
      {/* the great head: the cap with its combed lines, the long nose, almond eyes */}
      <path d="M-20,-126Q0,-134 20,-126" {...ln(1.4, 0.85)} />
      <path d={[-136, -141, -146].map((y, i) => `M${-17 + i * 3.5},${y}Q0,${y - 5} ${17 - i * 3.5},${y}`).join("") + "M0,-152v20"} {...ln(0.9, 0.6)} />
      <path d="M-15,-118Q-9.5,-123 -4,-118Q-9.5,-114.5 -15,-118ZM15,-118Q9.5,-123 4,-118Q9.5,-114.5 15,-118Z" fill={pal.deep} {...OUT} strokeWidth={1.5} />
      <path d="M-12,-118h5M7,-118h5" {...ln(1, 0.8)} />
      <path d="M-4,-124L-2.2,-108.5Q0,-106 2.2,-108.5L4,-124" {...ln(1.4, 0.85)} />
      <path d="M-6,-103.4Q0,-101 6,-103.4" {...ln(1.4, 0.9)} />
      <path d={Array.from({ length: 9 }, (_, i) => `M${f1(10.5 + hash(i, 44) * 1.5)},${f1(-106 - i * 4.2)}q4,1 ${f1(7.6 - Math.abs(i - 4) * 0.7)},-1.4`).join("")} {...ln(0.85, 0.55 * pal.h)} />
    </>
  ),
};

const LLAMA: P2[] = [
  [-57, -103],
  [-52, -110],
  [-42, -113],
  [-40, -126],
  [-35.5, -114],
  [-32, -127],
  [-27, -111],
  [-22, -92],
  [-15, -72],
  [0, -67],
  [30, -68],
  [42, -65],
  [50, -58],
  [48, -47],
  [44, -40],
  [44, 0],
  [34, 0],
  [34, -33],
  [30.5, -33],
  [30.5, 0],
  [20.5, 0],
  [21, -36],
  [-5, -36],
  [-5, 0],
  [-15, 0],
  [-15, -33],
  [-18.5, -33],
  [-18.5, 0],
  [-28.5, 0],
  [-28, -40],
  [-33, -58],
  [-38, -82],
  [-41, -95],
  [-55, -96],
];
const llama: Piece = {
  w: 110,
  h: 128,
  sil: poly(LLAMA),
  draw: (pal) => (
    <>
      <path d={poly(LLAMA)} fill={pal.main} {...OUT} />
      {/* the blanket over its back */}
      <path d="M-9,-69L27,-70L29,-47Q9,-43 -11,-47Z" fill={pal.deep} {...OUT} strokeWidth={1.8} />
      <path d="M-10,-58.5Q9,-55.5 28,-58.5M0,-69.5l-1,24M9,-70l0,25M18,-70l1,24" {...ln(1, 0.7)} />
      <path d="M-5,-64h2.5M4,-64.4h2.5M13,-64.6h2.5M22,-64.4h2.5M-5.4,-52.4h2.5M4,-51.6h2.5M13,-51.4h2.5M22,-52h2.5" {...ln(1.6, 0.7)} />
      <circle cx={-44.5} cy={-104.5} r={2} fill={DARK} opacity={0.9} />
      <path d="M-56,-99.6l6,0.4M-38.6,-121l1,6M-31,-121.6l-0.6,6" {...ln(1, 0.7)} />
      {/* the shaded side of the neck, the belly, the far legs */}
      <path d={Array.from({ length: 13 }, (_, i) => `M${f1(-33 + i * 1.15)},${f1(-104 + i * 3.4)}q4.4,0.4 7,-2.6`).join("")} {...ln(0.9, 0.55 * pal.h)} />
      <path d={Array.from({ length: 12 }, (_, i) => `M${f1(-3 + i * 2.1)},-37.4l1.4,-${f1(5 + 3 * hash(i, 51))}`).join("")} {...ln(0.9, 0.55 * pal.h)} />
      <path d={[-10.5, 25, 38.5].map((x, j) => Array.from({ length: 9 }, (_, i) => `M${f1(x)},${f1(-4 - i * 3.3 - hash(i, 52 + j))}q3,0.8 4.6,-0.8`).join("")).join("")} {...ln(0.85, 0.55 * pal.h)} />
      <path d={Array.from({ length: 6 }, (_, i) => `M${f1(40 + i * 0.8)},${f1(-62 + i * 3.4)}q4,0 6,-2`).join("")} {...ln(0.85, 0.5 * pal.h)} />
    </>
  ),
};

const PLATE_DX = [0, 3.5, -2.5, 4, -1, 2];
const platePts = (i: number) => ({ cx: PLATE_DX[i], cy: -9 - i * 8.6, rx: 60 - i * 1.2, ry: 9.2 });
const plates: Piece = {
  w: 124,
  h: 62,
  sil: "M-60,-9L-55,-53A59,9.2 0 0,1 63,-53L60,-9L49,0Q0,6 -49,0Z",
  draw: (pal) => (
    <>
      {PLATE_DX.map((_, i) => {
        const q = platePts(i);
        const last = i === PLATE_DX.length - 1;
        return (
          <g key={i}>
            <path d={`M${f1(q.cx - q.rx)},${f1(q.cy)}L${f1(q.cx - q.rx + 11)},${f1(q.cy + 8.6)}Q${f1(q.cx)},${f1(q.cy + 15)} ${f1(q.cx + q.rx - 11)},${f1(q.cy + 8.6)}L${f1(q.cx + q.rx)},${f1(q.cy)}Z`} fill={pal.deep} {...OUT} strokeWidth={2} />
            <path d={Array.from({ length: 9 }, (__, j) => `M${f1(q.cx + 12 + j * 4.6)},${f1(q.cy + 10.5 - j * 0.35)}l3,-${f1(3.4 + j * 0.2)}`).join("")} {...ln(0.85, 0.55 * pal.h)} />
            <path d={ellipseD(q.cx, q.cy, q.rx, q.ry)} fill={pal.main} {...OUT} strokeWidth={2} />
            {last ? (
              <>
                <path d={ellipseD(q.cx, q.cy + 0.6, q.rx - 9, q.ry - 2.4)} {...ln(1.1, 0.7)} fill={pal.deep} />
                <path d={Array.from({ length: 11 }, (__, j) => `M${f1(q.cx + 4 + j * 4)},${f1(q.cy + 5.4 - j * 0.42)}l3.4,-${f1(3 + j * 0.24)}`).join("")} {...ln(0.85, 0.5 * pal.h)} />
                <path d={`M${f1(q.cx - 40)},${f1(q.cy - 3)}Q${f1(q.cx - 10)},${f1(q.cy - 6.4)} ${f1(q.cx + 22)},${f1(q.cy - 5.4)}`} {...ln(1, 0.45)} />
              </>
            ) : null}
          </g>
        );
      })}
    </>
  ),
};

const SPOOLS: { c: P2; r: number }[] = [
  { c: [-22, -37], r: 35 },
  { c: [29, -30], r: 29 },
];
const spools: Piece = {
  w: 118,
  h: 74,
  sil: SPOOLS.map((s) => circleD(s.c[0], s.c[1], s.r + 1)).join(""),
  draw: (pal) => (
    <>
      {SPOOLS.map((s, j) => (
        <g key={j}>
          {/* the shaft that goes through the ear, behind the disc */}
          <path d={`M${f1(s.c[0] + s.r * 0.25)},${f1(s.c[1] - s.r * 0.36)}l${f1(s.r * 0.95)},${f1(-s.r * 0.3)}l${f1(s.r * 0.16)},${f1(s.r * 0.62)}l${f1(-s.r * 0.95)},${f1(s.r * 0.3)}Z`} fill={pal.deep} {...OUT} strokeWidth={1.9} />
          <circle cx={s.c[0]} cy={s.c[1]} r={s.r} fill={pal.main} {...OUT} />
          <circle cx={s.c[0]} cy={s.c[1]} r={s.r * 0.72} {...ln(1.1, 0.75)} />
          {Array.from({ length: 18 }, (_, i) => {
            const a = (i / 18) * 2 * Math.PI;
            return <circle key={i} cx={s.c[0] + s.r * 0.86 * Math.sin(a)} cy={s.c[1] - s.r * 0.86 * Math.cos(a)} r={s.r * 0.062} fill={pal.main} stroke={DARK} strokeWidth={1} strokeOpacity={0.8} />;
          })}
          <path d={[0.5, 0.58, 0.66].map((t, i) => arcD(s.c, s.r * t, 70 + i * 6, 178 - i * 8)).join("")} {...ln(0.9, 0.56 * pal.h)} />
          <circle cx={s.c[0]} cy={s.c[1]} r={s.r * 0.36} fill={pal.deep} {...OUT} strokeWidth={1.7} />
          <circle cx={s.c[0]} cy={s.c[1]} r={s.r * 0.13} fill={DARK} opacity={0.85} />
          <path d={[0, 60, 120, 180, 240, 300].map((a) => `M${f1(s.c[0] + s.r * 0.18 * Math.sin((a * Math.PI) / 180))},${f1(s.c[1] - s.r * 0.18 * Math.cos((a * Math.PI) / 180))}L${f1(s.c[0] + s.r * 0.33 * Math.sin((a * Math.PI) / 180))},${f1(s.c[1] - s.r * 0.33 * Math.cos((a * Math.PI) / 180))}`).join("")} {...ln(0.9, 0.6)} />
        </g>
      ))}
    </>
  ),
};

const BARS: P2[] = [
  [-31, 0],
  [31, 0],
  [0, -25],
];
const barFront = ([x, y]: P2) => `M${x - 29},${y}L${x - 25},${y - 23}L${x + 23},${y - 23}L${x + 27},${y}Z`;
const barTop = ([x, y]: P2) => `M${x - 25},${y - 23}L${x - 17},${y - 31}L${x + 31},${y - 31}L${x + 23},${y - 23}Z`;
const barSide = ([x, y]: P2) => `M${x + 23},${y - 23}L${x + 31},${y - 31}L${x + 35},${y - 8}L${x + 27},${y}Z`;
const bars: Piece = {
  w: 128,
  h: 58,
  sil: BARS.map((b) => `M${b[0] - 29},${b[1]}L${b[0] - 25},${b[1] - 23}L${b[0] - 17},${b[1] - 31}L${b[0] + 31},${b[1] - 31}L${b[0] + 35},${b[1] - 8}L${b[0] + 27},${b[1]}Z`).join(""),
  draw: (pal) => (
    <>
      {BARS.map((b, j) => (
        <g key={j}>
          <path d={barSide(b)} fill={pal.deep} {...OUT} strokeWidth={2} />
          <path d={Array.from({ length: 7 }, (_, i) => `M${f1(b[0] + 24.4 + i * 0.6)},${f1(b[1] - 21 + i * 3.2)}l7,-7`).join("")} {...ln(0.9, 0.6 * pal.h)} />
          <path d={barTop(b)} fill={pal.main} {...OUT} strokeWidth={2} />
          <path d={barFront(b)} fill={pal.main} {...OUT} strokeWidth={2} />
          <path d={Array.from({ length: 8 }, (_, i) => `M${f1(b[0] + 2 + i * 3)},${f1(b[1] - 2.4)}l${f1(1.6)},-${f1(4 + i * 1.5)}`).join("")} {...ln(0.9, 0.52 * pal.h)} />
          {/* the founder's stamp */}
          <path d={`M${b[0] - 15},${b[1] - 16}h9v9h-9ZM${b[0] - 12.4},${b[1] - 13.4}h3.8v3.8h-3.8Z`} {...ln(0.9, 0.6)} />
        </g>
      ))}
    </>
  ),
};

const BOWL = lathe([
  [0, 19],
  [5, 21],
  [13, 38],
  [38, 57],
  [60, 63],
]);
const bowl: Piece = {
  w: 128,
  h: 70,
  sil: BOWL.sil + ellipseD(0, -60, 63, E * 63),
  draw: (pal) => (
    <>
      <Turned L={BOWL} pal={pal} seed={61} gap={3.1} top={56} />
      <path d={ring(BOWL, 5) + ring(BOWL, 40) + ring(BOWL, 51)} {...ln(1.2, 0.8)} />
      {[-70, -52, -35, -17, 0, 17, 35, 52, 70].map((a) => {
        const q = onFace(BOWL, 45.5, a);
        return <circle key={a} cx={q[0]} cy={q[1]} r={2.3 * Math.max(0.5, Math.cos((a * Math.PI) / 180))} {...ln(1, 0.75)} />;
      })}
      <path d={ellipseD(0, -60, 63, E * 63)} fill={pal.hollow} {...OUT} strokeWidth={2} />
      <path d={Array.from({ length: 13 }, (_, i) => `M${f1(-50 + i * 6)},${f1(-60 - 6.4 * Math.sqrt(1 - Math.pow((-50 + i * 6) / 63, 2)))}l2.4,${f1(5 + 2 * hash(i, 62))}`).join("")} {...ln(0.9, 0.5)} />
      <path d="M-52,-56.4Q0,-45 52,-56.4" {...ln(1, 0.5)} />
    </>
  ),
};

const JAR = lathe([
  [0, 23],
  [9, 35],
  [38, 48],
  [68, 42],
  [86, 25],
  [94, 21],
  [120, 23],
  [133, 31],
]);
const JAR_STRAP = "M22,-118Q46,-116 47,-96Q47,-80 40,-74";
const faceJar: Piece = {
  w: 104,
  h: 140,
  sil: JAR.sil + ellipseD(0, -133, 31, E * 31) + JAR_STRAP,
  draw: (pal) => (
    <>
      <path d={JAR_STRAP} fill="none" stroke={DARK} strokeWidth={10.6} strokeLinecap="round" />
      <path d={JAR_STRAP} fill="none" stroke={pal.deep} strokeWidth={6} strokeLinecap="round" />
      <Turned L={JAR} pal={pal} seed={71} top={90} />
      <path d={turnHatch(JAR, 96, 128, 3.1, 0.5, 77)} {...ln(0.9, 0.58 * pal.h)} />
      <path d={ring(JAR, 30) + ring(JAR, 36) + ring(JAR, 60) + ring(JAR, 66) + ring(JAR, 90)} {...ln(1.2, 0.8)} />
      {/* the stepped fret round the belly */}
      <path
        d={[-68, -45, -22, 0, 22, 45, 68]
          .map((a) => poly([onFace(JAR, 40, a - 9), onFace(JAR, 48, a - 9), onFace(JAR, 48, a), onFace(JAR, 56, a), onFace(JAR, 56, a + 9)], false))
          .join("")}
        {...ln(1.1, 0.75)}
      />
      {/* the face on the neck */}
      <path d="M-13,-113Q-8.5,-117 -4,-113Q-8.5,-110 -13,-113ZM13,-113Q8.5,-117 4,-113Q8.5,-110 13,-113Z" {...ln(1.2, 0.9)} />
      <path d="M-1.6,-116L-3,-104.6h6L1.6,-116M-6,-99.6Q0,-97.6 6,-99.6" {...ln(1.25, 0.85)} />
      <path d="M-16,-119Q-8,-123 -2,-119.4M16,-119Q8,-123 2,-119.4" {...ln(1.3, 0.75)} />
      <Mouth L={JAR} pal={pal} />
    </>
  ),
};

const COB = lathe([
  [16, 9],
  [30, 18.5],
  [78, 20],
  [112, 13],
  [132, 2.5],
]);
const HUSK_L = "M-3,0Q-40,-22 -37,-78Q-33,-90 -30,-78Q-22,-42 -6,-22Z";
const HUSK_R = "M3,0Q40,-18 40,-66Q37,-80 33,-67Q24,-36 6,-20Z";
const maize: Piece = {
  w: 80,
  h: 134,
  sil: COB.sil + HUSK_L + HUSK_R + "M-6,2L-5,-20L5,-20L6,2Z",
  draw: (pal) => (
    <>
      <path d="M-6,2L-5,-22L5,-22L6,2Z" fill={pal.deep} {...OUT} strokeWidth={2} />
      <path d={COB.sil} fill={pal.main} {...OUT} />
      {/* the kernels: rows round the cob, files up it */}
      <path d={Array.from({ length: 15 }, (_, i) => ring(COB, 24 + i * 7)).join("")} {...ln(0.95, 0.7)} />
      <path d={[-62, -38, -13, 13, 38, 62].map((a) => poly(Array.from({ length: 12 }, (_, i) => onFace(COB, 22 + i * 9.6, a)), false)).join("")} {...ln(0.95, 0.7)} />
      <path d={turnHatch(COB, 22, 126, 3.5, 0.62, 81)} {...ln(0.85, 0.5 * pal.h)} />
      {[HUSK_L, HUSK_R].map((d, j) => (
        <path key={j} d={d} fill={j ? pal.deep : pal.main} {...OUT} strokeWidth={2} />
      ))}
      <path d="M-8,-12Q-32,-34 -34,-74M-12,-22Q-27,-44 -31,-66M8,-11Q33,-30 37,-63M12,-20Q28,-38 33,-56" {...ln(0.95, 0.6)} />
      <path d={Array.from({ length: 9 }, (_, i) => `M${f1(13 + i * 2.6)},${f1(-13 - i * 4.6)}l5,-${f1(1 + i * 0.5)}`).join("")} {...ln(0.85, 0.5 * pal.h)} />
    </>
  ),
};

export const PIECES = { kero, aryballos, sunDisc, tumi, figurine, llama, plates, spools, bars, bowl, faceJar, maize };
export type Kind = keyof typeof PIECES;
export const KINDS = Object.keys(PIECES) as Kind[];

/** one piece: base centre at (x, y) world px, `s` its scale, `rot` its lean (deg, about the base).
 *  Under it: the dark casing and a ring of short contact strokes on whatever it stands against. */
export const GoldPiece: React.FC<{ kind: Kind; x: number; y: number; s?: number; rot?: number; flip?: boolean; tone?: number; silver?: boolean; opacity?: number; contact?: boolean }> = ({
  kind,
  x,
  y,
  s = 1,
  rot = 0,
  flip = false,
  tone = 1,
  silver = false,
  opacity = 1,
  contact = true,
}) => {
  const p = PIECES[kind];
  const pal = palOf(tone, silver);
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot.toFixed(2)}) scale(${(flip ? -s : s).toFixed(3)} ${s.toFixed(3)})`} opacity={opacity < 0.999 ? opacity : undefined}>
      {contact ? <path d={p.sil} fill="none" stroke={DARK} strokeOpacity={0.62} strokeWidth={19} strokeDasharray="1.3 2.9" strokeLinejoin="round" transform={`translate(${flip ? -2.5 : 2.5} 3)`} /> : null}
      <path d={p.sil} fill={DARK} stroke={DARK} strokeWidth={7.5} strokeLinejoin="round" />
      {p.draw(pal)}
    </g>
  );
};
