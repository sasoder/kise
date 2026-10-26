// ---------------------------------------------------------------------------
// vaccineFolkProbe — probe sheets of the kyle-vaccine cast (vaccineFolk.tsx). Render entry src/entry.VaccineFolk.ts.
//   VaccineFolkStyle   THE STYLE SHEET on palette A's air: every kind standing beside the pandemics Worker, a Rome
//                      Freeman and the covidFolk Carrier at the same height (the same hand?); the states (a child well /
//                      pox 0.5 / pox 1 / drain 0.6, a man with glowArm 1); the turn (front .. back)
//   VaccineFolkHeads   hero-size heads (a head ~260 px) at three yaws: hair, beard, hats, brows
//   VaccineFolkStrip   one performance, EVERY frame (props.strip), ~380 px figures, frame numbers
//   VaccineFolkPhone   a 1080 x 1920 frame: the cast at phone sizes
// The performances (PERF) are data, so the pop detector (scratch popcheck.ts) reads the same frames.
// ---------------------------------------------------------------------------
import React from "react";
import { AirStage, H as AH, makeAirView, mixHex, type AirScene } from "../kyle-pandemics/pandemicAir";
import { FolkWorker, stand as workerStand } from "../kyle-pandemics/pandemicFolk";
import { Freeman, POSES as ROME_POSES, scaleForPx as romeScale } from "../kyle-rome-slavery/romeFolk";
import { CovidFigure, POSES as COVID_POSES, scaleForPx as covidScale } from "../kyle-covid/covidFolk";
import {
  Bench,
  Book,
  POSES,
  SEAT,
  VaccineContactShadow,
  VaccineFigure,
  WALK_CYCLE,
  dangleSeat,
  handMeet,
  lerpPose,
  scaleForPx,
  strideK,
  vaccineAnchors,
  walkAdvance,
  wiltBack,
  type P2,
  type VPose,
  type VaccineFigureProps,
  type VaccineKind,
} from "./vaccineFolk";

const SCENE: AirScene = { look: "A", mood: "day", F: 1000, fogNear: 800, fogVis: 2200, fogMax: 0.97, hLow: 0, hHigh: 300, moteUnit: 100 };
const FONT = "Helvetica, Arial, sans-serif";
const TXT = "#F3EBDD";
const airCss = (v: ReturnType<typeof makeAirView>, f: number) => {
  const c = v.airAtScreen(f * AH);
  return `rgb(${c.map((x) => Math.round(x)).join(",")})`;
};
/** a sheet's backdrop: AirStage + a sand-umber floor band under each row (covidFolkProbe's) */
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
          </defs>
          {base.map((b, i) => (
            <rect key={i} x={0} y={b - 140} width={w} height={150 + (i < base.length - 1 ? 0 : h - b)} fill={`url(#fl${id}${i})`} />
          ))}
          {children}
        </svg>
      </AirStage>
    </div>
  );
};
const Lbl: React.FC<{ x: number; y: number; t: string; size?: number; op?: number; anchor?: "middle" | "start" }> = ({ x, y, t, size = 22, op = 0.8, anchor = "middle" }) => (
  <text x={x} y={y} fill={TXT} fontFamily={FONT} fontSize={size} textAnchor={anchor} opacity={op}>
    {t}
  </text>
);

