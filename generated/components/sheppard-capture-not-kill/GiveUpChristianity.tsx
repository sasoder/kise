// ---------------------------------------------------------------------------
// GiveUpChristianity (file 83_GiveUpChristianity; Dwarkesh Patel with Si
// Sheppard, "Capture, not kill"). Dwarkesh map style, a non-map "page" cut: one
// tall engraved cross-section plate on the umber page. Opaque 1080x1920.
//
// CHECK LINE: "Even with alien ships overhead, you could not get the cross off
// the church: a people's faith is rooted far too deep to swap it for a creed
// that fights better."
//
// THE MOTION (one move): the church stands with its ORANGE cross at the middle
// of the frame while engraved flying discs slide in overhead; the villagers'
// two ropes go taut on "give up" and they heave, the cross does not move; the
// camera follows the building down through the ground line into the cutaway,
// where the church's foundations go on as thick ORANGE roots under every house
// and grave down to the bedrock; then it rises back to hold ships, church and
// the top of the roots in one picture, the ropes slack, the team standing down.
// Orange = what the home side holds to: the cross and what is under it. No text.
//
// DURATION: sequence 83.333-93.427 s = 10.094 s x 23.976 = 242 frames (f0..f241).
// WORD -> FRAME: if 8 · we're 15 · fighting 19 · aliens 33 · from 42 · another
//   47 · planet 51 · give 63 · up 66 · Christianity 70 · because 81 · there's
//   93 · too 100 · much 103 · invested 109 · in terms of 122 · its 133 ·
//   morality 135 · and 144 · more 148 · effective 157 · combat 168 · skills 182
//   · will be 192 · derived 196 · from 205 · following 213 · some 224 · other
//   229 · faith 232.
// World px: x = 0 the tower's axis, y = 0 the ground the church stands on, the
// cut face of the earth begins at y = CUT.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, ACCENT_DEEP, DARK, INK, LAND, hash, makeRng, mixColor, pchip, type P2 } from "../kits/maps/incaShared";
import { FPS, TexcocoPage, WorldSvg, track } from "../kits/maps/texcocoShared";
import { add, mix, mix2, mul, norm, sub, vlen } from "../kits/maps/stringsMotion";

export { FPS };
export const DURATION = 242;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---------------------------------------------------------------------------
// THE ENGRAVER'S HELPERS (copied from texcocoFigures, where they are private)
// ---------------------------------------------------------------------------
const DEEP = "#D3C5A2";
const HAIR = "#8C7F60";
const EARTH = mixColor(LAND, DARK, 0.42);
const P = (v: P2) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`;
const OUT = { stroke: DARK, strokeWidth: 2.3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const ln = (w = 1.2, a = 0.8, c: string = DARK) => ({ fill: "none", stroke: c, strokeWidth: w, strokeOpacity: a, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });
type Seg = [P2, P2];
type St = [P2, number];
const segD = (segs: Seg[]) => segs.map(([a, b]) => `M${P(a)}L${P(b)}`).join("");
const hatchSegs = (x0: number, y0: number, x1: number, y1: number, ang: number, gap: number, seed: number, rag = 0.28): Seg[] => {
  const r = (ang * Math.PI) / 180;
  const dx = Math.cos(r);
  const dy = Math.sin(r);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const R = Math.hypot(x1 - x0, y1 - y0) / 2;
  const out: Seg[] = [];
  let i = 0;
  for (let o = -R; o <= R; o += gap, i++) {
    const oo = o + (hash(i, seed) - 0.5) * gap * 0.5;
    const px = cx - dy * oo;
    const py = cy + dx * oo;
    let t0 = -R;
    let t1 = R;
    if (Math.abs(dx) > 1e-6) {
      const a = (x0 - px) / dx;
      const b = (x1 - px) / dx;
      t0 = Math.max(t0, Math.min(a, b));
      t1 = Math.min(t1, Math.max(a, b));
    } else if (px < x0 || px > x1) continue;
    if (Math.abs(dy) > 1e-6) {
      const a = (y0 - py) / dy;
      const b = (y1 - py) / dy;
      t0 = Math.max(t0, Math.min(a, b));
      t1 = Math.min(t1, Math.max(a, b));
    } else if (py < y0 || py > y1) continue;
    const span = t1 - t0;
    if (span < 3) continue;
    t0 += hash(i, seed + 7) * rag * span;
    t1 -= hash(i, seed + 13) * rag * span;
    out.push([
      [px + dx * t0, py + dy * t0],
      [px + dx * t1, py + dy * t1],
    ]);
  }
  return out;
};
const hatchD = (x0: number, y0: number, x1: number, y1: number, ang: number, gap: number, seed: number, rag = 0.28) => segD(hatchSegs(x0, y0, x1, y1, ang, gap, seed, rag));
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
/** a tapered limb through stations [point, width]: one smooth outlined form */
const limbD = (st: St[]) => {
  const n = st.length;
  const L: P2[] = [];
  const R: P2[] = [];
  let last: P2 = [0, 1];
  for (let i = 0; i < n; i++) {
    const a = st[Math.max(0, i - 1)][0];
    const b = st[Math.min(n - 1, i + 1)][0];
    const dv = sub(b, a);
    const u = vlen(dv) > 0.5 ? norm(dv) : last;
    last = u;
    const nr: P2 = [-u[1], u[0]];
    const h = st[i][1] / 2;
    L.push(add(st[i][0], mul(nr, h)));
    R.push(add(st[i][0], mul(nr, -h)));
  }
  const d0 = sub(st[1][0], st[0][0]);
  const d1 = sub(st[n - 1][0], st[n - 2][0]);
  const u0: P2 = vlen(d0) > 0.5 ? norm(d0) : [0, 1];
  const u1: P2 = vlen(d1) > 0.5 ? norm(d1) : [0, 1];
  return smoothClosed([...L, add(st[n - 1][0], mul(u1, st[n - 1][1] * 0.42)), ...R.reverse(), add(st[0][0], mul(u0, -st[0][1] * 0.42))]);
};
/** bracelet shading: short curved strokes round the limb's shaded (lower right) side */
const braceletD = (a: P2, b: P2, wa: number, wb: number, seed: number, gap = 3.1, reach = 1) => {
  const L = vlen(sub(b, a));
  if (L < 6) return "";
  const u = norm(sub(b, a));
  let n: P2 = [-u[1], u[0]];
  if (n[0] + n[1] * 0.6 < 0) n = [-n[0], -n[1]];
  let d = "";
  let i = 0;
  for (let t = gap * 0.5; t < L; t += gap, i++) {
    const tt = t / L;
    const c = mix2(a, b, tt);
    const w = mix(wa, wb, tt);
    const p0 = add(c, mul(n, w * (0.5 - reach * (0.44 - 0.2 * hash(i, seed)))));
    const p1 = add(c, mul(n, w / 2 - 0.7));
    d += `M${P(p0)}Q${P(add(mix2(p0, p1, 0.5), mul(u, 1.7)))} ${P(p1)}`;
  }
  return d;
};
const ik2 = (S: P2, W: P2, L1: number, L2: number, hint: P2) => {
  let d = sub(W, S);
  let L = vlen(d);
  const maxL = L1 + L2 - 0.5;
  let w = W;
  if (L > maxL) {
    w = add(S, mul(d, maxL / L));
    d = sub(w, S);
    L = maxL;
  }
  if (L < 1) return { mid: add(S, [0, L1]), end: w };
  const u = mul(d, 1 / L);
  const a = (L1 * L1 - L2 * L2 + L * L) / (2 * L);
  const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const n: P2 = [-u[1], u[0]];
  const b = Math.max(-1, Math.min(1, (n[0] * hint[0] + n[1] * hint[1]) * 3));
  return { mid: add(S, add(mul(u, a), mul(n, h * b))), end: w };
};
const Cased: React.FC<{ id: string; r?: number; children?: React.ReactNode }> = ({ id, r = 1.6, children }) => (
  <>
    <filter id={id} x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
      <feMorphology in="SourceAlpha" operator="dilate" radius={r} result="fat" />
      <feGaussianBlur in="fat" stdDeviation={r * 0.45} result="soft" />
      <feFlood floodColor={DARK} floodOpacity={0.62} />
      <feComposite in2="soft" operator="in" result="case" />
      <feMerge>
        <feMergeNode in="case" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <g filter={`url(#${id})`}>{children}</g>
  </>
);
const rect = (x: number, y: number, w: number, h: number) => `M${x},${y}h${w}v${h}h${-w}Z`;
/** a pointed lancet: centre x, half-width w, sill yb, apex yt */
const lancet = (x: number, w: number, yb: number, yt: number) => {
  const ys = yt + w * 2.1;
  return `M${x - w},${yb}L${x - w},${ys}Q${x - w},${yt + w * 0.7} ${x},${yt}Q${x + w},${yt + w * 0.7} ${x + w},${ys}L${x + w},${yb}Z`;
};

