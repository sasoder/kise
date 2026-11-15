// ---------------------------------------------------------------------------
// ChipTicksNeuronFires (rsi-since-writing, cut 94). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 114 frames.
// One stage inside the misty teal air (AirStage, palette A) on a londonDepth one-point perspective, from the kit
// kits/dwarkesh-3d/dwarkesh3d (its header is the API). No world module: the neuron and the chip are cut-local.
//
// CHECK LINE: "A chip ticks about a million times in the time our fastest neuron fires once."
//
// THE LINE: "Modern chips have a clock cycle that is about a million times faster than our fastest neurons fire."
// WORD -> FRAME: Modern -2 · chips 4 · have 11 · a 19 · clock 22 · cycle 25 · that 33 · is 38 · about 40 · a 43 ·
// million 45 · times 51 · faster 58 · than 71 · our 78 · fastest 81 · neurons 91 · fire. 99 · (And 112)
// DURATION: the slot 94.6779 -> 99.4327 s = 4.755 s x 23.976 = 114 frames (f0..f113).
//
// THE MOTION (Revision 1): a split stage in the air, the NEURON (left, rosy-cream gouache: dendrites, soma with
// nucleus, a thick beaded myelinated axon running down-right to its boutons) and the CHIP (right, a slate package with
// gold-grey pins, its die window glowing ORANGE) side by side on the front plane over a sand floor, each ~390-420 px at
// rest. Under each ONE counter on the same baseline: big tabular Caslon figures (~75 px tall), centred, the unit small
// below. f0 close on the chip (k 1.28 x rest): the die pulses softly on its first ticks, the chip's counter races on a
// log curve (10^(6 u^p)); ONE camera lobe pulls back and pans left at once (f-6 -> 70) bringing the neuron and its
// counter ("0 / firing") in from the left edge (whole by ~f60). ONE cream bead leaves the axon hillock (forming f5-12,
// constant speed f10 -> 99). CAUSE BEFORE EFFECT: the bead touches the boutons on f99 ("fire"); the flash starts on
// f99, the chip's counter lands on 1,000,000 on f99 and holds, the neuron's counter rolls 0 -> 1 (odometer slide-up
// crossfade f99-105). f100-113 settled and alive: 1 vs 1,000,000, the boutons' afterglow, the die's hum, a slow drift.
// Orange = the AI's hardware only (the die and its light); the neuron is rosy-cream, the pins gold-grey, type cream.
//
// DEPTH: eye at Y -740 (the horizon behind the pair), dRef 1800 at kRef 1, dolly 0.5, fog by DEPTH (a pull-back);
// the neuron at Z 0 (front plane, toned as Z 250), the chip's package Z -24..0 (pins at Z -12), the floor Z -2400..4600.
// RESOLVED FRAME (f113): k 0.985; neuron x 78-458 y ~414-901, chip x 490-903 y ~474-888; counters: figures y ~926-1012, units
// baseline ~1052 ("firing" descender ~1060); the chip's 1,000,000 x ~446-948 (clear of the button column x 955+).
//
// SOURCES: clock rates of modern CPUs ~3-5 GHz (GPUs ~1.5-2.5 GHz); the fastest neurons fire up to ~1 kHz (most far
// slower): ratio ~10^6, the speaker's "about a million times faster" (COMMON.md, Facts). On screen only the
// speaker's number (1,000,000) and the units (ticks, firing).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, ACCENT_DEEP, AIR, AirBox, AirFloor, AirHorizonHazeW, AirShadow, AirStage, MAT, ORANGE_LINE, lineOf, Paint, WorldSvg, airWorldOf, c01, mixHex, smoothstep, swayCam, type AirWorld, type Cam, type DepthOpts, type Mat, type P2 } from "../kits/dwarkesh-3d/dwarkesh3d";
import { PLATE_FONT } from "../rsi-ten-earths/tenEarthsHall";

export const FPS = 24000 / 1001;
export const DURATION = 114;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const PAL = AIR.A;
const f2 = (v: number) => v.toFixed(2);
const Pt = (v: P2) => `${f2(v[0])},${f2(v[1])}`;