// ---------------------------------------------------------------------------
// THE STYLE SHEET
// ---------------------------------------------------------------------------
type Cell = { kind: VaccineKind | "worker" | "freeman" | "carrier"; v?: number; label: string; pose?: VPose; props?: Partial<VaccineFigureProps>; seat?: number };
const profile = (dir: 1 | -1): VPose => {
  const q = POSES.turnTo(1.3 * dir);
  return { ...q, headYaw: 1.28 * dir };
};
const ROWS: Cell[][] = [
  [
    { kind: "worker", label: "pandemics Worker" },
    { kind: "freeman", label: "Rome Freeman" },
    { kind: "carrier", label: "covid Carrier" },
    { kind: "jenner", label: "JENNER", pose: POSES.stand(1) },
    { kind: "pasteur", label: "PASTEUR", pose: POSES.stand(-1) },
    { kind: "inoculator", v: 0, label: "Inoculator 0", pose: POSES.stand(1) },
    { kind: "inoculator", v: 1, label: "Inoculator 1", pose: POSES.stand(-1) },
    { kind: "parent", v: 0, label: "Parent 0 mother", pose: POSES.stand(1) },
    { kind: "parent", v: 1, label: "Parent 1 father", pose: POSES.front() },
    { kind: "parent", v: 2, label: "Parent 2 townswoman", pose: POSES.stand(-1) },
    { kind: "parent", v: 3, label: "Parent 3 townsman", pose: POSES.stand(1) },
  ],
  [
    { kind: "child", v: 0, label: "Child 0 (Phipps)", pose: POSES.stand(1) },
    { kind: "child", v: 1, label: "Child 1", pose: POSES.front() },
    { kind: "child", v: 2, label: "Child 2", pose: POSES.stand(-1) },
    { kind: "child", v: 3, label: "Child 3", pose: POSES.stand(1) },
    { kind: "child", v: 4, label: "Child 4", pose: POSES.front() },
    { kind: "child", v: 5, label: "Child 5", pose: POSES.stand(-1) },
    { kind: "child", v: 6, label: "Child 6", pose: POSES.stand(1) },
    { kind: "child", v: 7, label: "Child 7", pose: POSES.front() },
    { kind: "child", v: 8, label: "Child 8", pose: POSES.stand(-1) },
    { kind: "child", v: 9, label: "Child 9", pose: POSES.stand(1) },
    { kind: "jenner", label: "Jenner, book", pose: POSES.holdBook(-1, 0.4), props: { holdNear: "book" } },
  ],
  [
    { kind: "child", v: 0, label: "child well", pose: POSES.stand(1) },
    { kind: "child", v: 0, label: "pox 0.5", pose: POSES.stand(1), props: { pox: 0.5 } },
    { kind: "child", v: 0, label: "pox 1", pose: POSES.stand(1), props: { pox: 1 } },
    { kind: "child", v: 0, label: "drain 0.6", pose: POSES.stand(1), props: { drain: 0.6, pox: 1 } },
    { kind: "child", v: 3, label: "girl pox 1, front", pose: POSES.front(), props: { pox: 1 } },
    { kind: "parent", v: 1, label: "father, glowArm 1", pose: POSES.sleeveUp(1, 1), props: { glowArm: 1, glowSide: "R" } },
    { kind: "child", v: 0, label: "child sleeveUp + glowArm", pose: POSES.sleeveUp(-1, 1), props: { glowArm: 1, glowSide: "L" } },
    { kind: "parent", v: 0, label: "mother pox 1", pose: POSES.stand(-1), props: { pox: 1 } },
    { kind: "parent", v: 0, label: "slump, pox 0.8", pose: POSES.slump(1, 20), props: { pox: 0.8 }, seat: SEAT.h },
    { kind: "child", v: 3, label: "child sits (dangle)", pose: POSES.sit(1, 0), seat: -1 },
    { kind: "pasteur", label: "Pasteur, flask", pose: POSES.examineFlask(1, 1), props: { holdFar: "flask", flaskFill: 0.5 } },
  ],
  [
    { kind: "jenner", label: "front", pose: POSES.front() },
    { kind: "jenner", label: "three-quarter", pose: POSES.stand(-1) },
    { kind: "jenner", label: "profile", pose: profile(1) },
    { kind: "jenner", label: "back three-quarter", pose: POSES.turnTo(2.3) },
    { kind: "jenner", label: "back", pose: POSES.back() },
    { kind: "pasteur", label: "Pasteur front", pose: POSES.front() },
    { kind: "pasteur", label: "Pasteur profile", pose: profile(-1) },
    { kind: "pasteur", label: "Pasteur back", pose: POSES.back() },
    { kind: "parent", v: 2, label: "townswoman profile", pose: profile(1) },
    { kind: "parent", v: 3, label: "townsman back", pose: POSES.turnTo(-2.4) },
    { kind: "child", v: 5, label: "girl back (plait)", pose: POSES.back() },
  ],
];
const MANPX = 480;
const COLW = 300;
const ROWH = 720;
export const STYLE_W = 11 * COLW + 80;
export const STYLE_H = ROWS.length * ROWH + 60;
export const VaccineFolkStyle: React.FC = () => {
  const s = scaleForPx(MANPX);
  const bases = ROWS.map((_, i) => 620 + i * ROWH);
  const cellEl = (c: Cell, x: number, base: number, key: string) => {
    const at: P2 = [x, base];
    let fig: React.ReactNode;
    let back: React.ReactNode = null;
    if (c.kind === "worker") fig = <FolkWorker pose={workerStand(0.6)} x={x} y={base} scale={(MANPX * 1.04) / 513} uid={`wk${key}`} />;
    else if (c.kind === "freeman") fig = <Freeman pose={ROME_POSES.stand(1)} at={at} scale={romeScale(MANPX)} uid={`fr${key}`} />;
    else if (c.kind === "carrier") fig = <CovidFigure kind="carrier" pose={COVID_POSES.stand(-1)} at={at} scale={covidScale(MANPX)} uid={`cv${key}`} />;
    else {
      const pose = c.pose ?? POSES.stand(1);
      if (c.seat !== undefined) {
        const sh = c.seat < 0 ? dangleSeat(c.kind, c.v ?? 0) : c.seat;
        const q = { ...pose, seatH: sh };
        back = <Bench at={[x - 30 * s * (q.yaw > 0 ? 1 : -1), base]} scale={s} uid={`bn${key}`} seatH={sh} w={110} />;
        fig = <VaccineFigure kind={c.kind} variant={c.v ?? 0} pose={q} at={at} scale={s} uid={`f${key}`} frame={0} {...c.props} />;
      } else fig = <VaccineFigure kind={c.kind} variant={c.v ?? 0} pose={pose} at={at} scale={s} uid={`f${key}`} frame={0} {...c.props} />;
    }
    return (
      <g key={key}>
        {back}
        <VaccineContactShadow at={at} scale={s} uid={`cs${key}`} />
        {fig}
        <Lbl x={x} y={base + 50} t={c.label} size={20} />
      </g>
    );
  };
  return (
    <SheetAir w={STYLE_W} h={STYLE_H} base={bases} id="st">
      {ROWS.map((row, i) => row.map((c, j) => cellEl(c, 180 + j * COLW, bases[i], `${i}x${j}`)))}
    </SheetAir>
  );
};