// ---------------------------------------------------------------------------
// LAYOUT (world px)
// ---------------------------------------------------------------------------
/** the cut face of the earth begins here (the turf between 0 and CUT is the foreground the people stand on) */
const CUT = 26;
const X_L = -1000;
const X_R = 1000;
const TOWER_TOP = -428;
const APEX = -725;
/** the cross: foot, the junction of its arms, its top */
const CROSS = { foot: -728, arm: -818, top: -858, span: 41, t: 19 };
/** where the ropes are looped (just under the arms) */
const LOOP_Y = -800;

// ---------------------------------------------------------------------------
// SKY: the engraver's ruled night, a few stars
// ---------------------------------------------------------------------------
const SKY = (() => {
  const rnd = makeRng(71);
  const bands: string[] = ["", "", "", ""];
  for (let y = -1900, i = 0; y < -560; y += 13, i++) {
    const b = Math.min(3, Math.floor(((y + 1900) / 1340) * 4));
    let x = X_L + rnd() * 80;
    while (x < X_R) {
      const l = 90 + rnd() * 330;
      bands[b] += `M${x.toFixed(0)},${(y + (rnd() - 0.5) * 1.6).toFixed(1)}h${l.toFixed(0)}`;
      x += l + 14 + rnd() * 70 * (1 + b);
    }
  }
  const stars = Array.from({ length: 64 }, (_, i) => {
    const x = X_L + 120 + rnd() * (X_R - X_L - 240);
    const y = -1880 + rnd() * 1250;
    return { x, y, r: (i % 6 === 0 ? 3.2 : 1.5) + 1.6 * rnd() * rnd() };
  }).filter((s) => !(Math.abs(s.x) < 95 && s.y > -900));
  return { bands, stars };
})();
const Sky = React.memo(() => (
  <g>
    {SKY.bands.map((d, i) => (
      <path key={i} d={d} {...ln(1.1, [0.2, 0.15, 0.1, 0.055][i], INK)} />
    ))}
    {SKY.stars.map((s, i) => (
      <g key={i}>
        <circle cx={s.x} cy={s.y} r={s.r} fill={INK} opacity={0.85} />
      </g>
    ))}
  </g>
));

// ---------------------------------------------------------------------------
// THE VILLAGE AT GROUND LEVEL: cottages (set back), the church, the graves
// ---------------------------------------------------------------------------
const Cottage: React.FC<{ x: number; w: number; h: number; tone: number; seed: number; chimney?: number }> = ({ x, w, h, tone, seed, chimney = 0.72 }) => {
  const wall = mixColor(LAND, INK, tone);
  const thatch = mixColor(LAND, DEEP, tone * 0.82);
  const rh = h * 0.95;
  const ROOF = `M${x - 9},${-h + 4}Q${x - 2},${-h - rh * 0.8} ${x + w * 0.16},${-h - rh}L${x + w * 0.84},${-h - rh}Q${x + w + 2},${-h - rh * 0.8} ${x + w + 9},${-h + 4}Z`;
  const cx = x + w * chimney;
  return (
    <g>
      <path d={rect(cx - 8, -h - rh - 22, 16, 34) + rect(x, -h, w, h) + ROOF} {...ln(8, 0.5)} />
      <path d={rect(cx - 8, -h - rh - 22, 16, 34)} fill={wall} {...OUT} />
      <path d={rect(x, -h, w, h)} fill={wall} {...OUT} />
      <path d={hatchD(x + w * 0.62, -h, x + w, 0, 112, 5, seed)} {...ln(1, 0.5)} />
      <path d={rect(x + w * 0.2, -h * 0.62, w * 0.16, h * 0.62)} fill={DARK} opacity={0.8} />
      <path d={rect(x + w * 0.56, -h * 0.66, w * 0.18, h * 0.3)} fill={DARK} opacity={0.8} />
      <clipPath id={`cot-${seed}`}>
        <path d={ROOF} />
      </clipPath>
      <path d={ROOF} fill={thatch} {...OUT} />
      <g clipPath={`url(#cot-${seed})`}>
        <path d={hatchD(x - 10, -h - rh, x + w + 10, -h + 4, 82, 4.2, seed + 1, 0.2)} {...ln(1.05, 0.6)} />
        <path d={hatchD(x + w * 0.5, -h - rh, x + w + 10, -h + 4, 100, 4.6, seed + 2, 0.3)} {...ln(1, 0.5)} />
      </g>
    </g>
  );
};

