// ---------------------------------------------------------------------------
// pandemicFolkSketch — STYLE FRAMES for the kyle-pandemics V3 cast, take 2 (brief_V3_cast2.md, step 1 only).
// The director's pick after the first sheet (Oct 21): style A, GOUACHE. A drawn, picture-book cast (not realism, not
// 3D, not Mii): flat matte colour shapes, no outline, ONE soft crescent shadow per part from the upper-left light in a
// darker local colour, gouache grain + blotchy dry-brush wash + a few pale specks, hand-wobbly edges; dot eyes, a small
// nose, blush dots; mitten hands. Borrowed from the dropped variant B: the GLANCE (a tiny white almond whose dot shifts)
// for moments that act (faceFront look: -1..1), e.g. cut 74's turn.
//
// Units: a figure's feet at (0, 0), up is -y; the Worker is ~512 units to the top of his cap. Each drawing is a list
// of Parts (paths in units) painted back to front; FolkFigure renders it at (x, y, scale) inside an SVG (screen px).
// A drawing may carry a stance tilt: the body rotates about the hip (one hip a touch up), the head about the neck.
// The texture is an SVG filter in screen px, so it reads the same at any size.
// This is a design-sheet module: the production cast (poses, turn, anchors, sprites) is step 2 (pandemicFolk.tsx).
// ---------------------------------------------------------------------------
import React from "react";

export type VariantId = "A";
export type Inks = Record<string, string>;
export type Variant = {
  id: VariantId;
  name: string;
  /** crescent shadow: offset (units, toward the upper left), softness (px), mix toward `to` by `amt` */
  shade: { off: number; blur: number; amt: number; to: string };
  /** texture strengths: fine grain, blotchy wash, edge wobble (px at an 860 px figure), pale specks */
  tex: { grain: number; blotch: number; wobble: number; speck: number; speckColor: string };
  inks: Inks;
};

// ---- colour helpers ----------------------------------------------------------------------------------------------
const hx = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const toHex = (c: number[]) => `#${c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
export const mixC = (a: string, b: string, t: number) => {
  const A = hx(a);
  const B = hx(b);
  return toHex(A.map((v, i) => v + (B[i] - v) * t));
};

// ---- path helpers ------------------------------------------------------------------------------------------------
type P = [number, number];
const n2 = (v: number) => (Math.round(v * 100) / 100).toString();
/** an ellipse as a path */
export const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${n2(cx - rx)} ${n2(cy)} A ${n2(rx)} ${n2(ry)} 0 1 0 ${n2(cx + rx)} ${n2(cy)} A ${n2(rx)} ${n2(ry)} 0 1 0 ${n2(cx - rx)} ${n2(cy)} Z`;
const mapPath = (d: string, fx: (x: number) => number, fy: (y: number) => number, flipSweep: boolean) => {
  const tok = d.match(/[MLCQAZ]|-?\d*\.?\d+(?:e-?\d+)?/gi) ?? [];
  const out: string[] = [];
  let cmd = "";
  let k = 0;
  for (const t of tok) {
    if (/^[MLCQAZ]$/i.test(t)) {
      cmd = t.toUpperCase();
      k = 0;
      out.push(cmd);
      continue;
    }
    let v = parseFloat(t);
    if (cmd === "A") {
      const slot = k % 7;
      if (slot === 4 && flipSweep) v = v ? 0 : 1;
      if (slot === 5) v = fx(v);
      if (slot === 6) v = fy(v);
    } else v = k % 2 === 0 ? fx(v) : fy(v);
    out.push(n2(v));
    k++;
  }
  return out.join(" ");
};
/** mirror a path (absolute M L C Q A Z only) about x = 0 */
export const mir = (d: string) => mapPath(d, (x) => -x, (y) => y, true);
/** translate a path */
export const mv = (d: string, dx: number, dy: number) => mapPath(d, (x) => x + dx, (y) => y + dy, false);
/** scale a path about (cx, cy) */
export const sc = (d: string, cx: number, cy: number, k: number) => mapPath(d, (x) => cx + (x - cx) * k, (y) => cy + (y - cy) * k, false);
/** a tapered limb as a closed shape along a polyline, widths w0 -> w1, round ends */
export const limb = (pts: P[], w0: number, w1: number) => {
  const L: P[] = [];
  const R: P[] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0];
    let ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1;
    tx /= l;
    ty /= l;
    const w = (w0 + (w1 - w0) * (i / (n - 1))) / 2;
    L.push([pts[i][0] - ty * w, pts[i][1] + tx * w]);
    R.push([pts[i][0] + ty * w, pts[i][1] - tx * w]);
  }
  const e0 = (w0 / 2).toFixed(2);
  const e1 = (w1 / 2).toFixed(2);
  let d = `M ${n2(L[0][0])} ${n2(L[0][1])}`;
  for (let i = 1; i < n; i++) d += ` L ${n2(L[i][0])} ${n2(L[i][1])}`;
  d += ` A ${e1} ${e1} 0 0 0 ${n2(R[n - 1][0])} ${n2(R[n - 1][1])}`;
  for (let i = n - 2; i >= 0; i--) d += ` L ${n2(R[i][0])} ${n2(R[i][1])}`;
  d += ` A ${e0} ${e0} 0 0 0 ${n2(L[0][0])} ${n2(L[0][1])} Z`;
  return d;
};
/** quadratic and cubic samplers (for limb()) */
export const curve = (p0: P, p1: P, p2: P, n = 10): P[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return [(1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]];
  });
export const cubic = (p0: P, p1: P, p2: P, p3: P, n = 16): P[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const a = (1 - t) ** 3;
    const b = 3 * (1 - t) ** 2 * t;
    const c = 3 * (1 - t) * t * t;
    const d = t ** 3;
    return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
  });

// ---- parts -------------------------------------------------------------------------------------------------------
export type Grp = "h" | "b" | "l";
export type Part = {
  d: string;
  /** ink key (figure inks, then Variant.inks) or a literal #hex */
  ink: string;
  /** h = head (tilts about the neck), b = body (tilts about the hip; default), l = legs (planted) */
  g?: Grp;
  /** crescent shadow multiplier (0 = none; default 1) */
  sh?: number;
  /** a stroke-only detail line (width in px at an 860 px figure), in a darker local colour unless `keep` */
  det?: number;
  keep?: boolean;
  op?: number;
  /** a soft cast-shadow shape (fills with the shadow of `ink`, blurred) */
  cast?: boolean;
};
export type Drawing = { parts: Part[]; hipY: number; neckY: number; inks?: Inks; tilt?: { body: number; head: number } };

const shadeOf = (v: Variant, c: string) => mixC(c, v.shade.to, v.shade.amt);
const inkOf = (v: Variant, d: Drawing, k: string) => (k.startsWith("#") ? k : (d.inks?.[k] ?? v.inks[k] ?? "#ff00ff"));

// ---- texture (screen px) -------------------------------------------------------------------------------------------
const GREY = "0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 1";
const FolkFilters: React.FC<{ v: Variant; uid: string; px: number }> = ({ v, uid, px }) => {
  // px = the figure's size factor (1 at an ~860 px Worker): wobble and wash scale gently with it, grain stays fine
  const k = Math.max(0.2, Math.min(1.4, px));
  const wob = v.tex.wobble * k;
  const g = v.tex.grain;
  const b = v.tex.blotch;
  return (
    <defs>
      <filter id={`${uid}tx`} x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
        {/* hand-wobbly edges */}
        <feTurbulence type="fractalNoise" baseFrequency={(0.02 / Math.max(0.45, k)).toFixed(4)} numOctaves={2} seed={11} result="wn" />
        <feDisplacementMap in="SourceGraphic" in2="wn" scale={wob.toFixed(2)} xChannelSelector="R" yChannelSelector="G" result="wb" />
        {/* fine paper / pigment grain */}
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={5} result="gn" />
        <feColorMatrix in="gn" type="matrix" values={GREY} result="gg" />
        {/* dry-brush: short, multidirectional mottling (isotropic, mid frequency) — a wash, not stripes */}
        <feTurbulence type="fractalNoise" baseFrequency={(0.11 / Math.max(0.6, k)).toFixed(4)} numOctaves={3} seed={23} result="bn" />
        <feColorMatrix in="bn" type="matrix" values={GREY} result="bb" />
        <feComposite in="wb" in2="gg" operator="arithmetic" k1={(2 * g).toFixed(3)} k2={(1 - g).toFixed(3)} k3="0" k4="0" result="t1" />
        <feComposite in="t1" in2="bb" operator="arithmetic" k1={(2 * b).toFixed(3)} k2={(1 - b).toFixed(3)} k3="0" k4="0" result="t2" />
        {/* a few pale dry-brush specks */}
        <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves={1} seed={41} result="pn" />
        <feComponentTransfer in="pn" result="pk">
          <feFuncA type="discrete" tableValues={`0 0 0 0 0 0 0 0 0 0 0 0 0 ${v.tex.speck.toFixed(2)}`} />
        </feComponentTransfer>
        <feFlood floodColor={v.tex.speckColor} result="pc" />
        <feComposite in="pc" in2="pk" operator="in" result="pp" />
        <feMerge result="t3">
          <feMergeNode in="t2" />
          <feMergeNode in="pp" />
        </feMerge>
        <feComposite in="t3" in2="wb" operator="in" />
      </filter>
    </defs>
  );
};