// ===================================================================================================================
// TIMELINE (frames)
// ===================================================================================================================
/** "fire." 99: the pulse touches the boutons, the flash starts, the counter lands */
export const FIRE = 99;
/** the pulse forms at the hillock, then leaves at constant speed */
const PULSE_FORM: readonly [number, number] = [5, 12];
const PULSE_GO = 10;
/** the counter: log10 N = 6 u^P, u from COUNT_FS to FIRE (1 on f0, 2 ~f9, 3 ~f14, 4 ~f17 ... 1,000,000 on f99) */
const COUNT_FS = -4;
const COUNT_P = 1.45;
export const countAt = (f: number) => {
  if (f >= FIRE) return 1_000_000;
  const u = c01((f - COUNT_FS) / (FIRE - COUNT_FS));
  return Math.max(1, Math.floor(Math.pow(10, 6 * Math.pow(u, COUNT_P)) + 1e-9));
};
/** the frame tick n happens on (n >= 2; tick 1 is on f0) */
const tickAt = (n: number) => (n <= 1 ? 0 : COUNT_FS + (FIRE - COUNT_FS) * Math.pow(Math.log10(n) / 6, 1 / COUNT_P));
/** the die's light 0..~1.1: one pulse per tick while the ticks are countable, merging into a steady hum */
export const dieGlow = (f: number) => {
  let pulse = 0;
  for (let n = 1; n <= 12; n++) {
    const t = tickAt(n);
    if (f >= t) pulse += Math.exp(-(f - t) / 3.4);
  }
  const amp = 0.4 * (1 - smoothstep(13, 30, f));
  const base = 0.34 + 0.6 * smoothstep(10, 46, f);
  const hum = 0.035 * Math.sin(f / 3.1) * smoothstep(30, 50, f);
  return base + amp * Math.min(1.2, pulse) + hum;
};

// ===================================================================================================================
// THE CAMERA (WeKeepThemApart / marketWorkshopWorld: raised-cosine velocity lobes per channel)
// ===================================================================================================================
const lobe = (a: number, b: number) => (f: number) => {
  const L2 = b - a;
  const x = Math.max(0, Math.min(L2, f - a));
  return (x - (L2 / (2 * Math.PI)) * Math.sin((2 * Math.PI * x) / L2)) / L2;
};
type Lobe = readonly [number, number, number];
const channel = (v0: number, lobes: readonly Lobe[]) => (f: number) => lobes.reduce((v, [a, b, d]) => v + d * lobe(a, b)(f), v0);
/** f0: close on the chip (k 1.7, its centre at screen x 540); one lobe pulls back and pans left at once (f-6 -> 70);
 *  a slow drift on in the same directions (f50 -> 190) keeps the settled picture alive without a reversal */
export const CAM = {
  x: [183.3, [[-6, 70, -184.1], [50, 190, -8]]] as const,
  lnk: [Math.log(1.28), [[-6, 70, -0.2559], [50, 190, Math.log(0.985)]]] as const,
  y: [-383.3, [[-6, 70, -15.9], [50, 190, -2]]] as const,
};
const CX = channel(CAM.x[0], CAM.x[1]);
const LK = channel(CAM.lnk[0], CAM.lnk[1]);
const CY = channel(CAM.y[0], CAM.y[1]);
export const camBase = (f: number): Cam => ({ k: Math.exp(LK(f)), cx: CX(f), cy: CY(f) });
export const camAt = (f: number): Cam => swayCam(camBase(f), f);
const REST = camAt(0);
/** the eye 3.1 men up (the horizon sits behind the pair), half of a zoom is a dolly */
export const DEPTH: DepthOpts = { eyeY: -740, dRef: 1800, kRef: 1, dolly: 0.5 };