const SPIRE_D = `M-74,${TOWER_TOP}L-74,${TOWER_TOP - 12}L-70,${TOWER_TOP - 12}L-5,${APEX}Q0,${APEX - 6} 5,${APEX}L70,${TOWER_TOP - 12}L74,${TOWER_TOP - 12}L74,${TOWER_TOP}Z`;
const CROSS_D = (() => {
  const { foot, arm, top, span, t } = CROSS;
  const h = t / 2;
  return `M${-h * 1.25},${foot}L${-h},${arm + h}L${-span},${arm + h}L${-span},${arm - h}L${-h},${arm - h}L${-h},${top}L${h},${top}L${h},${arm - h}L${span},${arm - h}L${span},${arm + h}L${h},${arm + h}L${h * 1.25},${foot}Z`;
})();
const NAVE_ROOF = "M-342,-185L-324,-262L-85,-262L-85,-185Z";
const CHANCEL_ROOF = "M85,-150L85,-212L278,-212L300,-150Z";
const PARAPET = (() => {
  let d = `M-90,-410L-90,${TOWER_TOP - 6}`;
  for (let i = 0; i < 5; i++) {
    const x = -90 + i * 39.5;
    d += `L${x + 22},${TOWER_TOP - 6}`;
    if (i < 4) d += `L${x + 22},${TOWER_TOP + 5}L${x + 39.5},${TOWER_TOP + 5}L${x + 39.5},${TOWER_TOP - 6}`;
  }
  return `${d}L90,-410Z`;
})();
const COURSES = (() => {
  // broken stone courses on the tower and the walls
  const rnd = makeRng(19);
  let d = "";
  const run = (x0: number, x1: number, y0: number, y1: number, step: number) => {
    for (let y = y0 + step; y < y1 - 4; y += step) {
      let x = x0 + rnd() * 30;
      while (x < x1 - 12) {
        const l = Math.min(x1 - 6 - x, 14 + rnd() * 36);
        d += `M${x.toFixed(0)},${y}h${l.toFixed(0)}`;
        if (rnd() < 0.55) d += `M${(x + l * rnd()).toFixed(0)},${y}v${step}`;
        x += l + 10 + rnd() * 42;
      }
    }
  };
  run(-85, 85, -410, -14, 21);
  run(-330, -85, -185, -14, 21);
  run(85, 292, -150, -14, 21);
  return d;
})();
const slates = (x0: number, x1: number, y0: number, y1: number, seed: number) => {
  let d = "";
  for (let y = y0 + 11, r = 0; y < y1; y += 11, r++) {
    d += `M${x0},${y}H${x1}`;
    for (let x = x0 + (r % 2) * 7 + 4; x < x1; x += 14) d += `M${x + (hash(r, seed + x) - 0.5) * 2},${y - 11}v11`;
  }
  return d;
};
/** the church below the spire (static) */
const ChurchBody = React.memo(() => {
  const windows = [lancet(-196, 12, -52, -150), lancet(-140, 12, -52, -150), lancet(140, 11, -44, -122), lancet(192, 11, -44, -122), lancet(244, 11, -44, -122), lancet(0, 11, -196, -276), lancet(-259, 15, 0, -66)].join("");
  const BELFRY = lancet(0, 24, -312, -392);
  const butt = (x: number, top: number) => `M${x - 8},0L${x - 8},${top + 16}L${x},${top}L${x + 8},${top + 16}L${x + 8},0Z`;
  const BUTTS = butt(-330, -168) + butt(-222, -168) + butt(-100, -168) + butt(292, -134) + butt(166, -134);
  const PORCH = rect(-292, -92, 66, 92);
  const PORCH_ROOF = "M-300,-90L-259,-140L-218,-90Z";
  const SIL = rect(85, -150, 207, 150) + CHANCEL_ROOF + rect(-330, -185, 245, 185) + NAVE_ROOF + rect(-85, -410, 170, 410) + PARAPET + PORCH_ROOF;
  return (
    <g>
      <path d={SIL} {...ln(9, 0.55)} />
      {/* chancel */}
      <path d={rect(85, -150, 207, 150)} fill={INK} {...OUT} />
      <path d={hatchD(214, -150, 292, 0, 112, 5.2, 201)} {...ln(1.05, 0.5)} />
      <path d={hatchD(85, -150, 292, -132, 96, 3.4, 202, 0.15)} {...ln(1, 0.55)} />
      <clipPath id="ch-croof">
        <path d={CHANCEL_ROOF} />
      </clipPath>
      <path d={CHANCEL_ROOF} fill={HAIR} {...OUT} />
      <g clipPath="url(#ch-croof)">
        <path d={slates(85, 304, -212, -150, 5)} {...ln(1, 0.62)} />
        <path d={hatchD(190, -212, 304, -150, 118, 4, 203, 0.2)} {...ln(1, 0.45)} />
      </g>
      {/* nave */}
      <path d={rect(-330, -185, 245, 185)} fill={INK} {...OUT} />
      <path d={hatchD(-330, -185, -85, -166, 96, 3.4, 204, 0.15)} {...ln(1, 0.55)} />
      <path d={hatchD(-126, -185, -85, 0, 112, 5.2, 205)} {...ln(1.05, 0.42)} />
      <clipPath id="ch-nroof">
        <path d={NAVE_ROOF} />
      </clipPath>
      <path d={NAVE_ROOF} fill={HAIR} {...OUT} />
      <g clipPath="url(#ch-nroof)">
        <path d={slates(-345, -85, -262, -185, 6)} {...ln(1, 0.62)} />
        <path d={hatchD(-190, -262, -85, -185, 118, 4, 206, 0.2)} {...ln(1, 0.45)} />
      </g>
      {/* tower */}
      <path d={rect(-85, -410, 170, 410)} fill={INK} {...OUT} />
      <path d={PARAPET} fill={DEEP} {...OUT} />
      <path d={hatchD(22, -410, 85, 0, 114, 5, 207)} {...ln(1.1, 0.55)} />
      <path d={hatchD(52, -410, 85, 0, 66, 6.4, 208)} {...ln(1, 0.4)} />
      <path d={hatchD(-85, -410, 85, -396, 96, 3.2, 209, 0.15)} {...ln(1, 0.55)} />
      <path d="M-85,-298H85M-85,-292H85M-85,-176H85M-85,-170H85" {...ln(1.3, 0.7)} />
      <path d={COURSES} {...ln(0.9, 0.34)} />
      <path d={BUTTS} fill={DEEP} {...OUT} strokeWidth={2} />
      {/* plinth */}
      <path d={rect(-336, -13, 634, 13)} fill={DEEP} {...OUT} strokeWidth={2} />
      {/* porch */}
      <path d={PORCH} fill={INK} {...OUT} />
      <path d={hatchD(-250, -92, -226, 0, 112, 4.6, 210)} {...ln(1, 0.5)} />
      <path d={PORCH_ROOF} fill={HAIR} {...OUT} />
      <path d={hatchD(-300, -140, -218, -90, 60, 4.2, 211, 0.1)} {...ln(1, 0.5)} />
      {/* openings */}
      <path d={windows + BELFRY} fill={DARK} opacity={0.86} />
      <path d={windows + BELFRY} {...ln(1.6, 0.9)} />
      <path d="M-22,-378H22M-24,-364H24M-24,-350H24M-24,-336H24M-24,-322H24" {...ln(2.2, 0.75, DEEP)} />
      <path d="M-196,-140V-52M-140,-140V-52M140,-112V-44M192,-112V-44M244,-112V-44M0,-266V-196" {...ln(1.3, 0.55, DEEP)} />
    </g>
  );
});
/** the spire and the ORANGE cross; `lean` px = how far the cross is drawn over by the ropes (a hair) */
const Spire: React.FC<{ lean: number }> = ({ lean }) => {
  const sk = (Math.atan2(-lean, CROSS.arm - TOWER_TOP) * 180) / Math.PI;
  const { foot, arm, top, span, t } = CROSS;
  return (
    <g transform={`translate(0 ${TOWER_TOP}) skewX(${sk.toFixed(4)}) translate(0 ${-TOWER_TOP})`}>
      <path d={SPIRE_D} {...ln(9, 0.55)} />
      <clipPath id="ch-spire">
        <path d={SPIRE_D} />
      </clipPath>
      <path d={SPIRE_D} fill={INK} {...OUT} />
      <g clipPath="url(#ch-spire)">
        <path d={hatchD(4, APEX, 80, TOWER_TOP, 104, 4.6, 221, 0.2)} {...ln(1.05, 0.58)} />
        <path d={hatchD(26, APEX + 90, 80, TOWER_TOP, 62, 6, 222, 0.3)} {...ln(1, 0.4)} />
        <path d={[0.2, 0.4, 0.6, 0.8].map((v) => `M-80,${mix(TOWER_TOP - 12, APEX, v)}h160M-80,${mix(TOWER_TOP - 12, APEX, v) + 5}h160`).join("")} {...ln(1.1, 0.5)} />
        <path d={`M0,${APEX}L-2,${TOWER_TOP}`} {...ln(1, 0.4)} />
      </g>
      <path d={lancet(-16, 7, TOWER_TOP - 34, TOWER_TOP - 74)} fill={DARK} opacity={0.85} />
      <path d={`M-76,${TOWER_TOP - 12}H76`} {...ln(1.6, 0.8)} />
      {/* the cross */}
      <path d={CROSS_D} {...ln(11, 0.6)} />
      <clipPath id="ch-cross">
        <path d={CROSS_D} />
      </clipPath>
      <path d={CROSS_D} fill={ACCENT} {...OUT} strokeWidth={2.6} />
      <g clipPath="url(#ch-cross)">
        <path d={rect(2.5, top, t, foot - top) + rect(-span, arm + 2.5, span * 2, t)} fill={ACCENT_DEEP} opacity={0.9} />
        <path d={hatchD(1, top, t, foot, 118, 3.4, 231, 0.15) + hatchD(-span, arm + 1, span, arm + t, 62, 3.4, 232, 0.15)} {...ln(1, 0.55)} />
      </g>
      <circle cx={0} cy={APEX - 1} r={7.5} fill={DEEP} {...OUT} strokeWidth={2} />
      {/* the ropes' turns round the shaft */}
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${-t / 2 - 3},${LOOP_Y + 9 + i * 7}L${t / 2 + 3},${LOOP_Y + 1 + i * 7}`} stroke={DARK} strokeWidth={7} strokeLinecap="round" opacity={0.75} />
      ))}
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${-t / 2 - 3},${LOOP_Y + 9 + i * 7}L${t / 2 + 3},${LOOP_Y + 1 + i * 7}`} stroke={INK} strokeWidth={4.2} strokeLinecap="round" />
      ))}
    </g>
  );
};