// ---------------------------------------------------------------------------
// HEADS: hero-size heads (a head ~260 px on screen), three yaws
// ---------------------------------------------------------------------------
const HEAD_CELLS: { kind: VaccineKind; v: number; props?: Partial<VaccineFigureProps>; label: string }[] = [
  { kind: "jenner", v: 0, label: "Jenner" },
  { kind: "pasteur", v: 0, label: "Pasteur" },
  { kind: "child", v: 0, label: "Child 0" },
  { kind: "child", v: 3, label: "Child 3" },
  { kind: "child", v: 1, label: "Child 1" },
  { kind: "inoculator", v: 0, label: "Inoculator 0" },
  { kind: "parent", v: 3, label: "Townsman" },
  { kind: "child", v: 0, label: "Child 0 pox 1", props: { pox: 1 } },
];
export const HEADS_W = 4 * 3 * 330 + 80;
export const HEADS_H = 2 * 470 + 40;
export const VaccineFolkHeads: React.FC<{ worry?: number }> = ({ worry = 0 }) => {
  const s = scaleForPx(1000);
  const yaws = [0, 0.66, -1.25];
  return (
    <SheetAir w={HEADS_W} h={HEADS_H} base={[HEADS_H + 200]} id="hd">
      {HEAD_CELLS.map((c, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        return yaws.map((y, j) => {
          const cx = 205 + (col * 3 + j) * 330;
          const top = 70 + row * 470;
          const q: VPose = { ...POSES.turnTo(y), headYaw: y, worry };
          const sc = c.kind === "child" ? s * 1.15 : s;
          const a = vaccineAnchors(c.kind, q, [0, 0], sc, { variant: c.v });
          const at: P2 = [cx - a.headC[0], top + 190 - a.headC[1]];
          return (
            <g key={`${i}-${j}`}>
              <clipPath id={`hcl${i}x${j}`}>
                <rect x={cx - 160} y={top - 60} width={320} height={440} />
              </clipPath>
              <g clipPath={`url(#hcl${i}x${j})`}>
                <VaccineFigure kind={c.kind} variant={c.v} pose={q} at={at} scale={sc} uid={`hd${i}x${j}`} {...c.props} />
              </g>
              {j === 1 ? <Lbl x={cx} y={top + 420} t={c.label} size={26} /> : null}
            </g>
          );
        });
      })}
    </SheetAir>
  );
};

