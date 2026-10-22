// ---------------------------------------------------------------------------
// weirdWaysStreet: the night street of cut 74 (WeirdWaysToExploit, kyle-pandemics), in the London depth manner
// (londonDepth's one-point perspective: setts converging to one VP, house fronts as dim volumes, one light from the
// upper left, haze toward the page tone with distance). Low-key: deep umber planes in cream line, never black.
//
// 3D units as the cast's (a man ~310); the lane's house fronts at X = +-LANE, the setts from Z -400 to the far end
// (Z 3200), the haze closing the far end. The light: a lamp off frame at the upper left, in front of the man (LAMP):
// it lights the setts round him and the right-hand fronts; two windows down the lane glow dimly (cream, never orange:
// orange is the disease).
// ---------------------------------------------------------------------------
import React from "react";
import type { Persp } from "../kyle-london/londonDepth";

type P2 = [number, number];
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const f2 = (v: number) => v.toFixed(2);
const pt = (p: P2) => `${f2(p[0])},${f2(p[1])}`;
const hsh = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixHex = (a: string, b: string, t: number) => {
  const pa = hexRgb(a);
  const pb = hexRgb(b);
  const u = c01(t);
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * u).toString(16).padStart(2, "0")).join("")}`;
};

export const LANE = 205;
export const Z_FAR = 3200;
const DARK = "#17120D";
const INK = "#E9DDBF";
/** the haze at the far end (toward the page tone, a little lifted) */
export const HAZE = "#3F3429";
const FRONT = "#2C241B";
const FRONT_LIT = "#3A3024";
const PANE = "#1C1611";
const SETT = "#30281F";
/** the lamp (off frame, upper left, in front of him) */
export const LAMP: [number, number, number] = [-185, -470, -170];
const fog = (Z: number) => c01((Z - 300) / (Z_FAR - 300));

const quad = (P: Persp, pts: [number, number, number][]) => `M${pts.map(([x, y, z]) => pt(P.p(x, y, z))).join("L")}Z`;

// ---------------------------------------------------------------------------
// THE HOUSES: three storeys, the upper storeys jettied over the lane on some; doors, windows with sills and reveals
// ---------------------------------------------------------------------------
type House = { side: -1 | 1; z0: number; z1: number; jetty: number; top: number; door: number; lit: number[] };
const HOUSES: House[] = (() => {
  const out: House[] = [];
  for (const side of [-1, 1] as const) {
    let z = -500;
    let i = side === -1 ? 0 : 50;
    while (z < Z_FAR) {
      const w = 230 + 90 * hsh(i, 3);
      out.push({ side, z0: z, z1: z + w, jetty: hsh(i, 5) > 0.45 ? 16 : 0, top: -640 - 90 * hsh(i, 7), door: hsh(i, 9), lit: [] });
      z += w;
      i++;
    }
  }
  // two windows glow dimly down the lane
  const a = out.find((h) => h.side === -1 && h.z0 > 700);
  if (a) a.lit = [1];
  const b = out.find((h) => h.side === 1 && h.z0 > 1500);
  if (b) b.lit = [0];
  return out;
})();
const FLOOR_Y = [0, -225, -435];

const HouseEl: React.FC<{ P: Persp; h: House; uid: string }> = ({ P, h, uid }) => {
  const s = h.side;
  const X0 = s * LANE;
  const XJ = s * (LANE - h.jetty);
  const fz = fog((h.z0 + h.z1) / 2);
  // the light from the lamp falls on the right-hand fronts near him; the far ones sink into the haze
  const lamp = s === 1 ? c01(1 - Math.max(0, h.z0) / 900) : 0;
  const base = mixHex(mixHex(FRONT, FRONT_LIT, lamp), HAZE, fz * 0.65);
  const line = (a: number) => a * (1 - fz * 0.75);
  const r = P.r((h.z0 + h.z1) / 2);
  const els: React.ReactNode[] = [];
  // the ground storey (at the lane line) and the upper storeys (jettied out)
  els.push(<path key="g" d={quad(P, [[X0, 0, h.z0], [X0, FLOOR_Y[1], h.z0], [X0, FLOOR_Y[1], h.z1], [X0, 0, h.z1]])} fill={base} />);
  if (h.jetty > 0) {
    // the jetty's underside (above the eye: we see it), then the upper front
    els.push(<path key="ju" d={quad(P, [[X0, FLOOR_Y[1], h.z0], [XJ, FLOOR_Y[1], h.z0], [XJ, FLOOR_Y[1], h.z1], [X0, FLOOR_Y[1], h.z1]])} fill={mixHex("#1E1812", HAZE, fz * 0.8)} stroke={DARK} strokeWidth={1.4 * r} />);
  }
  els.push(<path key="u" d={quad(P, [[XJ, FLOOR_Y[1], h.z0], [XJ, h.top, h.z0], [XJ, h.top, h.z1], [XJ, FLOOR_Y[1], h.z1]])} fill={mixHex(base, "#000000", 0.04)} />);
  // the eaves: a board under the roof's edge, its underside seen
  const XE = s * (LANE - h.jetty - 26);
  els.push(<path key="ev" d={quad(P, [[XJ, h.top, h.z0], [XE, h.top - 8, h.z0], [XE, h.top - 8, h.z1], [XJ, h.top, h.z1]])} fill={mixHex("#1A140F", HAZE, fz * 0.8)} stroke={DARK} strokeWidth={1.2 * r} />);
  // the roof: a slope from the eaves up and away from the lane (seen from below, only its upper part shows over
  // the eaves' edge), dark against the sky, its ridge a cream line
  const XR = s * (LANE + 150);
  els.push(<path key="rf" d={quad(P, [[XE, h.top - 8, h.z0], [XR, h.top - 190, h.z0], [XR, h.top - 190, h.z1], [XE, h.top - 8, h.z1]])} fill={mixHex("#221B14", HAZE, fz * 0.75)} stroke={DARK} strokeWidth={1.2 * r} />);
  els.push(<path key="rg" d={`M${pt(P.p(XR, h.top - 190, h.z0))}L${pt(P.p(XR, h.top - 190, h.z1))}`} fill="none" stroke={INK} strokeWidth={1.1 * r} strokeOpacity={line(0.14)} />);
  if (hsh(h.z0, 13) > 0.5) {
    const cz = mix(h.z0, h.z1, 0.3 + 0.4 * hsh(h.z0, 17));
    const cx = s * (LANE + 110);
    els.push(<path key="chim" d={quad(P, [[cx, h.top - 120, cz], [cx, h.top - 250, cz], [cx, h.top - 250, cz + 40], [cx, h.top - 120, cz + 40]])} fill={mixHex("#2A2119", HAZE, fz * 0.75)} stroke={DARK} strokeWidth={1.2 * r} />);
  }
  // the party wall line, the storey lines (cream, low)
  els.push(
    <path
      key="ln"
      d={`M${pt(P.p(X0, 0, h.z0))}L${pt(P.p(X0, FLOOR_Y[1], h.z0))}M${pt(P.p(XJ, FLOOR_Y[1], h.z0))}L${pt(P.p(XJ, h.top, h.z0))}M${pt(P.p(XJ, FLOOR_Y[2], h.z0))}L${pt(P.p(XJ, FLOOR_Y[2], h.z1))}M${pt(P.p(XJ, FLOOR_Y[1] - 4, h.z0))}L${pt(P.p(XJ, FLOOR_Y[1] - 4, h.z1))}`}
      fill="none"
      stroke={INK}
      strokeWidth={1.3 * r}
      strokeOpacity={line(0.2)}
    />,
  );
  // the door (ground storey): a dark recess with its reveal and a step
  const dz0 = mix(h.z0 + 30, h.z1 - 110, h.door);
  const dz1 = dz0 + 72;
  els.push(<path key="dr" d={quad(P, [[X0, 0, dz0], [X0, -186, dz0], [X0, -186, dz1], [X0, 0, dz1]])} fill={mixHex(PANE, HAZE, fz * 0.7)} stroke={INK} strokeWidth={1.2 * r} strokeOpacity={line(0.22)} />);
  els.push(<path key="drv" d={quad(P, [[X0, 0, dz1], [X0, -186, dz1], [X0 - s * 14, -186, dz1], [X0 - s * 14, 0, dz1]])} fill={mixHex("#3B3126", HAZE, fz * 0.7)} />);
  // the windows: two per upper storey, one on the ground storey; panes dark (or dimly lit), a cream frame, glazing
  // bars, the reveal on the far side, a sill (a thin box)
  const wins: { X: number; y0: number; y1: number; z0: number; z1: number; lit: boolean }[] = [];
  const span = h.z1 - h.z0;
  const gz = dz0 > h.z0 + span / 2 ? h.z0 + span * 0.22 : h.z1 - span * 0.42;
  wins.push({ X: X0, y0: -150, y1: -70, z0: gz, z1: gz + 84, lit: false });
  for (const [k, y] of [[0, FLOOR_Y[1]], [1, FLOOR_Y[2]]] as const) {
    for (const t of [0.18, 0.6]) {
      const z0 = h.z0 + span * t;
      wins.push({ X: XJ, y0: y - 170, y1: y - 60, z0, z1: z0 + 70, lit: h.lit.includes(k) && t === 0.18 });
    }
  }
  wins.forEach((w, i) => {
    const glow = w.lit ? 1 : 0;
    const paneCol = glow ? mixHex("#8A7654", HAZE, fz * 0.4) : mixHex(PANE, HAZE, fz * 0.7);
    els.push(
      <g key={`w${i}`}>
        <path d={quad(P, [[w.X, w.y1, w.z0], [w.X, w.y0, w.z0], [w.X, w.y0, w.z1], [w.X, w.y1, w.z1]])} fill={paneCol} stroke={INK} strokeWidth={1.3 * r} strokeOpacity={line(0.26)} />
        {/* the reveal (the recess's far side, lit by nothing: a mid umber) */}
        <path d={quad(P, [[w.X, w.y1, w.z1], [w.X, w.y0, w.z1], [w.X - s * 9, w.y0, w.z1], [w.X - s * 9, w.y1, w.z1]])} fill={mixHex("#3E3327", HAZE, fz * 0.7)} />
        <path
          d={`M${pt(P.p(w.X, (w.y0 + w.y1) / 2, w.z0))}L${pt(P.p(w.X, (w.y0 + w.y1) / 2, w.z1))}M${pt(P.p(w.X, w.y0, (w.z0 + w.z1) / 2))}L${pt(P.p(w.X, w.y1, (w.z0 + w.z1) / 2))}`}
          fill="none"
          stroke={glow ? "#3A2E22" : INK}
          strokeWidth={1.1 * r}
          strokeOpacity={glow ? 0.8 : line(0.16)}
        />
        {/* the sill: a thin slab standing out of the front (its top seen when below the eye, its underside above) */}
        <path d={quad(P, [[w.X, w.y1, w.z0 - 6], [w.X + s * 8, w.y1, w.z0 - 6], [w.X + s * 8, w.y1, w.z1 + 6], [w.X, w.y1, w.z1 + 6]])} fill={mixHex("#4B3E30", HAZE, fz * 0.7)} stroke={DARK} strokeWidth={1 * r} />
      </g>,
    );
  });
  void uid;
  return <g>{els}</g>;
};

// ---------------------------------------------------------------------------
// THE SETTS: courses across the lane, compressing toward the horizon; joints converge on the VP; the lamp's pool
// lifts the stones round him (a faint cream glint on each), the far ones sink into the haze
// ---------------------------------------------------------------------------
const Setts: React.FC<{ P: Persp; uid: string; pool: [number, number] }> = ({ P, uid, pool }) => {
  const course = 24;
  const w = 38;
  const zA = Math.max(-420, P.zNear);
  let cross = "";
  let joints = "";
  let glint = "";
  const tones: React.ReactNode[] = [];
  let row = 0;
  let lastY = Infinity;
  for (let Z = zA - (((zA % course) + course) % course); Z < Z_FAR; Z += course, row++) {
    if (Z < zA) continue;
    const yA = P.p(0, 0, Z)[1];
    const yB = P.p(0, 0, Z + course)[1];
    // stop the joints where a course is under ~2.2 world px (it would only shimmer): the haze takes over
    if (Math.abs(yA - yB) * 1 < 1.6) break;
    if (Math.abs(yA - lastY) < 0.5) continue;
    lastY = yA;
    cross += `M${pt(P.p(-LANE, 0, Z))}L${pt(P.p(LANE, 0, Z))}`;
    const off = (row % 2) * w * 0.5 + hsh(row, 2) * 6;
    for (let X = -LANE + off; X < LANE; X += w) {
      joints += `M${pt(P.p(X, 0, Z))}L${pt(P.p(X, 0, Z + course))}`;
      // the glint on the stone's far half, inside the lamp's pool
      const d = Math.hypot((X + w / 2 - pool[0]) / 260, (Z + course / 2 - pool[1]) / 240);
      if (d < 1) {
        const a = P.p(X + 6, 0, Z + course * 0.62);
        const b = P.p(X + w - 8, 0, Z + course * 0.62);
        glint += `M${pt(a)}L${pt(b)}`;
      }
    }
  }
  // the lane's tone: lifted in the pool, sinking into the haze with distance
  const bands = 12;
  for (let i = 0; i < bands; i++) {
    const za = mix(zA, Z_FAR, Math.pow(i / bands, 1.8));
    const zb = mix(zA, Z_FAR, Math.pow((i + 1) / bands, 1.8));
    tones.push(<path key={i} d={quad(P, [[-LANE, 0, za], [LANE, 0, za], [LANE, 0, zb], [-LANE, 0, zb]])} fill={mixHex(SETT, HAZE, fog((za + zb) / 2) * 0.9)} />);
  }
  const pc = P.p(pool[0], 0, pool[1]);
  const prx = 300 * P.r(pool[1]);
  const pry = Math.max(2, (P.p(pool[0], 0, pool[1] - 260)[1] - P.p(pool[0], 0, pool[1] + 260)[1]) / 2);
  const r0 = P.r(0);
  return (
    <g>
      {tones}
      <defs>
        <radialGradient id={`${uid}-pool`}>
          <stop offset="0" stopColor="#D9C9A2" stopOpacity={0.16} />
          <stop offset="0.55" stopColor="#D9C9A2" stopOpacity={0.07} />
          <stop offset="1" stopColor="#D9C9A2" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={pc[0]} cy={pc[1]} rx={prx} ry={pry} fill={`url(#${uid}-pool)`} />
      <path d={cross} fill="none" stroke={DARK} strokeWidth={1.9 * r0} strokeOpacity={0.55} />
      <path d={joints} fill="none" stroke={DARK} strokeWidth={1.6 * r0} strokeOpacity={0.5} />
      <path d={glint} fill="none" stroke={INK} strokeWidth={1.1 * r0} strokeOpacity={0.13} strokeLinecap="round" />
    </g>
  );
};

