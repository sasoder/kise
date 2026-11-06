// ---------------------------------------------------------------------------
// payProps — Audi's pay as two picture-book objects (toto-twenty-person, cut 20 AudiHiredToRun; REVISION_1).
// Cheeky Pint stout (styles/cheeky-pint.md, palette B1): the key light from the upper left, flat matte fills with a
// top-lit ramp per part (no outlines), ONE UnionShadow per object / touching group, grain from the stage. The
// treatment follows toto-champion-eight/champShared.tsx (its prop / character look only).
//
//   SALARY  a manila pay envelope standing on the board, its flap open behind, three green banknotes peeking out of
//           the top, a cream sticker on its face printed SALARY (a word on the object, not a text block).
//   BONUS   a terracotta bonus envelope standing in front of the salary on its OUTER side, a cream ribbon round its
//           inner top corner tied in a bow, BONUS printed on it in cream; and a little stack of three brass coins
//           in front of its outer foot.
//
// Real-object colour (REVISION_1 #7: the pay may be colourful); never the amber token, which means "decides".
//
// EXPORTS
//   PAY              the geometry (world px at scale 1; feet on y = 0, x = 0 the salary envelope's centre)
//   PayProps         draws salary + bonus at (x, y) = the salary envelope's foot centre, `side` = which way the
//                    bonus sits (+1 right, -1 left), `salary` / `bonus` 0..1 their entrances, `dim` 0..1 a tone
//   paySil           the union silhouette (world px) of whatever has landed, for collision / framing checks
//   payBox           the settled bounding box (world px) of salary only / salary + bonus
//   PAY_TIMING       the fractions of `bonus` at which the envelope and each coin enter
//
// ENTRANCES. Salary: the stout entrance (blur in, a ~24 px slide up, settle), its shadow growing in. Bonus: the
// envelope the same way, then the three coins land on their stack one by one (each a ~14 px drop with blur, the
// shadow joins on landing). While the bonus envelope is entering it casts its own shadow; once settled, salary,
// bonus and coins (all touching) are ONE union shadow.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { COLOR, Label, clamp01, easeOutCubic, labelWidth, mixHex, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { UnionShadow, type SilItem } from "../kits/cheeky-pint/museShared";