const STONES: { x: number; y: number; w: number; h: number; tilt: number }[] = [
  { x: -548, y: 8, w: 30, h: 46, tilt: -5 },
  { x: -492, y: 17, w: 34, h: 54, tilt: 3 },
  { x: -436, y: 5, w: 28, h: 42, tilt: -2 },
  { x: -388, y: 19, w: 34, h: 52, tilt: 6 },
];
const Ground = React.memo(() => {
  const rnd = makeRng(33);
  let tufts = "";
  for (let i = 0; i < 260; i++) {
    const x = X_L + rnd() * (X_R - X_L);
    const y = 7 + rnd() * (CUT - 9);
    const l = 4 + rnd() * 6;
    tufts += `M${x.toFixed(0)},${y.toFixed(0)}l${(-2 + rnd() * 4).toFixed(1)},${(-l).toFixed(1)}`;
  }
  return (
    <g>
      <path d={rect(X_L, 0, X_R - X_L, CUT)} fill={mixColor(LAND, INK, 0.1)} />
      <path d={`M${X_L},0H${X_R}`} {...ln(1.6, 0.6, INK)} />
      <path d={tufts} {...ln(1.2, 0.4, INK)} />
      {STONES.map((s, i) => {
        const d = `M${-s.w / 2},0L${-s.w / 2},${-s.h + s.w / 2}Q${-s.w / 2},${-s.h} 0,${-s.h}Q${s.w / 2},${-s.h} ${s.w / 2},${-s.h + s.w / 2}L${s.w / 2},0Z`;
        return (
          <g key={i} transform={`translate(${s.x} ${s.y}) rotate(${s.tilt})`}>
            <path d={d} {...ln(7, 0.5)} />
            <path d={d} fill={DEEP} {...OUT} strokeWidth={2} />
            <path d={hatchD(1, -s.h, s.w / 2, 0, 110, 3.6, 240 + i)} {...ln(1, 0.55)} />
            <path d={`M${-s.w / 2 - 5},1h${s.w + 12}`} {...ln(1.4, 0.6)} />
          </g>
        );
      })}
    </g>
  );
});