// ===================================================================================================================
// THE NEURON (world units on the front plane Z 0; painted with the cast's gouache, pandemicFolkPaint)
// ===================================================================================================================
const NEURON_TONE_Z = 250;
const NEURON = {
  body: "#CFA99B",
  sheath: "#DDBFB1",
  nucleus: "#A9867D",
  nucleolus: "#86675F",
};
type V = [number, number];
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1]];
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1]];
const mul = (a: V, s: number): V => [a[0] * s, a[1] * s];
const len = (a: V) => Math.hypot(a[0], a[1]);
const norm = (a: V): V => mul(a, 1 / Math.max(1e-6, len(a)));
const perp = (a: V): V => [-a[1], a[0]];
const polar = (deg: number, r: number): V => [Math.cos((deg * Math.PI) / 180) * r, Math.sin((deg * Math.PI) / 180) * r];
const bez = (p0: V, p1: V, p2: V, p3: V, t: number): V => {
  const u = 1 - t;
  return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]];
};
const quad = (p0: V, p1: V, p2: V, t: number): V => {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
};
/** a tapered stroke along sampled centre points as one closed outline (consistent winding), round ends */
const taper = (pts: V[], w0: number, w1: number) => {
  const n = pts.length;
  const L: V[] = [];
  const R: V[] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const nn = perp(norm(sub(b, a)));
    const w = (w0 + (w1 - w0) * Math.pow(i / (n - 1), 0.85)) / 2;
    L.push(add(pts[i], mul(nn, w)));
    R.push(add(pts[i], mul(nn, -w)));
  }
  const dEnd = norm(sub(pts[n - 1], pts[n - 2]));
  const dSt = norm(sub(pts[0], pts[1]));
  // a half circle from the side perp(d) through the tip d to the side -perp(d)
  const capPts = (c: V, d: V, w: number): V[] => {
    const out: V[] = [];
    for (let j = 1; j < 6; j++) {
      const a = (j * Math.PI) / 6;
      out.push(add(c, add(mul(perp(d), w * Math.cos(a)), mul(d, w * Math.sin(a)))));
    }
    return out;
  };
  // left side forward, the end cap, right side back, the start cap (perp of the backward direction is the right side)
  const ring: V[] = [...L, ...capPts(pts[n - 1], dEnd, w1 / 2), ...R.reverse(), ...capPts(pts[0], dSt, w0 / 2)];
  return `M${ring.map(Pt).join("L")}Z`;
};
/** a round blob as a polygon (the same winding as taper) with a little hand wobble */
const blob = (c: V, r: number, seed: number, wob = 0.08, n = 28) => {
  const q: V[] = [];
  for (let i = 0; i < n; i++) {
    const a = -(i / n) * Math.PI * 2;
    const rr = r * (1 + wob * Math.sin(3 * a + seed) + 0.5 * wob * Math.sin(5 * a + 2 * seed));
    q.push(add(c, [Math.cos(a) * rr, Math.sin(a) * rr]));
  }
  return `M${q.map(Pt).join("L")}Z`;
};
const sampleQ = (p0: V, p1: V, p2: V, n = 14) => Array.from({ length: n }, (_, i) => quad(p0, p1, p2, i / (n - 1)));

