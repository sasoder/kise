// ---------------------------------------------------------------------------
// pandemicFolkAnimals — the ANIMALS of the kyle-pandemics V3 cast, take 2 (brief_V3_cast2.md): the picture-book
// GOUACHE style the director picked (pandemicFolkSketch.tsx, style A; its animal drawings are the model, copied here and
// made to move): flat matte colour shapes, no outline, ONE soft crescent shadow per part on the side turned from the
// upper-left light (the part's colour mixed toward slate), a gouache texture (fine grain, a blotchy dry-brush wash, pale
// specks, slightly hand-wobbly edges) laid over a whole layer by an SVG filter, dot eyes.
//
// THE TEXTURE IS LOCKED TO THE ANIMAL: <FolkLayer frame> applies the filter in a frame that moves with the animal (the
// ant's mesosoma, the marmot's body), so the grain never slides over a moving animal (no "shower door").
//
// API
//   FOLK                       the style constants (shadow mix, offsets in screen px, texture strengths)
//   <FolkLayer uid parts pxPerUnit frame? opacity?>   paints FParts (paths in the caller's user units) with the
//                              per-part crescent shadows and the gouache texture; frame = {x, y, a} the texture's anchor
//   ellC / limbC / mapD        path helpers (cubic ellipses, tapered limbs with round caps, point maps of M/L/C/Z paths)
//   THE ANT (cut 58): folkAnt(b, mandOpen, opts) -> FPart[] (the body: gaster, petiole, mesosoma, head, eye, pincers),
//     folkLeg(g, ink) / folkAntenna(head, scapeA, funA, ink) -> FPart[], folkJointThreads(b, t) (orange, alive),
//     folkDeathThreads(b, t, legs) (the mycelium after death), antHeadOutline(b), antStalkBase(b), ANT_SOCKET_W(b)
//   THE MARMOT (cut 1): folkMarmot(pose) -> FPart[] (see its section)
// ---------------------------------------------------------------------------
import React from "react";
import { FUNGUS } from "./cordyceps";
import { jawPoly } from "./zombieAntFigure";
import { ANT_S, type BodyPose, type P2, type Seg } from "./zombieAntWorld";
import type { LegGeo } from "./zombieAntFigure";