type P2 = [number, number];
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const D2R = Math.PI / 180;
const uidOf = (raw: string) => `pp${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

// --- tones (warm, muted, real-object colour in the stout light) -----------------------------------------------
const LIGHT_TINT = "#FFF4E2";
const topOf = (c: string) => mixHex(c, LIGHT_TINT, 0.14);
const footOf = (c: string) => mixHex(c, COLOR.shadow, 0.16);
export const PAY_TONE = {
  manila: "#D9B47A",
  manilaIn: "#B08654",
  note: "#8FAE78",
  noteAlt: "#86A672",
  noteBand: "#B3C89A",
  noteInk: "#4E6A44",
  medal: "#EFE8D2",
  sticker: "#F3EAD8",
  terracotta: "#C9714D",
  ribbon: "#F2E7D3",
  brass: "#CDA45E",
  brassSide: "#A9803F",
  brassRim: "#E6CC94",
} as const;

// --- geometry (world px at scale 1, y down, feet on 0, x = 0 the salary envelope's centre; side +1) -------------
export const PAY = {
  salary: {
    w: 150,
    h: 112,
    r: 8,
    /** the open flap behind: its apex height above the feet */
    flapTop: 166,
    /** the banknotes: w x h, each [bottom-centre x, bottom y (up from the feet), rotation deg] */
    note: { w: 104, h: 64 },
    notes: [
      [-12, 80, -11],
      [2, 86, -2],
      [15, 80, 9],
    ] as [number, number, number][],
    /** the sticker on its face, high (the bonus stands in front of the face's foot): centre x, centre height,
     *  w x h; its word and size (world px) */
    sticker: { cx: 0, cy: 87, w: 136, h: 40, text: "SALARY", px: 30 },
  },
  bonus: {
    /** centre x, w x h: it stands on the same ground, in front of the salary's outer foot, under its sticker */
    cx: 104,
    w: 128,
    h: 64,
    r: 7,
    /** the ribbon round its inner top corner: distance of the band's centre line from that corner, band width;
     *  the bow's size (x the drawn loops) */
    ribbon: { at: 22, w: 11, bow: 0.8 },
    /** BONUS printed on it: centre x (from its centre), height of its centre above the feet, size */
    text: { dx: 0, cy: 24, px: 30 },
  },
  coins: { cx: 190, r: 26, h: 9.5, n: 3, face: 0.3, jitter: [0, 3, -2] as number[] },
} as const;

/** fractions of the `bonus` entrance: the envelope [0, 0.5], coin i [0.4 + i * 0.15, 0.4 + i * 0.15 + 0.25] (all
 *  landed by 0.95, so a 15-frame bonus settles a frame early) */
export const PAY_TIMING = { env: [0, 0.5] as [number, number], coin0: 0.4, coinStep: 0.15, coinDur: 0.25 } as const;

// --- path helpers -----------------------------------------------------------------------------------------------
const polyD = (pts: P2[]) => `${pts.map((q, i) => `${i ? "L" : "M"}${f3(q[0])} ${f3(q[1])}`).join("")}Z`;
/** a closed soft shape through points (quadratics through the midpoints: cut-card corners) */
const softClosed = (pts: P2[]) => {
  const n = pts.length;
  const mid = (a: P2, b: P2): P2 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  let d = `M${f3(m0[0])} ${f3(m0[1])}`;
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    d += `Q${f3(pts[i][0])} ${f3(pts[i][1])} ${f3(m[0])} ${f3(m[1])}`;
  }
  return `${d}Z`;
};
const roundRect = (x0: number, y0: number, w: number, h: number, r: number) => {
  const x = Math.min(x0, x0 + w);
  const W = Math.abs(w);
  const rr = Math.min(r, W / 2, h / 2);
  return `M${f3(x + rr)} ${f3(y0)}H${f3(x + W - rr)}A${f3(rr)} ${f3(rr)} 0 0 1 ${f3(x + W)} ${f3(y0 + rr)}V${f3(y0 + h - rr)}A${f3(rr)} ${f3(rr)} 0 0 1 ${f3(x + W - rr)} ${f3(y0 + h)}H${f3(x + rr)}A${f3(rr)} ${f3(rr)} 0 0 1 ${f3(x)} ${f3(y0 + h - rr)}V${f3(y0 + rr)}A${f3(rr)} ${f3(rr)} 0 0 1 ${f3(x + rr)} ${f3(y0)}Z`;
};
const ellipseD = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f3(cx + rx)} ${f3(cy)}A${f3(rx)} ${f3(ry)} 0 1 1 ${f3(cx - rx)} ${f3(cy)}A${f3(rx)} ${f3(ry)} 0 1 1 ${f3(cx + rx)} ${f3(cy)}Z`;
const rot = (p: P2, deg: number, o: P2): P2 => {
  const c = Math.cos(deg * D2R);
  const s = Math.sin(deg * D2R);
  return [o[0] + (p[0] - o[0]) * c - (p[1] - o[1]) * s, o[1] + (p[0] - o[0]) * s + (p[1] - o[1]) * c];
};

// --- the frame: local (lx right-is-outward, ly up from the feet) -> world ------------------------------------------
type Frame = { x: number; y: number; s: number; side: 1 | -1 };
const W = (F: Frame) => (lx: number, ly: number): P2 => [F.x + F.side * lx * F.s, F.y - ly * F.s];

