// ---------------------------------------------------------------------------
// romeFolkProbe — probe sheets of the drawn Roman folk (romeFolk.tsx). Render entry src/entry.RomeFolk.ts.
//   RomeFolkStyle    THE STYLE SHEET on palette A's air: every kind front / three-quarter / profile, the fettered
//                    woman, the freewoman, the Dominus reclining by the coin heap, the overseer with his rod; the old
//                    romeCast figures beside them and the pandemics' folk Worker (the same hand)
//   RomeFolkPhone    a 1080 x 1920 frame in the air: the four kinds at ~220 px and a crowd at ~120 px, the crowd
//                    fogged into the air left to right (fog amount 0 .. 0.56)
//   RomeFolkStrip    one pose's cycle, every 2nd frame, at ~520 px (row 1) and ~170 px (row 2): props.strip = pose
//   RomeFolkMotion   one pose, one figure, animated (for the pop detector / frame-differences): props.strip
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AirStage, H as AH, makeAirView, mixHex, type AirScene } from "../kyle-pandemics/pandemicAir";
import { FolkWorker, stand as workerStand } from "../kyle-pandemics/pandemicFolk";
import { RomeFigure as OldFigure, scaleForPx as oldScale } from "./romeCast";
import {
  CoinHeap,
  Couch,
  GRIND,
  HAUL,
  POSES,
  POTTER,
  PUSH,
  PotterWheel,
  RomeContactShadow,
  RomeFigure,
  RomeFolkLayer,
  RotaryQuern,
  Stool,
  TREAD,
  WALK_CYCLE,
  headTurn,
  lerpFig,
  mirrorPose,
  pushAdvance,
  quernHandle,
  reclineAt,
  romeAnchors,
  scaleForPx,
  walkAdvance,
  Amphora,
  Sack,
  Basket,
  type FigPose,
  type RomeKind,
  type RomeFigureProps,
} from "./romeFolk";

type P2 = [number, number];
const SCENE: AirScene = { look: "A", mood: "day", F: 1000, fogNear: 800, fogVis: 2200, fogMax: 0.97, hLow: 0, hHigh: 300, moteUnit: 100 };
const FONT = "Helvetica, Arial, sans-serif";
const TXT = "#F3EBDD";