/** the soma, the hillock, the axon (a cubic), the terminal */
export const SOMA: V = [-336, -812];
const SOMA_R = 66;
const AX0: V = add(SOMA, polar(48, SOMA_R * 0.82));
const AX1: V = [-264, -724];
const AX2: V = [-210, -596];
export const AX3: V = [-160, -530];
/** the axon sampled by arc length: s 0..1 -> point */
const AXON_PTS: V[] = Array.from({ length: 121 }, (_, i) => bez(AX0, AX1, AX2, AX3, i / 120));
const AXON_CUM: number[] = AXON_PTS.reduce<number[]>((acc, p, i) => (i === 0 ? [0] : [...acc, acc[i - 1] + len(sub(p, AXON_PTS[i - 1]))]), []);
const AXON_LEN = AXON_CUM[AXON_CUM.length - 1];
export const axonAt = (s: number): V => {
  const L0 = c01(s) * AXON_LEN;
  let i = 1;
  while (i < AXON_CUM.length - 1 && AXON_CUM[i] < L0) i++;
  const t = (L0 - AXON_CUM[i - 1]) / Math.max(1e-6, AXON_CUM[i] - AXON_CUM[i - 1]);
  return add(AXON_PTS[i - 1], mul(sub(AXON_PTS[i], AXON_PTS[i - 1]), t));
};
const axonRange = (s0: number, s1: number, n = 16) => Array.from({ length: n }, (_, i) => axonAt(s0 + ((s1 - s0) * i) / (n - 1)));
/** the terminal: short branches fanning down-right off the axon's end, each ending in a bouton */
export const BOUTONS: { tip: V; ctrl: V; r: number }[] = [
  { tip: add(AX3, [56, -6]), ctrl: add(AX3, [28, -8]), r: 13 },
  { tip: add(AX3, [56, 28]), ctrl: add(AX3, [30, 10]), r: 13.5 },
  { tip: add(AX3, [28, 54]), ctrl: add(AX3, [20, 22]), r: 13 },
  { tip: add(AX3, [-6, 56]), ctrl: add(AX3, [2, 28]), r: 12.5 },
];
export const SYNAPSE: V = add(AX3, [30, 24]);
/** dendrites: [angle, length, root width, forks [at, angle offset, length]] */
const DENDRITES: { a: number; L: number; w: number; bend: number; forks: [number, number, number][] }[] = [
  { a: -148, L: 84, w: 28, bend: 14, forks: [[0.5, -34, 46], [0.95, 28, 34]] },
  { a: -108, L: 88, w: 27, bend: -12, forks: [[0.5, 32, 44], [0.94, -26, 36]] },
  { a: -66, L: 80, w: 26, bend: 12, forks: [[0.5, 34, 42], [0.95, -22, 32]] },
  { a: 178, L: 74, w: 25, bend: -10, forks: [[0.55, -36, 38], [0.95, 26, 30]] },
  { a: 136, L: 72, w: 25, bend: 12, forks: [[0.5, 32, 38], [0.96, -26, 28]] },
  { a: 96, L: 58, w: 22, bend: -10, forks: [[0.6, -34, 32]] },
  { a: -18, L: 56, w: 21, bend: -10, forks: [[0.7, -36, 28]] },
];
const dendritePaths = () => {
  const ds: string[] = [];
  for (const dd of DENDRITES) {
    const dir = polar(dd.a, 1);
    const p0 = add(SOMA, mul(dir, SOMA_R * 0.6));
    const p2 = add(SOMA, mul(dir, SOMA_R * 0.6 + dd.L));
    const p1 = add(add(SOMA, mul(dir, SOMA_R * 0.6 + dd.L * 0.5)), mul(perp(dir), dd.bend));
    ds.push(taper(sampleQ(p0, p1, p2), dd.w * 1.2, 7));
    for (const [at, off, fl] of dd.forks) {
      const q0 = quad(p0, p1, p2, at);
      const fdir = polar(dd.a + off, 1);
      const q2 = add(q0, mul(fdir, fl));
      const q1 = add(add(q0, mul(fdir, fl * 0.5)), mul(perp(fdir), off > 0 ? -5 : 5));
      ds.push(taper(sampleQ(q0, q1, q2, 10), Math.max(8, dd.w * 1.2 * (1 - at) * 0.85), 5));
    }
  }
  return ds.join("");
};
/** the myelin sheath: segments along the axon with bare nodes between */
const SHEATH: [number, number][] = [
  [0.12, 0.23],
  [0.33, 0.44],
  [0.54, 0.65],
  [0.75, 0.86],
];
export const NEURON_GEOM = (() => {
  const body = [
    dendritePaths(),
    // the hillock: the soma narrowing into the axon
    taper(axonRange(-0.04, 0.12, 10).map((p, i) => (i === 0 ? add(SOMA, polar(48, SOMA_R * 0.5)) : p)), 50, 20),
    taper(axonRange(0.08, 1, 40), 20, 16),
    ...BOUTONS.map((b) => taper(sampleQ(AX3, b.ctrl, b.tip, 10), 12, 9)),
    ...BOUTONS.map((b, i) => blob(b.tip, b.r, i * 1.7, 0.05, 20)),
    blob(SOMA, SOMA_R, 0.6, 0.1),
  ].join("");
  const sheath = SHEATH.map(([a, b]) => taper(axonRange(a, b, 14), 38, 38)).join("");
  return { body, sheath, nucleus: blob(add(SOMA, [-6, -5]), 26, 2.1, 0.06, 20), nucleolus: blob(add(SOMA, [-11, -10]), 8, 0.3, 0.05, 14) };
})();

