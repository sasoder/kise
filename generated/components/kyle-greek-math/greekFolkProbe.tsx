// ---------------------------------------------------------------------------
// greekFolkProbe — probe sheets of the Greek cast (greekFolk.tsx). Render entry src/entry.GreekFolk.ts.
//   GreekFolkSheet   THE STYLE SHEET on palette A's air: Euclid front / three-quarter / profile / back at hero size,
//                    the seven Scholars, Diophantus writing, four Citizens, the five tablets at ~120 px, the scroll,
//                    the dividers, the armillary sphere; the pandemics Worker and RomeFolk's Freeman and Dominus beside
//                    them for the hand
//   GreekFolkStrip   one pose's cycle, every 2nd frame, at ~520 px (rows 1..) and ~170 px (last row): props.strip
//   GreekFolkMotion  one performance animated (for the frame-difference / pop checks): props.strip
//   GreekFolkHeads   Euclid's head turn (front -> back) at hero size, every 2nd frame
//   GreekFolkCrowd   the crowd sprites: 300 figures in depth on an AirFloor (Athenians near, Romans far right)
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AirStage, makeAirView, mixHex, H as AH, type AirScene } from "../kyle-pandemics/pandemicAir";
import { FolkWorker, stand as workerStand } from "../kyle-pandemics/pandemicFolk";
import { RomeFigure } from "../kyle-rome-slavery/romeFolk";
import { AirFloor, AirHorizonHazeW, AirStage as KitAirStage, airWorldOf, makeCamera, WorldSvg, type DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";
import {
  ArmillarySphere,
  Citizen,
  DIOPHANTUS_HELD,
  Dividers,
  Diophantus,
  EUCLID_HELD,
  Euclid,
  GreekFigure,
  POSES,
  RomeContactShadow,
  Scholar,
  Scroll,
  Stick,
  Stool,
  STOOL_SEAT,
  Tablet,
  CROWD_H_UNITS,
  FolkCanvas,
  GREEK_CROWD,
  MAN_UNITS,
  ROMAN_CROWD,
  WALK_CYCLE,
  crowdReq,
  crowdSway,
  crowdTier,
  crowdVeils,
  drawCrowd,
  greekAnchors,
  idle,
  lerpFig,
  scaleForPx,
  useFolkSprites,
  walkAdvance,
  type CrowdFig,
  type GPose,
  type Held,
  type SpriteReq,
  type FigPose,
  type GreekFigureProps,
  type GreekKind,
} from "./greekFolk";

const SCENE: AirScene = { look: "A", mood: "day", F: 1000, fogNear: 800, fogVis: 2200, fogMax: 0.97, hLow: 0, hHigh: 300, moteUnit: 100 };
const FONT = "Helvetica, Arial, sans-serif";
const TXT = "#F3EBDD";
const airCss = (v: ReturnType<typeof makeAirView>, f: number) => {
  const c = v.airAtScreen(f * AH);
  return `rgb(${c.map((x) => Math.round(x)).join(",")})`;
};
/** a sheet's backdrop (romeFolkProbe's): AirStage + a sand-umber floor band per row + a few soft shafts */
export const SheetAir: React.FC<{ w: number; h: number; base: number[]; id: string; grain?: number; children?: React.ReactNode }> = ({ w, h, base, id, grain = 0, children }) => {
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
export const SHEET_W = 4600;
export const SHEET_H = 2700;
type FigCell = { kind: GreekKind; v: number; label: string; pose: FigPose; props?: Partial<GreekFigureProps> };
const SCHOLARS: FigCell[] = [0, 1, 2, 3, 4, 5, 6].map((v) => ({
  kind: "scholar" as GreekKind,
  v,
  label: ["0 Thales-like", "1 Pythagoras-like", "2 curly dark beard", "3 young (Theaetetus)", "4 short grey beard", "5 broad, middle-aged", "6 Alexandrian"][v],
  pose: v === 3 ? POSES.holdTablet(1) : v === 1 ? POSES.stand(-1) : v === 5 ? POSES.front() : v === 6 ? POSES.stand(-1) : v % 2 ? POSES.stand(-1) : POSES.stand(1),
  props: v === 3 ? { held: { two: "tablet", diagram: "solids" } } : v === 6 ? { held: { R: "scrollClosed" } } : undefined,
}));
const CITIZENS: FigCell[] = [
  { kind: "citizen", v: 0, label: "citizen 0 (man)", pose: POSES.stand(1) },
  { kind: "citizen", v: 1, label: "citizen 1 (exomis)", pose: POSES.front() },
  { kind: "citizen", v: 3, label: "citizen 3 (woman, veiled)", pose: POSES.stand(-1) },
  { kind: "citizen", v: 4, label: "citizen 4 (woman, shawl)", pose: POSES.front() },
];
export const GreekFolkSheet: React.FC = () => {
  const bases = [1180, 2020, 2560];
  const sHero = scaleForPx(900);
  const sMid = scaleForPx(520);
  const euclidViews: { label: string; yaw: number; dir: 1 | -1 }[] = [
    { label: "Euclid, front", yaw: 0.0, dir: 1 },
    { label: "three-quarter", yaw: 0.68, dir: 1 },
    { label: "profile", yaw: Math.PI / 2, dir: -1 },
    { label: "three-quarter back", yaw: 2.45, dir: 1 },
    { label: "back", yaw: Math.PI, dir: 1 },
  ];
  const cell = (c: FigCell, x: number, base: number, s: number, key: string) => (
    <g key={key}>
      <RomeContactShadow at={[x, base]} scale={s} uid={`cs${key}`} />
      <GreekFigure kind={c.kind} variant={c.v} pose={c.pose} at={[x, base]} scale={s} uid={`f${key}`} {...c.props} />
      <Lbl x={x} y={base + 56} t={c.label} />
    </g>
  );
  const refX = 3400;
  const tabs = ["thales", "pythagoras", "lunes", "exhaustion", "solids"] as const;
  return (
    <SheetAir w={SHEET_W} h={SHEET_H} base={bases} id="gs">
      {euclidViews.map((e, i) => {
        const x = 330 + i * 590;
        const q = POSES.holdScroll(e.dir, e.yaw);
        return (
          <g key={`eu${i}`}>
            <RomeContactShadow at={[x, bases[0]]} scale={sHero} uid={`eucs${i}`} />
            <Euclid pose={q} at={[x, bases[0]]} scale={sHero} uid={`eu${i}`} held={EUCLID_HELD} />
            <Lbl x={x} y={bases[0] + 64} t={e.label} size={30} />
          </g>
        );
      })}
      {/* the reference: the pandemics Worker, RomeFolk Freeman and Dominus (the same hand) */}
      <g>
        <RomeContactShadow at={[refX + 150, bases[0]]} scale={sMid} uid="csw" />
        <FolkWorker pose={workerStand(0.6)} x={refX + 150} y={bases[0]} scale={(520 * 1.04) / 513} uid="wk" />
        <Lbl x={refX + 150} y={bases[0] + 56} t="pandemics Worker" />
        <RomeContactShadow at={[refX + 470, bases[0]]} scale={sMid} uid="csfr" />
        <RomeFigure kind="freeman" variant={0} pose={POSES.stand(-1)} at={[refX + 470, bases[0]]} scale={sMid} uid="fr" />
        <Lbl x={refX + 470} y={bases[0] + 56} t="RomeFolk Freeman" />
        <RomeContactShadow at={[refX + 790, bases[0]]} scale={sMid} uid="csdo" />
        <RomeFigure kind="dominus" variant={0} pose={POSES.stand(-1)} at={[refX + 790, bases[0]]} scale={sMid} uid="do" />
        <Lbl x={refX + 790} y={bases[0] + 56} t="RomeFolk Dominus" />
      </g>
      {SCHOLARS.map((c, i) => cell(c, 200 + i * 330, bases[1], sMid, `s${i}`))}
      <g>
        <RomeContactShadow at={[2560, bases[1]]} scale={sMid} uid="csdio" />
        <Diophantus pose={POSES.write(1, 0.3)} at={[2560, bases[1]]} scale={sMid} uid="dio" held={DIOPHANTUS_HELD} />
        <Lbl x={2560} y={bases[1] + 56} t="Diophantus, writing" />
        <Stool at={[2930, bases[1]]} scale={sMid} uid="stool" />
        <Diophantus pose={POSES.write(1, 0.6, true)} at={[2930 + 6 * sMid, bases[1]]} scale={sMid} uid="dio2" held={DIOPHANTUS_HELD} />
        <Lbl x={2930} y={bases[1] + 56} t="seated" />
      </g>
      {CITIZENS.map((c, i) => cell(c, 3330 + i * 330, bases[1], sMid, `c${i}`))}
      {/* row 3: the tablets at ~120 px, the scrolls, dividers, stick, stool, the armillary sphere */}
      {tabs.map((t, i) => {
        const x = 160 + i * 200;
        const s = 120 / 72;
        return (
          <g key={t}>
            <Tablet at={[x, bases[2] - 120]} scale={s} uid={`tb${i}`} diagram={t} />
            <Lbl x={x} y={bases[2] - 40} t={t} size={20} />
          </g>
        );
      })}
      <Scroll at={[1300, bases[2] - 140]} scale={2.4} uid="scrA" open diagram="elements" />
      <Lbl x={1300} y={bases[2] - 40} t="scroll: the Elements" size={20} />
      <Scroll at={[1650, bases[2] - 140]} scale={2.4} uid="scrB" open diagram="arithmetica" />
      <Lbl x={1650} y={bases[2] - 40} t="scroll: Arithmetica" size={20} />
      <Scroll at={[1900, bases[2] - 140]} scale={2.4} uid="scrC" angle={-20} />
      <Lbl x={1900} y={bases[2] - 40} t="closed" size={20} />
      <Dividers at={[2120, bases[2] - 230]} scale={2.6} uid="div" angle={90} open={28} />
      <Lbl x={2120} y={bases[2] - 40} t="dividers (bronze)" size={20} />
      <Stick at={[2280, bases[2] - 80]} scale={1.2} uid="stk" angle={-62} />
      <Lbl x={2380} y={bases[2] - 40} t="stick" size={20} />
      <ArmillarySphere at={[2700, bases[2] - 20]} scale={1.9} uid="arm" turn={0.08} />
      <Lbl x={2700} y={bases[2] + 30} t="armillary sphere" size={20} />
      <g>
        <RomeContactShadow at={[3700, bases[2] + 40]} scale={sMid} uid="cscd" />
        <Scholar variant={2} pose={POSES.crouchDraw(1, 0.2)} at={[3700, bases[2] + 40]} scale={sMid} uid="cd" held={{ L: "stick" }} />
        <Lbl x={3780} y={bases[2] + 84} t="crouchDraw (the stick's tip on the ground)" size={20} />
      </g>
      <g>
        <RomeContactShadow at={[4400, bases[2] + 40]} scale={sMid * 0.75} uid="csof" />
        <Scholar variant={0} pose={POSES.offerUp(-1, 1)} at={[4400, bases[2] + 40]} scale={sMid * 0.75} uid="of" held={{ two: "tablet", diagram: "lunes" }} />
        <Lbl x={4400} y={bases[2] + 84} t="offerUp" size={20} />
      </g>
    </SheetAir>
  );
};
// ---------------------------------------------------------------------------
// HEADS: every kind turning from the front (yaw 0) to the back (yaw PI) every 30 deg, the head and shoulders cropped
// per cell (rows: Euclid, the seven Scholars, Diophantus, the six Citizens)
// ---------------------------------------------------------------------------
const HEAD_KINDS: { kind: GreekKind; v: number; label: string }[] = [
  { kind: "euclid", v: 0, label: "Euclid" },
  ...[0, 1, 2, 3, 4, 5, 6].map((v) => ({ kind: "scholar" as GreekKind, v, label: `scholar ${v}` })),
  { kind: "diophantus", v: 0, label: "Diophantus" },
  ...[0, 1, 2, 3, 4, 5].map((v) => ({ kind: "citizen" as GreekKind, v, label: `citizen ${v}` })),
];
const HEAD_YAWS = [0, 30, 60, 90, 120, 150, 180];
const HC = { w: 230, h: 250, lab: 200 };
export const HEADS_W = HC.lab + HEAD_YAWS.length * HC.w + 20;
export const HEADS_H = 60 + HEAD_KINDS.length * HC.h;
/** a pose turned to any body yaw (arms hanging) */
const turned = (yaw: number): GPose => POSES.standAt(yaw);
export const GreekFolkHeads: React.FC = () => {
  const s = scaleForPx(640);
  return (
    <SheetAir w={HEADS_W} h={HEADS_H} base={[HEADS_H + 400]} id="hd">
      {HEAD_YAWS.map((y, j) => (
        <Lbl key={`y${j}`} x={HC.lab + j * HC.w + HC.w / 2} y={40} t={`yaw ${y}\u00b0`} size={24} />
      ))}
      {HEAD_KINDS.map((hk, i) => (
        <g key={`r${i}`}>
          <Lbl x={HC.lab / 2} y={60 + i * HC.h + HC.h / 2} t={hk.label} size={24} />
          {HEAD_YAWS.map((y, j) => {
            const x0 = HC.lab + j * HC.w;
            const y0 = 60 + i * HC.h;
            const yaw = (y * Math.PI) / 180;
            const pose = hk.kind === "euclid" ? POSES.holdScroll(1, yaw) : turned(yaw);
            return (
              <g key={`c${i}x${j}`}>
                <clipPath id={`hc${i}x${j}`}>
                  <rect x={x0 + 4} y={y0 + 4} width={HC.w - 8} height={HC.h - 8} rx={10} />
                </clipPath>
                <g clipPath={`url(#hc${i}x${j})`}>
                  <GreekFigure kind={hk.kind} variant={hk.v} pose={pose} at={[x0 + HC.w / 2, y0 + 30 + 300 * s]} scale={s} uid={`h${i}x${j}`} held={hk.kind === "euclid" ? EUCLID_HELD : undefined} />
                </g>
              </g>
            );
          })}
        </g>
      ))}
    </SheetAir>
  );
};
// ---------------------------------------------------------------------------
// TURNAROUND: Euclid (holdScroll) from the front to the back every 15 deg at ~520 px
// ---------------------------------------------------------------------------
export const TURN_W = 13 * 300 + 100;
export const TURN_H = 760;
export const GreekFolkTurnaround: React.FC = () => {
  const s = scaleForPx(520);
  return (
    <SheetAir w={TURN_W} h={TURN_H} base={[640]} id="ta">
      {Array.from({ length: 13 }, (_, i) => {
        const x = 200 + i * 300;
        const yaw = (i * 15 * Math.PI) / 180;
        return (
          <g key={i}>
            <RomeContactShadow at={[x, 640]} scale={s} uid={`tacs${i}`} />
            <Euclid pose={POSES.holdScroll(1, yaw)} at={[x, 640]} scale={s} uid={`ta${i}`} held={EUCLID_HELD} />
            <Lbl x={x} y={700} t={`${i * 15}\u00b0`} size={24} />
          </g>
        );
      })}
    </SheetAir>
  );
};
// ---------------------------------------------------------------------------
// PERFORMANCES (strips, motion, the pop detector all read this table)
// ---------------------------------------------------------------------------
type P2 = [number, number];
export type StripName = "turn" | "headTurn" | "lookUp" | "offerUp" | "holdTablet" | "write" | "writeSeated" | "crouchDraw" | "stickTo" | "gesture" | "walk" | "walkWoman";
export type Perf = {
  kind: GreekKind;
  v: number;
  frames: number;
  held?: Held;
  /** the performance at frame f: pose, feet (relative to at0, world px at scale s), stickTo, props behind */
  at: (f: number, s: number, at0: P2) => { pose: GPose; at: P2; stickTo?: P2; back?: React.ReactNode };
  /** moving figures: the strip cell subtracts the travel */
  travels?: boolean;
};
const ez = (t: number) => {
  const u = Math.max(0, Math.min(1, t));
  return u * u * (3 - 2 * u);
};
export const PERF: Record<StripName, Perf> = {
  turn: { kind: "euclid", v: 0, frames: 60, held: EUCLID_HELD, at: (f, s, a) => ({ pose: POSES.holdScroll(1, Math.PI * ez(f / 56)), at: a }) },
  headTurn: { kind: "euclid", v: 0, frames: 40, held: EUCLID_HELD, at: (f, s, a) => ({ pose: POSES.turnHead(POSES.holdScroll(1, 0.35), -0.7 + 2.3 * ez(f / 38)), at: a }) },
  lookUp: { kind: "scholar", v: 4, frames: 30, at: (f, s, a) => ({ pose: POSES.lookUp(1, ez(f / 28)), at: a }) },
  offerUp: { kind: "scholar", v: 0, frames: 60, held: { two: "tablet", diagram: "thales" }, at: (f, s, a) => ({ pose: POSES.offerUp(1, ez(f / 30), f > 30 ? (f - 30) / 30 : 0), at: a }) },
  holdTablet: { kind: "scholar", v: 3, frames: 40, held: { two: "tablet", diagram: "solids" }, at: (f, s, a) => ({ pose: idle(POSES.holdTablet(1, 0.1 + 1.1 * ez(f / 38)), f, 1) as GPose, at: a }) },
  write: { kind: "diophantus", v: 0, frames: 60, held: DIOPHANTUS_HELD, at: (f, s, a) => ({ pose: POSES.write(1, f / 60), at: a }) },
  writeSeated: {
    kind: "diophantus",
    v: 0,
    frames: 60,
    held: DIOPHANTUS_HELD,
    at: (f, s, a) => ({ pose: POSES.write(1, f / 60, true), at: a, back: <Stool at={[a[0] - 6 * s, a[1]]} scale={s} uid={`stl${f}${a[0].toFixed(0)}`} /> }),
  },
  crouchDraw: { kind: "scholar", v: 2, frames: 40, held: { L: "stick" }, at: (f, s, a) => ({ pose: POSES.crouchDraw(1, f / 40), at: a }) },
  stickTo: {
    kind: "scholar",
    v: 5,
    frames: 40,
    held: { L: "stick" },
    // the cut drives the tip along a straight line on the ground, out and back
    at: (f, s, a) => ({ pose: POSES.crouchDraw(1, 0), at: a, stickTo: [a[0] + (172 + 30 * Math.sin((2 * Math.PI * f) / 40)) * s, a[1]] }),
  },
  gesture: { kind: "scholar", v: 6, frames: 30, held: { R: "scrollClosed" }, at: (f, s, a) => ({ pose: lerpFig(POSES.stand(1), POSES.gesture(1, 1), ez(f / 26)), at: a }) },
  walk: { kind: "citizen", v: 0, frames: WALK_CYCLE, travels: true, at: (f, s, a) => ({ pose: POSES.walk(1, f / WALK_CYCLE), at: [a[0] + walkAdvance(s) * f, a[1]] }) },
  walkWoman: { kind: "citizen", v: 3, frames: WALK_CYCLE, travels: true, at: (f, s, a) => ({ pose: POSES.walk(-1, f / WALK_CYCLE), at: [a[0] - walkAdvance(s) * f, a[1]] }) },
};
const perfFig = (pf: Perf, f: number, s: number, a: P2, uid: string) => {
  const r = pf.at(f, s, a);
  return (
    <g key={uid}>
      {r.back}
      <RomeContactShadow at={r.at} scale={s} uid={`${uid}cs`} amount={0.8} />
      <GreekFigure kind={pf.kind} variant={pf.v} pose={r.pose} at={r.at} scale={s} uid={uid} held={pf.held} stickTo={r.stickTo} />
    </g>
  );
};
export const stripSize = (name: StripName) => {
  const n = Math.ceil(PERF[name].frames / 2);
  return { w: Math.min(n, 10) * 330 + 120, h: Math.ceil(n / 10) * 640 + 380 };
};
export const GreekFolkStrip: React.FC<{ strip: StripName }> = ({ strip }) => {
  const pf = PERF[strip];
  const n = Math.ceil(pf.frames / 2);
  const { w, h } = stripSize(strip);
  const sBig = scaleForPx(520);
  const sSm = scaleForPx(170);
  const rowsBig = Math.ceil(n / 10);
  const bases = [...Array.from({ length: rowsBig }, (_, i) => 600 + i * 640), rowsBig * 640 + 330];
  return (
    <SheetAir w={w} h={h} base={bases} id="sp">
      {Array.from({ length: n }, (_, i) => {
        const f = i * 2;
        const r0 = pf.at(f, sBig, [0, 0]);
        const x0 = 190 + (i % 10) * 330 - (pf.travels ? r0.at[0] : 0);
        return (
          <g key={`b${i}`}>
            {perfFig(pf, f, sBig, [x0, bases[Math.floor(i / 10)]], `b${i}`)}
            <text x={190 + (i % 10) * 330 - 140} y={bases[Math.floor(i / 10)] + 40} fill={TXT} fontFamily={FONT} fontSize={18} opacity={0.7}>{`f${f}`}</text>
          </g>
        );
      })}
      {Array.from({ length: n }, (_, i) => {
        const f = i * 2;
        const r0 = pf.at(f, sSm, [0, 0]);
        const x = 90 + i * ((w - 200) / Math.max(1, n - 1));
        return <g key={`s${i}`}>{perfFig(pf, f, sSm, [x - (pf.travels ? r0.at[0] : 0), bases[bases.length - 1]], `s${i}`)}</g>;
      })}
    </SheetAir>
  );
};
/** one performance animated, a figure ~500 px, on a plain ground (frame-difference / pop checks) */
export const GreekFolkMotion: React.FC<{ strip: StripName }> = ({ strip }) => {
  const f = useCurrentFrame();
  const pf = PERF[strip];
  const s = scaleForPx(500);
  const ff = f % pf.frames;
  const r0 = pf.at(ff, s, [0, 0]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#3E5A57" }}>
      <svg width={760} height={720} style={{ position: "absolute", left: 0, top: 0 }}>
        {perfFig(pf, ff, s, [330 - (pf.travels ? r0.at[0] : 0), 660], "m")}
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// CROWD: 300 sprites in depth on an AirFloor (the kit's air): Athenians near (a few scholars with orange tablets),
// Romans behind and to the right; fog by depth band through crowdVeils; a slow push so the tiers and veils move
// ---------------------------------------------------------------------------
const U = 178;
const CDEPTH: DepthOpts = { eyeY: -3.2 * U, dRef: 1800, kRef: 1.4, dolly: 0.5 };
const crowdCam = makeCamera(
  [
    { f: 0, k: 1.15, wx: 200, wy: -260, sy: 960 },
    { f: 90, k: 1.35, wx: 220, wy: -270, sy: 960 },
  ],
  true,
);
type CrowdMan = { X: number; Z: number; side: "greek" | "roman"; i: number; seed: number };
const hsh = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};
const CROWD_MEN: CrowdMan[] = (() => {
  const out: CrowdMan[] = [];
  // the Athenians: 120 in a loose block in front (left of centre)
  for (let i = 0; i < 120; i++) {
    const row = Math.floor(i / 12);
    const col = i % 12;
    out.push({ X: -1300 + col * 125 + 40 * (hsh(i, 1) - 0.5) + (row % 2) * 60, Z: 100 + row * 170 + 50 * hsh(i, 2), side: "greek", i: Math.floor(hsh(i, 3) * GREEK_CROWD.length), seed: i });
  }
  // the Romans: 180 behind, to the right, to the haze
  for (let i = 0; i < 180; i++) {
    const row = Math.floor(i / 15);
    const col = i % 15;
    out.push({ X: 100 + col * 120 + 40 * (hsh(i, 4) - 0.5) + (row % 2) * 60, Z: 1800 + row * 260 + 60 * hsh(i, 5), side: "roman", i: Math.floor(hsh(i, 6) * ROMAN_CROWD.length), seed: 500 + i });
  }
  return out.sort((a, b) => b.Z - a.Z);
})();
const VEIL_Z = [5000, 4300, 3600, 3000, 2400, 1900, 1400, 1000, 600];
const crowdAt = (frame: number) => {
  const cam = crowdCam(frame);
  const A = airWorldOf({ cam, rest: crowdCam(0), depth: CDEPTH, frame, fogBy: "eye" });
  const figs: CrowdFig[] = [];
  for (const m of CROWD_MEN) {
    const { at, scale } = A.P.at(m.X, m.Z);
    const sx = 540 + (at[0] - cam.cx) * cam.k;
    const sy = 960 + (at[1] - cam.cy) * cam.k;
    const hPx = MAN_UNITS * scale * cam.k;
    if (sx < -100 || sx > 1180 || sy < 0 || sy > 2100 || hPx < 6) continue;
    const sw = crowdSway(frame, m.seed);
    figs.push({ x: sx, y: sy, hPx, Z: m.Z, side: m.side, i: m.i, rot: sw.rot, sy: sw.sy });
  }
  return { A, cam, figs };
};
/** every sprite the crowd probe needs on any frame (baked once) */
const CROWD_REQS: SpriteReq[] = (() => {
  const seen = new Map<string, SpriteReq>();
  for (let f = 0; f <= 90; f += 10)
    for (const fg of crowdAt(f).figs) {
      const r = crowdReq(fg.side, fg.i, crowdTier(fg.hPx));
      if (!seen.has(r.key)) seen.set(r.key, r);
    }
  return [...seen.values()];
})();
export const GreekFolkCrowd: React.FC = () => {
  const frame = useCurrentFrame();
  const get = useFolkSprites(CROWD_REQS);
  const { A, cam, figs } = crowdAt(frame);
  const veils = crowdVeils((Z) => A.figFog(Z), (Z) => A.airHex(Z, 150), VEIL_Z);
  return (
    <KitAirStage v={A.v} bloom={0.22}>
      <WorldSvg cam={cam}>
        <AirFloor A={A} x0={-4000} x1={4500} z0={-1700} z1={9000} course={200} />
        <AirHorizonHazeW A={A} id="cz" />
      </WorldSvg>
      <FolkCanvas draw={(ctx) => drawCrowd(ctx, figs, get, veils, "#22180F")} />
    </KitAirStage>
  );
};
export const CROWD_COUNT = CROWD_MEN.length;
void CROWD_H_UNITS;
void greekAnchors;
void Citizen;
void STOOL_SEAT;
void useMemo;