// --- the parts as world paths ------------------------------------------------------------------------------------
const salaryParts = (F: Frame, dy = 0) => {
  const P = (lx: number, ly: number): P2 => {
    const q = W(F)(lx, ly);
    return [q[0], q[1] + dy];
  };
  const S = PAY.salary;
  const hw = S.w / 2;
  const body = roundRect(P(-hw, S.h)[0], P(0, S.h)[1], F.side * S.w * F.s, S.h * F.s, S.r * F.s);
  // the open flap, folded up behind: a triangle with a softly rounded tip
  const flap = `M${f3(P(-hw + 2, S.h - 4)[0])} ${f3(P(-hw + 2, S.h - 4)[1])}L${f3(P(-8, S.flapTop - 6)[0])} ${f3(P(-8, S.flapTop - 6)[1])}Q${f3(P(0, S.flapTop + 2)[0])} ${f3(P(0, S.flapTop + 2)[1])} ${f3(P(8, S.flapTop - 6)[0])} ${f3(P(8, S.flapTop - 6)[1])}L${f3(P(hw - 2, S.h - 4)[0])} ${f3(P(hw - 2, S.h - 4)[1])}Z`;
  const notes = S.notes.map(([bx, by, deg]) => {
    const o = P(bx, by);
    const hw2 = S.note.w / 2;
    const corners: P2[] = [P(bx - hw2, by), P(bx - hw2, by + S.note.h), P(bx + hw2, by + S.note.h), P(bx + hw2, by)];
    const R = (q: P2) => rot(q, F.side * deg, o);
    return { o, deg: F.side * deg, corners: corners.map(R), R };
  });
  // the face's construction: two side flaps meeting under the pocket edge, the bottom flap rising to the centre
  const sideL = polyD([P(-hw, S.h), P(-hw, 0), P(-6, S.h * 0.5)]);
  const sideR = polyD([P(hw, S.h), P(hw, 0), P(6, S.h * 0.5)]);
  const bottom = softClosed([P(-hw + 1, 1), P(-8, S.h * 0.56), P(8, S.h * 0.56), P(hw - 1, 1)]);
  return { body, flap, notes, sideL, sideR, bottom, P };
};
const bonusParts = (F: Frame, dy = 0) => {
  const P = (lx: number, ly: number): P2 => {
    const q = W(F)(lx, ly);
    return [q[0], q[1] + dy];
  };
  const B = PAY.bonus;
  const x0 = B.cx - B.w / 2;
  const x1 = B.cx + B.w / 2;
  const body = roundRect(P(x0, B.h)[0], P(0, B.h)[1], F.side * B.w * F.s, B.h * F.s, B.r * F.s);
  // the flap seam: a shallow V from the top corners
  const seam = polyD([P(x0 + 2, B.h - 2), P(B.cx, B.h * 0.46), P(x1 - 2, B.h - 2), P(x1 - 2, B.h - 5), P(B.cx, B.h * 0.42), P(x0 + 2, B.h - 5)]);
  // the ribbon: a band across the inner top corner (x0, h), perpendicular to the diagonal, `at` from the corner
  const a = B.ribbon.at;
  const rw = B.ribbon.w;
  const band = polyD([P(x0 - 3, B.h - a - rw / 2 * 1.41 - 3), P(x0 + a + rw / 2 * 1.41 + 3, B.h + 3), P(x0 + a - rw / 2 * 1.41 + 3, B.h + 3), P(x0 - 3, B.h - a + rw / 2 * 1.41 - 3)]);
  const knot: P2 = P(x0 + a / 2 + 1, B.h - a / 2 - 1);
  return { body, seam, band, knot, P, x0, x1 };
};
const coinParts = (F: Frame, i: number, dy = 0) => {
  const C = PAY.coins;
  const q = W(F)(C.cx + (C.jitter[i] ?? 0), (i + 1) * C.h);
  const cx = q[0];
  const top = q[1] + dy; // the top face's centre line
  const rx = C.r * F.s;
  const ry = C.r * C.face * F.s;
  const hh = C.h * F.s;
  const side = `M${f3(cx - rx)} ${f3(top)}V${f3(top + hh)}A${f3(rx)} ${f3(ry)} 0 0 0 ${f3(cx + rx)} ${f3(top + hh)}V${f3(top)}Z`;
  return { cx, top, rx, ry, hh, side, face: ellipseD(cx, top, rx, ry) };
};

// --- timing helpers ------------------------------------------------------------------------------------------------
const span = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
/** the stout entrance: opacity, blur (screen px), and a slide (screen px) that settles to 0 */
const enterOf = (t: number) => {
  const a = easeOutCubic(t);
  return { a, blur: 6 * (1 - a), slide: 24 * (1 - a) };
};
const coinT = (bonus: number, i: number) => span(bonus, PAY_TIMING.coin0 + i * PAY_TIMING.coinStep, PAY_TIMING.coin0 + i * PAY_TIMING.coinStep + PAY_TIMING.coinDur);