const Neuron: React.FC<{ A: AirWorld; frame: number }> = ({ A, frame }) => {
  const f = frame;
  const tone = (hex: string) => A.tone(hex, NEURON_TONE_Z, 300);
  const shapes: Paint.Shape[] = [
    { d: NEURON_GEOM.body, fill: tone(NEURON.body), sh: 1 },
    { d: NEURON_GEOM.sheath, fill: tone(NEURON.sheath), sh: 0.8 },
    { d: NEURON_GEOM.nucleus, fill: tone(NEURON.nucleus), sh: 0.6 },
    { d: NEURON_GEOM.nucleolus, fill: tone(NEURON.nucleolus), sh: 0 },
  ];
  // the pulse: forms at the hillock, travels the axon at a constant speed, touches the boutons on FIRE
  const s = c01((f - PULSE_GO) / (FIRE - PULSE_GO));
  const form = smoothstep(PULSE_FORM[0], PULSE_FORM[1], f);
  const arrive = 1 - smoothstep(FIRE - 1, FIRE + 3, f);
  const pa = form * arrive;
  const pc = f < PULSE_GO ? axonAt(0) : axonAt(s);
  // the flash at the synapse: on FIRE, decaying to a warm glow
  const fl = f >= FIRE ? Math.exp(-(f - FIRE) / 6.5) : 0;
  const glowAfter = f >= FIRE ? 0.42 * smoothstep(FIRE, FIRE + 4, f) : 0;
  const flashR = 52 + 110 * (1 - Math.exp(-(Math.max(0, f - FIRE) + 1) / 4));
  const boutonLit = Math.max(fl, glowAfter * 1.4);
  const cream = PAL.cream;
  const hot = "#FFF7E6";
  return (
    <g>
      <Paint.FolkPaint shapes={shapes} x={0} y={0} scale={1} uid="neu" unitPx={A.k} px={0.9} />
      {/* the boutons light up when the pulse arrives */}
      {boutonLit > 0.002 ? (
        <g opacity={f2(Math.min(1, boutonLit))}>
          {BOUTONS.map((b, i) => (
            <circle key={i} cx={b.tip[0]} cy={b.tip[1]} r={b.r * 0.9} fill={mixHex(cream, hot, 0.5)} opacity={0.85} />
          ))}
        </g>
      ) : null}
      <defs>
        <radialGradient id="neu-pulse">
          <stop offset="0" stopColor={hot} stopOpacity={1} />
          <stop offset="0.22" stopColor={hot} stopOpacity={0.95} />
          <stop offset="0.45" stopColor={cream} stopOpacity={0.45} />
          <stop offset="1" stopColor={cream} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="neu-flash">
          <stop offset="0" stopColor={hot} stopOpacity={0.9} />
          <stop offset="0.3" stopColor={cream} stopOpacity={0.55} />
          <stop offset="1" stopColor={cream} stopOpacity={0} />
        </radialGradient>
      </defs>
      {pa > 0.002 ? (
        <g opacity={f2(pa)}>
          {/* a short lit tail behind the pulse, inside the axon */}
          {s > 0.01 ? <path d={taper(axonRange(Math.max(0, s - 0.1), s, 12), 5, 17)} fill={hot} opacity={0.6} /> : null}
          <circle cx={pc[0]} cy={pc[1]} r={66} fill="url(#neu-pulse)" />
        </g>
      ) : null}
      {fl + glowAfter > 0.002 ? <circle cx={SYNAPSE[0]} cy={SYNAPSE[1]} r={flashR} fill="url(#neu-flash)" opacity={f2(Math.min(1, fl + glowAfter))} /> : null}
    </g>
  );
};

// ===================================================================================================================
// THE CHIP (a slate package on the front plane, gold-grey pins, the ORANGE die)
// ===================================================================================================================
export const CHIP = { X0: -28, X1: 332, Y0: -865, Y1: -505, Z0: -26, Z1: 0, pinL: 30, pinW: 16, pins: 8 };
const SLATE: Mat = { lit: "#7E878B", mid: "#525B60", dark: "#2D3337" };
const PIN: Mat = { lit: "#C2B793", mid: "#978D6E", dark: "#625B47" };
const RECESS = "#3B3530";
export const DIE = { X0: 80, X1: 224, Y0: -757, Y1: -613 };
const WIN = { X0: 62, X1: 242, Y0: -775, Y1: -595 };