// ---------------------------------------------------------------------------
// THE CUTAWAY: earth, bedrock, the graves, and the ORANGE foundations and roots
// ---------------------------------------------------------------------------
const ROCKS = (() => {
  const rnd = makeRng(905);
  const rocks: { d: string; cracks: string; cx: number; cy: number; rx: number; ry: number; row: number }[] = [];
  [1092, 1244, 1400].forEach((yy, row) => {
    for (let x = X_L + row * 60; x < X_R + 100; x += 150 + rnd() * 60) {
      const cx = x + rnd() * 30;
      const cy = yy + (rnd() - 0.5) * 70;
      const rx = 78 + rnd() * 50;
      const ry = 58 + rnd() * 40;
      const n = 7;
      const pts = Array.from({ length: n }, (_, i): P2 => {
        const a = (i / n) * Math.PI * 2 + rnd() * 0.5;
        const k = 0.78 + rnd() * 0.3;
        return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k];
      });
      const cracks = `M${P(mix2(pts[0], pts[3], 0.2))}L${P(mix2(pts[0], pts[3], 0.62))}L${P(mix2(pts[5], pts[2], 0.5))}M${P(mix2(pts[1], pts[4], 0.3))}L${P(mix2(pts[1], pts[5], 0.6))}`;
      rocks.push({ d: `M${pts.map(P).join("L")}Z`, cracks: cracks + hatchD(cx - rx * 0.1, cy, cx + rx * 0.62, cy + ry * 0.6, 62, 5, Math.round(cx)), cx, cy, rx, ry, row });
    }
  });
  return rocks;
})();
/** the bedrock blocks the main roots clamp: the top-row block nearest each x */
const GRIPPED = (() => {
  const top = ROCKS.filter((r) => r.row === 0);
  const used = new Set<number>();
  return [0, -255, 255, -490, 490].map((x) => {
    let best = -1;
    top.forEach((r, i) => {
      if (!used.has(i) && (best < 0 || Math.abs(r.cx - x) < Math.abs(top[best].cx - x))) best = i;
    });
    used.add(best);
    return top[best];
  });
})();
type Branch = { st: St[]; lvl: number };
const ROOTS = (() => {
  const rnd = makeRng(4107);
  const out: Branch[] = [];
  const FLOOR = 1010;
  const grow = (p: P2, ang: number, len: number, w0: number, lvl: number, target?: P2) => {
    const step = lvl === 0 ? 36 : 28;
    const n = Math.max(3, Math.round((target ? vlen(sub(target, p)) : len) / step));
    const st: St[] = [];
    const w1 = lvl >= 2 ? 1.4 : w0 * 0.2;
    let a = ang;
    let q = p;
    const ph = rnd() * 6;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const w = target ? mix(w0, Math.max(15, w0 * 0.4), t) : mix(w0, w1, Math.pow(t, 0.85));
      st.push([q, w]);
      if (i > 0 && i < n && lvl < 2 && rnd() < (lvl === 0 ? 0.4 : 0.1)) {
        const side = rnd() < 0.5 ? -1 : 1;
        let ca = a + side * (0.5 + 0.55 * rnd());
        if (Math.sin(ca) < 0.08) ca = a - side * (0.5 + 0.4 * rnd());
        if (Math.sin(ca) < 0.08) ca = Math.cos(ca) > 0 ? 0.1 : Math.PI - 0.1;
        grow(q, ca, len * (1 - t) * 0.72 + 50 + 70 * rnd(), w * (lvl === 0 ? 0.74 : 0.5), lvl + 1);
      }
      if (target) {
        // a main root: a gentle S down to the block it clamps
        const t1 = (i + 1) / n;
        const u = norm(sub(target, p));
        const nq = add(mix2(p, target, t1), mul([-u[1], u[0]], 24 * Math.sin(Math.PI * t1) * Math.sin(2.3 * Math.PI * t1 + ph)));
        a = Math.atan2(nq[1] - q[1], nq[0] - q[0]);
        q = nq;
        continue;
      }
      a += (rnd() - 0.5) * 0.5;
      a = mix(a, ang, 0.18);
      if (q[1] > FLOOR - 40) a = mix(a, Math.cos(a) >= 0 ? 0.1 : Math.PI - 0.1, 0.6);
      if (q[1] < CUT + 110 && Math.sin(a) < 0.15) a = Math.cos(a) >= 0 ? 0.25 : Math.PI - 0.25;
      q = add(q, [Math.cos(a) * step, Math.sin(a) * step]);
    }
    out.push({ st, lvl });
    return st[st.length - 1];
  };
  const deg = (v: number) => (v * Math.PI) / 180;
  const MAIN: [P2, number, number][] = [
    [[0, 236], 90, 70],
    [[-44, 232], 128, 52],
    [[46, 232], 53, 52],
    [[-296, 198], 114, 38],
    [[254, 198], 66, 38],
  ];
  MAIN.forEach(([p, ang, w], i) => {
    const r = GRIPPED[i];
    const topPt: P2 = [r.cx, r.cy - r.ry * 0.93];
    const [end, we] = grow(p, deg(ang), 900, w, 0, topPt);
    // the root's end splits and clamps the block: two fingers round its shoulders, one down its face
    [-1, 1].forEach((sd) => {
      const st: St[] = [[add(end, [0, -8]), we * 0.8]];
      const sweep = 118 + 22 * rnd();
      for (let d = 14; d <= sweep; d += 13) {
        const th = deg(-90 + sd * d);
        st.push([[r.cx + Math.cos(th) * r.rx * 0.97, r.cy + Math.sin(th) * r.ry * 0.97], mix(we * 0.72, 4, d / sweep)]);
      }
      out.push({ st, lvl: 0 });
    });
    out.push({ st: [[add(end, [0, -8]), we * 0.7], [[r.cx + 5, r.cy - r.ry * 0.5], we * 0.5], [[r.cx - 3, r.cy - r.ry * 0.05], we * 0.32], [[r.cx + 4, r.cy + r.ry * 0.35], 3]], lvl: 0 });
  });
  grow([-304, 196], deg(158), 620, 34, 0);
  grow([262, 196], deg(22), 620, 34, 0);
  grow([-188, 122], deg(102), 460, 21, 0);
  grow([170, 122], deg(79), 460, 21, 0);
  // parents over children at the forks
  out.sort((a, b) => b.lvl - a.lvl);
  const shapes = out.map((b) => limbD(b.st));
  let shade = "";
  out.forEach((b, bi) => {
    for (let i = 0; i < b.st.length - 1; i++) {
      const [pa, wa] = b.st[i];
      const [pb, wb] = b.st[i + 1];
      if (wa < 7) continue;
      shade += braceletD(pa, pb, wa, wb, bi * 31 + i, wa > 30 ? 5.2 : 4.2, 0.82);
    }
  });
  return { all: shapes.join(""), shade };
})();
/** the foundations: coursed masonry from directly under the walls, a footing course, three piers */
const FOUND = (() => {
  const band = `M-348,${CUT - 4}H308V118H-348Z`;
  const footing = "M-362,112H322V134H-362Z";
  const tower = "M-104,132H104L74,252H-74Z";
  const nave = "M-348,132H-258L-272,212H-334Z";
  const chancel = "M214,132H308L294,212H228Z";
  let joints = "";
  let hatch = "";
  const rnd = makeRng(88);
  let row = 0;
  for (let y = CUT + 14; y < 254; y += y > 108 && y < 132 ? 22 : 17, row++) {
    const half = y < 134 ? 362 : 104;
    joints += `M${-half},${y}H${half}`;
    for (let x = -half + (row % 2) * 19 + rnd() * 8; x < half; x += 30 + rnd() * 22) {
      joints += `M${x.toFixed(0)},${y - 17}v17`;
      if (rnd() < 0.36) hatch += hatchD(x + 2, y - 15, x + 26, y - 2, 62, 3.2, Math.round(x + y), 0.2);
    }
    // each course throws a ruled shadow on the one below
    hatch += hatchD(-half, y + 1, half, y + 5, 96, 3.4, 700 + row, 0.3);
  }
  hatch += hatchD(170, CUT, 322, 215, 114, 4.4, 61) + hatchD(34, 132, 110, 255, 114, 4.4, 62) + hatchD(-292, 132, -255, 215, 114, 4.4, 63);
  return { d: band + footing + tower + nave + chancel, joints, hatch };
})();
const EARTH_ART = (() => {
  const rnd = makeRng(512);
  let strata = "";
  [170, 318, 452, 610, 760, 905, 1040].forEach((y0, i) => {
    let d = "";
    for (let x = X_L; x <= X_R; x += 40) d += `${x === X_L ? "M" : "L"}${x},${(y0 + 16 * Math.sin(x / 170 + i * 1.7) + 9 * Math.sin(x / 61 + i)).toFixed(1)}`;
    strata += d;
  });
  const dots: P2[] = Array.from({ length: 620 }, () => [X_L + rnd() * (X_R - X_L), CUT + 12 + rnd() * 1250]);
  let pebbles = "";
  for (let i = 0; i < 70; i++) {
    const x = X_L + rnd() * (X_R - X_L);
    const y = CUT + 30 + rnd() * 1050;
    const r = 4 + rnd() * 8;
    pebbles += `M${(x - r).toFixed(0)},${y.toFixed(0)}a${r.toFixed(1)},${(r * 0.62).toFixed(1)} 0 1 0 ${(2 * r).toFixed(1)},0a${r.toFixed(1)},${(r * 0.62).toFixed(1)} 0 1 0 ${(-2 * r).toFixed(1)},0`;
  }
  let lip = `M${X_L},${CUT}`;
  for (let x = X_L + 22; x <= X_R; x += 22) lip += `L${x},${(CUT + 2.4 * Math.sin(x / 31) + 1.6 * Math.sin(x / 9)).toFixed(1)}`;
  let fringe = "";
  for (let x = X_L; x < X_R; x += 7) fringe += `M${(x + rnd() * 4).toFixed(0)},${CUT + 2}v${(5 + rnd() * 13).toFixed(0)}`;
  return { strata, dots, pebbles, lip, fringe };
})();
const Earth = React.memo(() => (
  <g>
    <path d={rect(X_L, CUT, X_R - X_L, 1800)} fill={EARTH} />
    <path d={EARTH_ART.strata} {...ln(1.4, 0.2, INK)} strokeDasharray="46 10 15 10" />
    {EARTH_ART.dots.map((p, i) => (
      <circle key={i} cx={p[0]} cy={p[1]} r={1.5} fill={INK} opacity={0.22} />
    ))}
    <path d={EARTH_ART.pebbles} {...ln(1.2, 0.3, INK)} />
    <path d={EARTH_ART.fringe} {...ln(1.1, 0.34, INK)} />
    {ROCKS.map((r, i) => (
      <g key={i}>
        <path d={r.d} fill={mixColor(LAND, INK, 0.05)} stroke={INK} strokeOpacity={0.6} strokeWidth={2.2} strokeLinejoin="round" />
        <path d={r.cracks} {...ln(1.1, 0.34, INK)} />
      </g>
    ))}
    {/* the graves under their stones */}
    {STONES.map((s, i) => (
      <g key={i}>
        <path d={`M${s.x - 40},${CUT + 66 + (i % 2) * 16}l12,-9l64,5l6,7l-6,7l-64,5Z`} fill={mixColor(LAND, INK, 0.1)} stroke={INK} strokeOpacity={0.62} strokeWidth={1.8} strokeLinejoin="round" />
        <path d={`M${s.x - 28},${CUT + 57 + (i % 2) * 16}v18M${s.x - 20},${CUT + 66 + (i % 2) * 16}h50`} {...ln(1, 0.35, INK)} />
      </g>
    ))}
  </g>
));
/** the orange under the church; `glint` = the world y of a slow highlight travelling down it */
const Roots: React.FC<{ glint: number }> = ({ glint }) => (
  <g>
    <path d={ROOTS.all + FOUND.d} {...ln(11, 0.55)} />
    <path d={ROOTS.all} fill="none" stroke={DARK} strokeWidth={5} strokeLinejoin="round" />
    <path d={ROOTS.all} fill={ACCENT} />
    <path d={ROOTS.shade} {...ln(1.25, 0.6)} />
    <path d={FOUND.d} fill={ACCENT} {...OUT} strokeWidth={2.6} />
    <clipPath id="found-clip">
      <path d={FOUND.d} />
    </clipPath>
    <g clipPath="url(#found-clip)">
      <path d={FOUND.joints} {...ln(1.35, 0.66)} />
      <path d="M-362,112H322M-362,134H322" {...ln(2.2, 0.85)} />
      <path d={FOUND.hatch} {...ln(1, 0.5)} />
    </g>
    <clipPath id="root-clip">
      <path d={ROOTS.all + FOUND.d} />
    </clipPath>
    <linearGradient id="root-glint" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#FFE6A8" stopOpacity={0} />
      <stop offset="0.5" stopColor="#FFE6A8" stopOpacity={0.5} />
      <stop offset="1" stopColor="#FFE6A8" stopOpacity={0} />
    </linearGradient>
    <g clipPath="url(#root-clip)">
      <rect x={X_L} y={glint - 150} width={X_R - X_L} height={300} fill="url(#root-glint)" />
    </g>
  </g>
);