// --- silhouettes and boxes -----------------------------------------------------------------------------------------
const salarySilAt = (F: Frame, dy = 0): SilItem[] => {
  const s = salaryParts(F, dy);
  return [{ d: s.body }, { d: s.flap }, ...s.notes.map((n) => ({ d: polyD(n.corners) }))];
};
const bonusSilAt = (F: Frame, dy = 0): SilItem[] => [{ d: bonusParts(F, dy).body }];
const coinSilAt = (F: Frame, i: number, dy = 0): SilItem[] => {
  const c = coinParts(F, i, dy);
  return [{ d: c.side }, { d: c.face }];
};
/** the union silhouette of what has landed (world px) */
export const paySil = (x: number, y: number, scale = 1, side: 1 | -1 = 1, salary = 1, bonus = 1): SilItem[] => {
  const F: Frame = { x, y, s: scale, side };
  const out: SilItem[] = [];
  if (salary > 0.999) out.push(...salarySilAt(F));
  if (span(bonus, PAY_TIMING.env[0], PAY_TIMING.env[1]) > 0.999) out.push(...bonusSilAt(F));
  for (let i = 0; i < PAY.coins.n; i++) if (coinT(bonus, i) > 0.999) out.push(...coinSilAt(F, i));
  return out;
};
/** the settled bounding box (world px): `withBonus` false = the salary alone */
export const payBox = (x: number, y: number, scale = 1, side: 1 | -1 = 1, withBonus = true) => {
  const S = PAY.salary;
  const lx0 = -S.w / 2 - 6;
  const lx1 = withBonus ? PAY.coins.cx + PAY.coins.r + Math.max(...PAY.coins.jitter) : S.w / 2 + 8;
  const top = Math.max(S.flapTop, S.notes.reduce((m, [, by, deg]) => Math.max(m, by + S.note.h * Math.cos(deg * D2R) + (S.note.w / 2) * Math.abs(Math.sin(deg * D2R))), 0));
  const xa = x + side * lx0 * scale;
  const xb = x + side * lx1 * scale;
  return { x0: Math.min(xa, xb), x1: Math.max(xa, xb), y0: y - top * scale, y1: y };
};

// --- drawing -------------------------------------------------------------------------------------------------------
export type PayPropsProps = {
  /** the salary envelope's foot centre (world px) */
  x: number;
  y: number;
  /** camera k (text and blur are screen-sized) */
  k: number;
  scale?: number;
  /** which way the bonus sits from the salary: +1 right, -1 left */
  side?: 1 | -1;
  /** entrances 0..1 */
  salary: number;
  bonus: number;
  /** 0..1 a tone toward the board (context), never opacity */
  dim?: number;
};