const Chip: React.FC<{ A: AirWorld; frame: number }> = ({ A, frame }) => {
  const P = A.P;
  const Zf = CHIP.Z0;
  const Zp = (CHIP.Z0 + CHIP.Z1) / 2;
  const h = 685;
  const tone = (hex: string) => A.tone(hex, 200, h);
  const toneO = (hex: string) => A.toneO(hex, 200, h);
  const w = A.lw(1.1);
  const g = dieGlow(frame);
  const cxC = (CHIP.X0 + CHIP.X1) / 2;
  const quadAt = (x0: number, y0: number, x1: number, y1: number, Z: number) => `M${Pt(P.p(x0, y0, Z))}L${Pt(P.p(x1, y0, Z))}L${Pt(P.p(x1, y1, Z))}L${Pt(P.p(x0, y1, Z))}Z`;
  // the pins: 8 a side, gull-wing leads seen from above, drawn under the package
  const pins: React.ReactNode[] = [];
  const pitch = (CHIP.X1 - CHIP.X0 - 60) / (CHIP.pins - 1);
  const inset = 14;
  for (let i = 0; i < CHIP.pins; i++) {
    const ax = CHIP.X0 + 30 + i * pitch;
    const ay = CHIP.Y0 + 30 + i * pitch;
    const hw = CHIP.pinW / 2;
    // [x0, y0, x1, y1, lit strip side]
    const rects: [number, number, number, number, "h" | "v", string][] = [
      [ax - hw, CHIP.Y0 - CHIP.pinL, ax + hw, CHIP.Y0 + inset, "v", `t${i}`],
      [ax - hw, CHIP.Y1 - inset, ax + hw, CHIP.Y1 + CHIP.pinL, "v", `b${i}`],
      [CHIP.X0 - CHIP.pinL, ay - hw, CHIP.X0 + inset, ay + hw, "h", `l${i}`],
      [CHIP.X1 - inset, ay - hw, CHIP.X1 + CHIP.pinL, ay + hw, "h", `r${i}`],
    ];
    for (const [x0, y0, x1, y1, o, key] of rects) {
      pins.push(<path key={key} d={quadAt(x0, y0, x1, y1, Zp)} fill={tone(PIN.mid)} stroke={tone(lineOf(PIN))} strokeWidth={w * 0.8} strokeLinejoin="round" />);
      // the lit side (upper / left) and a darker foot
      if (o === "v") pins.push(<path key={`${key}L`} d={quadAt(x0 + 1.5, y0, x0 + (x1 - x0) * 0.42, y1, Zp)} fill={tone(PIN.lit)} opacity={0.85} />);
      else pins.push(<path key={`${key}L`} d={quadAt(x0, y0 + 1.5, x1, y0 + (y1 - y0) * 0.42, Zp)} fill={tone(PIN.lit)} opacity={0.85} />);
    }
  }
  // the die's light
  const gl = c01(g);
  const dieFill = mixHex(mixHex("#7A4A0C", ACCENT_DEEP, c01(g * 1.4)), ACCENT, c01((g - 0.35) * 1.3));
  const hotCore = mixHex(ACCENT, "#FFE2A0", c01((g - 0.55) * 1.6));
  const grid: string[] = [];
  const nG = 4;
  for (let i = 1; i < nG; i++) {
    const x = DIE.X0 + ((DIE.X1 - DIE.X0) * i) / nG;
    const y = DIE.Y0 + ((DIE.Y1 - DIE.Y0) * i) / nG;
    grid.push(`M${Pt(P.p(x, DIE.Y0 + 6, Zf))}L${Pt(P.p(x, DIE.Y1 - 6, Zf))}`);
    grid.push(`M${Pt(P.p(DIE.X0 + 6, y, Zf))}L${Pt(P.p(DIE.X1 - 6, y, Zf))}`);
  }
  const dc = P.p(cxC, (DIE.Y0 + DIE.Y1) / 2, Zf);
  const r1 = P.r(Zf);
  return (
    <g>
      <defs>
        <radialGradient id="chip-die" cx="0.5" cy="0.5" r="0.62">
          <stop offset="0" stopColor={toneO(hotCore)} />
          <stop offset="0.55" stopColor={toneO(dieFill)} />
          <stop offset="1" stopColor={toneO(mixHex(dieFill, ACCENT_DEEP, 0.6))} />
        </radialGradient>
        <radialGradient id="chip-halo">
          <stop offset="0" stopColor={ACCENT} stopOpacity={f2(0.32 * gl)} />
          <stop offset="0.4" stopColor={ACCENT} stopOpacity={f2(0.08 * gl)} />
          <stop offset="1" stopColor={ACCENT} stopOpacity={0} />
        </radialGradient>
        <linearGradient id="chip-recess" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={tone(mixHex(RECESS, PAL.shadow, 0.35))} />
          <stop offset="1" stopColor={tone(mixHex(RECESS, SLATE.mid, 0.3))} />
        </linearGradient>
      </defs>
      {pins}
      <AirBox A={A} X0={CHIP.X0} X1={CHIP.X1} Y0={CHIP.Y0} Y1={CHIP.Y1} Z0={CHIP.Z0} Z1={CHIP.Z1} mat={SLATE} uid="chipB" rim={1.2} />
      {/* a soft bevel just inside the package edge */}
      <path d={quadAt(CHIP.X0 + 12, CHIP.Y0 + 12, CHIP.X1 - 12, CHIP.Y1 - 12, Zf)} fill="none" stroke={tone(SLATE.lit)} strokeWidth={w * 1.4} strokeOpacity={0.35} />
      {/* pin 1 */}
      <circle cx={P.p(CHIP.X0 + 34, 0, Zf)[0]} cy={P.p(0, CHIP.Y0 + 34, Zf)[1]} r={9 * r1} fill={tone(mixHex(SLATE.dark, SLATE.mid, 0.4))} />
      {/* the window and the die */}
      <path d={quadAt(WIN.X0, WIN.Y0, WIN.X1, WIN.Y1, Zf)} fill="url(#chip-recess)" stroke={tone(SLATE.dark)} strokeWidth={w} />
      <path d={quadAt(DIE.X0, DIE.Y0, DIE.X1, DIE.Y1, Zf)} fill="url(#chip-die)" stroke={toneO(ORANGE_LINE)} strokeWidth={w * 0.9} />
      <path d={grid.join("")} stroke={toneO(ORANGE_LINE)} strokeWidth={w * 0.8} strokeOpacity={0.4 * (1 - 0.5 * gl)} fill="none" />
      {/* the die's light on the package and in the air */}
      <circle cx={dc[0]} cy={dc[1]} r={205 * r1} fill="url(#chip-halo)" />
    </g>
  );
};