/** a drawing at screen (x, y) (the feet), `scale` px per unit */
export const FolkFigure: React.FC<{ d: Drawing; v: Variant; x: number; y: number; scale: number; uid: string; opacity?: number }> = ({ d, v, x, y, scale, uid, opacity = 1 }) => {
  const px = (scale * 512) / 860;
  const bt = d.tilt?.body ?? 0;
  const ht = d.tilt?.head ?? 0;
  const tfOf = (g: Grp = "b") => {
    if (g === "l") return undefined;
    const body = bt ? `rotate(${bt} 0 ${d.hipY})` : "";
    if (g === "h") return `${body} ${ht ? `rotate(${ht} 0 ${d.neckY})` : ""}`.trim() || undefined;
    return body || undefined;
  };
  const off = v.shade.off;
  const blurU = v.shade.blur / scale;
  return (
    <g opacity={opacity}>
      <FolkFilters v={v} uid={uid} px={px} />
      <defs>
        <filter id={`${uid}su`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={Math.max(0.01, blurU).toFixed(3)} />
        </filter>
        <filter id={`${uid}cu`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={Math.max(0.01, blurU * 2.2).toFixed(3)} />
        </filter>
      </defs>
      <g filter={`url(#${uid}tx)`}>
        <g transform={`translate(${n2(x)} ${n2(y)}) scale(${scale})`}>
          {d.parts.map((p, i) => {
            const base = inkOf(v, d, p.ink);
            const tf = tfOf(p.g);
            if (p.det !== undefined) {
              return (
                <path
                  key={i}
                  d={p.d}
                  transform={tf}
                  fill="none"
                  stroke={p.keep ? base : mixC(base, "#1E1611", 0.32)}
                  strokeWidth={(p.det * Math.max(0.45, Math.min(1.3, px))).toFixed(2)}
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={p.op ?? 0.55}
                />
              );
            }
            if (p.cast) return <path key={i} d={p.d} transform={tf} fill={shadeOf(v, base)} opacity={p.op ?? 0.8} filter={`url(#${uid}cu)`} />;
            const sh = p.sh ?? 1;
            const mid = `${uid}m${i}`;
            return (
              <g key={i} transform={tf}>
                <path d={p.d} fill={base} opacity={p.op ?? 1} />
                {sh > 0 ? (
                  <>
                    <mask id={mid} maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="4000" height="4000">
                      <path d={p.d} fill="#fff" />
                      <path d={p.d} fill="#000" transform={`translate(${n2(-off * sh)} ${n2(-off * sh * 1.05)})`} filter={`url(#${uid}su)`} />
                    </mask>
                    <rect x={-2000} y={-2000} width={4000} height={4000} mask={`url(#${mid})`} fill={shadeOf(v, base)} opacity={p.op ?? 1} />
                  </>
                ) : null}
              </g>
            );
          })}
        </g>
      </g>
    </g>
  );
};

/** a soft contact shadow on the ground (screen px) */
export const FolkShadow: React.FC<{ x: number; y: number; w: number; uid: string; color?: string; opacity?: number }> = ({ x, y, w, uid, color = "#22180F", opacity = 0.32 }) => (
  <g>
    <defs>
      <radialGradient id={`${uid}cs`}>
        <stop offset="0" stopColor={color} stopOpacity={opacity} />
        <stop offset="0.6" stopColor={color} stopOpacity={opacity * 0.55} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={x + w * 0.1} cy={y} rx={w * 0.62} ry={w * 0.1} fill={`url(#${uid}cs)`} />
  </g>
);

// ===================================================================================================================
// THE STYLE (A, gouache)
// ===================================================================================================================
export const VARIANTS: Record<VariantId, Variant> = {
  A: {
    id: "A",
    name: "A  gouache: flat matte paint, dot eyes, no outline",
    shade: { off: 7, blur: 3.2, amt: 0.3, to: "#2C3433" },
    tex: { grain: 0.11, blotch: 0.06, wobble: 3, speck: 0.16, speckColor: "#F6EEDC" },
    inks: {
      skin: "#E9C6A4",
      skinSh: "#C89A7C",
      blush: "#D98A80",
      eye: "#2A201A",
      eyeW: "#F7F1E3",
      hair: "#6E4E38",
      cap: "#8E4D3E",
      capRib: "#7B4034",
      shirt: "#ECE2CC",
      vest: "#5A4434",
      apron: "#BFA67E",
      apronTie: "#A08865",
      trousers: "#4E4640",
      trousersFar: "#3F3833",
      boots: "#33261E",
    },
  },
};

// ===================================================================================================================
// FACES
// ===================================================================================================================
/** a front face: eyes at (cx ± sp, eyeY). look undefined = dot eyes; look -1..1 = the glance (a tiny white almond whose
 *  dot shifts sideways), for moments that act */
export const faceFront = (cx: number, eyeY: number, sp: number, opts: { look?: number; brows?: number; blush?: boolean; nose?: boolean } = {}): Part[] => {
  const P: Part[] = [];
  const g: Grp = "h";
  for (const s of [-1, 1]) {
    const ex = cx + s * sp;
    if (opts.look === undefined) P.push({ d: ell(ex, eyeY, 4.3, 5.2), ink: "eye", g, sh: 0 });
    else {
      P.push({ d: `M ${ex - 8} ${eyeY} C ${ex - 5} ${eyeY - 5.5} ${ex + 5} ${eyeY - 5.5} ${ex + 8} ${eyeY} C ${ex + 5} ${eyeY + 4.5} ${ex - 5} ${eyeY + 4.5} ${ex - 8} ${eyeY} Z`, ink: "eyeW", g, sh: 0 });
      P.push({ d: ell(ex + opts.look * 4.2, eyeY - 0.2, 3.3, 3.8), ink: "eye", g, sh: 0 });
    }
  }
  if (opts.nose !== false) P.push({ d: `M ${cx - 3} ${eyeY + 6} C ${cx - 1} ${eyeY + 2} ${cx + 5} ${eyeY + 3} ${cx + 6} ${eyeY + 11} C ${cx + 6} ${eyeY + 16} ${cx} ${eyeY + 17} ${cx - 4} ${eyeY + 14} Z`, ink: "skinSh", g, sh: 0 });
  if (opts.blush !== false) {
    P.push({ d: ell(cx - sp - 12, eyeY + 15, 8, 5), ink: "blush", g, sh: 0, op: 0.55 });
    P.push({ d: ell(cx + sp + 12, eyeY + 15, 8, 5), ink: "blush", g, sh: 0, op: 0.55 });
  }
  if (opts.brows) {
    for (const s of [-1, 1]) {
      const ex = cx + s * sp;
      P.push({ d: `M ${ex - 7 * s} ${eyeY - 13 - opts.brows} L ${ex + 7 * s} ${eyeY - 12}`, ink: "#8C8070", g, det: 2.4, keep: true, op: 0.85 });
    }
  }
  return P;
};
/** a profile face (facing +x): one eye at (ex, ey) */
const faceSide = (ex: number, ey: number): Part[] => [
  { d: ell(ex, ey, 4.2, 5.2), ink: "eye", g: "h", sh: 0 },
  { d: ell(ex - 10, ey + 16, 8, 5), ink: "blush", g: "h", sh: 0, op: 0.5 },
];

// ===================================================================================================================
// THE WORKER (c.1900 working man: knitted cap, rolled sleeves, waistcoat, apron, boots) — front / profile / back
// Stance: weight on his left leg (screen right), that hip a touch up, the head tipped a little the other way.
// ===================================================================================================================
const HIP = -216;
const NECK = -390;
const STANCE = { body: -1.6, head: 4.5 };
const wHead = "M 0 -494 C 30 -494 51 -472 51 -442 C 51 -410 33 -388 0 -388 C -33 -388 -51 -410 -51 -442 C -51 -472 -30 -494 0 -494 Z";
const wCapDome = "M -55 -452 C -58 -488 -32 -511 4 -512 C 22 -513 38 -506 47 -494 C 54 -484 57 -470 55 -452 Z";
const wCapBrim = "M -57 -472 C -30 -478 30 -478 57 -472 C 60 -463 60 -453 57 -446 C 30 -441 -30 -441 -57 -446 C -60 -453 -60 -463 -57 -472 Z";
// a pear: narrow sloping shoulders, the belly and hips the widest
const wTorso = "M -20 -390 C -40 -389 -52 -381 -56 -364 C -64 -334 -82 -296 -87 -262 C -90 -238 -81 -221 -62 -214 L 62 -214 C 81 -221 90 -238 87 -262 C 82 -296 64 -334 56 -364 C 52 -381 40 -389 20 -390 Z";
const wVest = "M -20 -390 C -40 -389 -52 -381 -56 -364 C -64 -334 -82 -298 -87 -266 C -88 -250 -81 -240 -70 -237 L -10 -229 L 0 -222 L 10 -229 L 70 -237 C 81 -240 88 -250 87 -266 C 82 -298 64 -334 56 -364 C 52 -381 40 -389 20 -390 L 0 -330 Z";
const wApron =
  "M -27 -336 C -10 -338 10 -338 27 -336 L 31 -270 C 55 -266 73 -255 80 -238 C 86 -202 89 -162 91 -124 C 68 -113 36 -107 4 -109 C -28 -107 -62 -113 -87 -125 C -87 -162 -83 -202 -78 -238 C -72 -255 -54 -266 -31 -270 Z";
// his right arm (screen left), a slight bend at the elbow, the forearm coming in toward the thigh
const wArm = (thumb: boolean): Part[] => [
  { d: "M -42 -383 C -62 -386 -78 -372 -86 -351 C -92 -333 -98 -315 -100 -301 L -74 -295 C -71 -315 -63 -342 -42 -383 Z", ink: "shirt" },
  { d: "M -72 -346 C -77 -328 -80 -314 -81 -304", ink: "shirt", det: 1.3 },
  { d: "M -103 -302 C -94 -307 -79 -306 -72 -300 C -70 -293 -70 -285 -73 -280 C -82 -277 -96 -278 -103 -282 C -106 -288 -106 -296 -103 -302 Z", ink: "shirt" },
  { d: "M -100 -283 C -96 -260 -89 -242 -84 -229 L -65 -231 C -66 -247 -69 -266 -74 -283 Z", ink: "skin" },
  { d: "M -86 -236 C -92 -219 -91 -203 -84 -197 C -78 -192 -69 -193 -65 -199 C -61 -207 -61 -221 -64 -236 Z", ink: "skin" },
  { d: "M -82 -212 C -80 -206 -78 -202 -75 -200", ink: "skinSh", det: 1.3, op: 0.5 },
  ...(thumb ? [{ d: "M -66 -232 C -58 -230 -55 -221 -59 -213 C -61 -211 -64 -211 -66 -214 Z", ink: "skin", sh: 0.6 } as Part] : []),
];
// legs: his right (screen left) relaxed, angled out, the knee soft; his left (screen right) straight under the hip.
// Tapering to SMALL feet.
const legL = "M -64 -238 C -64 -170 -55 -86 -47 -26 L -27 -26 C -24 -86 -13 -170 -4 -238 Z";
const legR = "M 4 -238 C 7 -166 17 -86 21 -26 L 41 -26 C 46 -86 56 -166 62 -238 Z";
const footL = "M -47 -30 C -47 -36 -26 -36 -25 -30 C -21 -16 -21 -2 -29 0 L -50 0 C -60 0 -63 -6 -59 -12 C -55 -17 -50 -22 -47 -30 Z";
const footR = "M 21 -30 C 21 -36 42 -36 42 -30 C 48 -22 54 -14 55 -7 C 56 -1 51 0 45 0 L 24 0 C 16 0 15 -12 21 -30 Z";
const wLegs = (): Part[] => [
  { d: legL, ink: "trousers", g: "l" },
  { d: legR, ink: "trousers", g: "l" },
  { d: "M -50 -40 C -42 -36 -30 -36 -25 -40", ink: "trousers", g: "l", det: 1.3 },
  { d: "M 20 -40 C 28 -36 38 -36 42 -40", ink: "trousers", g: "l", det: 1.3 },
  { d: footL, ink: "boots", g: "l" },
  { d: footR, ink: "boots", g: "l" },
];
const capRibs = (x0: number, x1: number, y0: number, y1: number, n: number): Part[] =>
  Array.from({ length: n }, (_, i) => {
    const x = x0 + ((x1 - x0) * (i + 0.5)) / n;
    return { d: `M ${n2(x)} ${y0} L ${n2(x * 1.01)} ${y1}`, ink: "capRib", g: "h" as Grp, det: 1.1, op: 0.45 };
  });
const wCap = (): Part[] => [
  { d: wCapDome, ink: "cap", g: "h" },
  { d: "M 30 -508 C 40 -506 47 -498 49 -488", ink: "capRib", g: "h", det: 1.3 },
  { d: wCapBrim, ink: "cap", g: "h" },
  ...capRibs(-54, 54, -472, -447, 13),
];

export const workerFront = (opts: { look?: number } = {}): Drawing => ({
  hipY: HIP,
  neckY: NECK,
  tilt: STANCE,
  parts: [
    ...wLegs(),
    { d: wTorso, ink: "shirt" },
    { d: wVest, ink: "vest" },
    { d: "M -16 -404 L 16 -404 L 17 -382 L -17 -382 Z", ink: "skin", sh: 0.5 },
    { d: "M -22 -394 C -11 -388 11 -388 22 -394 L 25 -381 L 7 -372 L 0 -379 L -7 -372 L -25 -381 Z", ink: "shirt", sh: 0.6 },
    { d: "M -27 -334 L -21 -334 L -15 -390 L -21 -390 Z", ink: "apronTie", sh: 0 },
    { d: mir("M -27 -334 L -21 -334 L -15 -390 L -21 -390 Z"), ink: "apronTie", sh: 0 },
    { d: "M -87 -271 C -40 -264 40 -264 87 -271 L 87 -262 C 40 -255 -40 -255 -87 -262 Z", ink: "apronTie", sh: 0.5 },
    { d: wApron, ink: "apron" },
    // the apron's one soft fold, from the waist to the hem
    { d: "M 10 -252 C 18 -204 24 -158 30 -112 L 17 -109 C 16 -156 13 -204 10 -252 Z", ink: "apron", cast: true, op: 0.45 },
    { d: "M -34 -208 C -12 -210 12 -210 34 -208 L 32 -176 C 12 -172 -12 -172 -32 -176 Z", ink: "apron", sh: 0.5 },
    { d: "M -34 -208 C -12 -210 12 -210 34 -208", ink: "apronTie", det: 1.3, op: 0.45 },
    ...wArm(true),
    ...wArm(true).map((p) => ({ ...p, d: mir(p.d) })),
    { d: ell(-50, -434, 8, 11), ink: "skin", g: "h", sh: 0.5 },
    { d: ell(50, -434, 8, 11), ink: "skin", g: "h", sh: 0.5 },
    { d: wHead, ink: "skin", g: "h" },
    { d: "M -46 -446 C -20 -438 20 -438 46 -446 C 44 -438 40 -432 34 -429 C 14 -434 -14 -434 -34 -429 C -40 -432 -44 -438 -46 -446 Z", ink: "skin", g: "h", cast: true, op: 0.5 },
    ...wCap(),
    ...faceFront(0, -424, 18, { look: opts.look }),
  ],
});

export const workerProfile = (): Drawing => ({
  hipY: HIP,
  neckY: NECK,
  tilt: { body: 0, head: 3 },
  parts: [
    // far leg and foot (behind), a half step back
    { d: "M -26 -236 C -30 -170 -30 -90 -30 -28 L -10 -28 C -6 -90 6 -170 12 -236 Z", ink: "trousersFar", g: "l" },
    { d: "M -32 -32 C -32 -38 -10 -38 -9 -32 C 4 -28 16 -20 18 -10 C 19 -3 14 0 8 0 L -32 0 C -36 -10 -36 -22 -32 -32 Z", ink: "boots", g: "l" },
    // near leg and foot
    { d: "M -18 -236 C -18 -170 -10 -90 -6 -28 L 14 -28 C 18 -90 24 -170 28 -236 Z", ink: "trousers", g: "l" },
    { d: "M -8 -32 C -8 -38 14 -38 15 -32 C 28 -28 40 -20 42 -10 C 43 -3 38 0 32 0 L -8 0 C -12 -10 -12 -22 -8 -32 Z", ink: "boots", g: "l" },
    // torso, waistcoat
    { d: "M -8 -392 C -30 -390 -44 -378 -48 -356 C -54 -320 -52 -280 -48 -250 C -46 -232 -38 -220 -26 -214 L 30 -214 C 42 -220 52 -236 54 -258 C 58 -292 50 -330 40 -360 C 34 -380 18 -392 -8 -392 Z", ink: "shirt" },
    { d: "M -8 -392 C -30 -390 -44 -378 -48 -356 C -54 -320 -52 -280 -49 -252 C -47 -242 -42 -236 -34 -234 L 46 -230 C 51 -240 53 -252 54 -264 C 55 -292 48 -330 38 -362 L 26 -384 C 20 -390 8 -392 -8 -392 Z", ink: "vest" },
    { d: "M -14 -404 L 16 -404 L 18 -382 L -16 -382 Z", ink: "skin", sh: 0.5 },
    { d: "M -14 -394 C 0 -390 14 -390 24 -394 L 30 -380 L 14 -376 L -12 -380 Z", ink: "shirt", sh: 0.6 },
    // the waist tie running round to the back, and the bow on his back: a loop and two tails
    { d: "M -46 -270 C -20 -268 20 -270 54 -272 L 54 -263 C 20 -261 -20 -259 -46 -261 Z", ink: "apronTie", sh: 0.4 },
    { d: "M -46 -268 C -54 -284 -72 -286 -72 -272 C -72 -260 -56 -260 -46 -264 Z", ink: "apron", sh: 0.7 },
    { d: "M -48 -262 C -56 -250 -60 -238 -58 -226 L -50 -227 C -51 -238 -48 -250 -43 -260 Z", ink: "apron", sh: 0.6 },
    { d: "M -46 -262 C -44 -250 -42 -240 -36 -232 L -30 -236 C -35 -244 -38 -252 -40 -262 Z", ink: "apron", sh: 0.6 },
    { d: ell(-46, -266, 6, 6), ink: "apronTie", sh: 0.5 },
    // apron: bib down the chest, skirt hanging from the waist with one soft fold
    { d: "M 24 -386 L 30 -386 L 44 -332 L 38 -332 Z", ink: "apronTie", sh: 0 },
    { d: "M 34 -334 L 44 -334 C 52 -312 57 -292 58 -268 C 63 -230 65 -170 64 -118 C 42 -112 2 -112 -22 -116 C -23 -160 -24 -220 -24 -262 C 0 -266 26 -268 36 -300 Z", ink: "apron" },
    { d: "M 20 -258 C 24 -210 28 -160 30 -116 L 18 -114 C 18 -160 18 -210 20 -258 Z", ink: "apron", cast: true, op: 0.4 },
    // arm: hanging, a slight bend, the hand a little forward
    { d: "M -8 -384 C -26 -382 -32 -364 -30 -342 C -29 -324 -27 -306 -25 -295 L 1 -294 C 4 -314 5 -340 3 -360 C 1 -376 -2 -384 -8 -384 Z", ink: "shirt" },
    { d: "M -28 -302 C -20 -306 -4 -306 4 -301 C 6 -294 6 -287 3 -282 C -6 -279 -21 -279 -28 -282 C -31 -288 -31 -296 -28 -302 Z", ink: "shirt" },
    { d: "M -24 -283 C -22 -260 -16 -242 -10 -228 L 8 -229 C 6 -244 3 -264 2 -283 Z", ink: "skin" },
    { d: "M -12 -234 C -14 -216 -10 -201 -2 -196 C 5 -192 13 -195 15 -202 C 17 -210 14 -222 10 -234 Z", ink: "skin" },
    { d: "M 9 -230 C 17 -228 20 -218 16 -211 C 14 -209 11 -209 9 -212 Z", ink: "skin", sh: 0.6 },
    // head (facing right)
    { d: "M -6 -495 C 28 -495 48 -474 49 -448 C 49 -440 52 -436 58 -428 C 62 -422 60 -414 52 -414 C 52 -403 47 -394 35 -390 C 20 -386 -4 -386 -20 -392 C -42 -400 -55 -420 -55 -445 C -55 -475 -34 -495 -6 -495 Z", ink: "skin", g: "h" },
    { d: "M -54 -440 C -54 -420 -46 -404 -30 -396 C -40 -410 -44 -426 -42 -442 Z", ink: "hair", g: "h", sh: 0.4 },
    { d: ell(-8, -432, 8.5, 11.5), ink: "skin", g: "h", sh: 0.6 },
    { d: "M -42 -446 C -10 -440 30 -440 48 -446 C 46 -438 42 -432 36 -430 C 10 -434 -20 -434 -36 -430 Z", ink: "skin", g: "h", cast: true, op: 0.5 },
    { d: "M -59 -450 C -62 -486 -36 -511 -2 -512 C 18 -513 34 -505 44 -492 C 50 -482 52 -468 51 -456 Z", ink: "cap", g: "h" },
    { d: "M -60 -470 C -24 -478 26 -478 51 -469 C 54 -461 54 -452 51 -446 C 22 -442 -24 -440 -58 -447 C -62 -454 -62 -464 -60 -470 Z", ink: "cap", g: "h" },
    ...capRibs(-58, 50, -472, -446, 12),
    ...faceSide(32, -426),
  ],
});

export const workerBack = (): Drawing => ({
  hipY: HIP,
  neckY: NECK,
  tilt: { body: 1.6, head: -4.5 },
  parts: [
    // from behind his left leg (the straight one) is on screen left
    { d: mir(legR), ink: "trousers", g: "l" },
    { d: mir(legL), ink: "trousers", g: "l" },
    { d: mir(footR), ink: "boots", g: "l" },
    { d: mir(footL), ink: "boots", g: "l" },
    { d: wTorso, ink: "shirt" },
    // the waistcoat's back, with its little strap and buckle
    { d: "M -20 -390 C -40 -389 -52 -381 -56 -364 C -64 -334 -82 -298 -87 -266 C -89 -244 -82 -228 -66 -221 L 66 -221 C 82 -228 89 -244 87 -266 C 82 -298 64 -334 56 -364 C 52 -381 40 -389 20 -390 Z", ink: "vest" },
    { d: "M -40 -298 L 40 -298 L 40 -291 L -40 -291 Z", ink: "#4A372A", sh: 0 },
    { d: "M -6 -300 L 6 -300 L 6 -289 L -6 -289 Z", ink: "#9C8A6A", sh: 0.3 },
    // apron skirt edges at the hips
    { d: "M -78 -262 C -84 -210 -87 -160 -89 -122 L -72 -119 C -72 -160 -71 -210 -67 -262 Z", ink: "apron", sh: 0.4 },
    { d: mir("M -78 -262 C -84 -210 -87 -160 -89 -122 L -72 -119 C -72 -160 -71 -210 -67 -262 Z"), ink: "apron", sh: 0.4 },
    // the apron's straps crossing on the back, the waist tie, and the bow
    { d: limb([[-18, -386], [12, -322], [70, -268]], 8, 8), ink: "apron", sh: 0.3 },
    { d: limb([[18, -386], [-12, -322], [-70, -268]], 8, 8), ink: "apron", sh: 0.3 },
    { d: "M -87 -272 C -40 -265 40 -265 87 -272 L 87 -262 C 40 -255 -40 -255 -87 -262 Z", ink: "apron", sh: 0.5 },
    { d: "M -3 -268 C -14 -288 -38 -292 -40 -274 C -41 -258 -18 -256 -3 -264 Z", ink: "apron", sh: 0.7 },
    { d: mir("M -3 -268 C -14 -288 -38 -292 -40 -274 C -41 -258 -18 -256 -3 -264 Z"), ink: "apron", sh: 0.7 },
    { d: "M -4 -264 C -10 -248 -18 -232 -26 -220 L -16 -217 C -9 -230 -3 -246 2 -262 Z", ink: "apron", sh: 0.5 },
    { d: "M 2 -264 C 8 -250 14 -236 20 -224 L 29 -228 C 21 -240 13 -252 7 -264 Z", ink: "apron", sh: 0.5 },
    { d: ell(0, -266, 7, 7), ink: "apron", sh: 0.6 },
    ...wArm(false),
    ...wArm(false).map((p) => ({ ...p, d: mir(p.d) })),
    { d: "M -17 -412 L 17 -412 L 19 -384 L -19 -384 Z", ink: "skin", sh: 0.5 },
    { d: ell(-50, -434, 8, 11), ink: "skin", g: "h", sh: 0.5 },
    { d: ell(50, -434, 8, 11), ink: "skin", g: "h", sh: 0.5 },
    // the back of the head: skin, with short hair as one simple shape under the cap (a soft nape line)
    { d: wHead, ink: "skin", g: "h" },
    { d: "M -50 -450 C -50 -438 -47 -428 -41 -421 C -28 -416 -14 -420 0 -417 C 14 -420 28 -416 41 -421 C 47 -428 50 -438 50 -450 Z", ink: "#8A6A4E", g: "h", sh: 0.6 },
    { d: "M -40 -421 C -28 -414 -14 -418 0 -415 C 14 -418 28 -414 40 -421 C 34 -412 20 -408 0 -408 C -20 -408 -34 -412 -40 -421 Z", ink: "skin", g: "h", cast: true, op: 0.45 },
    { d: "M -55 -446 C -58 -488 -32 -511 4 -512 C 22 -513 38 -506 47 -494 C 54 -484 57 -470 55 -446 Z", ink: "cap", g: "h" },
    { d: "M -58 -468 C -30 -474 30 -474 58 -468 C 61 -458 61 -448 58 -441 C 30 -436 -30 -436 -58 -441 C -61 -448 -61 -458 -58 -468 Z", ink: "cap", g: "h" },
    ...capRibs(-55, 55, -468, -441, 13),
  ],
});

// ===================================================================================================================
// CROWD — a woman c.1900 (orange ink: TB's toll), a boy c.1900 (cream: the living), an old medieval man (DEAD)
// Inks: c1 lit, c2 mid, c3 shade/deep, c4 a light breaking piece (apron / collar), c5 dark accents. Skin stays natural.
// ===================================================================================================================
export const INK_ORANGE: Inks = { c1: "#FFB000", c2: "#E99A10", c3: "#D98A0C", c4: "#EFE6D3", c5: "#B0700A" };
export const INK_CREAM: Inks = { c1: "#EFE6D3", c2: "#D9CDB4", c3: "#C5B697", c4: "#F6F0E2", c5: "#9D8F74" };
export const INK_DEAD: Inks = { c1: "#9A8B70", c2: "#8A7B62", c3: "#776A53", c4: "#AA9C82", c5: "#5E5341" };

export const woman = (ink: Inks = INK_ORANGE, look?: number): Drawing => ({
  hipY: -214,
  neckY: -372,
  tilt: { body: 1.2, head: -5 },
  inks: { ...ink, hair: "#6A4630", boots: "#3A2C22" },
  parts: [
    // boots peeking under a long skirt (deep tone)
    { d: ell(-20, -6, 15, 7), ink: "boots", g: "l" },
    { d: ell(22, -6, 15, 7), ink: "boots", g: "l" },
    { d: "M -52 -236 C -62 -170 -78 -84 -90 -24 C -70 -12 -36 -6 0 -10 C 36 -6 70 -12 90 -24 C 78 -84 62 -170 52 -236 Z", ink: "c3", g: "l" },
    { d: "M 36 -120 C 42 -88 46 -56 52 -22 L 64 -24 C 58 -58 52 -90 46 -122 Z", ink: "c3", g: "l", cast: true, op: 0.35 },
    // a cream apron breaking the mass
    { d: "M -40 -232 C -42 -180 -46 -120 -52 -64 C -30 -56 30 -56 52 -64 C 46 -120 42 -180 40 -232 Z", ink: "c4", sh: 0.7 },
    { d: "M 6 -220 C 10 -170 14 -120 16 -64 L 6 -62 C 6 -120 6 -170 6 -220 Z", ink: "c4", cast: true, op: 0.35 },
    // bodice and sleeves (deep), hands clasped at the waist
    { d: "M -20 -376 C -44 -374 -60 -362 -64 -338 C -68 -300 -62 -262 -54 -232 L 54 -232 C 62 -262 68 -300 64 -338 C 60 -362 44 -374 20 -376 Z", ink: "c3" },
    { d: "M -58 -240 L 58 -240 L 56 -228 L -56 -228 Z", ink: "c5", sh: 0.4 },
    { d: limb([[-60, -318], [-64, -270], [-30, -238]], 26, 20), ink: "c3" },
    { d: limb([[60, -318], [64, -270], [30, -238]], 26, 20), ink: "c3" },
    { d: "M -32 -248 C -20 -252 -6 -248 2 -240 C 6 -232 0 -226 -10 -226 C -20 -226 -30 -230 -34 -236 Z", ink: "skin" },
    { d: mir("M -32 -248 C -20 -252 -6 -248 2 -240 C 6 -232 0 -226 -10 -226 C -20 -226 -30 -230 -34 -236 Z"), ink: "skin" },
    // the shawl (lit), pointed at the front, its ends tucked in
    { d: "M -24 -378 C -58 -374 -82 -356 -86 -326 C -88 -306 -86 -290 -82 -280 C -58 -284 -30 -272 0 -254 C 30 -272 58 -284 82 -280 C 86 -290 88 -306 86 -326 C 82 -356 58 -374 24 -378 Z", ink: "c1" },
    { d: "M -82 -280 C -58 -284 -30 -272 0 -254 C 30 -272 58 -284 82 -280", ink: "c5", det: 1.4, op: 0.5 },
    // a small cream collar at the throat
    { d: "M -16 -380 C -8 -374 8 -374 16 -380 L 18 -366 L 4 -360 L 0 -364 L -4 -360 L -18 -366 Z", ink: "c4", sh: 0.6 },
    // neck, the scarf behind the head, the face, a parted fringe of hair, the scarf's front edge, the knot
    { d: "M -13 -394 L 13 -394 L 14 -374 L -14 -374 Z", ink: "skin", sh: 0.5 },
    { d: "M 0 -472 C 34 -472 52 -448 52 -420 C 52 -398 44 -384 30 -376 L -30 -376 C -44 -384 -52 -398 -52 -420 C -52 -448 -34 -472 0 -472 Z", ink: "c3", g: "h" },
    { d: "M 0 -446 C 24 -446 36 -428 36 -408 C 36 -388 22 -374 0 -374 C -22 -374 -36 -388 -36 -408 C -36 -428 -24 -446 0 -446 Z", ink: "skin", g: "h" },
    { d: "M -32 -424 C -24 -440 -8 -444 0 -434 C 8 -444 24 -440 32 -424 C 22 -430 10 -430 0 -426 C -10 -430 -22 -430 -32 -424 Z", ink: "hair", g: "h", sh: 0.4 },
    { d: "M -40 -418 C -36 -446 -18 -458 0 -458 C 18 -458 36 -446 40 -418 C 34 -432 18 -442 0 -442 C -18 -442 -34 -432 -40 -418 Z", ink: "c2", g: "h", sh: 0.5 },
    { d: "M -36 -404 C -34 -386 -26 -376 -14 -370 L -10 -366 C -22 -372 -32 -384 -36 -404 Z", ink: "c3", g: "h", sh: 0 },
    { d: mir("M -36 -404 C -34 -386 -26 -376 -14 -370 L -10 -366 C -22 -372 -32 -384 -36 -404 Z"), ink: "c3", g: "h", sh: 0 },
    { d: "M -4 -368 C -12 -362 -18 -350 -16 -340 L -8 -342 C -8 -350 -4 -358 0 -364 Z", ink: "c2", g: "h", sh: 0.5 },
    { d: "M 4 -368 C 12 -362 20 -352 20 -342 L 12 -342 C 10 -350 6 -358 0 -364 Z", ink: "c2", g: "h", sh: 0.5 },
    { d: ell(0, -368, 9, 7), ink: "c2", g: "h", sh: 0.6 },
    ...faceFront(0, -412, 15, { look }),
  ],
});

export const boy = (ink: Inks = INK_CREAM, look?: number): Drawing => ({
  hipY: -150,
  neckY: -262,
  tilt: { body: -1.5, head: 6 },
  inks: { ...ink, hair: "#8A6440" },
  parts: [
    // stockinged legs tapering to small boots
    { d: limb([[-18, -150], [-20, -70], [-19, -18]], 22, 15), ink: "c4", g: "l" },
    { d: limb([[18, -150], [19, -70], [17, -18]], 22, 15), ink: "c4", g: "l" },
    { d: "M -27 -24 C -27 -30 -12 -30 -11 -24 C -8 -12 -9 0 -15 0 L -30 0 C -38 0 -39 -8 -35 -13 C -31 -16 -28 -19 -27 -24 Z", ink: "c5", g: "l" },
    { d: "M 10 -24 C 10 -30 25 -30 25 -24 C 30 -16 34 -10 34 -5 C 34 -1 30 0 26 0 L 12 0 C 6 0 6 -10 10 -24 Z", ink: "c5", g: "l" },
    // short trousers to the knee
    { d: "M -42 -160 C -44 -130 -42 -106 -38 -90 L -4 -90 L 0 -120 L 4 -90 L 38 -90 C 42 -106 44 -130 42 -160 Z", ink: "c3" },
    // jacket (a small pear)
    { d: "M -14 -268 C -32 -266 -42 -256 -46 -238 C -52 -210 -54 -172 -48 -140 L 48 -140 C 54 -172 52 -210 46 -238 C 42 -256 32 -266 14 -268 Z", ink: "c2" },
    { d: "M -11 -268 L 0 -222 L 11 -268 Z", ink: "c4", sh: 0.4 },
    { d: "M 0 -222 L 0 -142", ink: "c2", det: 1.3 },
    { d: ell(-6, -198, 2.6, 2.6), ink: "c5", sh: 0 },
    { d: ell(-6, -172, 2.6, 2.6), ink: "c5", sh: 0 },
    // arms, hands in the jacket pockets
    { d: limb([[-40, -252], [-52, -214], [-42, -172]], 21, 18), ink: "c2" },
    { d: limb([[40, -252], [52, -214], [42, -172]], 21, 18), ink: "c2" },
    { d: "M -50 -178 L -28 -178 L -28 -170 L -50 -170 Z", ink: "c3", sh: 0.3 },
    { d: mir("M -50 -178 L -28 -178 L -28 -170 L -50 -170 Z"), ink: "c3", sh: 0.3 },
    // head, flat cap
    { d: "M -11 -278 L 11 -278 L 12 -262 L -12 -262 Z", ink: "skin", sh: 0.5 },
    { d: ell(-42, -312, 7, 9.5), ink: "skin", g: "h", sh: 0.5 },
    { d: ell(42, -312, 7, 9.5), ink: "skin", g: "h", sh: 0.5 },
    { d: "M 0 -362 C 26 -362 43 -344 43 -318 C 43 -290 26 -272 0 -272 C -26 -272 -43 -290 -43 -318 C -43 -344 -26 -362 0 -362 Z", ink: "skin", g: "h" },
    { d: "M -40 -332 C -40 -316 -36 -306 -30 -300 C -32 -312 -32 -324 -30 -332 Z", ink: "hair", g: "h", sh: 0 },
    { d: mir("M -40 -332 C -40 -316 -36 -306 -30 -300 C -32 -312 -32 -324 -30 -332 Z"), ink: "hair", g: "h", sh: 0 },
    { d: "M -38 -330 C -18 -322 18 -322 38 -330 C 36 -322 32 -318 26 -316 C 10 -320 -10 -320 -26 -316 C -32 -318 -36 -322 -38 -330 Z", ink: "skin", g: "h", cast: true, op: 0.5 },
    { d: "M -48 -332 C -52 -356 -30 -374 0 -374 C 34 -374 56 -360 56 -342 C 56 -334 50 -330 40 -330 C 20 -328 -24 -326 -48 -332 Z", ink: "c3", g: "h" },
    { d: "M -46 -334 C -20 -330 20 -332 50 -336 C 58 -334 62 -330 58 -326 C 30 -320 -20 -320 -46 -326 Z", ink: "c5", g: "h", sh: 0.4 },
    { d: ell(2, -372, 5, 3), ink: "c5", g: "h", sh: 0 },
    ...faceFront(0, -310, 15, { look }),
  ],
});

export const oldMan = (ink: Inks = INK_DEAD, look?: number): Drawing => ({
  hipY: -206,
  neckY: -384,
  tilt: { body: 1.5, head: -3 },
  inks: { ...ink, beard: "#E4DED0" },
  parts: [
    // the staff behind his near hand
    { d: limb([[80, -330], [82, -160], [84, 0]], 9, 8), ink: "c5", sh: 0.5 },
    // hose tapering to small pointed shoes
    { d: limb([[-18, -200], [-20, -100], [-19, -22]], 24, 16), ink: "c5", g: "l" },
    { d: limb([[18, -200], [20, -100], [19, -22]], 24, 16), ink: "c5", g: "l" },
    { d: "M -27 -26 C -27 -32 -12 -32 -11 -26 C -9 -12 -9 0 -15 0 L -38 0 C -50 0 -52 -5 -44 -9 C -36 -13 -30 -18 -27 -26 Z", ink: "c3", g: "l" },
    { d: mir("M -27 -26 C -27 -32 -12 -32 -11 -26 C -9 -12 -9 0 -15 0 L -38 0 C -50 0 -52 -5 -44 -9 C -36 -13 -30 -18 -27 -26 Z"), ink: "c3", g: "l" },
    // a long tunic (a soft pear), a belt with a pouch
    { d: "M -20 -380 C -46 -378 -62 -364 -66 -340 C -72 -290 -78 -200 -84 -112 C -50 -102 50 -102 84 -112 C 78 -200 72 -290 66 -340 C 62 -364 46 -378 20 -380 Z", ink: "c2" },
    { d: "M -20 -200 C -24 -160 -28 -130 -34 -108 L -24 -106 C -20 -130 -18 -160 -20 -200 Z", ink: "c2", cast: true, op: 0.4 },
    { d: "M -76 -228 C -30 -222 30 -222 76 -228 L 76 -218 C 30 -212 -30 -212 -76 -218 Z", ink: "c5", sh: 0.4 },
    { d: "M 30 -218 L 50 -218 C 52 -202 50 -190 40 -188 C 30 -190 28 -202 30 -218 Z", ink: "c3", sh: 0.6 },
    // arms: the far one hanging, the near one holding the staff
    { d: limb([[-56, -350], [-72, -292], [-70, -238]], 28, 24), ink: "c2" },
    { d: ell(-70, -224, 12, 15), ink: "skin" },
    { d: limb([[56, -350], [78, -312], [82, -286]], 28, 24), ink: "c2" },
    { d: "M 68 -302 C 78 -308 94 -306 96 -294 C 98 -282 90 -272 80 -272 C 70 -274 66 -286 68 -302 Z", ink: "skin" },
    // the hood's shoulder cape (chaperon), the hood framing the face, a white beard
    { d: "M -30 -388 C -64 -384 -88 -366 -92 -336 C -94 -320 -90 -308 -82 -300 C -50 -304 50 -304 82 -300 C 90 -308 94 -320 92 -336 C 88 -366 64 -384 30 -388 Z", ink: "c1" },
    { d: "M -82 -300 C -60 -296 -30 -310 0 -306 C 30 -310 60 -296 82 -300", ink: "c3", det: 1.3, op: 0.5 },
    { d: "M 0 -484 C 40 -486 62 -458 62 -420 C 62 -398 58 -384 50 -372 L -50 -372 C -58 -384 -62 -398 -62 -420 C -62 -458 -40 -484 0 -484 Z", ink: "c1", g: "h" },
    { d: "M 0 -458 C 28 -458 42 -438 42 -414 C 42 -392 28 -376 0 -376 C -28 -376 -42 -392 -42 -414 C -42 -438 -28 -458 0 -458 Z", ink: "c5", g: "h", sh: 0 },
    { d: "M 0 -452 C 25 -452 37 -434 37 -412 C 37 -392 24 -378 0 -378 C -24 -378 -37 -392 -37 -412 C -37 -434 -25 -452 0 -452 Z", ink: "skin", g: "h" },
    { d: "M -34 -406 C -36 -380 -24 -346 0 -336 C 24 -346 36 -380 34 -406 C 24 -398 12 -396 0 -398 C -12 -396 -24 -398 -34 -406 Z", ink: "beard", g: "h" },
    { d: "M -14 -398 C -8 -404 8 -404 14 -398 C 8 -394 -8 -394 -14 -398 Z", ink: "beard", g: "h", sh: 0.4 },
    { d: "M -36 -440 C -20 -452 20 -452 36 -440 C 26 -446 14 -450 0 -450 C -14 -450 -26 -446 -36 -440 Z", ink: "c1", g: "h", cast: true, op: 0.5 },
    ...faceFront(0, -424, 14, { look, brows: 3, blush: false }),
  ],
});

// ===================================================================================================================
// ANIMALS (same hand) — marmot (front, standing at its burrow), carpenter ant (profile, orange threads), greylag goose
// ===================================================================================================================
export const marmot = (): Drawing => ({
  hipY: 0,
  neckY: 0,
  inks: { fur: "#A6875F", furDk: "#5E4634", belly: "#D5BF96", muzzle: "#CDB38A", crown: "#7A5E46", nose: "#3A2B22", earth: "#7E6A4E", hole: "#2E241B" },
  parts: [
    // the burrow mound and its hole
    { d: "M -132 14 C -116 -30 -56 -46 0 -46 C 56 -46 116 -30 132 14 Z", ink: "earth", sh: 0.8 },
    { d: ell(0, -18, 64, 14), ink: "hole", sh: 0 },
    // a short tail
    { d: "M -42 -34 C -62 -48 -82 -40 -80 -24 C -78 -12 -60 -12 -44 -20 Z", ink: "furDk", sh: 0.5 },
    // a short, plump, squat body
    { d: "M 0 -186 C 40 -186 62 -156 68 -116 C 74 -74 64 -36 44 -22 C 28 -12 -28 -12 -44 -22 C -64 -36 -74 -74 -68 -116 C -62 -156 -40 -186 0 -186 Z", ink: "fur" },
    { d: "M 0 -160 C 26 -160 40 -130 42 -98 C 44 -64 30 -34 0 -30 C -30 -34 -44 -64 -42 -98 C -40 -130 -26 -160 0 -160 Z", ink: "belly", sh: 0.6 },
    // feet
    { d: ell(-28, -18, 18, 9), ink: "furDk", sh: 0.5 },
    { d: ell(28, -18, 18, 9), ink: "furDk", sh: 0.5 },
    // tiny arms and paws held at the chest
    { d: limb([[-42, -160], [-30, -142], [-14, -138]], 18, 13), ink: "fur" },
    { d: limb([[42, -160], [30, -142], [14, -138]], 18, 13), ink: "fur" },
    { d: ell(-10, -136, 7.5, 8), ink: "furDk", sh: 0.4 },
    { d: ell(10, -136, 7.5, 8), ink: "furDk", sh: 0.4 },
    // small round ears set low on the sides of a broad, flat head
    { d: ell(-45, -232, 8.5, 8), ink: "furDk", sh: 0.4 },
    { d: ell(45, -232, 8.5, 8), ink: "furDk", sh: 0.4 },
    { d: "M 0 -252 C 36 -252 55 -236 55 -213 C 55 -190 33 -176 0 -176 C -33 -176 -55 -190 -55 -213 C -55 -236 -36 -252 0 -252 Z", ink: "fur" },
    // the darker crown: a soft cap over the top of the head, down to the brow
    { d: "M -46 -226 C -42 -244 -22 -250 0 -250 C 22 -250 42 -244 46 -226 C 34 -232 18 -228 0 -232 C -18 -228 -34 -232 -46 -226 Z", ink: "crown", sh: 0.3 },
    // a pale muzzle (small, low), the nose, the eyes
    { d: "M 0 -210 C 10 -210 16 -204 24 -200 C 32 -196 34 -188 28 -183 C 20 -178 8 -178 0 -180 C -8 -178 -20 -178 -28 -183 C -34 -188 -32 -196 -24 -200 C -16 -204 -10 -210 0 -210 Z", ink: "muzzle", sh: 0.3 },
    { d: "M -6 -203 C -3 -206 3 -206 6 -203 C 5 -198 2 -196 0 -196 C -2 -196 -5 -198 -6 -203 Z", ink: "nose", sh: 0 },
    { d: ell(-21, -215, 4.4, 5.2), ink: "#2A201A", sh: 0 },
    { d: ell(21, -215, 4.4, 5.2), ink: "#2A201A", sh: 0 },
    { d: ell(-35, -197, 7, 4), ink: "#D99A86", sh: 0, op: 0.4 },
    { d: ell(35, -197, 7, 4), ink: "#D99A86", sh: 0, op: 0.4 },
  ],
});

// the ant's head is a touch bigger than the first pass: head parts are scaled about the neck
const AH = (d: string) => sc(d, 66, -82, 1.14);
export const ant = (): Drawing => {
  const leg = (c: P, k: P, f: P, ink: string, w = 7): Part[] => [
    { d: limb(curve(c, [(c[0] + k[0]) / 2, (c[1] + k[1]) / 2 - 3], k, 6), w + 2, w), ink, sh: 0.4 },
    { d: limb(curve(k, [(k[0] + f[0]) / 2, (k[1] + f[1]) / 2 - 2], f, 8), w, w * 0.55), ink, sh: 0.4 },
  ];
  return {
    hipY: 0,
    neckY: 0,
    inks: { ant: "#5A3B2B", antTop: "#83604A", antFar: "#432C21", thread: "#FFB000" },
    parts: [
      ...leg([-6, -58], [-42, -68], [-84, 0], "antFar", 6),
      ...leg([14, -58], [4, -64], [-18, 0], "antFar", 6),
      ...leg([36, -60], [62, -70], [82, 0], "antFar", 6),
      // antenna (far)
      { d: AH(limb([[94, -124], [104, -160], [112, -168]], 5, 5)), ink: "antFar", sh: 0 },
      { d: AH(limb([[112, -168], [140, -150], [156, -132]], 4.5, 6.5)), ink: "antFar", sh: 0 },
      // gaster with plate edges, petiole, mesosoma
      { d: "M -40 -70 C -40 -104 -78 -122 -116 -114 C -150 -106 -170 -82 -166 -56 C -162 -30 -132 -18 -100 -22 C -64 -26 -40 -42 -40 -70 Z", ink: "ant" },
      { d: "M -60 -104 C -70 -82 -72 -52 -66 -28", ink: "antTop", det: 1.6, keep: true, op: 0.7 },
      { d: "M -86 -114 C -98 -88 -100 -54 -92 -24", ink: "antTop", det: 1.6, keep: true, op: 0.7 },
      { d: "M -114 -114 C -126 -90 -128 -58 -122 -26", ink: "antTop", det: 1.6, keep: true, op: 0.7 },
      { d: "M -50 -96 C -70 -110 -110 -116 -140 -100 C -110 -108 -76 -106 -54 -90 Z", ink: "antTop", sh: 0 },
      { d: "M -44 -62 C -42 -78 -32 -88 -24 -84 C -18 -80 -20 -64 -26 -54 C -32 -50 -42 -52 -44 -62 Z", ink: "ant", sh: 0.6 },
      { d: "M -24 -64 C -24 -94 2 -110 30 -104 C 46 -100 58 -88 62 -74 C 58 -60 40 -54 16 -54 C -6 -54 -22 -56 -24 -64 Z", ink: "ant" },
      { d: "M -14 -86 C -4 -102 22 -106 40 -96 C 22 -100 2 -96 -10 -82 Z", ink: "antTop", sh: 0 },
      // head
      { d: AH("M 58 -86 C 62 -118 88 -132 112 -126 C 136 -120 146 -98 142 -80 C 138 -62 118 -54 96 -56 C 74 -58 56 -66 58 -86 Z"), ink: "ant" },
      { d: AH("M 70 -110 C 84 -126 112 -128 128 -116 C 110 -120 88 -118 74 -104 Z"), ink: "antTop", sh: 0 },
      { d: AH("M 136 -76 C 146 -78 154 -72 156 -62 C 150 -66 144 -66 138 -64 Z"), ink: "antFar", sh: 0 },
      { d: AH(ell(102, -102, 4.6, 5.4)), ink: "#211813", sh: 0 },
      { d: AH(ell(100.5, -104, 1.4, 1.6)), ink: "#F3EBDD", sh: 0 },
      // near legs
      ...leg([-4, -58], [-46, -56], [-78, 0], "ant", 7.5),
      ...leg([16, -56], [6, -46], [-14, 0], "ant", 7.5),
      ...leg([38, -58], [70, -56], [94, 0], "ant", 7.5),
      // antenna (near): scape up, the elbow, the funiculus forward and down
      { d: AH(limb([[100, -120], [112, -156], [120, -170]], 6, 6)), ink: "ant", sh: 0 },
      { d: AH(limb([[120, -170], [150, -152], [166, -128]], 5.5, 8)), ink: "ant", sh: 0 },
      // the infection: fine orange threads at the joints
      { d: "M -36 -62 C -30 -48 -40 -40 -34 -28", ink: "thread", det: 1.6, keep: true, op: 0.95 },
      { d: "M -46 -56 C -56 -46 -50 -36 -58 -30", ink: "thread", det: 1.4, keep: true, op: 0.9 },
      { d: "M 62 -70 C 70 -62 66 -52 74 -46", ink: "thread", det: 1.4, keep: true, op: 0.9 },
      { d: "M 6 -46 C 0 -38 6 -30 2 -22", ink: "thread", det: 1.4, keep: true, op: 0.9 },
    ],
  };
};

// a scalloped feather row: a band whose lower edge is a row of round scallops, from x0 to x1 (tail at x0)
const scallops = (x0: number, x1: number, yTop0: number, yTop1: number, yBot0: number, yBot1: number, n: number) => {
  const yt = (x: number) => yTop0 + ((yTop1 - yTop0) * (x - x0)) / (x1 - x0);
  const yb = (x: number) => yBot0 + ((yBot1 - yBot0) * (x - x0)) / (x1 - x0);
  let d = `M ${n2(x1)} ${n2(yt(x1))} C ${n2(x1 - (x1 - x0) * 0.3)} ${n2(yt(x1) - 6)} ${n2(x0 + (x1 - x0) * 0.3)} ${n2(yt(x0) - 4)} ${n2(x0)} ${n2(yt(x0))}`;
  const w = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const a = x0 + i * w;
    const b = a + w;
    const dip = Math.min(14, w * 0.42);
    d += ` C ${n2(a)} ${n2(yb(a) + dip)} ${n2(b)} ${n2(yb(b) + dip)} ${n2(b)} ${n2(yb(b))}`;
  }
  return `${d} Z`;
};

export const goose = (): Drawing => {
  // the S-curved neck: out of the breast, a forward swell, back, then up to the head
  const neck = cubic([80, -132], [134, -186], [64, -240], [92, -292], 24);
  return {
    hipY: 0,
    neckY: 0,
    inks: { body: "#958B7B", back: "#756B5D", back2: "#6A6053", back3: "#5E5549", breast: "#B7AD9C", neck: "#8A8072", head: "#7F7669", cream: "#E2D7C1", rump: "#F1EBDF", orange: "#FFB000", orangeDk: "#D98A0C" },
    parts: [
      // far leg
      { d: limb([[6, -70], [4, -36], [6, -8]], 9, 7), ink: "orangeDk", sh: 0.3 },
      { d: "M 0 -10 L 26 -10 C 32 -6 34 -2 30 0 L -4 0 Z", ink: "orangeDk", sh: 0.3 },
      // body: deep-bellied, carried level, the tail lifted a little
      { d: "M -118 -122 C -110 -172 -56 -198 12 -194 C 72 -190 108 -160 108 -118 C 108 -84 74 -64 20 -62 C -40 -60 -82 -72 -104 -94 C -118 -104 -134 -114 -150 -122 C -138 -126 -126 -126 -118 -122 Z", ink: "body" },
      { d: "M 108 -118 C 108 -84 74 -64 20 -62 C 0 -62 -16 -64 -30 -66 C 20 -74 70 -90 92 -122 C 98 -134 102 -146 104 -150 C 107 -140 108 -130 108 -118 Z", ink: "breast", sh: 0.6 },
      // the white rump under the tail
      { d: "M -96 -88 C -116 -100 -134 -110 -150 -118 C -140 -102 -122 -84 -96 -76 C -90 -78 -90 -84 -96 -88 Z", ink: "rump", sh: 0.4 },
      // the folded wing: three layered scallop rows, darker toward the tail, pale edges
      { d: scallops(-150, 70, -120, -168, -110, -150, 6), ink: "back" },
      { d: scallops(-150, 52, -124, -150, -118, -126, 6), ink: "back2", sh: 0.7 },
      { d: scallops(-150, 26, -122, -132, -120, -108, 5), ink: "back3", sh: 0.7 },
      { d: "M -112 -112 C -100 -104 -88 -104 -78 -112", ink: "cream", det: 1.3, keep: true, op: 0.55 },
      // neck (S-curve) and a small head
      { d: limb(neck, 60, 22), ink: "neck" },
      
      { d: "M 92 -316 C 110 -316 119 -304 117 -292 C 115 -280 104 -276 92 -276 C 79 -276 71 -284 71 -296 C 71 -308 79 -316 92 -316 Z", ink: "head" },
      // the bill (orange: the bird-flu carrier) with its pale nail
      { d: "M 111 -302 C 126 -302 142 -295 149 -286 C 141 -281 126 -279 112 -283 Z", ink: "orange", sh: 0.6 },
      { d: "M 143 -292 C 147 -290 150 -288 149 -286 C 146 -284 143 -285 141 -287 Z", ink: "#F3E7CC", sh: 0 },
      { d: ell(100, -299, 3.9, 4.5), ink: "#211813", sh: 0 },
      // near leg and webbed foot
      { d: limb([[24, -70], [26, -36], [28, -8]], 10, 8), ink: "orange", sh: 0.4 },
      { d: "M 20 -12 L 50 -12 C 58 -8 60 -2 54 0 L 14 0 C 12 -4 14 -10 20 -12 Z", ink: "orange", sh: 0.4 },
    ],
  };
};