// ---------------------------------------------------------------------------
// THE SHIPS: flying discs as a period engraver would have cut them
// ---------------------------------------------------------------------------
const Ship: React.FC<{ at: P2; w: number; tilt: number; uid: string }> = ({ at, w, tilt, uid }) => {
  const DISC = "M-100,0C-70,-22 -40,-27 0,-27C40,-27 70,-22 100,0C70,22 38,26 0,26C-38,26 -70,22 -100,0Z";
  const DOME = "M-40,-23C-40,-66 40,-66 40,-23Q0,-15 -40,-23Z";
  const BELLY = "M-36,22Q0,48 36,22Q0,29 -36,22Z";
  // the engraver's ruled shadow under the hull
  const SHADOW = [0, 1, 2, 3, 4, 5, 6].map((i) => `M${-78 + i * 9 + 4 * hash(i, 3)},${50 + i * 5.2}H${84 - i * 10 - 5 * hash(i, 4)}`).join("");
  return (
    <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) rotate(${tilt}) scale(${(w / 200).toFixed(4)})`}>
      <path d={SHADOW} {...ln(1.7, 0.55)} />
      <Cased id={`${uid}-case`} r={2}>
        <clipPath id={`${uid}-disc`}>
          <path d={DISC} />
        </clipPath>
        <clipPath id={`${uid}-dome`}>
          <path d={DOME} />
        </clipPath>
        <path d={BELLY} fill={HAIR} {...OUT} />
        <path d={hatchD(-30, 22, 36, 44, 96, 3, 11, 0.1)} {...ln(1, 0.6)} />
        <path d={DISC} fill={INK} {...OUT} strokeWidth={2.6} />
        <g clipPath={`url(#${uid}-disc)`}>
          {/* the underside is away from the light */}
          <path d="M-100,0Q0,15 100,0L100,30L-100,30Z" fill={DEEP} />
          <path d={hatchD(-100, 2, 100, 28, 100, 3.6, 12, 0.12)} {...ln(1.05, 0.62)} />
          <path d={hatchD(20, 4, 100, 28, 62, 4.4, 13, 0.2)} {...ln(1, 0.45)} />
          <path d={hatchD(44, -27, 100, 0, 112, 4, 14, 0.25)} {...ln(1, 0.45)} />
          {/* plate seams on the upper hull, the double rim band */}
          <path d={[-70, -44, -18, 18, 44, 70].map((x) => `M${x * 0.42},-25Q${x * 0.8},-14 ${x},${-3 + (x * x) / 1900}`).join("")} {...ln(1, 0.5)} />
          <path d="M-100,0Q0,15 100,0" {...ln(1.7, 0.85)} />
          <path d="M-97,-3.4Q0,10.5 97,-3.4" {...ln(1, 0.6)} />
          <path d="M-88,-6Q0,-20 88,-6" {...ln(1.1, 0.5)} />
        </g>
        {/* rivets as engraved rings along the rim */}
        {[-84, -63, -42, -21, 0, 21, 42, 63, 84].map((x) => (
          <g key={x}>
            <circle cx={x} cy={9.4 - (x * x) / 1050} r={3.1} fill={INK} stroke={DARK} strokeWidth={1.2} />
            <circle cx={x + 0.6} cy={9.8 - (x * x) / 1050} r={1} fill={DARK} opacity={0.8} />
          </g>
        ))}
        <path d={DOME} fill={INK} {...OUT} strokeWidth={2.4} />
        <g clipPath={`url(#${uid}-dome)`}>
          <path d={hatchD(8, -62, 42, -18, 108, 3.4, 15, 0.2)} {...ln(1, 0.55)} />
          <path d="M-40,-27Q0,-19 40,-27M-39,-46Q0,-40 39,-46" {...ln(1, 0.55)} />
        </g>
        {/* portholes: a ring, the dark glass, a ruled glint */}
        {[-21, 0, 21].map((x) => (
          <g key={x}>
            <circle cx={x} cy={-36} r={6.6} fill={DEEP} stroke={DARK} strokeWidth={1.5} />
            <circle cx={x} cy={-36} r={4} fill={DARK} opacity={0.86} />
            <path d={`M${x - 2.6},-37.4l2.4,-2.2`} {...ln(0.9, 0.7, INK)} />
          </g>
        ))}
        <path d="M0,-62V-72" {...ln(2, 0.9)} />
        <circle cx={0} cy={-60} r={4.2} fill={DEEP} {...OUT} strokeWidth={1.8} />
        <circle cx={0} cy={-73} r={2.4} fill={INK} {...OUT} strokeWidth={1.4} />
      </Cased>
    </g>
  );
};
const SHIPS: { from: P2; to: P2; f0: number; speed: number; w: number; tilt: number }[] = [
  { from: [545, -1262], to: [-150, -1188], f0: 0, speed: 15, w: 232, tilt: -3 },
  { from: [262, -1640], to: [150, -1322], f0: 9, speed: 12.5, w: 192, tilt: 2.5 },
  { from: [760, -1300], to: [392, -1146], f0: 20, speed: 13.5, w: 212, tilt: 4 },
  { from: [-190, -1650], to: [-256, -1376], f0: 30, speed: 11.5, w: 158, tilt: -4.5 },
];
/** constant speed, then a short eased stop on station; a slow bob throughout */
const shipAt = (i: number, f: number): P2 => {
  const s = SHIPS[i];
  const d = vlen(sub(s.to, s.from));
  const u = Math.max(0, (f - s.f0) / (d / s.speed));
  const a = 0.74;
  const v = (u - a) / (2 * (1 - a));
  const g = u < a ? u : v >= 1 ? 1 : a + (1 - a) * (1 - (1 - v) * (1 - v));
  const p = mix2(s.from, s.to, g);
  return [p[0] + 3.5 * Math.sin(f / 31 + i * 1.9), p[1] + 2.6 * Math.sin(f / 19 + i * 2.3)];
};