// ===================================================================================================================
// THE COUNTERS (Revision 1): one under each object on the same baseline, big tabular figures centred under it, the
// unit small below. Cream type on a soft dark plate, the sister clip's Caslon; every figure in its own fixed cell
// (tabular), the whole string centred.
// ===================================================================================================================
/** the figures' baseline and size, the unit's baseline and size (world = rest screen px; Y = screen y - 1360 at rest) */
export const NUM_Y = -362;
export const NUM_SIZE = 108;
export const UNIT_Y = -308;
export const UNIT_SIZE = 36;
/** the counters' centres: under the chip's centre, under the neuron's middle */
export const CHIP_CX = 152;
export const NEURON_CX = -290;
const CELL_DIGIT = 0.6;
const CELL_COMMA = 0.26;
const easeOut = (t: number) => 1 - Math.pow(1 - c01(t), 3);
const fmt = (n: number) => n.toLocaleString("en-US");
/** the string's width in em (tabular cells) */
export const numWidthEm = (str: string) => [...str].reduce((a, ch) => a + (ch === "," ? CELL_COMMA : CELL_DIGIT), 0);
/** the neuron's counter flips 0 -> 1 on FIRE (slide-up crossfade) */
const NEURON_FLIP: readonly [number, number] = [FIRE, FIRE + 6];

const PlateHalo: React.FC<{ c: P2; rx: number; ry: number; uid: string }> = ({ c, rx, ry, uid }) => (
  <g>
    <defs>
      <radialGradient id={`${uid}-pl`}>
        <stop offset="0" stopColor={PAL.shadow} stopOpacity={0.5} />
        <stop offset="0.6" stopColor={PAL.shadow} stopOpacity={0.3} />
        <stop offset="1" stopColor={PAL.shadow} stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={c[0]} cy={c[1]} rx={rx} ry={ry} fill={`url(#${uid}-pl)`} />
  </g>
);
const glyphProps = (s: number, weight: number) => ({
  fill: PAL.cream,
  stroke: PAL.shadow,
  strokeOpacity: 0.85,
  strokeWidth: s * 0.12,
  strokeLinejoin: "round" as const,
  paintOrder: "stroke" as const,
  style: { fontFamily: PLATE_FONT, fontWeight: weight, fontSize: s, fontVariantNumeric: "lining-nums tabular-nums" } as React.CSSProperties,
});
/** a number in tabular cells, centred at x, on baseline y */
const Figures: React.FC<{ str: string; x: number; y: number; s: number; opacity?: number }> = ({ str, x, y, s, opacity = 1 }) => {
  let at = x - (numWidthEm(str) * s) / 2;
  return (
    <g opacity={f2(opacity)}>
      {[...str].map((ch, i) => {
        const cell = (ch === "," ? CELL_COMMA : CELL_DIGIT) * s;
        const cxc = at + cell / 2;
        at += cell;
        return (
          <text key={i} x={f2(cxc)} y={f2(y)} textAnchor="middle" {...glyphProps(s, 700)}>
            {ch}
          </text>
        );
      })}
    </g>
  );
};