// ---------------------------------------------------------------------------
// POSE STRIPS: EVERY frame of one performance (data: figures and a few set pieces per frame)
// ---------------------------------------------------------------------------
export type StripName = "walkJenner" | "walkChild" | "walkGirl" | "inoculate" | "examineFlask" | "placeFlask" | "shelveBook" | "flinch" | "wilt" | "sleeveUp" | "holdHand" | "turn";
export type FigSpec = { kind: VaccineKind; v: number; pose: VPose; at: P2; props?: Partial<VaccineFigureProps>; id: string };
export type SetPiece = { kind: "bench"; at: P2; seatH: number; w: number } | { kind: "shelf"; x0: number; x1: number; y: number; books: { x: number; turn: number; color: string }[] } | { kind: "dot"; at: P2; color: string };
export type Perf = { frames: number; moving?: boolean; at: (f: number, s: number, a: P2) => { figs: FigSpec[]; set?: SetPiece[]; front?: SetPiece[] } };
const T = (f: number, n: number) => f / (n - 1);
/** the shelf's slot for the book (rig units from the cell anchor): the book's foot */
const SHELF_SLOT: P2 = [74, -280];
const BENCH_PT: P2 = [96, -168];
export const PERF: Record<StripName, Perf> = {
  walkJenner: { frames: WALK_CYCLE, moving: true, at: (f, s, a) => ({ figs: [{ kind: "jenner", v: 0, id: "j", pose: POSES.walk(1, f / WALK_CYCLE), at: [a[0] + walkAdvance(s) * f, a[1]] }] }) },
  walkChild: { frames: WALK_CYCLE, moving: true, at: (f, s, a) => ({ figs: [{ kind: "child", v: 0, id: "c", pose: POSES.walk(1, f / WALK_CYCLE), at: [a[0] + walkAdvance(s * strideK("child", 0)) * f, a[1]] }] }) },
  walkGirl: { frames: WALK_CYCLE, moving: true, at: (f, s, a) => ({ figs: [{ kind: "parent", v: 0, id: "m", pose: POSES.walk(-1, f / WALK_CYCLE), at: [a[0] - walkAdvance(s * strideK("parent", 0)) * f, a[1]] }] }) },
  inoculate: {
    frames: 50,
    at: (f, s, a) => {
      const t = T(f, 50);
      const childAt: P2 = [a[0] + 95 * s, a[1]];
      const cq = POSES.flinch(POSES.sleeveUp(-1, 1), (t - 0.5) / 0.4, t > 0.5 ? 1 : 0);
      const ca = vaccineAnchors("child", cq, childAt, s, { variant: 0 });
      const iq = POSES.inoculate(1, t);
      return {
        figs: [
          { kind: "child", v: 0, id: "c", pose: cq, at: childAt },
          { kind: "inoculator", v: 1, id: "i", pose: iq, at: [a[0] - 40 * s, a[1]], props: { lancetTo: ca.armSpotL, charge: { kind: "pox", amt: 1 - (t > 0.6 ? 1 : 0) } } },
        ],
        front: [{ kind: "dot", at: ca.armSpotL, color: t > 0.6 ? "#8E4552" : "none" }],
      };
    },
  },
  examineFlask: { frames: 40, at: (f, s, a) => ({ figs: [{ kind: "pasteur", v: 0, id: "p", pose: POSES.examineFlask(1, T(f, 40)), at: a, props: { holdFar: "flask", flaskFill: 0.45 } }] }) },
  placeFlask: {
    frames: 50,
    at: (f, s, a) => {
      const pt: P2 = [a[0] + BENCH_PT[0] * s, a[1] + BENCH_PT[1] * s];
      return { set: [{ kind: "bench", at: [pt[0] + 10 * s, a[1]], seatH: -BENCH_PT[1], w: 90 }], figs: [{ kind: "pasteur", v: 0, id: "p", pose: POSES.placeFlask(1, T(f, 50)), at: a, props: { holdFar: "flask", flaskFill: 0.45, flaskTo: pt } }] };
    },
  },
  shelveBook: {
    frames: 60,
    at: (f, s, a) => {
      const slot: P2 = [a[0] + SHELF_SLOT[0] * s, a[1] + SHELF_SLOT[1] * s];
      const books = [-3, -2, -1, 1, 2].map((i) => ({ x: slot[0] + i * 9 * s, turn: 1, color: ["#6A5040", "#5E6A70", "#8C5A4C", "#7A6E5E", "#5A4E42"][i + 3] }));
      return { set: [{ kind: "shelf", x0: slot[0] - 40 * s, x1: slot[0] + 40 * s, y: slot[1], books }], figs: [{ kind: "jenner", v: 0, id: "j", pose: POSES.shelveBook(1, T(f, 60)), at: a, props: { holdNear: "book", bookTo: slot } }] };
    },
  },
  flinch: { frames: 30, at: (f, s, a) => ({ figs: [{ kind: "child", v: 3, id: "c", pose: POSES.flinch(POSES.sleeveUp(-1, 1), T(f, 30)), at: a }] }) },
  wilt: {
    frames: 50,
    at: (f, s, a) => {
      const t = T(f, 50);
      const at: P2 = [a[0] - wiltBack(t, "parent", 0) * s, a[1]];
      const hip1: P2 = [a[0] - wiltBack(1, "parent", 0) * s, a[1]];
      return { set: [{ kind: "bench", at: [hip1[0] - 25 * s, a[1]], seatH: SEAT.h, w: 110 }], figs: [{ kind: "parent", v: 0, id: "m", pose: POSES.wilt(1, t), at, props: { pox: Math.min(1, 0.3 + t) } }] };
    },
  },
  sleeveUp: { frames: 30, at: (f, s, a) => ({ figs: [{ kind: "child", v: 0, id: "c", pose: POSES.sleeveUp(-1, T(f, 30)), at: a, props: { glowArm: Math.max(0, (T(f, 30) - 0.6) / 0.4), glowSide: "L" } }] }) },
  holdHand: {
    frames: 30,
    at: (f, s, a) => {
      const t = T(f, 30);
      const mAt: P2 = [a[0] - 50 * s, a[1]];
      const cAt: P2 = [a[0] + 55 * s, a[1]];
      const mq = POSES.holdHand({ ...POSES.turnTo(0.35), headYaw: 0.5 }, 1, t);
      const cq = POSES.holdHand({ ...POSES.turnTo(-0.3), headYaw: -0.55, look: [-0.4, -0.5] }, -1, t, true);
      const mh = vaccineAnchors("parent", mq, mAt, s, { variant: 0 }).handR;
      const ch = vaccineAnchors("child", cq, cAt, s, { variant: 7 }).handL;
      const M = handMeet(mh, ch);
      const g0 = Math.max(0, (t - 0.5) / 0.5);
      const g = g0 * g0 * (3 - 2 * g0);
      const mg: P2 = [mh[0] + (M[0] - mh[0]) * g, mh[1] + (M[1] - mh[1]) * g];
      const cg: P2 = [ch[0] + (M[0] - ch[0]) * g, ch[1] + (M[1] - ch[1]) * g];
      return {
        figs: [
          { kind: "child", v: 7, id: "c", pose: cq, at: cAt, props: { grip: { L: cg } } },
          { kind: "parent", v: 0, id: "m", pose: mq, at: mAt, props: { grip: { R: mg } } },
        ],
      };
    },
  },
  turn: {
    frames: 40,
    at: (f, s, a) => {
      const t = T(f, 40);
      const e = t * t * (3 - 2 * t);
      return { figs: [{ kind: "jenner", v: 0, id: "j", pose: lerpPose(POSES.stand(-1), POSES.turnTo(2.6), e), at: a }] };
    },
  },
};
const SetEl: React.FC<{ p: SetPiece; s: number; uid: string }> = ({ p, s, uid }) => {
  if (p.kind === "bench") return <Bench at={p.at} scale={s} uid={uid} seatH={p.seatH} w={p.w} />;
  if (p.kind === "dot") return p.color === "none" ? null : <circle cx={p.at[0]} cy={p.at[1]} r={Math.max(1.2, 1.4 * s)} fill={p.color} />;
  return (
    <g>
      <rect x={p.x0} y={p.y} width={p.x1 - p.x0} height={10 * s} fill="#6B5440" />
      <rect x={p.x0} y={p.y - 90 * s} width={6 * s} height={100 * s} fill="#5A4636" />
      {p.books.map((b, i) => (
        <Book key={i} at={[b.x, p.y]} scale={s} uid={`${uid}b${i}`} turn={b.turn} color={b.color} />
      ))}
    </g>
  );
};
const frameEl = (pf: Perf, f: number, s: number, a: P2, uid: string) => {
  const r = pf.at(f, s, a);
  return (
    <g key={uid}>
      {(r.set ?? []).map((p, i) => (
        <SetEl key={`s${i}`} p={p} s={s} uid={`${uid}s${i}`} />
      ))}
      {r.figs.map((g) => (
        <g key={g.id}>
          <VaccineContactShadow at={g.at} scale={s} uid={`${uid}${g.id}cs`} amount={0.8} />
          <VaccineFigure kind={g.kind} variant={g.v} pose={g.pose} at={g.at} scale={s} uid={`${uid}${g.id}`} frame={f} {...g.props} />
        </g>
      ))}
      {(r.front ?? []).map((p, i) => (
        <SetEl key={`f${i}`} p={p} s={s} uid={`${uid}f${i}`} />
      ))}
    </g>
  );
};
const PER_ROW = 10;
const CW = 300;
const RH = 520;
export const stripSize = (name: StripName) => {
  const n = PERF[name].frames;
  return { w: Math.min(n, PER_ROW) * CW + 60, h: Math.ceil(n / PER_ROW) * RH + 60 };
};
export const VaccineFolkStrip: React.FC<{ strip: StripName }> = ({ strip }) => {
  const pf = PERF[strip];
  const n = pf.frames;
  const { w, h } = stripSize(strip);
  const s = scaleForPx(380);
  const rows = Math.ceil(n / PER_ROW);
  const bases = Array.from({ length: rows }, (_, i) => 470 + i * RH);
  return (
    <SheetAir w={w} h={h} base={bases} id="sp">
      {Array.from({ length: n }, (_, i) => {
        const r0 = pf.at(i, s, [0, 0]);
        const cx = 170 + (i % PER_ROW) * CW;
        const at0: P2 = [cx - (pf.moving ? r0.figs[0].at[0] : 0), bases[Math.floor(i / PER_ROW)]];
        return (
          <g key={i}>
            {frameEl(pf, i, s, at0, `b${i}`)}
            <Lbl x={cx - 130} y={bases[Math.floor(i / PER_ROW)] + 36} t={`f${i}`} size={20} anchor="start" />
          </g>
        );
      })}
    </SheetAir>
  );
};
export const STRIPS: StripName[] = Object.keys(PERF) as StripName[];