// ---------------------------------------------------------------------------
// THE STYLE
// ---------------------------------------------------------------------------
export const FOLK = {
  shadeTo: "#2C3433",
  shadeAmt: 0.3,
  /** crescent shadow: offset toward the upper left and its softness, screen px */
  offPx: 9,
  blurPx: 3.2,
  tex: { grain: 0.11, blotch: 0.06, wobblePx: 2.4, speck: 0.16, speckColor: "#F6EEDC" },
};
const hx = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const toHex = (c: number[]) => `#${c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
export const mixC = (a: string, b: string, t: number) => {
  const A = hx(a);
  const B = hx(b);
  return toHex(A.map((v, i) => v + (B[i] - v) * Math.max(0, Math.min(1, t))));
};
export const shadeOf = (c: string) => mixC(c, FOLK.shadeTo, FOLK.shadeAmt);

export type FPart = {
  d: string;
  fill: string;
  /** crescent shadow multiplier (0 = none; default 1) */
  sh?: number;
  op?: number;
  /** a stroke-only line (screen px width) */
  line?: number;
};

// ---------------------------------------------------------------------------
// PATH HELPERS (M L C Z only, so any point map transforms them exactly)
// ---------------------------------------------------------------------------
const n2 = (v: number) => (Math.round(v * 100) / 100).toString();
const K = 0.5523;
export const ellC = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${n2(cx + rx)} ${n2(cy)} C ${n2(cx + rx)} ${n2(cy + ry * K)} ${n2(cx + rx * K)} ${n2(cy + ry)} ${n2(cx)} ${n2(cy + ry)} C ${n2(cx - rx * K)} ${n2(cy + ry)} ${n2(cx - rx)} ${n2(cy + ry * K)} ${n2(cx - rx)} ${n2(cy)} C ${n2(cx - rx)} ${n2(cy - ry * K)} ${n2(cx - rx * K)} ${n2(cy - ry)} ${n2(cx)} ${n2(cy - ry)} C ${n2(cx + rx * K)} ${n2(cy - ry)} ${n2(cx + rx)} ${n2(cy - ry * K)} ${n2(cx + rx)} ${n2(cy)} Z`;
/** a tapered limb along a polyline, widths w0 -> w1, round caps (polyline arcs) */
export const limbC = (pts: P2[], w0: number, w1: number) => {
  const L: P2[] = [];
  const R: P2[] = [];
  const n = pts.length;
  const tan = (i: number): P2 => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  };
  for (let i = 0; i < n; i++) {
    const t = tan(i);
    const w = (w0 + (w1 - w0) * (i / (n - 1))) / 2;
    L.push([pts[i][0] - t[1] * w, pts[i][1] + t[0] * w]);
    R.push([pts[i][0] + t[1] * w, pts[i][1] - t[0] * w]);
  }
  const cap = (c: P2, t: P2, r: number, back: boolean): P2[] => {
    const out: P2[] = [];
    const a0 = Math.atan2(t[1], t[0]);
    for (let k = 1; k < 8; k++) {
      // from the L side round the end to the R side
      const a = back ? a0 + Math.PI / 2 + (Math.PI * k) / 8 : a0 + Math.PI / 2 - (Math.PI * k) / 8;
      out.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]);
    }
    return out;
  };
  const endCap = cap(pts[n - 1], tan(n - 1), w1 / 2, false);
  const startCap = cap(pts[0], tan(0), w0 / 2, true).reverse();
  const all = [...L, ...endCap, ...R.slice().reverse(), ...startCap];
  return `M ${all.map((p) => `${n2(p[0])} ${n2(p[1])}`).join(" L ")} Z`;
};
/** apply a point map to an absolute M/L/C/Z path */
export const mapD = (d: string, f: (p: P2) => P2) => {
  const tok = d.match(/[MLCZ]|-?\d*\.?\d+(?:e-?\d+)?/gi) ?? [];
  const out: string[] = [];
  let buf: number[] = [];
  for (const t of tok) {
    if (/^[MLCZ]$/i.test(t)) {
      out.push(t.toUpperCase());
      continue;
    }
    buf.push(parseFloat(t));
    if (buf.length === 2) {
      const q = f([buf[0], buf[1]]);
      out.push(n2(q[0]), n2(q[1]));
      buf = [];
    }
  }
  return out.join(" ");
};
const quad = (p0: P2, p1: P2, p2: P2, n = 8): P2[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return [(1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]];
  });

// ---------------------------------------------------------------------------
// THE LAYER: parts with their crescent shadows, under one gouache texture locked to `frame`
// ---------------------------------------------------------------------------
const GREY = "0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 1";
export const GouacheFilter: React.FC<{ id: string; pxPerUnit: number; wobble?: number }> = ({ id, pxPerUnit, wobble = 1 }) => {
  const u = pxPerUnit; // frequencies per user unit = per px x px per unit
  const t = FOLK.tex;
  return (
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency={(0.022 * u).toFixed(5)} numOctaves={2} seed={11} result="wn" />
      <feDisplacementMap in="SourceGraphic" in2="wn" scale={((t.wobblePx * wobble) / u).toFixed(3)} xChannelSelector="R" yChannelSelector="G" result="wb" />
      <feTurbulence type="fractalNoise" baseFrequency={(0.9 * u).toFixed(5)} numOctaves={2} seed={5} result="gn" />
      <feColorMatrix in="gn" type="matrix" values={GREY} result="gg" />
      <feTurbulence type="fractalNoise" baseFrequency={(0.11 * u).toFixed(5)} numOctaves={3} seed={23} result="bn" />
      <feColorMatrix in="bn" type="matrix" values={GREY} result="bb" />
      <feComposite in="wb" in2="gg" operator="arithmetic" k1={(2 * t.grain).toFixed(3)} k2={(1 - t.grain).toFixed(3)} k3="0" k4="0" result="t1" />
      <feComposite in="t1" in2="bb" operator="arithmetic" k1={(2 * t.blotch).toFixed(3)} k2={(1 - t.blotch).toFixed(3)} k3="0" k4="0" result="t2" />
      <feTurbulence type="fractalNoise" baseFrequency={(0.5 * u).toFixed(5)} numOctaves={1} seed={41} result="pn" />
      <feComponentTransfer in="pn" result="pk">
        <feFuncA type="discrete" tableValues={`0 0 0 0 0 0 0 0 0 0 0 0 0 ${t.speck.toFixed(2)}`} />
      </feComponentTransfer>
      <feFlood floodColor={t.speckColor} result="pc" />
      <feComposite in="pc" in2="pk" operator="in" result="pp" />
      <feMerge result="t3">
        <feMergeNode in="t2" />
        <feMergeNode in="pp" />
      </feMerge>
      <feComposite in="t3" in2="wb" operator="in" />
    </filter>
  );
};
/** the texture's anchor; with `s` the parts are given in the frame's own units (x, y, a, s place them), else in the
 *  caller's user units */