// ---------------------------------------------------------------------------
// THE HAULING TEAM (side view, facing the church) and the two ropes
// ---------------------------------------------------------------------------
type Hauler = { x0: number; gy: number; s: number; kind: "man" | "woman"; high: boolean; seed: number };
/** hips, shoulders, head, feet (world px) at pull p (0 standing, 1 hanging back on the rope) */
const haulerBody = (h: Hauler, p: number, wob = 0) => {
  const U = (x: number, y: number): P2 => [h.x0 + x * h.s, h.gy + y * h.s];
  const th = ((3 + 24 * p + wob) * Math.PI) / 180;
  const hip = U(14 * p, -50 + 10 * p);
  const sh: P2 = [hip[0] + 32 * h.s * Math.sin(th), hip[1] - 32 * h.s * Math.cos(th)];
  const head: P2 = [sh[0] + 12 * h.s * Math.sin(th * 0.45), sh[1] - 12 * h.s * Math.cos(th * 0.45)];
  return { hip, sh, head, th, footF: U(-9 - 6 * p, -3), footB: U(9 + 5 * p, -3) };
};
const ARM = 31.5;
const mkTeam = () => {
  const A: P2 = [0, LOOP_Y];
  const pair = (x0: number, s: number, kinds: ["man" | "woman", "man" | "woman"], seed: number) => {
    const front: Hauler = { x0, gy: 4, s, kind: kinds[0], high: true, seed };
    const sf = haulerBody(front, 1).sh;
    const dir = norm(sub(A, sf));
    const hf = add(sf, mul(dir, ARM * s));
    // the second hauler holds the same straight rope at his hip
    const s2 = s * 0.97;
    const away = mul(dir, -1);
    const gy2 = 10;
    const shY = gy2 + (-40 - 32 * Math.cos((27 * Math.PI) / 180)) * s2;
    const py = shY + 0.93 * ARM * s2;
    const t = (py - hf[1]) / away[1];
    const hb = add(hf, mul(away, t));
    const x2 = hb[0] + 0.37 * ARM * s2 - (14 + 32 * Math.sin((27 * Math.PI) / 180)) * s2;
    const back: Hauler = { x0: x2, gy: gy2, s: s2, kind: kinds[1], high: false, seed: seed + 1 };
    return { front, back, hf, hb };
  };
  return [pair(270, 1.62, ["man", "woman"], 1), pair(354, 1.66, ["man", "man"], 3)];
};
const TEAM = mkTeam();
const slackHand = (h: Hauler): P2 => [h.x0 - 8 * h.s, h.gy - 47 * h.s];

const grip = track([[0, 0], [52, 0], [64, 1], [192, 1], [216, 0], [241, 0]]);
const pull = track([[0, 0], [59, 0], [69, 1], [76, 0.84], [85, 1], [120, 0.93], [150, 1], [180, 0.96], [200, 0], [241, 0]]);
/** the steeple gives a hair, once, as the ropes come on */
const shiver = (f: number) => {
  const u = (f - 65) / 15;
  return u <= 0 || u >= 1 ? 0 : 4.5 * Math.pow(Math.sin(Math.PI * u), 2);
};

const HaulerFig: React.FC<{ h: Hauler; p: number; hand: P2; f: number; part: "body" | "arms" }> = ({ h, p, hand, f, part }) => {
  const s = h.s;
  const b = haulerBody(h, p, 0.9 * Math.sin(f / 15 + h.seed * 1.7) * (1 - p));
  const legF = ik2(b.hip, b.footF, 25 * s, 24 * s, [-1, 0]);
  const legB = ik2(b.hip, b.footB, 25 * s, 24 * s, [-1, 0]);
  const rdir = norm(sub(hand, b.sh));
  const arm = (off: number) => {
    const W = add(hand, mul(rdir, off * s));
    const { mid, end } = ik2(b.sh, W, 17 * s, 16.5 * s, [0.3, 1]);
    return { E: mid, W: end };
  };
  const a1 = arm(-3.5);
  const a2 = arm(3.5);
  const uid = `hl-${h.seed}`;
  if (part === "arms") {
    const drawArm = (a: { E: P2; W: P2 }, k: number) => (
      <g key={k}>
        <path d={limbD([[b.sh, 9.5 * s], [mix2(b.sh, a.E, 0.5), 8.6 * s], [a.E, 7 * s], [mix2(a.E, a.W, 0.5), 6.6 * s], [a.W, 5.6 * s]])} fill={k ? INK : DEEP} {...OUT} strokeWidth={2} />
        <path d={braceletD(b.sh, a.E, 8.6 * s, 7 * s, 300 + h.seed, 3.4) + braceletD(a.E, a.W, 7 * s, 5.6 * s, 310 + h.seed, 3.4)} {...ln(0.95, 0.55)} />
        <circle cx={a.W[0]} cy={a.W[1]} r={4.3 * s} fill={INK} {...OUT} strokeWidth={2} />
      </g>
    );
    return <Cased id={`${uid}-ac`}>{[a1, a2].map(drawArm)}</Cased>;
  }
  const drawLeg = (l: { mid: P2; end: P2 }, k: number) => (
    <g key={k}>
      <path d={limbD([[b.hip, 12.5 * s], [mix2(b.hip, l.mid, 0.5), 11 * s], [l.mid, 8.6 * s], [mix2(l.mid, l.end, 0.5), 8 * s], [l.end, 6.4 * s]])} fill={k ? DEEP : HAIR} {...OUT} strokeWidth={2} />
      <path d={braceletD(l.mid, l.end, 8.6 * s, 6.4 * s, 320 + h.seed + k, 3.4)} {...ln(0.95, 0.55)} />
      <path d={`M${P(add(l.end, [3.4 * s, -1.5 * s]))}L${P(add(l.end, [3.6 * s, 3 * s]))}L${P(add(l.end, [-10 * s, 3 * s]))}Q${P(add(l.end, [-10.5 * s, -0.5 * s]))} ${P(add(l.end, [-3.4 * s, -2.2 * s]))}Z`} fill={HAIR} {...OUT} strokeWidth={2} />
    </g>
  );
  const up = norm(sub(b.sh, b.hip));
  const nr: P2 = [-up[1], up[0]];
  const T = (along: number, across: number): P2 => add(b.hip, add(mul(up, along * s), mul(nr, across * s)));
  const COAT = h.kind === "man" ? limbD([[T(34, 0), 15 * s], [T(24, 0), 19.5 * s], [T(8, 0), 18 * s], [T(-4, 0), 20 * s], [T(-13, 0), 21.5 * s]]) : limbD([[T(34, 0), 14 * s], [T(24, 0), 18.5 * s], [T(9, 0), 15.5 * s], [T(2, 0), 17 * s]]);
  const hem = h.gy - 7 * s;
  const SKIRT = smoothClosed([T(6, -8.5), T(6, 8.5), [b.footB[0] + 9 * s, hem - 12 * s], [b.footB[0] + 10 * s, hem], [mix(b.footF[0], b.footB[0], 0.5), hem + 1.5 * s], [b.footF[0] - 9 * s, hem], [b.footF[0] - 6 * s, hem - 14 * s]]);
  const hdeg = (b.th * 0.45 * 180) / Math.PI - 14 * (1 - p) * 0 - 10 * p;
  return (
    <Cased id={`${uid}-bc`}>
      {h.kind === "man" ? (
        <>
          {drawLeg(legB, 0)}
          {drawLeg(legF, 1)}
        </>
      ) : (
        <>
          <path d={rect(b.footB[0] - 9 * s, h.gy - 5 * s, 12 * s, 5 * s) + rect(b.footF[0] - 10 * s, h.gy - 5 * s, 12 * s, 5 * s)} fill={HAIR} {...OUT} strokeWidth={2} />
          <clipPath id={`${uid}-sk`}>
            <path d={SKIRT} />
          </clipPath>
          <path d={SKIRT} fill={DEEP} {...OUT} />
          <g clipPath={`url(#${uid}-sk)`}>
            <path d={hatchD(h.x0 + 2 * s, h.gy - 60 * s, h.x0 + 40 * s, h.gy, 100, 3.6, 330 + h.seed, 0.2)} {...ln(1, 0.55)} />
            <path d={[0.3, 0.55].map((v) => `M${P(T(4, mix(-8, 8, v)))}L${P([mix(b.footF[0] - 8 * s, b.footB[0] + 9 * s, v), hem])}`).join("")} {...ln(1.2, 0.6)} />
          </g>
        </>
      )}
      <clipPath id={`${uid}-ct`}>
        <path d={COAT} />
      </clipPath>
      <path d={COAT} fill={INK} {...OUT} />
      <g clipPath={`url(#${uid}-ct)`}>
        <path d={hatchD(b.hip[0] + 1 * s, b.sh[1] - 6 * s, b.sh[0] + 16 * s, b.hip[1] + 16 * s, 108, 3.4, 340 + h.seed, 0.2)} {...ln(1, 0.58)} />
        <path d={`M${P(T(8, -10))}L${P(T(8, 10))}`} {...ln(1.5, 0.75)} />
      </g>
      <g transform={`translate(${b.head[0].toFixed(2)} ${b.head[1].toFixed(2)}) rotate(${hdeg.toFixed(2)}) scale(${s})`}>
        <path d="M-8,-1C-8.4,-9 -3,-11 1,-11C7,-11 8.6,-5 8,0C7.6,6 4,9.5 -1,9.5C-4,9.5 -6.6,7 -7,4L-9.6,2.6Z" fill={INK} {...OUT} strokeWidth={1.4} />
        <path d="M2,-2L9,2L7,8L1,9Z" fill="none" />
        <path d={hatchD(1, -4, 9, 9, 108, 2.2, 350 + h.seed, 0.2)} {...ln(0.7, 0.5)} />
        <circle cx={-4.2} cy={-1.6} r={0.95} fill={DARK} />
        {h.kind === "man" ? (
          <>
            <path d="M-13.5,-6.4Q0,-9.4 14,-5.6Q0,-4 -13.5,-6.4Z" fill={HAIR} {...OUT} strokeWidth={1.3} />
            <path d="M-7,-7.4C-7.4,-15.5 7.4,-15.5 7.4,-6.6Z" fill={HAIR} {...OUT} strokeWidth={1.3} />
            <path d="M-6.6,-9.6Q0,-11.2 7,-9" {...ln(0.9, 0.7)} />
          </>
        ) : (
          <>
            <path d="M-4.6,-11.2C6,-14.5 12.6,-8 11,1C10.4,6 7.6,9.6 5,11L3.4,6.6C6,2 5.4,-5 -5.4,-8.4Z" fill={DEEP} {...OUT} strokeWidth={1.3} />
            <path d="M0,-10.6Q8,-7 7.6,3" {...ln(0.8, 0.55)} />
          </>
        )}
      </g>
    </Cased>
  );
};