/** the whole street behind the man: the sky's sliver between the eaves, the far haze, the houses (far first), the
 *  setts and the lamp's pool (`pool` = [X, Z] on the setts) */
export const Street: React.FC<{ P: Persp; uid: string; pool: [number, number] }> = ({ P, uid, pool }) => {
  const order = [...HOUSES].sort((a, b) => b.z0 - a.z0);
  // the far end: a haze wall at Z_FAR (the lane closes in mist), lighter round the vanishing point
  const vp = P.p(0, -215, Z_FAR);
  const r = P.r(Z_FAR);
  return (
    <g>
      <path d={quad(P, [[-3000, -2600, Z_FAR], [3000, -2600, Z_FAR], [3000, 0, Z_FAR], [-3000, 0, Z_FAR]])} fill={HAZE} />
      <defs>
        <radialGradient id={`${uid}-hz`}>
          <stop offset="0" stopColor="#6E5F4A" stopOpacity={0.32} />
          <stop offset="1" stopColor="#7A6A52" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={vp[0]} cy={vp[1]} rx={900 * r} ry={520 * r} fill={`url(#${uid}-hz)`} />
      {order.map((h, i) => (
        <HouseEl key={i} P={P} h={h} uid={`${uid}-h${i}`} />
      ))}
      <Setts P={P} uid={`${uid}-st`} pool={pool} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// V3: THE LANE INSIDE THE CLIP'S MEDIUM (pandemicAir.tsx, palette A, mood night). The same houses, setts, lamp pool
// and geometry as Street above (which stays the delivered picture), in local night colours (warm umber plaster and
// stone) fogged by their distance into the dark teal air; cream lines fade with the fog; the lamp lifts the
// right-hand fronts and the setts round him; the sky between the eaves and the lane's far end are the air itself.
// ---------------------------------------------------------------------------
type AirTone = (hex: string, Z: number, height?: number) => string;
const AIR_LOCAL = {
  front: "#3A3229",
  frontLit: "#5E5242",
  under: "#2C2620",
  roof: "#302A23",
  chimney: "#3A3229",
  pane: "#211C17",
  paneLit: "#B8A47E",
  reveal: "#4C4134",
  door: "#241E18",
  doorReveal: "#4A3F32",
  sill: "#5C4E3D",
  sett: "#41392F",
  line: "#211B15",
  cream: "#E9DDBF",
};
const HouseAir: React.FC<{ P: Persp; h: House; tone: AirTone; fogOf: (Z: number) => number }> = ({ P, h, tone, fogOf }) => {
  const s = h.side;
  const X0 = s * LANE;
  const XJ = s * (LANE - h.jetty);
  const zm = (h.z0 + h.z1) / 2;
  const fz = fogOf(zm);
  const L = AIR_LOCAL;
  const lamp = s === 1 ? c01(1 - Math.max(0, h.z0) / 900) : 0;
  const base = tone(mixHex(L.front, L.frontLit, lamp), zm, 200);
  const upper = tone(mixHex(L.front, L.frontLit, lamp * 0.7), zm, 500);
  const line = (a: number) => a * (1 - fz);
  const lineC = tone(L.line, zm, 300);
  const r = P.r(zm);
  const els: React.ReactNode[] = [];
  els.push(<path key="g" d={quad(P, [[X0, 0, h.z0], [X0, FLOOR_Y[1], h.z0], [X0, FLOOR_Y[1], h.z1], [X0, 0, h.z1]])} fill={base} />);
  if (h.jetty > 0) {
    els.push(<path key="ju" d={quad(P, [[X0, FLOOR_Y[1], h.z0], [XJ, FLOOR_Y[1], h.z0], [XJ, FLOOR_Y[1], h.z1], [X0, FLOOR_Y[1], h.z1]])} fill={tone(L.under, zm, 225)} stroke={lineC} strokeWidth={0.9 * r} />);
  }
  els.push(<path key="u" d={quad(P, [[XJ, FLOOR_Y[1], h.z0], [XJ, h.top, h.z0], [XJ, h.top, h.z1], [XJ, FLOOR_Y[1], h.z1]])} fill={upper} />);
  const XE = s * (LANE - h.jetty - 26);
  els.push(<path key="ev" d={quad(P, [[XJ, h.top, h.z0], [XE, h.top - 8, h.z0], [XE, h.top - 8, h.z1], [XJ, h.top, h.z1]])} fill={tone(L.under, zm, 640)} stroke={lineC} strokeWidth={0.8 * r} />);
  const XR = s * (LANE + 150);
  els.push(<path key="rf" d={quad(P, [[XE, h.top - 8, h.z0], [XR, h.top - 190, h.z0], [XR, h.top - 190, h.z1], [XE, h.top - 8, h.z1]])} fill={tone(L.roof, zm, 760)} stroke={lineC} strokeWidth={0.8 * r} />);
  // the ridge catches a little of the sky's light: a cream rim
  els.push(<path key="rg" d={`M${pt(P.p(XR, h.top - 190, h.z0))}L${pt(P.p(XR, h.top - 190, h.z1))}`} fill="none" stroke={L.cream} strokeWidth={1.1 * r} strokeOpacity={line(0.22)} />);
  if (hsh(h.z0, 13) > 0.5) {
    const cz = mix(h.z0, h.z1, 0.3 + 0.4 * hsh(h.z0, 17));
    const cx = s * (LANE + 110);
    els.push(<path key="chim" d={quad(P, [[cx, h.top - 120, cz], [cx, h.top - 250, cz], [cx, h.top - 250, cz + 40], [cx, h.top - 120, cz + 40]])} fill={tone(L.chimney, cz, 850)} stroke={lineC} strokeWidth={0.8 * r} />);
  }
  els.push(
    <path
      key="ln"
      d={`M${pt(P.p(X0, 0, h.z0))}L${pt(P.p(X0, FLOOR_Y[1], h.z0))}M${pt(P.p(XJ, FLOOR_Y[1], h.z0))}L${pt(P.p(XJ, h.top, h.z0))}M${pt(P.p(XJ, FLOOR_Y[2], h.z0))}L${pt(P.p(XJ, FLOOR_Y[2], h.z1))}M${pt(P.p(XJ, FLOOR_Y[1] - 4, h.z0))}L${pt(P.p(XJ, FLOOR_Y[1] - 4, h.z1))}`}
      fill="none"
      stroke={L.cream}
      strokeWidth={1.1 * r}
      strokeOpacity={line(0.14 + 0.1 * lamp)}
    />,
  );
  const dz0 = mix(h.z0 + 30, h.z1 - 110, h.door);
  const dz1 = dz0 + 72;
  els.push(<path key="dr" d={quad(P, [[X0, 0, dz0], [X0, -186, dz0], [X0, -186, dz1], [X0, 0, dz1]])} fill={tone(L.door, dz0, 90)} stroke={L.cream} strokeWidth={1 * r} strokeOpacity={line(0.16)} />);
  els.push(<path key="drv" d={quad(P, [[X0, 0, dz1], [X0, -186, dz1], [X0 - s * 14, -186, dz1], [X0 - s * 14, 0, dz1]])} fill={tone(L.doorReveal, dz1, 90)} />);
  const wins: { X: number; y0: number; y1: number; z0: number; z1: number; lit: boolean }[] = [];
  const span = h.z1 - h.z0;
  const gz = dz0 > h.z0 + span / 2 ? h.z0 + span * 0.22 : h.z1 - span * 0.42;
  wins.push({ X: X0, y0: -150, y1: -70, z0: gz, z1: gz + 84, lit: false });
  for (const [k, y] of [[0, FLOOR_Y[1]], [1, FLOOR_Y[2]]] as const) {
    for (const t of [0.18, 0.6]) {
      const z0 = h.z0 + span * t;
      wins.push({ X: XJ, y0: y - 170, y1: y - 60, z0, z1: z0 + 70, lit: h.lit.includes(k) && t === 0.18 });
    }
  }
  wins.forEach((w, i) => {
    const hgt = -(w.y0 + w.y1) / 2;
    // a lit window glows through the air (its light is less fogged than the wall)
    const paneCol = w.lit ? mixHex(L.paneLit, tone(L.paneLit, w.z0, hgt), 0.45) : tone(L.pane, w.z0, hgt);
    els.push(
      <g key={`w${i}`}>
        <path d={quad(P, [[w.X, w.y1, w.z0], [w.X, w.y0, w.z0], [w.X, w.y0, w.z1], [w.X, w.y1, w.z1]])} fill={paneCol} stroke={L.cream} strokeWidth={1.1 * r} strokeOpacity={line(0.2)} />
        <path d={quad(P, [[w.X, w.y1, w.z1], [w.X, w.y0, w.z1], [w.X - s * 9, w.y0, w.z1], [w.X - s * 9, w.y1, w.z1]])} fill={tone(L.reveal, w.z1, hgt)} />
        <path
          d={`M${pt(P.p(w.X, (w.y0 + w.y1) / 2, w.z0))}L${pt(P.p(w.X, (w.y0 + w.y1) / 2, w.z1))}M${pt(P.p(w.X, w.y0, (w.z0 + w.z1) / 2))}L${pt(P.p(w.X, w.y1, (w.z0 + w.z1) / 2))}`}
          fill="none"
          stroke={w.lit ? "#4A3C2C" : L.cream}
          strokeWidth={1 * r}
          strokeOpacity={w.lit ? 0.7 : line(0.12)}
        />
        <path d={quad(P, [[w.X, w.y1, w.z0 - 6], [w.X + s * 8, w.y1, w.z0 - 6], [w.X + s * 8, w.y1, w.z1 + 6], [w.X, w.y1, w.z1 + 6]])} fill={tone(L.sill, w.z0, hgt)} stroke={lineC} strokeWidth={0.7 * r} />
      </g>,
    );
  });
  return <g>{els}</g>;
};
const SettsAir: React.FC<{ P: Persp; uid: string; pool: [number, number]; tone: AirTone; fogOf: (Z: number) => number; shadow: string }> = ({ P, uid, pool, tone, fogOf }) => {
  const course = 24;
  const w = 38;
  const zA = Math.max(-420, P.zNear);
  const L = AIR_LOCAL;
  const groups: Record<string, string> = {};
  let glint = "";
  let row = 0;
  let lastY = Infinity;
  for (let Z = zA - (((zA % course) + course) % course); Z < Z_FAR; Z += course, row++) {
    if (Z < zA) continue;
    const yA = P.p(0, 0, Z)[1];
    const yB = P.p(0, 0, Z + course)[1];
    if (Math.abs(yA - yB) * 1 < 1.6) break;
    if (Math.abs(yA - lastY) < 0.5) continue;
    lastY = yA;
    const key = `${Math.round(fogOf(Z) * 20)}`;
    let d = `M${pt(P.p(-LANE, 0, Z))}L${pt(P.p(LANE, 0, Z))}`;
    const off = (row % 2) * w * 0.5 + hsh(row, 2) * 6;
    for (let X = -LANE + off; X < LANE; X += w) {
      d += `M${pt(P.p(X, 0, Z))}L${pt(P.p(X, 0, Z + course))}`;
      const dd = Math.hypot((X + w / 2 - pool[0]) / 260, (Z + course / 2 - pool[1]) / 240);
      if (dd < 1) glint += `M${pt(P.p(X + 6, 0, Z + course * 0.62))}L${pt(P.p(X + w - 8, 0, Z + course * 0.62))}`;
    }
    groups[key] = (groups[key] ?? "") + d;
  }
  // the lane's tone: one continuous gradient by distance (no bands), lifted in the pool
  const N = 18;
  const tones: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const za = mix(zA, Z_FAR, Math.pow(i / N, 1.8));
    const zb = mix(zA, Z_FAR, Math.pow((i + 1) / N, 1.8));
    tones.push(<path key={i} d={quad(P, [[-LANE, 0, za], [LANE, 0, za], [LANE, 0, zb + 2], [-LANE, 0, zb + 2]])} fill={tone(L.sett, (za + zb) / 2, 0)} />);
  }
  const pc = P.p(pool[0], 0, pool[1]);
  const prx = 300 * P.r(pool[1]);
  const pry = Math.max(2, (P.p(pool[0], 0, pool[1] - 260)[1] - P.p(pool[0], 0, pool[1] + 260)[1]) / 2);
  const r0 = P.r(0);
  return (
    <g>
      {tones}
      <defs>
        <radialGradient id={`${uid}-pool`}>
          <stop offset="0" stopColor="#E3D3AE" stopOpacity={0.26} />
          <stop offset="0.55" stopColor="#E3D3AE" stopOpacity={0.1} />
          <stop offset="1" stopColor="#E3D3AE" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={pc[0]} cy={pc[1]} rx={prx} ry={pry} fill={`url(#${uid}-pool)`} />
      {Object.entries(groups).map(([k, d]) => (
        <path key={k} d={d} fill="none" stroke={tone(L.line, 0, 0)} strokeWidth={1.3 * r0} strokeOpacity={0.55 * (1 - Number(k) / 20)} />
      ))}
      <path d={glint} fill="none" stroke={L.cream} strokeWidth={1.1 * r0} strokeOpacity={0.2} strokeLinecap="round" />
    </g>
  );
};
/** Street in the medium: `tone(hex, Z, height)` fogs a local colour by the distance of depth Z (pandemicAir fogHex),
 *  `fogOf(Z)` the fog amount there */
export const AirStreet: React.FC<{ P: Persp; uid: string; pool: [number, number]; tone: AirTone; fogOf: (Z: number) => number; shadow: string }> = ({ P, uid, pool, tone, fogOf, shadow }) => {
  const order = [...HOUSES].sort((a, b) => b.z0 - a.z0);
  return (
    <g>
      {order.map((h, i) => (
        <HouseAir key={i} P={P} h={h} tone={tone} fogOf={fogOf} />
      ))}
      <SettsAir P={P} uid={`${uid}-st`} pool={pool} tone={tone} fogOf={fogOf} shadow={shadow} />
    </g>
  );
};