export type Frame = { x: number; y: number; a: number; s?: number };
export const FolkLayer: React.FC<{ uid: string; parts: FPart[]; pxPerUnit: number; frame?: Frame; opacity?: number; wobble?: number; light?: P2; children?: React.ReactNode }> = ({ uid, parts, pxPerUnit, frame, opacity = 1, wobble = 1, light = [-1, -1.05], children }) => {
  const off = FOLK.offPx / pxPerUnit;
  const blur = FOLK.blurPx / pxPerUnit;
  const fr = frame ?? { x: 0, y: 0, a: 0 };
  const deg = (fr.a * 180) / Math.PI;
  const local = fr.s !== undefined;
  const into = `translate(${n2(fr.x)} ${n2(fr.y)}) rotate(${n2(deg)})${local ? ` scale(${fr.s})` : ""}`;
  const back = local ? undefined : `rotate(${n2(-deg)}) translate(${n2(-fr.x)} ${n2(-fr.y)})`;
  const big = 100000;
  return (
    <g opacity={opacity}>
      <defs>
        <filter id={`${uid}-su`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={Math.max(0.01, blur).toFixed(3)} />
        </filter>
      </defs>
      <g transform={into}>
        <defs>
          <GouacheFilter id={`${uid}-tx`} pxPerUnit={pxPerUnit} wobble={wobble} />
        </defs>
        <g filter={`url(#${uid}-tx)`}>
          <g transform={back}>
            {parts.map((p, i) => {
              if (p.line !== undefined) {
                return <path key={i} d={p.d} fill="none" stroke={p.fill} strokeWidth={p.line / pxPerUnit} strokeLinecap="round" strokeLinejoin="round" opacity={p.op ?? 1} />;
              }
              const sh = p.sh ?? 1;
              const mid = `${uid}-m${i}`;
              return (
                <g key={i}>
                  <path d={p.d} fill={p.fill} opacity={p.op ?? 1} />
                  {sh > 0 ? (
                    <>
                      <mask id={mid} maskUnits="userSpaceOnUse" x={-big} y={-big} width={2 * big} height={2 * big}>
                        <path d={p.d} fill="#fff" />
                        <path d={p.d} fill="#000" transform={`translate(${n2(light[0] * off * sh)} ${n2(light[1] * off * sh)})`} filter={`url(#${uid}-su)`} />
                      </mask>
                      <path d={p.d} mask={`url(#${mid})`} fill={shadeOf(p.fill)} opacity={p.op ?? 1} />
                    </>
                  ) : null}
                </g>
              );
            })}
            {children}
          </g>
        </g>
      </g>
    </g>
  );
};

// ===================================================================================================================
// THE ANT (cut 58): pandemicFolkSketch's carpenter ant, each body part placed in its segment of the world's BodyPose
// (zombieAntWorld), the legs and antennae drawn along the motion's joints (the IK, gait and death grip are unchanged)
// ===================================================================================================================
export const ANT_INKS = { ant: "#5A3B2B", top: "#83604A", far: "#432C21", eye: "#211813", glint: "#F3EBDD", thread: FUNGUS.main };
/** sketch units -> world px */
const KA = 1.33;
/** the sketch's segment centres (the head's after its 1.14 scale about the neck) */
const C_MESO: P2 = [19, -79];
const C_PET: P2 = [-31, -68];
const C_GAS: P2 = [-103, -68];
const C_HEAD: P2 = [104, -92];
const AH = (p: P2): P2 => [66 + (p[0] - 66) * 1.14, -82 + (p[1] + 82) * 1.14];
const rot = (v: P2, a: number): P2 => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
/** a sketch point of a segment -> world */
const onSeg = (s: Seg, c: P2, head = false) => (q: P2): P2 => {
  const p = head ? AH(q) : q;
  const v = rot([(p[0] - c[0]) * KA, (p[1] - c[1]) * KA], s.a);
  return [s.p[0] + v[0], s.p[1] + v[1]];
};
const SK = {
  gaster: "M -40 -70 C -40 -104 -78 -122 -116 -114 C -150 -106 -170 -82 -166 -56 C -162 -30 -132 -18 -100 -22 C -64 -26 -40 -42 -40 -70 Z",
  plates: ["M -60 -104 C -70 -82 -72 -52 -66 -28", "M -86 -114 C -98 -88 -100 -54 -92 -24", "M -114 -114 C -126 -90 -128 -58 -122 -26"],
  gasterTop: "M -50 -96 C -70 -110 -110 -116 -140 -100 C -110 -108 -76 -106 -54 -90 Z",
  pet: "M -44 -62 C -42 -78 -32 -88 -24 -84 C -18 -80 -20 -64 -26 -54 C -32 -50 -42 -52 -44 -62 Z",
  meso: "M -24 -64 C -24 -94 2 -110 30 -104 C 46 -100 58 -88 62 -74 C 58 -60 40 -54 16 -54 C -6 -54 -22 -56 -24 -64 Z",
  mesoTop: "M -14 -86 C -4 -102 22 -106 40 -96 C 22 -100 2 -96 -10 -82 Z",
  head: "M 58 -86 C 62 -118 88 -132 112 -126 C 136 -120 146 -98 142 -80 C 138 -62 118 -54 96 -56 C 74 -58 56 -66 58 -86 Z",
  headTop: "M 70 -110 C 84 -126 112 -128 128 -116 C 110 -120 88 -118 74 -104 Z",
};
/** the antenna socket on the head (world) */
export const antSocket = (b: BodyPose): P2 => onSeg(b.head, C_HEAD, true)([100, -120]);
/** the head's silhouette (world), for the stalk's mask */
export const antHeadOutline = (b: BodyPose) => mapD(SK.head, onSeg(b.head, C_HEAD, true));
/** where the stalk leaves the dead ant: the dorsal front of the mesosoma (the pronotum), just behind the head */
export const antStalkBase = (b: BodyPose): P2 => onSeg(b.meso, C_MESO)([47, -95]);

/** the body for a pose: gaster, petiole, mesosoma, head (with its eye) and the far / near pincers (the near one only
 *  when nearJaw; the cut draws it after the vein) */
export const folkAntBody = (b: BodyPose, mandOpen: number, opts: { nearJaw?: boolean; farJaw?: boolean } = {}): FPart[] => {
  const g = onSeg(b.gaster, C_GAS);
  const pe = onSeg(b.pet, C_PET);
  const m = onSeg(b.meso, C_MESO);
  const h = onSeg(b.head, C_HEAD, true);
  const P: FPart[] = [];
  if (opts.farJaw !== false) P.push({ d: `M ${jawPoly(b.head, "far", mandOpen).map((q) => `${n2(q[0])} ${n2(q[1])}`).join(" L ")} Z`, fill: ANT_INKS.far, sh: 0.4 });
  P.push({ d: mapD(SK.gaster, g), fill: ANT_INKS.ant });
  SK.plates.forEach((d) => P.push({ d: mapD(d, g), fill: ANT_INKS.top, line: 1.7, op: 0.7 }));
  P.push({ d: mapD(SK.gasterTop, g), fill: ANT_INKS.top, sh: 0 });
  P.push({ d: mapD(SK.pet, pe), fill: ANT_INKS.ant, sh: 0.6 });
  P.push({ d: mapD(SK.meso, m), fill: ANT_INKS.ant });
  P.push({ d: mapD(SK.mesoTop, m), fill: ANT_INKS.top, sh: 0 });
  P.push({ d: mapD(SK.head, h), fill: ANT_INKS.ant });
  P.push({ d: mapD(SK.headTop, h), fill: ANT_INKS.top, sh: 0 });
  P.push({ d: mapD(ellC(102, -102, 4.6, 5.4), h), fill: ANT_INKS.eye, sh: 0 });
  P.push({ d: mapD(ellC(100.5, -104, 1.4, 1.6), h), fill: ANT_INKS.glint, sh: 0 });
  if (opts.nearJaw) P.push(...folkJaw(b.head, mandOpen));
  return P;
};
/** the near pincer blade (the death grip closes it on the vein) */
export const folkJaw = (head: Seg, mandOpen: number): FPart[] => [{ d: `M ${jawPoly(head, "near", mandOpen).map((q) => `${n2(q[0])} ${n2(q[1])}`).join(" L ")} Z`, fill: ANT_INKS.ant, sh: 0.4 }];
/** one leg along the motion's joints: coxa + femur as one tapered limb, tibia + tarsus as another (a slight bow) */
export const folkLeg = (g: LegGeo, ink: string): FPart[] => {
  const w = 7.6 * KA * g.r * 0.95;
  const bow = (a: P2, b: P2, k: number): P2 => {
    // the midpoint bowed a little to the leg's fixed left side (so it can never flip)
    const d: P2 = [b[0] - a[0], b[1] - a[1]];
    return [(a[0] + b[0]) / 2 - d[1] * k, (a[1] + b[1]) / 2 + d[0] * k];
  };
  const upper = [...quad(g.root, bow(g.root, g.hip, 0.04), g.hip, 3), ...quad(g.hip, bow(g.hip, g.knee, 0.05), g.knee, 6).slice(1)];
  const lower = [...quad(g.knee, bow(g.knee, g.ankle, 0.04), g.ankle, 6), ...quad(g.ankle, bow(g.ankle, g.toe, 0.03), g.toe, 4).slice(1)];
  return [
    { d: limbC(upper, w + 2.6 * g.r, w), fill: ink, sh: 0.4 },
    { d: limbC(lower, w, w * 0.5), fill: ink, sh: 0.4 },
  ];
};
/** an elbowed antenna: scape and funiculus angles (head-local rad) as the motion gives them */
export const folkAntenna = (head: Seg, scapeA: number, funA: number, ink: string, sock: P2, scale = 1): FPart[] => {
  const s = ANT_S * scale;
  // the folk drawing's posture: the scape stands up and a little forward from the socket on the crown, the funiculus
  // reaches forward and down (the motion's angles, turned to suit the drawing's socket)
  scapeA += 0.85;
  funA += 1.0;
  const sDir = rot([1, 0], head.a + scapeA);
  const elbow: P2 = [sock[0] + sDir[0] * 100 * s, sock[1] + sDir[1] * 100 * s];
  let dir = rot([1, 0], head.a + funA);
  const pts: P2[] = [elbow];
  let p = elbow;
  for (let i = 0; i < 8; i++) {
    dir = rot(dir, 0.06);
    p = [p[0] + dir[0] * 15 * s, p[1] + dir[1] * 15 * s];
    pts.push(p);
  }
  return [
    { d: limbC(quad(sock, [(sock[0] + elbow[0]) / 2, (sock[1] + elbow[1]) / 2], elbow, 4), 6 * KA * scale, 6 * KA * scale), fill: ink, sh: 0 },
    { d: limbC(pts, 5.5 * KA * scale, 8 * KA * scale), fill: ink, sh: 0 },
  ];
};
/** the infection while it is alive: fine wavy orange threads at the joints (the neck, the waist, under the mesosoma,
 *  the plate edges), revealed along their length by t (0..1) */
const THREADS: { seg: "head" | "meso" | "pet" | "gaster"; d: string; w: number }[] = [
  { seg: "pet", d: "M -36 -62 C -30 -48 -40 -40 -34 -28", w: 2.2 },
  { seg: "pet", d: "M -40 -70 C -46 -80 -38 -86 -44 -94", w: 1.9 },
  { seg: "gaster", d: "M -46 -56 C -56 -46 -50 -36 -58 -30", w: 1.9 },
  { seg: "meso", d: "M 62 -70 C 70 -62 66 -52 74 -46", w: 1.9 },
  { seg: "meso", d: "M 56 -88 C 62 -98 56 -104 62 -112", w: 1.8 },
  { seg: "meso", d: "M 6 -54 C 0 -46 6 -38 2 -30", w: 1.9 },
  { seg: "gaster", d: "M -60 -104 C -64 -112 -58 -118 -62 -124", w: 1.7 },
  { seg: "gaster", d: "M -114 -112 C -118 -120 -112 -126 -116 -132", w: 1.6 },
];
const SEG_C = { head: C_HEAD, meso: C_MESO, pet: C_PET, gaster: C_GAS };
export const folkJointThreads = (b: BodyPose, t: number): FPart[] => {
  if (t <= 0) return [];
  return THREADS.map((q, i) => {
    const start = (i % 4) * 0.08;
    const u = Math.max(0, Math.min(1, (t - start) / (1 - 0.24)));
    if (u <= 0.02) return null;
    const f = onSeg(b[q.seg], SEG_C[q.seg], q.seg === "head");
    // the drawn part of the curve: its cubic sampled to u
    const nums = (q.d.match(/-?\d*\.?\d+/g) ?? []).map(Number);
    const [x0, y0, x1, y1, x2, y2, x3, y3] = nums;
    const pts: P2[] = [];
    for (let k = 0; k <= 10; k++) {
      const tt = (k / 10) * u;
      const a = (1 - tt) ** 3;
      const bb = 3 * (1 - tt) ** 2 * tt;
      const c = 3 * (1 - tt) * tt * tt;
      const d = tt ** 3;
      pts.push(f([a * x0 + bb * x1 + c * x2 + d * x3, a * y0 + bb * y1 + c * y2 + d * y3]));
    }
    return { d: `M ${pts.map((p) => `${n2(p[0])} ${n2(p[1])}`).join(" L ")}`, fill: ANT_INKS.thread, line: q.w * 1.25, op: 0.95 } as FPart;
  }).filter((x): x is FPart => !!x);
};
/** the mycelium after death: few fine wavy tapering filaments out of the joints and the near knees, drawn by their tips */
const DEATH: { seg: "meso" | "pet" | "gaster"; at: P2; dir: P2; len: number; fork?: boolean }[] = [
  { seg: "meso", at: [50, -96], dir: [0.4, -1], len: 30, fork: true },
  { seg: "meso", at: [58, -60], dir: [0.5, 1], len: 24 },
  { seg: "pet", at: [-32, -86], dir: [-0.1, -1], len: 28, fork: true },
  { seg: "pet", at: [-32, -52], dir: [0.2, 1], len: 22 },
  { seg: "gaster", at: [-62, -110], dir: [-0.2, -1], len: 24 },
  { seg: "gaster", at: [-96, -24], dir: [-0.1, 1], len: 24, fork: true },
  { seg: "meso", at: [-18, -88], dir: [-0.7, -1], len: 20 },
];
const filament = (root: P2, dir: P2, len: number, w: number, wave: number, seed: number) => {
  const l0 = Math.hypot(dir[0], dir[1]) || 1;
  const d0: P2 = [dir[0] / l0, dir[1] / l0];
  const nrm: P2 = [-d0[1], d0[0]];
  const pts: P2[] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const off = wave * Math.sin(t * Math.PI * 1.6 + seed) * t;
    pts.push([root[0] + d0[0] * len * t + nrm[0] * off, root[1] + d0[1] * len * t + nrm[1] * off]);
  }
  return { d: limbC(pts, w, w * 0.3), mid: pts[6], dir: d0 };
};
export const folkDeathThreads = (b: BodyPose, t: number, legs: LegGeo[] = []): FPart[] => {
  if (t <= 0) return [];
  const items = DEATH.map((q, i) => {
    const f = onSeg(b[q.seg], SEG_C[q.seg]);
    const root = f(q.at);
    const tip = f([q.at[0] + q.dir[0], q.at[1] + q.dir[1]]);
    return { root, dir: [tip[0] - root[0], tip[1] - root[1]] as P2, len: q.len * ANT_S, k: i, fork: !!q.fork };
  });
  legs.forEach((g, i) => {
    const d: P2 = [g.ankle[0] - g.hip[0], g.ankle[1] - g.hip[1]];
    const nn: P2 = [-d[1], d[0]];
    const out: P2 = [g.knee[0] - (g.hip[0] + g.ankle[0]) / 2, g.knee[1] - (g.hip[1] + g.ankle[1]) / 2];
    const dir: P2 = nn[0] * out[0] + nn[1] * out[1] >= 0 ? nn : [-nn[0], -nn[1]];
    items.push({ root: g.knee, dir, len: 20 * ANT_S * g.r, k: DEATH.length + i, fork: false });
  });
  const P: FPart[] = [];
  items.forEach((q) => {
    const start = (q.k % 7) * 0.05;
    const u = Math.max(0, Math.min(1, (t - start) / 0.7));
    if (u <= 0) return;
    const e = 1 - Math.pow(1 - u, 2);
    const f = filament(q.root, q.dir, q.len * e, 2.6, 3.2, q.k * 1.7);
    P.push({ d: f.d, fill: FUNGUS.main, sh: 0 });
    if (q.fork && e > 0.5) {
      const fd = rot(f.dir, (q.k % 2 ? 1 : -1) * 0.6);
      P.push({ d: filament(f.mid, fd, q.len * 0.45 * (e - 0.5) * 2, 1.7, 2, q.k).d, fill: FUNGUS.main, sh: 0 });
    }
  });
  return P;
};