const airCss = (v: ReturnType<typeof makeAirView>, f: number) => {
  const c = v.airAtScreen(f * AH);
  return `rgb(${c.map((x) => Math.round(x)).join(",")})`;
};
/** a sheet's backdrop: AirStage (graded air, glow, grade, vignette) + a sand-umber floor + a few soft shafts */
const SheetAir: React.FC<{ w: number; h: number; base: number[]; id: string; grain?: number; children?: React.ReactNode }> = ({ w, h, base, id, grain = 0, children }) => {
  const v = makeAirView({ scene: SCENE, frame: 0, horizon: 1250 });
  return (
    <div style={{ position: "relative", width: w, height: h, overflow: "hidden" }}>
      <AirStage v={v} shafts={0} motes={0} grain={grain} bloom={0.22}>
        <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
          <defs>
            {base.map((b, i) => (
              <linearGradient key={i} id={`fl${id}${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={airCss(v, 0.55)} stopOpacity={0} />
                <stop offset="0.35" stopColor={mixHex("#857659", "#5F877D", 0.35)} stopOpacity={0.55} />
                <stop offset="1" stopColor={mixHex("#6B5E49", "#3A3128", 0.3)} stopOpacity={1} />
              </linearGradient>
            ))}
            <linearGradient id={`sh${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#F3EBDD" stopOpacity={0.14} />
              <stop offset="1" stopColor="#F3EBDD" stopOpacity={0} />
            </linearGradient>
          </defs>
          {[0.04, 0.19, 0.31, 0.52, 0.66, 0.83].map((f, i) => {
            const x0 = f * w;
            const ww = 80 + ((i * 37) % 110);
            const run = h * 0.4;
            return <polygon key={i} points={`${x0},0 ${x0 + ww},0 ${x0 + ww + run},${h} ${x0 + run},${h}`} fill={`url(#sh${id})`} style={{ mixBlendMode: "screen" }} />;
          })}
          {base.map((b, i) => (
            <rect key={i} x={0} y={b - 140} width={w} height={150 + (i < base.length - 1 ? 0 : h - b)} fill={`url(#fl${id}${i})`} />
          ))}
          {children}
        </svg>
      </AirStage>
    </div>
  );
};
const Lbl: React.FC<{ x: number; y: number; t: string; size?: number; op?: number }> = ({ x, y, t, size = 24, op = 0.8 }) => (
  <text x={x} y={y} fill={TXT} fontFamily={FONT} fontSize={size} textAnchor="middle" opacity={op}>
    {t}
  </text>
);

// ---------------------------------------------------------------------------
// THE STYLE SHEET
// ---------------------------------------------------------------------------
/** a profile view: the standing pose turned further (yaw 1.25) */
const profile = (dir: 1 | -1): FigPose => {
  const q = POSES.stand(1);
  const p: FigPose = { ...q, yaw: 1.25, headYaw: 1.25, armL: { ...q.armL, w: [-10, -139] }, armR: { ...q.armR, w: [14, -141] } };
  return dir === 1 ? p : mirrorPose(p);
};
type Cell = { kind: RomeKind; v: number; label: string; pose: FigPose; props?: Partial<RomeFigureProps>; old?: boolean };
const MANPX = 640;
const ROW1: Cell[] = [
  { kind: "slave", v: 0, label: "old romeCast slave", pose: POSES.stand(1), old: true },
  { kind: "slave", v: 0, label: "slave, front", pose: POSES.front() },
  { kind: "slave", v: 0, label: "three-quarter", pose: POSES.stand(1) },
  { kind: "slave", v: 0, label: "profile", pose: profile(1) },
  { kind: "slave", v: 1, label: "slave, exomis + fetters", pose: headTurn(POSES.stand(-1), -0.4), props: { garb: "exomis", fetters: true } },
  { kind: "slave", v: 3, label: "slave woman, fettered", pose: POSES.stand(1), props: { fetters: true, collar: true } },
  { kind: "slave", v: 4, label: "older, collar, chalk, titulus", pose: POSES.stoop(1), props: { collar: true, chalk: true, titulus: true } },
  { kind: "slave", v: 2, label: "loincloth (the mine)", pose: POSES.front(), props: { garb: "loincloth" } },
];
const ROW2: Cell[] = [
  { kind: "freeman", v: 0, label: "old romeCast freeman", pose: POSES.stand(1), old: true },
  { kind: "freeman", v: 0, label: "freeman, front", pose: POSES.front() },
  { kind: "freeman", v: 0, label: "three-quarter", pose: POSES.stand(1) },
  { kind: "freeman", v: 1, label: "profile", pose: profile(1) },
  { kind: "freeman", v: 2, label: "freeman 2, older", pose: POSES.stand(-1) },
  { kind: "freeman", v: 3, label: "freewoman (shopkeeper)", pose: POSES.gesture(1, 1) },
];
const ROW3: Cell[] = [
  { kind: "dominus", v: 0, label: "old romeCast dominus", pose: POSES.stand(1), old: true },
  { kind: "dominus", v: 0, label: "dominus, front", pose: POSES.front() },
  { kind: "dominus", v: 0, label: "three-quarter", pose: POSES.stand(1) },
  { kind: "dominus", v: 2, label: "profile", pose: profile(1), props: { stripe: true } },
  { kind: "overseer", v: 0, label: "overseer, front", pose: POSES.front() },
  { kind: "overseer", v: 0, label: "three-quarter, rod raised", pose: POSES.raiseRod(1, 1) },
  { kind: "overseer", v: 1, label: "profile, whip", pose: profile(1), props: { tool: "whip" } },
];
const COLW = 420;
export const STYLE_W = 10 * COLW + 900;
export const STYLE_H = 3 * 900 + 120;
export const RomeFolkStyle: React.FC = () => {
  const s = scaleForPx(MANPX);
  const bases = [880, 1780, 2680];
  const cellEl = (c: Cell, x: number, base: number, key: string) => {
    const at: P2 = [x, base];
    return (
      <g key={key}>
        <RomeContactShadow at={at} scale={s} uid={`cs${key}`} />
        {c.old ? <OldFigure kind={c.kind} variant={c.v} pose={c.pose} at={at} scale={oldScale(MANPX)} uid={`o${key}`} shade={1} /> : <RomeFigure kind={c.kind} variant={c.v} pose={c.pose} at={at} scale={s} uid={`f${key}`} {...c.props} />}
        <Lbl x={x} y={base + 64} t={c.label} />
      </g>
    );
  };
  const rows = [ROW1, ROW2, ROW3];
  // the reclining dominus by his coin heap (row 2, right), the pandemics' folk Worker (row 1, right)
  const couchAt: P2 = [6 * COLW + 520, bases[1] - 6];
  const domAt = reclineAt(couchAt, s, 1);
  const wx = STYLE_W - 300;
  return (
    <SheetAir w={STYLE_W} h={STYLE_H} base={bases} id="st">
      {rows.map((row, i) => row.map((c, j) => cellEl(c, 230 + j * COLW, bases[i], `${i}x${j}`)))}
      <RomeContactShadow at={couchAt} scale={s} w={210} uid="cscouch" />
      <Couch at={couchAt} scale={s} uid="couch" dir={1} />
      <RomeFigure kind="dominus" variant={1} pose={POSES.recline(1)} at={domAt} scale={s} uid="rec" held="cup" stripe />
      <RomeContactShadow at={[couchAt[0] + 330 * s + 120, bases[1]]} scale={s} w={120} uid="csheap" />
      <CoinHeap at={[couchAt[0] + 330 * s + 120, bases[1]]} scale={s} uid="heap" amount={0.75} />
      <Lbl x={couchAt[0] + 120} y={bases[1] + 64} t="dominus reclining, coin heap (orange)" />
      {bases.map((b, i) => (
        <g key={`wk${i}`}>
          <RomeContactShadow at={[wx, b]} scale={s} uid={`csw${i}`} />
          <FolkWorker pose={workerStand([0, 0.6, 1.2][i])} x={wx} y={b} scale={(MANPX * 1.04) / 513} uid={`wk${i}`} />
          <Lbl x={wx} y={b + 64} t="pandemics folk Worker (same hand)" />
        </g>
      ))}
    </SheetAir>
  );
};

// ---------------------------------------------------------------------------
// PHONE: a 1080 x 1920 frame in the air
// ---------------------------------------------------------------------------
export const RomeFolkPhone: React.FC = () => {
  const s1 = scaleForPx(220);
  const s2 = scaleForPx(120);
  const big: Cell[] = [
    { kind: "slave", v: 1, label: "", pose: POSES.stand(1), props: { fetters: true, collar: true, garb: "exomis" } },
    { kind: "freeman", v: 0, label: "", pose: POSES.stand(1) },
    { kind: "dominus", v: 0, label: "", pose: POSES.gesture(-1, 1) },
    { kind: "overseer", v: 0, label: "", pose: POSES.raiseRod(-1, 1) },
  ];
  const crowd: Cell[] = [
    { kind: "slave", v: 0, label: "", pose: POSES.walk(1, 0.1) },
    { kind: "slave", v: 3, label: "", pose: POSES.stand(1) },
    { kind: "freeman", v: 1, label: "", pose: POSES.stand(-1) },
    { kind: "slave", v: 2, label: "", pose: POSES.walk(1, 0.6) },
    { kind: "freeman", v: 3, label: "", pose: POSES.front() },
    { kind: "dominus", v: 1, label: "", pose: POSES.stand(-1) },
    { kind: "slave", v: 4, label: "", pose: POSES.stoop(1) },
    { kind: "overseer", v: 2, label: "", pose: POSES.gesture(1, 1), props: { tool: "none" } },
  ];
  // the far row fogs into the air by an amount rising left to right (0 .. 0.56): the `fog` prop
  const airV = makeAirView({ scene: SCENE, frame: 0, horizon: 1250 });
  return (
    <SheetAir w={1080} h={1920} base={[1000, 1500]} id="ph" grain={1}>
      {big.map((c, i) => {
        const at: P2 = [150 + i * 260, 1000];
        return (
          <g key={i}>
            <RomeContactShadow at={at} scale={s1} uid={`pb${i}`} />
            <RomeFigure kind={c.kind} variant={c.v} pose={c.pose} at={at} scale={s1} uid={`pb${i}f`} {...c.props} />
          </g>
        );
      })}
      {crowd.map((c, i) => {
        const at: P2 = [80 + i * 130, 1500];
        return (
          <g key={i}>
            <RomeContactShadow at={at} scale={s2} uid={`pc${i}`} />
            <RomeFigure kind={c.kind} variant={c.v} pose={c.pose} at={at} scale={s2} uid={`pc${i}f`} fog={{ rgb: airV.airAtScreen(1440), amount: 0.08 * i }} {...c.props} />
          </g>
        );
      })}
    </SheetAir>
  );
};

// ---------------------------------------------------------------------------
// POSE STRIPS: every 2nd frame of one cycle
// ---------------------------------------------------------------------------
export type StripName = "walk" | "push" | "tread" | "carry" | "grind" | "strike" | "potter" | "sit" | "recline" | "haul" | "stoop" | "raiseRod" | "turn";
type Perf = {
  kind: RomeKind;
  v: number;
  frames: number;
  props?: Partial<RomeFigureProps>;
  /** the performance at frame f: pose, feet, grips, and the scene drawn behind / in front (world px at scale s) */
  at: (f: number, s: number, at0: P2) => { pose: FigPose; at: P2; grip?: { L?: P2; R?: P2 }; back?: React.ReactNode; front?: React.ReactNode };
};
const PERF: Record<StripName, Perf> = {
  walk: { kind: "slave", v: 0, frames: WALK_CYCLE, props: { fetters: true }, at: (f, s, a) => ({ pose: POSES.walk(1, f / WALK_CYCLE), at: [a[0] + walkAdvance(s) * f, a[1]] }) },
  push: {
    kind: "slave",
    v: 1,
    frames: PUSH.cycle,
    props: { garb: "exomis", fetters: true },
    at: (f, s, a) => {
      const at: P2 = [a[0] + pushAdvance(s) * f, a[1]];
      const gL: P2 = [at[0] + PUSH.grip[0] * s, at[1] + PUSH.grip[1] * s];
      const gR: P2 = [at[0] + PUSH.gripFar[0] * s, at[1] + PUSH.gripFar[1] * s];
      const bar = (
        <g>
          <line x1={gL[0] - 60 * s} y1={gL[1] + 2 * s} x2={gL[0] + 60 * s} y2={gL[1] - 2 * s} stroke="#6E5440" strokeWidth={9 * s} strokeLinecap="round" />
        </g>
      );
      return { pose: POSES.push(1, f / PUSH.cycle), at, grip: { L: gL, R: gR }, back: bar };
    },
  },
  tread: {
    kind: "slave",
    v: 2,
    frames: 40,
    props: { garb: "loincloth" },
    at: (f, s, a) => {
      const ph = f / 40;
      const rail: P2 = [a[0] + TREAD.rail[0] * s, a[1] + TREAD.rail[1] * s];
      const railF: P2 = [a[0] + TREAD.railFar[0] * s, a[1] + TREAD.railFar[1] * s];
      // the slats: the rim surface moving top -> bottom (55 units per half cycle)
      const slats = Array.from({ length: 6 }, (_, i) => {
        const u = (((i / 3 + ph * 2) % 2) + 2) % 2;
        const x = a[0] + (TREAD.top[0] + (TREAD.bottom[0] - TREAD.top[0]) * (u - 0.5) * 1) * s;
        const y = a[1] + (TREAD.top[1] + (TREAD.bottom[1] - TREAD.top[1]) * (u - 0.5) * 1) * s;
        return <line key={i} x1={x - 26 * s} y1={y + 2 * s} x2={x + 26 * s} y2={y + 2 * s} stroke="#6E5440" strokeWidth={6 * s} strokeLinecap="round" />;
      });
      return {
        pose: POSES.tread(1, ph),
        at: a,
        grip: { L: rail, R: railF },
        back: (
          <g>
            <line x1={a[0] + (TREAD.top[0] + 60) * s} y1={a[1] + (TREAD.top[1] - 60 * 0.55) * s} x2={a[0] + (TREAD.bottom[0] - 60) * s} y2={a[1] + (TREAD.bottom[1] + 60 * 0.55) * s} stroke="#584334" strokeWidth={4 * s} />
            {slats}
            <line x1={rail[0] - 50 * s} y1={rail[1]} x2={rail[0] + 40 * s} y2={rail[1]} stroke="#6E5440" strokeWidth={8 * s} strokeLinecap="round" />
          </g>
        ),
      };
    },
  },
  carry: { kind: "slave", v: 0, frames: WALK_CYCLE, props: { load: "amphora" }, at: (f, s, a) => ({ pose: POSES.carry(1, f / WALK_CYCLE), at: [a[0] + walkAdvance(s) * f, a[1]] }) },
  grind: {
    kind: "slave",
    v: 3,
    frames: 40,
    at: (f, s, a) => {
      const ph = f / 40;
      const qAt: P2 = [a[0] + GRIND.quernDX * s, a[1]];
      return { pose: POSES.grind(1, ph), at: a, grip: { L: quernHandle(qAt, s, ph, 1) }, front: <RotaryQuern at={qAt} scale={s} uid={`q${f}`} turn={ph} dir={1} /> };
    },
  },
  strike: { kind: "freeman", v: 0, frames: 40, props: { tool: "hammer" }, at: (f, s, a) => ({ pose: POSES.strike(1, f / 40), at: a }) },
  potter: {
    kind: "slave",
    v: 1,
    frames: 40,
    at: (f, s, a) => {
      const ph = f / 40;
      return {
        pose: POSES.potter(1, ph),
        at: a,
        back: <Stool at={[a[0] + POTTER.stoolDX * s, a[1]]} scale={s} uid={`st${f}`} />,
        front: <PotterWheel at={[a[0] + POTTER.wheelDX * s, a[1]]} scale={s} uid={`pw${f}`} turn={ph * 3} dir={1} />,
      };
    },
  },
  sit: {
    kind: "slave",
    v: 0,
    frames: 40,
    at: (f, s, a) => {
      const t = Math.min(1, f / 36);
      const e = t * t * (3 - 2 * t);
      return { pose: lerpFig(POSES.stand(1), POSES.potter(1, 0), e), at: a, back: <Stool at={[a[0] + POTTER.stoolDX * s, a[1]]} scale={s} uid={`st${f}`} /> };
    },
  },
  recline: {
    kind: "dominus",
    v: 1,
    frames: 40,
    props: { held: "cup" },
    at: (f, s, a) => {
      const t = Math.min(1, f / 36);
      const e = t * t * (3 - 2 * t);
      const couchAt: P2 = [a[0] + 40 * s, a[1]];
      const rAt = reclineAt(couchAt, s, 1);
      const at: P2 = [a[0] + (rAt[0] - a[0]) * e, a[1] + (rAt[1] - a[1]) * e];
      return { pose: lerpFig(POSES.stand(1), POSES.recline(1), e), at, back: <Couch at={couchAt} scale={s} uid={`c${f}`} dir={1} /> };
    },
  },
  haul: {
    kind: "slave",
    v: 4,
    frames: 40,
    at: (f, s, a) => {
      const x = a[0] + HAUL.ropeX * s;
      const off = ((f / 40) * 2 * (HAUL.lo - HAUL.hi)) % 40;
      return {
        pose: POSES.haul(1, f / 40),
        at: a,
        back: (
          <g>
            <line x1={x} y1={a[1] + (HAUL.hi - 120) * s} x2={x} y2={a[1] - 20 * s} stroke="#8A7458" strokeWidth={5 * s} />
            {Array.from({ length: 12 }, (_, i) => <line key={i} x1={x - 2.5 * s} y1={a[1] + (HAUL.hi - 120 + i * 20 + off) * s} x2={x + 2.5 * s} y2={a[1] + (HAUL.hi - 116 + i * 20 + off) * s} stroke="#5C4A36" strokeWidth={1.5 * s} />)}
          </g>
        ),
      };
    },
  },
  stoop: { kind: "slave", v: 4, frames: 20, props: { collar: true, chalk: true, titulus: true }, at: (f, s, a) => ({ pose: lerpFig(POSES.stand(1), POSES.stoop(1), Math.min(1, f / 18)), at: a }) },
  raiseRod: { kind: "overseer", v: 0, frames: 30, at: (f, s, a) => ({ pose: POSES.raiseRod(1, Math.min(1, f / 26)), at: a }) },
  turn: {
    kind: "freeman",
    v: 0,
    frames: 40,
    at: (f, s, a) => {
      const t = Math.min(1, f / 38);
      const e = t * t * (3 - 2 * t);
      const q = lerpFig(POSES.stand(-1), POSES.stand(1), e);
      return { pose: q, at: a };
    },
  },
};
const fig = (pf: Perf, f: number, s: number, a: P2, uid: string) => {
  const r = pf.at(f, s, a);
  return (
    <g key={uid}>
      {r.back}
      <RomeContactShadow at={r.at} scale={s} uid={`${uid}cs`} amount={0.8} />
      <RomeFigure kind={pf.kind} variant={pf.v} pose={r.pose} at={r.at} scale={s} uid={uid} grip={r.grip} {...pf.props} />
      {r.front}
    </g>
  );
};
export const stripSize = (name: StripName) => {
  const n = Math.ceil(PERF[name].frames / 2);
  return { w: Math.min(n, 10) * 330 + 60, h: Math.ceil(n / 10) * 640 + 360 + 40 };
};
export const RomeFolkStrip: React.FC<{ strip: StripName }> = ({ strip }) => {
  const pf = PERF[strip];
  const n = Math.ceil(pf.frames / 2);
  const { w, h } = stripSize(strip);
  const sBig = scaleForPx(520);
  const sSm = scaleForPx(170);
  const rowsBig = Math.ceil(n / 10);
  const bases = [...Array.from({ length: rowsBig }, (_, i) => 600 + i * 640), rowsBig * 640 + 330];
  // moving figures are drawn back at their cell (subtract the travel) so each cell frames the figure
  const cell = (i: number, s: number, base: number, x0: number, dx: number, tag: string) => {
    const f = i * 2;
    const r0 = pf.at(f, s, [0, 0]);
    const at0: P2 = [x0 + (i % 10) * dx - r0.at[0] * (strip === "recline" ? 0 : 1), base];
    return (
      <g key={`${tag}${i}`}>
        {fig(pf, f, s, at0, `${tag}${i}`)}
        <text x={x0 + (i % 10) * dx - 120} y={base + 40} fill={TXT} fontFamily={FONT} fontSize={18} opacity={0.7}>{`f${f}`}</text>
      </g>
    );
  };
  return (
    <SheetAir w={w} h={h} base={bases} id="sp">
      {Array.from({ length: n }, (_, i) => cell(i, sBig, bases[Math.floor(i / 10)], 150, 330, "b"))}
      {Array.from({ length: n }, (_, i) => {
        const f = i * 2;
        const r0 = pf.at(f, sSm, [0, 0]);
        const x = 80 + i * ((w - 160) / Math.max(1, n - 1));
        return <g key={`s${i}`}>{fig(pf, f, sSm, [x - r0.at[0] * (strip === "recline" ? 0 : 1), bases[bases.length - 1]], `s${i}`)}</g>;
      })}
    </SheetAir>
  );
};
/** one performance animated (frame = the frame), a figure ~500 px: for the frame-difference checks */
export const RomeFolkMotion: React.FC<{ strip: StripName }> = ({ strip }) => {
  const f = useCurrentFrame();
  const pf = PERF[strip];
  const s = scaleForPx(500);
  const r0 = pf.at(f % pf.frames, s, [0, 0]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#3E5A57" }}>
      <svg width={760} height={720} style={{ position: "absolute", left: 0, top: 0 }}>
        {fig(pf, f % pf.frames, s, [300 - (strip === "recline" ? 0 : r0.at[0]), 640], "m")}
      </svg>
    </AbsoluteFill>
  );
};
export { romeAnchors, Amphora, Sack, Basket };

// ---------------------------------------------------------------------------
// CROWD: 30 working figures in one frame (the filter cost): props.shared = one texture filter for the group
// ---------------------------------------------------------------------------
export const RomeFolkCrowd: React.FC<{ shared: boolean }> = ({ shared }) => {
  const f = useCurrentFrame();
  const kinds: RomeKind[] = ["slave", "slave", "freeman", "slave", "overseer", "slave", "dominus", "freeman"];
  const figs = Array.from({ length: 30 }, (_, i) => {
    const row = Math.floor(i / 6);
    const s = scaleForPx(150 + row * 40);
    const at: P2 = [90 + (i % 6) * 180 + ((f * walkAdvance(s)) % 180), 700 + row * 260];
    const kind = kinds[i % kinds.length];
    return (
      <g key={i}>
        <RomeContactShadow at={at} scale={s} uid={`c${i}`} />
        <RomeFigure kind={kind} variant={i % 3} pose={POSES.walk(1, (f + i * 7) / WALK_CYCLE)} at={at} scale={s} uid={`w${i}`} fetters={kind === "slave"} texture={!shared} />
      </g>
    );
  });
  return (
    <SheetAir w={1080} h={1920} base={[1900]} id="cr">
      {shared ? (
        <RomeFolkLayer uid="lay" px={0.25}>
          {figs}
        </RomeFolkLayer>
      ) : (
        figs
      )}
    </SheetAir>
  );
};