/** one rope: from the loop on the cross, through the two pairs of hands, its tail on the turf */
const ropeD = (A: P2, h1: P2, h2: P2, slack: number, back: Hauler, k: number) => {
  const mid = mix2(A, h1, 0.5);
  const c1: P2 = mix2(mid, [A[0] + (0.2 + 0.1 * k) * (h1[0] - A[0]), h1[1] + 36 + 26 * k], slack);
  const m2 = mix2(h1, h2, 0.5);
  const c2: P2 = [m2[0], m2[1] + 16 * slack];
  const g: P2 = [back.x0 + 46 * back.s, back.gy + 3];
  const c3: P2 = [h2[0] + 10 * back.s, mix(h2[1], g[1], 0.9)];
  const end: P2 = [g[0] + 46, g[1] + 5 + 4 * k];
  return `M${P(A)}Q${P(c1)} ${P(h1)}Q${P(c2)} ${P(h2)}Q${P(c3)} ${P(g)}Q${P([g[0] + 22, g[1] - 9])} ${P(end)}`;
};

// ---------------------------------------------------------------------------
// THE CAMERA: creep on the cross while the ships come in; down the ropes to the
// team; down the building into the earth; back up to hold all three layers
// ---------------------------------------------------------------------------
type Pose = { k: number; cx: number; cy: number };
// one damped track per channel (monotone cubics through the keys, moving at both ends). The descent
// (f56-126) peaks under ~30 px a frame; at the bottom of the plate the sideways drift carries the
// turn, so the camera rounds from down to up without ever standing still.
const CAM_CY = pchip([[0, -746], [56, -741], [126, 470], [134, 477], [144, 468], [228, -530], [241, -536]]);
const CAM_CX = pchip([[0, 70], [68, 128], [114, -62], [164, 62], [228, 30], [241, 29]]);
const CAM_LK = pchip(([[0, 1.25], [56, 1.27], [126, 0.88], [144, 0.892], [228, 1.05], [241, 1.066]] as [number, number][]).map(([f, k]) => [f, Math.log(k)] as [number, number]));
const camAt = (f: number): Pose => ({ k: Math.exp(CAM_LK(f)), cx: CAM_CX(f), cy: CAM_CY(f) });
const glintAt = track([[98, 40], [166, 1180]]);

const GiveUpChristianity: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const g = grip(f);
  const p = pull(f);
  const lean = shiver(f);
  const A: P2 = [lean * ((LOOP_Y - TOWER_TOP) / (CROSS.arm - TOWER_TOP)), LOOP_Y];
  const slack = Math.pow(1 - g, 2);
  const hands = TEAM.map((t) => ({ hf: mix2(slackHand(t.front), t.hf, g), hb: mix2(slackHand(t.back), t.hb, g) }));
  const ropes = TEAM.map((t, i) => ropeD(add(A, [3 - 6 * i, 4 + 5 * i]), hands[i].hf, hands[i].hb, slack, t.back, i));
  const people = TEAM.flatMap((t, i) => [
    { h: t.front, hand: hands[i].hf },
    { h: t.back, hand: hands[i].hb },
  ]);
  return (
    <AbsoluteFill>
      <TexcocoPage cam={cam}>
        <WorldSvg cam={cam}>
          <Sky />
          <Cottage x={-566} w={128} h={72} tone={0.66} seed={401} />
          <Cottage x={556} w={124} h={68} tone={0.6} seed={404} chimney={0.3} />
          <Cottage x={716} w={150} h={78} tone={0.66} seed={407} />
          <Cottage x={-800} w={150} h={80} tone={0.62} seed={410} chimney={0.25} />
          <Ground />
          <ChurchBody />
          <Spire lean={lean} />
          <Earth />
          <Roots glint={glintAt(f)} />
          <path d={EARTH_ART.lip} {...ln(6, 0.5)} />
          <path d={EARTH_ART.lip} {...ln(2.6, 0.9, INK)} />
          {SHIPS.map((s, i) => (
            <Ship key={i} at={shipAt(i, f)} w={s.w} tilt={s.tilt + 0.8 * Math.sin(f / 27 + i)} uid={`ship${i}`} />
          ))}
          {people.map((q, i) => (
            <HaulerFig key={i} h={q.h} p={p} hand={q.hand} f={f} part="body" />
          ))}
          {ropes.map((d, i) => (
            <g key={i}>
              <path d={d} {...ln(8, 0.62)} />
              <path d={d} {...ln(4.4, 1, INK)} />
              <path d={d} {...ln(1.1, 0.6)} strokeDasharray="2.5 5.5" />
            </g>
          ))}
          {people.map((q, i) => (
            <HaulerFig key={i} h={q.h} p={p} hand={q.hand} f={f} part="arms" />
          ))}
        </WorldSvg>
      </TexcocoPage>
    </AbsoluteFill>
  );
};

export default GiveUpChristianity;