export const PayProps: React.FC<PayPropsProps> = ({ x, y, k, scale = 1, side = 1, salary, bonus, dim = 0 }) => {
  const uid = uidOf(useId());
  if (salary <= 0.001 && bonus <= 0.001) return null;
  const F: Frame = { x, y, s: scale, side };
  const col = (c: string) => mixHex(c, COLOR.board, clamp01(dim) * 0.55);
  const eS = enterOf(salary);
  const eB = enterOf(span(bonus, PAY_TIMING.env[0], PAY_TIMING.env[1]));
  const eC = [0, 1, 2].map((i) => {
    const t = coinT(bonus, i);
    const a = easeOutCubic(t);
    return { t, a, blur: 5 * (1 - a), drop: -14 * (1 - a) };
  });
  const sS = salaryParts(F, eS.slide / k);
  const sB = bonusParts(F, eB.slide / k);
  const S = PAY.salary;
  const B = PAY.bonus;
  const s = scale;
  // shadows: what has landed is ONE union shadow (salary + bonus + coins touch); anything still entering casts its
  // own, growing in with its entrance and handing over to the union as it settles
  const landed = (t: number) => smoothstep(clamp01((t - 0.75) / 0.25));
  const wB = landed(eB.a);
  const wC = eC.map((c) => landed(c.a));
  const unionSil: SilItem[] = [];
  if (salary > 0.001) unionSil.push(...salarySilAt(F, eS.slide / k));
  const ownShadows: React.ReactNode[] = [];
  if (eB.a > 0.002) {
    if (wB > 0.999) unionSil.push(...bonusSilAt(F));
    else ownShadows.push(<UnionShadow key="b" sil={bonusSilAt(F, eB.slide / k)} s={(B.w / 96) * s} strength={eB.a} />);
  }
  eC.forEach((c, i) => {
    if (c.a <= 0.002) return;
    if (wC[i] > 0.999) unionSil.push(...coinSilAt(F, i));
    else ownShadows.push(<UnionShadow key={`c${i}`} sil={coinSilAt(F, i, c.drop / k)} s={((PAY.coins.r * 2) / 96) * s} lift={1 - c.a} strength={c.a} />);
  });
  const unionStrength = salary > 0.001 ? eS.a : 0;
  const gradV = (id: string, c: string, y0: number, y1: number) => (
    <linearGradient id={`${uid}${id}`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y1)}>
      <stop offset="0" stopColor={topOf(c)} />
      <stop offset="1" stopColor={footOf(c)} />
    </linearGradient>
  );
  const sBot = sS.P(0, 0)[1];
  const bTop = sB.P(0, B.h)[1];
  const bBot = sB.P(0, 0)[1];
  const fade = (a: number, blur: number, children: React.ReactNode, key?: string) => (
    <g key={key} opacity={f3(a)} style={blur > 0.05 ? { filter: `blur(${f3(blur / k)}px)` } : undefined}>
      {children}
    </g>
  );
  // a banknote: green paper, a lighter border band, a cream medallion with an ink euro sign, a corner value dot
  const note = (n: ReturnType<typeof salaryParts>["notes"][number], i: number) => {
    const base = col(i === 1 ? PAY_TONE.note : PAY_TONE.noteAlt);
    const R = n.R;
    const [bx, by] = S.notes[i];
    const L = (lx: number, ly: number) => R(sS.P(bx + lx, by + ly));
    const hw = S.note.w / 2;
    const h = S.note.h;
    const inset = 6;
    const band = polyD([L(-hw + inset, inset), L(-hw + inset, h - inset), L(hw - inset, h - inset), L(hw - inset, inset)]);
    const inner = polyD([L(-hw + inset + 4, inset + 4), L(-hw + inset + 4, h - inset - 4), L(hw - inset - 4, h - inset - 4), L(hw - inset - 4, inset + 4)]);
    const mc = L(0, h - 22);
    const mr = 13 * s;
    const dot = L(-hw + 18, h - 15);
    const dot2 = L(hw - 18, h - 15);
    return (
      <g key={i}>
        <path
          d={roundRect(sS.P(bx - hw, by + h)[0], sS.P(0, by + h)[1], side * S.note.w * s, h * s, 4 * s)}
          transform={`rotate(${f3(n.deg)} ${f3(n.o[0])} ${f3(n.o[1])})`}
          fill={base}
        />
        <path d={band} fill={col(PAY_TONE.noteBand)} opacity={0.55} />
        <path d={inner} fill={base} />
        <ellipse cx={f3(mc[0])} cy={f3(mc[1])} rx={f3(mr * 1.15)} ry={f3(mr)} transform={`rotate(${f3(n.deg)} ${f3(mc[0])} ${f3(mc[1])})`} fill={col(PAY_TONE.medal)} />
        <text
          x={f3(mc[0])}
          y={f3(mc[1] + 6.2 * s)}
          transform={`rotate(${f3(n.deg)} ${f3(mc[0])} ${f3(mc[1])})`}
          fontFamily="StoutSohneDreiviertelfett"
          fontSize={f3(18 * s)}
          textAnchor="middle"
          fill={col(PAY_TONE.noteInk)}
        >
          €
        </text>
        <circle cx={f3(dot[0])} cy={f3(dot[1])} r={f3(5 * s)} fill={col(PAY_TONE.noteInk)} opacity={0.55} />
        <circle cx={f3(dot2[0])} cy={f3(dot2[1])} r={f3(5 * s)} fill={col(PAY_TONE.noteInk)} opacity={0.55} />
      </g>
    );
  };
  const stk = S.sticker;
  const stTL = sS.P(stk.cx - stk.w / 2, stk.cy + stk.h / 2);
  const stC = sS.P(stk.cx, stk.cy);
  const tB = sB.P(B.cx + B.text.dx, B.text.cy);
  // the bow on the band: two teardrop loops out to either side of the knot, two short tails hanging down
  const kn = sB.knot;
  const KL = PAY.bonus.cx - PAY.bonus.w / 2 + PAY.bonus.ribbon.at / 2 + 1;
  const KH = PAY.bonus.h - PAY.bonus.ribbon.at / 2 - 1;
  const BP = (lx: number, ly: number) => sB.P(KL + lx, KH + ly);
  const bw = PAY.bonus.ribbon.bow;
  const loop = (d: 1 | -1) => softClosed([BP(0, 1), BP(d * 8 * bw, 15 * bw), BP(d * 26 * bw, 14 * bw), BP(d * 26 * bw, -5 * bw), BP(d * 8 * bw, -5 * bw)]);
  const tail = (d: 1 | -1) => polyD([BP(-d * 2, 0), BP(d * 9 * bw - 3.5, -13 * bw), BP(d * 9 * bw + 3.5, -11 * bw), BP(d * 2, 0)]);
  const ribbon = col(PAY_TONE.ribbon);
  return (
    <g>
      <defs>
        {gradV("mn", col(PAY_TONE.manila), sS.P(0, S.h)[1], sBot)}
        {gradV("tc", col(PAY_TONE.terracotta), bTop, bBot)}
        {gradV("rb", ribbon, bTop - 20 * s, bBot)}
        <clipPath id={`${uid}bc`}>
          <path d={sB.body} />
        </clipPath>
      </defs>
      {/* shadows first: the union of everything that has landed, then whatever is still entering */}
      {unionSil.length ? <UnionShadow sil={unionSil} s={(S.w / 96) * s} strength={unionStrength} /> : null}
      {ownShadows}
      {/* THE SALARY: the open flap behind, the banknotes, the envelope's face with its sticker */}
      {salary > 0.001
        ? fade(
            eS.a,
            eS.blur,
            <g>
              <path d={sS.flap} fill={col(PAY_TONE.manilaIn)} />
              {sS.notes.map((n, i) => note(n, i))}
              <path d={sS.body} fill={`url(#${uid}mn)`} />
              <path d={sS.sideL} fill={mixHex(col(PAY_TONE.manila), COLOR.shadow, 0.07)} opacity={0.9} />
              <path d={sS.sideR} fill={mixHex(col(PAY_TONE.manila), COLOR.shadow, 0.1)} opacity={0.9} />
              <path d={sS.bottom} fill={mixHex(col(PAY_TONE.manila), LIGHT_TINT, 0.08)} />
              {/* the pocket's lip: a thin lit edge along the top of the face */}
              <path d={polyD([sS.P(-S.w / 2 + 3, S.h), sS.P(S.w / 2 - 3, S.h), sS.P(S.w / 2 - 3, S.h - 2.5), sS.P(-S.w / 2 + 3, S.h - 2.5)])} fill={topOf(mixHex(col(PAY_TONE.manila), LIGHT_TINT, 0.3))} />
              <path d={roundRect(stTL[0], stTL[1], side * stk.w * s, stk.h * s, 4 * s)} fill={col(PAY_TONE.sticker)} />
              <Label x={stC[0]} y={stC[1] + (stk.px * s * 0.718) / 2} k={k} text={stk.text} px={stk.px * s * k} tone="dark" />
            </g>,
          )
        : null}
      {/* THE BONUS: the ribboned envelope, then the coins landing on their stack */}
      {eB.a > 0.002
        ? fade(
            eB.a,
            eB.blur,
            <g>
              <path d={sB.body} fill={`url(#${uid}tc)`} />
              <path d={sB.seam} fill={mixHex(col(PAY_TONE.terracotta), COLOR.shadow, 0.14)} opacity={0.8} />
              <Label x={tB[0]} y={tB[1] + (B.text.px * s * 0.718) / 2} k={k} text="BONUS" px={B.text.px * s * k} tone="cream" />
              <g clipPath={`url(#${uid}bc)`}>
                <path d={sB.band} fill={`url(#${uid}rb)`} />
              </g>
              <path d={tail(1)} fill={mixHex(ribbon, COLOR.shadow, 0.1)} />
              <path d={tail(-1)} fill={mixHex(ribbon, COLOR.shadow, 0.06)} />
              <path d={loop(1)} fill={topOf(ribbon)} />
              <path d={loop(-1)} fill={ribbon} />
              <circle cx={f3(kn[0])} cy={f3(kn[1])} r={f3(6.5 * bw * s)} fill={mixHex(ribbon, COLOR.shadow, 0.08)} />
            </g>,
          )
        : null}
      {eC.map((c, i) => {
        if (c.a <= 0.002) return null;
        const p = coinParts(F, i, c.drop / k);
        const rim = col(PAY_TONE.brassRim);
        return fade(
          c.a,
          c.blur,
          <g>
            <path d={p.side} fill={col(PAY_TONE.brassSide)} />
            {/* the seam to the coin below: a dark arc along this coin's bottom edge */}
            <path
              d={`M${f3(p.cx - p.rx)} ${f3(p.top + p.hh)}A${f3(p.rx)} ${f3(p.ry)} 0 0 0 ${f3(p.cx + p.rx)} ${f3(p.top + p.hh)}`}
              fill="none"
              stroke={mixHex(col(PAY_TONE.brassSide), COLOR.shadow, 0.45)}
              strokeWidth={f3(1.6 * s)}
            />
            {/* the milled edge: a few darker ticks on the band */}
            {[-0.7, -0.35, 0, 0.35, 0.7].map((u, j) => (
              <path
                key={j}
                d={`M${f3(p.cx + u * p.rx)} ${f3(p.top + p.ry * Math.sqrt(1 - u * u) * 0.9)}v${f3(p.hh * 0.8)}`}
                stroke={mixHex(col(PAY_TONE.brassSide), COLOR.shadow, 0.18)}
                strokeWidth={f3(1.4 * s)}
              />
            ))}
            <path d={p.face} fill={col(PAY_TONE.brass)} />
            <path d={ellipseD(p.cx, p.top, p.rx * 0.74, p.ry * 0.74)} fill="none" stroke={rim} strokeWidth={f3(2 * s)} opacity={0.8} />
            <path d={ellipseD(p.cx - p.rx * 0.18, p.top - p.ry * 0.25, p.rx * 0.32, p.ry * 0.3)} fill={rim} opacity={0.35} />
          </g>,
          `c${i}`,
        );
      })}
    </g>
  );
};