// ===================================================================================================================
// THE MARMOT (cut 1): pandemicFolkSketch's marmot (front, standing up at its burrow), made to move: the head turns
// (its features slide round a round head, the snout grows out to the side it faces, the far eye goes behind), nods,
// sniffs and blinks; the body breathes and leans; the belly and the arms slide a little with the camera's arc round it;
// the tail flicks. Units as the sketch: the feet at (0, 0), up is -y, ~252 to the top of the head.
// ===================================================================================================================
export const MARMOT_INKS = { fur: "#A6875F", furDk: "#5E4634", belly: "#D5BF96", muzzle: "#CDB38A", crown: "#7A5E46", nose: "#3A2B22", eye: "#2A201A", blush: "#D99A86" };
export const MARMOT_H = 252;
export type MarmotPose = {
  /** head yaw on screen: 0 facing us, -1 a full profile to screen left, +1 to screen right */
  turn: number;
  /** the body's yaw on screen (the camera's arc round it), -1..1, small */
  body: number;
  /** nod (rad, + = nose down), sniff 0..1, blink 1 open .. 0.1 shut, breath (scale y), lean (rad), tail flick (rad) */
  nod: number;
  sniff: number;
  sniffPh: number;
  blink: number;
  breath: number;
  lean: number;
  tail: number;
};
const rotAbout = (c: P2, a: number) => (p: P2): P2 => {
  const v = rot([p[0] - c[0], p[1] - c[1]], a);
  return [c[0] + v[0], c[1] + v[1]];
};
export const folkMarmot = (q: MarmotPose): FPart[] => {
  const I = MARMOT_INKS;
  const P: FPart[] = [];
  const br = (p: P2): P2 => [p[0], p[1] * q.breath];
  const lean = rotAbout([0, 0], q.lean);
  const body = (p: P2): P2 => lean(br(p));
  const NECK: P2 = [0, -182];
  const neckW = body(NECK);
  const headF = (p: P2): P2 => {
    const r = rotAbout(NECK, q.nod * (q.turn < 0 ? -1 : 1))(p);
    const d: P2 = [r[0] - NECK[0] + neckW[0], r[1] - NECK[1] + neckW[1]];
    return d;
  };
  const bx = q.body * 18;
  // the tail, behind, to the side away from the body's turn
  const tailRoot: P2 = [-44 - bx * 0.6, -26];
  const tl = rotAbout(tailRoot, q.tail);
  P.push({ d: mapD("M -42 -34 C -62 -48 -82 -40 -80 -24 C -78 -12 -60 -12 -44 -20 Z", (p) => body(tl([p[0] - bx * 0.6, p[1]]))), fill: I.furDk, sh: 0.5 });
  // the plump squat body and its pale belly (sliding with the body's turn)
  P.push({ d: mapD("M 0 -186 C 40 -186 62 -156 68 -116 C 74 -74 64 -36 44 -22 C 28 -12 -28 -12 -44 -22 C -64 -36 -74 -74 -68 -116 C -62 -156 -40 -186 0 -186 Z", body), fill: I.fur });
  const bk = 1 - 0.18 * Math.abs(q.body);
  P.push({ d: mapD("M 0 -160 C 26 -160 40 -130 42 -98 C 44 -64 30 -34 0 -30 C -30 -34 -44 -64 -42 -98 C -40 -130 -26 -160 0 -160 Z", (p) => body([p[0] * bk + bx, p[1]])), fill: I.belly, sh: 0.6 });
  // the feet
  P.push({ d: mapD(ellC(-28 + bx * 0.5, -18, 18, 9), body), fill: I.furDk, sh: 0.5 });
  P.push({ d: mapD(ellC(28 + bx * 0.5, -18, 18, 9), body), fill: I.furDk, sh: 0.5 });
  // tiny arms and paws held at the chest
  const ax = bx * 0.8;
  P.push({ d: mapD(limbC([[-42 + ax * 0.5, -160], [-30 + ax, -142], [-14 + ax, -138]], 18, 13), body), fill: I.fur });
  P.push({ d: mapD(limbC([[42 + ax * 0.5, -160], [30 + ax, -142], [14 + ax, -138]], 18, 13), body), fill: I.fur });
  P.push({ d: mapD(ellC(-10 + ax, -136, 7.5, 8), body), fill: I.furDk, sh: 0.4 });
  P.push({ d: mapD(ellC(10 + ax, -136, 7.5, 8), body), fill: I.furDk, sh: 0.4 });
  // THE HEAD: features on a round head of radius R round the vertical axis, turned by yaw
  const yaw = q.turn * 1.25;
  const R = 52;
  const sideX = (theta: number) => Math.sin(theta + yaw) * R;
  const vis = (theta: number) => Math.cos(theta + yaw);
  // the ears: small, low on the sides
  for (const s of [-1, 1]) {
    const th = s * 1.2;
    const v = vis(th);
    if (v < -0.55) continue;
    P.push({ d: mapD(ellC(sideX(th) * 0.92, -232, 8.5 * (0.55 + 0.45 * Math.max(0, v)), 8), headF), fill: I.furDk, sh: 0.4 });
  }
  // the head's round, then the snout swelling out toward the side it faces
  P.push({ d: mapD("M 0 -252 C 36 -252 55 -236 55 -213 C 55 -190 33 -176 0 -176 C -33 -176 -55 -190 -55 -213 C -55 -236 -36 -252 0 -252 Z", headF), fill: I.fur });
  const sx = Math.sin(yaw) * 34;
  if (Math.abs(sx) > 2) P.push({ d: mapD(ellC(sx, -197, 22 + Math.abs(sx) * 0.15, 18), headF), fill: I.fur, sh: 0.5 });
  // the darker crown: a soft cap over the top of the head, down to the brow (sliding with the turn)
  const cx = Math.sin(yaw) * 10;
  P.push({ d: mapD("M -46 -226 C -42 -244 -22 -250 0 -250 C 22 -250 42 -244 46 -226 C 34 -232 18 -228 0 -232 C -18 -228 -34 -232 -46 -226 Z", (p) => headF([p[0] + cx, p[1]])), fill: I.crown, sh: 0.3 });
  // the pale muzzle on the snout, the nose at its front
  const mx = Math.sin(yaw) * 44;
  const mk = 0.62 + 0.38 * Math.cos(yaw);
  const sn = q.sniff * Math.sin(q.sniffPh) * 1.6;
  P.push({ d: mapD("M 0 -210 C 10 -210 16 -204 24 -200 C 32 -196 34 -188 28 -183 C 20 -178 8 -178 0 -180 C -8 -178 -20 -178 -28 -183 C -34 -188 -32 -196 -24 -200 C -16 -204 -10 -210 0 -210 Z", (p) => headF([p[0] * mk + mx, p[1] + sn * 0.5])), fill: I.muzzle, sh: 0.3 });
  const nx = Math.sin(yaw) * 58;
  P.push({ d: mapD("M -6 -203 C -3 -206 3 -206 6 -203 C 5 -198 2 -196 0 -196 C -2 -196 -5 -198 -6 -203 Z", (p) => headF([p[0] * (0.7 + 0.3 * Math.cos(yaw)) + nx, p[1] + sn])), fill: I.nose, sh: 0 });
  // the dot eyes (the far one goes behind the head as it turns), blinking
  for (const s of [-1, 1]) {
    const th = s * 0.42;
    const v = vis(th);
    if (v < 0.12) continue;
    const ex = sideX(th) * 0.93;
    P.push({ d: mapD(ellC(ex, -215, 4.4 * (0.55 + 0.45 * v), 5.2 * q.blink), headF), fill: I.eye, sh: 0 });
  }
  for (const s of [-1, 1]) {
    const th = s * 0.78;
    const v = vis(th);
    if (v < 0.25) continue;
    P.push({ d: mapD(ellC(sideX(th) * 0.88, -197, 7 * v, 4), headF), fill: I.blush, sh: 0, op: 0.4 });
  }
  return P;
};