const Counter: React.FC<{ A: AirWorld; X: number; children: React.ReactNode; unit: string; haloEm: number; uid: string }> = ({ A, X, children, unit, haloEm, uid }) => {
  const P = A.P;
  const s = NUM_SIZE * P.r(0);
  const u = UNIT_SIZE * P.r(0);
  const cN = P.p(X, NUM_Y, 0);
  const cU = P.p(X, UNIT_Y, 0);
  const hc: P2 = [cN[0], (cN[1] - 0.34 * s + cU[1]) / 2];
  return (
    <g>
      <PlateHalo c={hc} rx={(haloEm * s) / 2 + 0.55 * s} ry={0.82 * s} uid={uid} />
      {children}
      <text x={f2(cU[0])} y={f2(cU[1])} textAnchor="middle" {...glyphProps(u, 400)} letterSpacing={u * 0.04}>
        {unit}
      </text>
    </g>
  );
};

const ChipCounter: React.FC<{ A: AirWorld; frame: number }> = ({ A, frame }) => {
  const P = A.P;
  const s = NUM_SIZE * P.r(0);
  const c = P.p(CHIP_CX, NUM_Y, 0);
  return (
    <Counter A={A} X={CHIP_CX} unit={countAt(frame) === 1 ? "tick" : "ticks"} haloEm={numWidthEm("1,000,000")} uid="cnt">
      <Figures str={fmt(countAt(frame))} x={c[0]} y={c[1]} s={s} />
    </Counter>
  );
};

const NeuronCounter: React.FC<{ A: AirWorld; frame: number }> = ({ A, frame }) => {
  const P = A.P;
  const s = NUM_SIZE * P.r(0);
  const c = P.p(NEURON_CX, NUM_Y, 0);
  const e = easeOut((frame - NEURON_FLIP[0]) / (NEURON_FLIP[1] - NEURON_FLIP[0]));
  // an odometer roll: the 0 slides up out of the figure's window while the 1 slides up into it (crossfading)
  const d = 0.62 * s;
  return (
    <Counter A={A} X={NEURON_CX} unit="firing" haloEm={0.9} uid="fir">
      <defs>
        <clipPath id="fir-win">
          <rect x={f2(c[0] - 0.7 * s)} y={f2(c[1] - 0.8 * s)} width={f2(1.4 * s)} height={f2(0.9 * s)} />
        </clipPath>
      </defs>
      <g clipPath="url(#fir-win)">
        {e < 1 ? <Figures str="0" x={c[0]} y={c[1] - d * e} s={s} opacity={1 - e} /> : null}
        {e > 0 ? <Figures str="1" x={c[0]} y={c[1] + d * (1 - e)} s={s} opacity={e} /> : null}
      </g>
    </Counter>
  );
};

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
const ChipTicksNeuronFires: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const A = airWorldOf({ cam, rest: REST, depth: DEPTH, frame, fogBy: "depth" });
  return (
    <AirStage v={A.v} bloom={0.22}>
      <WorldSvg cam={cam}>
        <AirFloor A={A} x0={-3400} x1={3400} z0={-2400} z1={4600} mat={MAT.ground} course={190} />
        <AirHorizonHazeW A={A} id="haze" />
        <AirShadow A={A} X={-290} Z={60} w={240} d={100} uid="neuS" amt={0.38} />
        <AirShadow A={A} X={152} Z={60} w={240} d={100} uid="chipS" amt={0.5} />
        <Neuron A={A} frame={frame} />
        <Chip A={A} frame={frame} />
        <NeuronCounter A={A} frame={frame} />
        <ChipCounter A={A} frame={frame} />
      </WorldSvg>
    </AirStage>
  );
};

export default ChipTicksNeuronFires;