// --- load-time checks ------------------------------------------------------------------------------------------------
{
  const st = PAY.salary.sticker;
  if (labelWidth(st.text, st.px) > st.w - 10) throw new Error(`payProps: SALARY ${labelWidth(st.text, st.px).toFixed(0)} wide on a ${st.w} sticker`);
  const B = PAY.bonus;
  const tw = labelWidth("BONUS", B.text.px);
  if (B.cx + B.text.dx - tw / 2 < B.cx - B.w / 2 + 8 || B.cx + B.text.dx + tw / 2 > B.cx + B.w / 2 - 8) throw new Error("payProps: BONUS overruns its envelope");
  if (B.text.cy + (B.text.px * 0.718) / 2 > B.h - 8) throw new Error("payProps: BONUS too high on its envelope");
  // the bonus envelope and its bow stay under the SALARY sticker; the bow's tails stay above BONUS
  const knotH = B.h - B.ribbon.at / 2 - 1;
  if (knotH + 15 * B.ribbon.bow > st.cy - st.h / 2) throw new Error("payProps: the bonus bow covers the SALARY sticker");
  if (knotH - 13 * B.ribbon.bow < B.text.cy + (B.text.px * 0.718) / 2 + 2) throw new Error("payProps: the bow's tails reach BONUS");
  if (st.cy + st.h / 2 > PAY.salary.h - 3) throw new Error("payProps: the SALARY sticker overruns the envelope's top");
}