// ---------------------------------------------------------------------------
// PHONE: the cast at phone sizes in a 1080 x 1920 frame (hero ~620, mid ~300, a row of ten children ~150)
// ---------------------------------------------------------------------------
export const VaccineFolkPhone: React.FC = () => {
  const big = scaleForPx(620);
  const mid = scaleForPx(300);
  const sm = scaleForPx(165);
  const mids: { kind: VaccineKind; v: number; pose: VPose; props?: Partial<VaccineFigureProps> }[] = [
    { kind: "inoculator", v: 0, pose: POSES.stand(1) },
    { kind: "parent", v: 0, pose: POSES.stand(1) },
    { kind: "child", v: 0, pose: POSES.stand(-1), props: { pox: 1 } },
    { kind: "parent", v: 3, pose: POSES.stand(-1) },
  ];
  return (
    <SheetAir w={1080} h={1920} base={[960, 1500, 1860]} id="ph" grain={1}>
      <VaccineContactShadow at={[300, 960]} scale={big} uid="pb0" />
      <VaccineFigure kind="jenner" pose={POSES.stand(1)} at={[300, 960]} scale={big} uid="pbj" />
      <VaccineContactShadow at={[790, 960]} scale={big} uid="pb1" />
      <VaccineFigure kind="pasteur" pose={POSES.examineFlask(-1, 1)} at={[790, 960]} scale={big} uid="pbp" holdFar="flask" flaskFill={0.5} />
      {mids.map((m, i) => (
        <g key={i}>
          <VaccineContactShadow at={[150 + i * 260, 1500]} scale={mid} uid={`pm${i}`} />
          <VaccineFigure kind={m.kind} variant={m.v} pose={m.pose} at={[150 + i * 260, 1500]} scale={mid} uid={`pmf${i}`} {...m.props} />
        </g>
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <g key={i}>
          <VaccineContactShadow at={[70 + i * 104, 1860]} scale={sm} uid={`ps${i}`} />
          <VaccineFigure kind="child" variant={i} pose={i % 3 === 1 ? POSES.front() : POSES.stand(i % 2 ? -1 : 1)} at={[70 + i * 104, 1860]} scale={sm} uid={`psf${i}`} pox={i === 3 || i === 6 ? 1 : 0} />
        </g>
      ))}
    </SheetAir>
  );
};
