// ---------------------------------------------------------------------------
// covidFolkProbe — probe sheets of the modern cast (covidFolk.tsx). Render entry src/entry.CovidFolk.ts.
//   CovidFolkStyle   THE STYLE SHEET on palette A's air: every kind standing beside the pandemics' folk Worker and a
//                    Rome Freeman at the same height (the same hand?); the variants; the states (Carrier and Officer:
//                    well / infected 0.5 / infected 1 + breathOut / sick 1); the turn (front .. back)
//   CovidFolkStrip   one performance, EVERY frame (props.strip), ~380 px figures, frame numbers
//   CovidFolkMotion  one performance animated (for the frame-difference pop check): props.strip
//   CovidFolkCrowd   ~200 crowd sprites on a floor from a high camera, a third infected, three sick
//   CovidFolkPhone   a 1080 x 1920 frame: the cast at phone sizes (hero ~620 px, mid ~300 px, crowd ~150 px)
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AirStage, H as AH, makeAirView, mixHex, type AirScene } from "../kyle-pandemics/pandemicAir";
import { FolkWorker, stand as workerStand } from "../kyle-pandemics/pandemicFolk";
import { Freeman, POSES as ROME_POSES, scaleForPx as romeScale } from "../kyle-rome-slavery/romeFolk";
import {
  COVID_VARIANTS,
  CovidContactShadow,
  CovidFigure,
  FolkCanvas,
  HOLD,
  POSES,
  SEAT,
  WALK_CYCLE,
  blitFolk,
  breathe,
  covidAnchors,
  covidCrowdSpriteReq,
  lerpPose,
  mirrorPose,
  scaleForPx,
  seatFootX,
  sickenBack,
  sitBack,
  sitDown,
  useCovidSprites,
  walkAdvance,
  type CovidFigureProps,
  type CovidKind,
  type CovidPose,
  type CovidSpriteReq,
  type CrowdState,
  type CrowdView,
  type P2,
} from "./covidFolk";

const SCENE: AirScene = { look: "A", mood: "day", F: 1000, fogNear: 800, fogVis: 2200, fogMax: 0.97, hLow: 0, hHigh: 300, moteUnit: 100 };
const FONT = "Helvetica, Arial, sans-serif";
const TXT = "#F3EBDD";
const airCss = (v: ReturnType<typeof makeAirView>, f: number) => {
  const c = v.airAtScreen(f * AH);
  return `rgb(${c.map((x) => Math.round(x)).join(",")})`;
};
/** a sheet's backdrop: AirStage + a sand-umber floor band under each row + a few soft shafts (romeFolkProbe's) */
const SheetAir: React.FC<{ w: number; h: number; base: number[]; id: string; grain?: number; children?: React.ReactNode; over?: React.ReactNode }> = ({ w, h, base, id, grain = 0, children, over }) => {
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
        {over}
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
const profile = (dir: 1 | -1): CovidPose => {
  const q = POSES.stand(1);
  const p: CovidPose = { ...q, yaw: 1.3, headYaw: 1.28, armL: { ...q.armL, w: [-8, -139] }, armR: { ...q.armR, w: [12, -141] } };
  return dir === 1 ? p : mirrorPose(p);
};
const backQ = (yaw: number): CovidPose => POSES.turnTo(yaw);
type Cell = { kind: CovidKind | "worker" | "freeman"; v?: number; label: string; pose?: CovidPose; props?: Partial<CovidFigureProps> };
const MANPX = 600;
const ROWS: Cell[][] = [
  [
    { kind: "worker", label: "pandemics Worker" },
    { kind: "freeman", label: "Rome Freeman" },
    { kind: "carrier", v: 0, label: "Carrier (THE COVID man)", pose: POSES.stand(1) },
    { kind: "officer", v: 0, label: "Officer (THE SARS-1 man)", pose: POSES.stand(-1) },
    { kind: "commuter", v: 0, label: "Commuter 0", pose: POSES.stand(1) },
    { kind: "commuter", v: 1, label: "Commuter 1", pose: POSES.front() },
    { kind: "commuter", v: 2, label: "Commuter 2 (woman)", pose: POSES.stand(-1) },
    { kind: "commuter", v: 3, label: "Commuter 3 (woman)", pose: POSES.stand(1) },
    { kind: "elder", v: 0, label: "Elder 0", pose: POSES.stand(-1) },
    { kind: "elder", v: 1, label: "Elder 1 (woman)", pose: POSES.front() },
    { kind: "elder", v: 2, label: "Elder 2", pose: POSES.stand(1) },
  ],
  [
    { kind: "youth", v: 0, label: "Youth 0", pose: POSES.stand(1) },
    { kind: "youth", v: 1, label: "Youth 1", pose: POSES.front() },
    { kind: "youth", v: 2, label: "Youth 2 (girl)", pose: POSES.stand(-1) },
    { kind: "parent", v: 0, label: "Parent 0", pose: POSES.stand(1) },
    { kind: "child", v: 0, label: "Child 0", pose: POSES.front() },
    { kind: "parent", v: 1, label: "Parent 1", pose: POSES.stand(-1) },
    { kind: "child", v: 1, label: "Child 1", pose: POSES.stand(1) },
    { kind: "carrier", v: 1, label: "Carrier v1", pose: POSES.front() },
    { kind: "carrier", v: 2, label: "Carrier v2", pose: POSES.stand(-1) },
    { kind: "officer", v: 1, label: "Officer v1", pose: POSES.front() },
    { kind: "medic", v: 0, label: "Medic (protective suit)", pose: POSES.stand(1) },
  ],
  [
    { kind: "carrier", v: 0, label: "Carrier well", pose: POSES.stand(1) },
    { kind: "carrier", v: 0, label: "infected 0.5", pose: POSES.stand(1), props: { infected: 0.5 } },
    { kind: "carrier", v: 0, label: "infected 1 + breathOut", pose: { ...POSES.stand(1), open: 0.25 }, props: { infected: 1, breathOut: 1, frame: 70 } },
    { kind: "carrier", v: 0, label: "sick 1", pose: POSES.stand(1), props: { infected: 1, sick: 1 } },
    { kind: "carrier", v: 0, label: "front, infected 1", pose: POSES.front(), props: { infected: 1 } },
    { kind: "officer", v: 0, label: "Officer well", pose: POSES.stand(-1) },
    { kind: "officer", v: 0, label: "infected 0.5", pose: POSES.stand(-1), props: { infected: 0.5 } },
    { kind: "officer", v: 0, label: "infected 1 + breathOut", pose: { ...POSES.stand(-1), open: 0.25 }, props: { infected: 1, breathOut: 1, frame: 70 } },
    { kind: "officer", v: 0, label: "sick 1", pose: POSES.stand(-1), props: { infected: 1, sick: 1 } },
    { kind: "officer", v: 0, label: "sick, coughing", pose: POSES.cough(POSES.stand(-1), 0.3, 3), props: { infected: 1, sick: 1 } },
    { kind: "officer", v: 0, label: "hand to the forehead", pose: { ...POSES.stand(-1), handTo: { R: { to: "forehead", amt: 1 } }, worry: 1 }, props: { infected: 1, sick: 0.6 } },
  ],
  [
    { kind: "carrier", v: 0, label: "front", pose: POSES.front() },
    { kind: "carrier", v: 0, label: "three-quarter", pose: POSES.stand(1) },
    { kind: "carrier", v: 0, label: "profile", pose: profile(1) },
    { kind: "carrier", v: 0, label: "back three-quarter", pose: backQ(2.3) },
    { kind: "carrier", v: 0, label: "back", pose: backQ(Math.PI) },
    { kind: "officer", v: 0, label: "Officer profile", pose: profile(-1) },
    { kind: "officer", v: 0, label: "back", pose: backQ(Math.PI) },
    { kind: "commuter", v: 2, label: "woman profile", pose: profile(1) },
    { kind: "commuter", v: 2, label: "back", pose: backQ(Math.PI) },
    { kind: "medic", v: 1, label: "Medic v1, front", pose: POSES.front() },
    { kind: "elder", v: 0, label: "Elder profile", pose: profile(1) },
  ],
];
const COLW = 360;
const ROWH = 820;
export const STYLE_W = 11 * COLW + 80;
export const STYLE_H = ROWS.length * ROWH + 60;
export const CovidFolkStyle: React.FC = () => {
  const s = scaleForPx(MANPX);
  const bases = ROWS.map((_, i) => 720 + i * ROWH);
  const cellEl = (c: Cell, x: number, base: number, key: string) => {
    const at: P2 = [x, base];
    let fig: React.ReactNode;
    if (c.kind === "worker") fig = <FolkWorker pose={workerStand(0.6)} x={x} y={base} scale={(MANPX * 1.04) / 513} uid={`wk${key}`} />;
    else if (c.kind === "freeman") fig = <Freeman pose={ROME_POSES.stand(1)} at={at} scale={romeScale(MANPX)} uid={`fr${key}`} />;
    else fig = <CovidFigure kind={c.kind} variant={c.v ?? 0} pose={c.pose ?? POSES.stand(1)} at={at} scale={s} uid={`f${key}`} frame={0} {...c.props} />;
    return (
      <g key={key}>
        <CovidContactShadow at={at} scale={s} uid={`cs${key}`} />
        {fig}
        <Lbl x={x} y={base + 56} t={c.label} />
      </g>
    );
  };
  return (
    <SheetAir w={STYLE_W} h={STYLE_H} base={bases} id="st">
      {ROWS.map((row, i) => row.map((c, j) => cellEl(c, 220 + j * COLW, bases[i], `${i}x${j}`)))}
    </SheetAir>
  );
};

// ---------------------------------------------------------------------------
// POSE STRIPS: EVERY frame of one performance
// ---------------------------------------------------------------------------
export type StripName = "laugh" | "walk" | "cough" | "coughElbow" | "sicken" | "slump" | "leanAway" | "standHold" | "sitDown" | "chat" | "turn" | "turnBack" | "walkWoman" | "walkChild";
type Perf = {
  kind: CovidKind;
  v: number;
  frames: number;
  props?: Partial<CovidFigureProps>;
  /** frame f -> the pose, the feet (world px at scale s about the cell's anchor a), and the set behind / in front */
  at: (f: number, s: number, a: P2) => { pose: CovidPose; at: P2; back?: React.ReactNode; front?: React.ReactNode; props?: Partial<CovidFigureProps> };
};
/** a bench seat (flat sheet): its top seatH units up, its front edge `front` units in front of the hip point */
const Bench: React.FC<{ hip: P2; s: number; dir: 1 | -1; seatH?: number; front?: number; back?: number }> = ({ hip, s, dir, seatH = SEAT.h, front = 20, back = 70 }) => {
  const x0 = hip[0] - dir * back * s;
  const x1 = hip[0] + dir * front * s;
  const y = hip[1] - seatH * s;
  return (
    <g>
      <rect x={Math.min(x0, x1)} y={y} width={Math.abs(x1 - x0)} height={seatH * s} fill="#5A4A3E" />
      <rect x={Math.min(x0, x1)} y={y - 10 * s} width={Math.abs(x1 - x0)} height={14 * s} rx={5 * s} fill="#5F7D77" />
    </g>
  );
};
const Pole: React.FC<{ x: number; base: number; s: number }> = ({ x, base, s }) => <rect x={x - 5 * s} y={base - 420 * s} width={10 * s} height={420 * s} fill="#8A9396" />;
const PERF: Record<StripName, Perf> = {
  laugh: { kind: "carrier", v: 0, frames: 30, props: { infected: 1 }, at: (f, s, a) => ({ pose: POSES.laugh({ ...POSES.stand(1), open: 0.3 }, f, Math.min(1, f / 18)), at: a }) },
  walk: { kind: "carrier", v: 0, frames: WALK_CYCLE, at: (f, s, a) => ({ pose: POSES.walk(1, f / WALK_CYCLE), at: [a[0] + walkAdvance(s) * f, a[1]] }) },
  walkWoman: { kind: "commuter", v: 2, frames: WALK_CYCLE, at: (f, s, a) => ({ pose: POSES.walk(-1, f / WALK_CYCLE), at: [a[0] - walkAdvance(s) * f, a[1]] }) },
  walkChild: { kind: "child", v: 0, frames: WALK_CYCLE, at: (f, s, a) => ({ pose: POSES.walk(1, f / WALK_CYCLE), at: [a[0] + walkAdvance(s * (92 / 152)) * f, a[1]] }) },
  cough: { kind: "officer", v: 0, frames: 48, props: { infected: 1, sick: 0.6 }, at: (f, s, a) => ({ pose: POSES.cough(POSES.stand(1), f / 47, 3, "fist"), at: a }) },
  coughElbow: { kind: "carrier", v: 0, frames: 48, props: { infected: 1 }, at: (f, s, a) => ({ pose: POSES.cough(POSES.stand(1), f / 47, 3, "elbow"), at: a }) },
  sicken: {
    kind: "officer",
    v: 0,
    frames: 60,
    props: { infected: 1 },
    at: (f, s, a) => {
      const t = f / 59;
      const at: P2 = [a[0] - sickenBack(t, "officer", 0) * s, a[1]];
      const hip0: P2 = [a[0] - seatFootX("officer", 0) * s, a[1]];
      return { pose: POSES.sicken(1, t), at, back: <g><Bench hip={hip0} s={s} dir={1} /><Pole x={a[0] + HOLD.poleDX * s} base={a[1]} s={s} /></g>, props: { sick: Math.min(1, t * 1.6) } };
    },
  },
  slump: { kind: "officer", v: 0, frames: 40, props: { infected: 1, sick: 1 }, at: (f, s, a) => ({ pose: POSES.slump(1, f), at: a, back: <Bench hip={a} s={s} dir={1} /> }) },
  leanAway: {
    kind: "elder",
    v: 1,
    frames: 30,
    at: (f, s, a) => ({ pose: POSES.leanAway(POSES.sit(-1), f / 29, 1), at: a, back: <Bench hip={a} s={s} dir={-1} /> }),
  },
  standHold: {
    kind: "carrier",
    v: 0,
    frames: 40,
    props: { infected: 1, breathOut: 1 },
    at: (f, s, a) => ({ pose: breathe(POSES.standHold(1, "pole"), f, 1.4), at: a, back: <Pole x={a[0] + HOLD.poleDX * s} base={a[1]} s={s} />, props: { frame: f } }),
  },
  sitDown: {
    kind: "commuter",
    v: 2,
    frames: 30,
    at: (f, s, a) => {
      const t = f / 29;
      const at: P2 = [a[0] + sitBack(t, "commuter", 2) * s, a[1]];
      const hip1: P2 = [a[0] + sitBack(1, "commuter", 2) * s, a[1]];
      return { pose: sitDown(-1, t), at, back: <Bench hip={hip1} s={s} dir={-1} /> };
    },
  },
  chat: { kind: "youth", v: 2, frames: 40, at: (f, s, a) => ({ pose: POSES.chat(POSES.stand(1), f, 1, 1), at: a }) },
  turn: {
    kind: "carrier",
    v: 0,
    frames: 40,
    at: (f, s, a) => {
      const t = f / 39;
      const e = t * t * (3 - 2 * t);
      return { pose: lerpPose(POSES.stand(-1), POSES.stand(1), e), at: a };
    },
  },
  turnBack: {
    kind: "carrier",
    v: 0,
    frames: 40,
    at: (f, s, a) => {
      const t = f / 39;
      const e = t * t * (3 - 2 * t);
      return { pose: lerpPose(POSES.stand(1), backQ(Math.PI), e), at: a };
    },
  },
};
const figEl = (pf: Perf, f: number, s: number, a: P2, uid: string) => {
  const r = pf.at(f, s, a);
  return (
    <g key={uid}>
      {r.back}
      <CovidContactShadow at={r.at} scale={s} uid={`${uid}cs`} amount={0.8} />
      <CovidFigure kind={pf.kind} variant={pf.v} pose={r.pose} at={r.at} scale={s} uid={uid} frame={f} {...pf.props} {...r.props} />
      {r.front}
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
export const CovidFolkStrip: React.FC<{ strip: StripName }> = ({ strip }) => {
  const pf = PERF[strip];
  const n = pf.frames;
  const { w, h } = stripSize(strip);
  const s = scaleForPx(380);
  const rows = Math.ceil(n / PER_ROW);
  const bases = Array.from({ length: rows }, (_, i) => 470 + i * RH);
  const moving = strip.startsWith("walk");
  return (
    <SheetAir w={w} h={h} base={bases} id="sp">
      {Array.from({ length: n }, (_, i) => {
        const r0 = pf.at(i, s, [0, 0]);
        const cx = 170 + (i % PER_ROW) * CW;
        const at0: P2 = [cx - (moving ? r0.at[0] : 0), bases[Math.floor(i / PER_ROW)]];
        return (
          <g key={i}>
            {figEl(pf, i, s, at0, `b${i}`)}
            <Lbl x={cx - 120} y={bases[Math.floor(i / PER_ROW)] + 36} t={`f${i}`} size={20} anchor="start" />
          </g>
        );
      })}
    </SheetAir>
  );
};
/** one performance animated (frame = the frame), a figure ~520 px: for the frame-difference checks */
export const CovidFolkMotion: React.FC<{ strip: StripName }> = ({ strip }) => {
  const f = useCurrentFrame();
  const pf = PERF[strip];
  const s = scaleForPx(520);
  const r0 = pf.at(f % pf.frames, s, [0, 0]);
  const moving = strip.startsWith("walk");
  return (
    <AbsoluteFill style={{ backgroundColor: "#3E5A57" }}>
      <svg width={760} height={720} style={{ position: "absolute", left: 0, top: 0 }}>
        {figEl(pf, f % pf.frames, s, [380 - (moving ? r0.at[0] : 0), 660], "m")}
      </svg>
    </AbsoluteFill>
  );
};
export const STRIPS: StripName[] = ["laugh", "walk", "walkWoman", "walkChild", "cough", "coughElbow", "sicken", "slump", "leanAway", "standHold", "sitDown", "chat", "turn", "turnBack"];
export const motionFrames = (strip: StripName) => PERF[strip].frames;

// ---------------------------------------------------------------------------
// THE CROWD: ~200 sprites on a floor from a high camera, a third infected, three sick
// ---------------------------------------------------------------------------
// the Carrier and the Officer are THE two men: never in a crowd
const CROWD_KINDS: CovidKind[] = ["commuter", "commuter", "elder", "youth", "parent", "commuter", "youth", "elder", "child", "commuter"];
type CrowdItem = { x: number; y: number; h: number; req: CovidSpriteReq };
const crowdLayout = (): CrowdItem[] => {
  const items: CrowdItem[] = [];
  const rnd = (i: number, k: number) => {
    const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
  // a floor from a high camera: rows recede up the frame (smaller, closer together)
  let i = 0;
  for (let row = 0; row < 15; row++) {
    const depth = row / 14;
    const y = 1680 - 1180 * (1 - Math.pow(1 - depth, 1.35));
    const hpx = 150 * Math.pow(0.86, row);
    const nInRow = 9 + Math.floor(row * 0.9);
    for (let j = 0; j < nInRow; j++) {
      const x = 540 + (j - (nInRow - 1) / 2) * (1000 / nInRow) * (1 - 0.2 * depth) + (rnd(i, 3) - 0.5) * 40;
      const kind = CROWD_KINDS[Math.floor(rnd(i, 5) * CROWD_KINDS.length)];
      const views: CrowdView[] = ["front", "back", "left", "right", "walkLeft", "walkRight"];
      const view = views[Math.floor(rnd(i, 7) * views.length)];
      let state: CrowdState = "well";
      if (rnd(i, 11) < 0.34) state = (["infected-lo", "infected", "infected-hi"] as CrowdState[])[Math.floor(rnd(i, 13) * 3)];
      if (i === 23 || i === 61 || i === 118) state = i === 61 ? "sick-sit" : "sick";
      const hq = Math.round(hpx / 8) * 8;
      items.push({ x, y: y + (rnd(i, 17) - 0.5) * 12, h: hpx, req: covidCrowdSpriteReq(kind, state === "sick-sit" && view.startsWith("walk") ? "left" : view, state, Math.floor(rnd(i, 19) * 40), hq, Math.floor(rnd(i, 23) * 4)) });
      i++;
    }
  }
  return items.sort((a, b) => a.y - b.y);
};
export const CovidFolkCrowd: React.FC = () => {
  const items = useMemo(crowdLayout, []);
  const reqs = useMemo(() => {
    const m = new Map<string, CovidSpriteReq>();
    for (const it of items) m.set(it.req.key, it.req);
    return Array.from(m.values());
  }, [items]);
  const get = useCovidSprites(reqs);
  return (
    <SheetAir
      w={1080}
      h={1920}
      base={[560]}
      id="cr"
      grain={1}
      over={
        <FolkCanvas
          draw={(ctx) => {
            for (const it of items) {
              ctx.save();
              ctx.globalAlpha = 0.5;
              ctx.fillStyle = "#22180F";
              ctx.beginPath();
              ctx.ellipse(it.x + 4, it.y, it.h * 0.17, it.h * 0.05, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
              blitFolk(ctx, get(it.req.key), it.x, it.y, it.req.hPx, { sy: 0.93 });
            }
          }}
        />
      }
    >
      <Lbl x={540} y={60} t={`${items.length} sprites; ${items.filter((i) => i.req.key.includes("infected")).length} infected; ${items.filter((i) => i.req.key.includes("sick")).length} sick`} size={26} />
    </SheetAir>
  );
};

// ---------------------------------------------------------------------------
// PHONE: the cast at phone sizes in a 1080 x 1920 frame
// ---------------------------------------------------------------------------
export const CovidFolkPhone: React.FC = () => {
  const big = scaleForPx(620);
  const mid = scaleForPx(300);
  const sm = scaleForPx(150);
  const mids: { kind: CovidKind; v: number; pose: CovidPose; props?: Partial<CovidFigureProps> }[] = [
    { kind: "commuter", v: 2, pose: POSES.stand(1) },
    { kind: "youth", v: 0, pose: POSES.stand(-1), props: { infected: 1 } },
    { kind: "elder", v: 1, pose: POSES.front(), props: { sick: 1 } },
    { kind: "commuter", v: 0, pose: POSES.stand(-1) },
  ];
  const smalls: CovidKind[] = ["commuter", "elder", "youth", "parent", "child", "commuter", "officer", "youth", "commuter"];
  return (
    <SheetAir w={1080} h={1920} base={[960, 1500, 1860]} id="ph" grain={1}>
      <CovidContactShadow at={[300, 960]} scale={big} uid="pb0" />
      <CovidFigure kind="carrier" pose={{ ...POSES.stand(1), open: 0.2 }} at={[300, 960]} scale={big} uid="pbc" infected={1} breathOut={1} frame={80} />
      <CovidContactShadow at={[790, 960]} scale={big} uid="pb1" />
      <CovidFigure kind="officer" pose={POSES.cough(POSES.stand(-1), 0.32, 3)} at={[790, 960]} scale={big} uid="pbo" infected={1} sick={1} />
      {mids.map((m, i) => (
        <g key={i}>
          <CovidContactShadow at={[150 + i * 260, 1500]} scale={mid} uid={`pm${i}`} />
          <CovidFigure kind={m.kind} variant={m.v} pose={m.pose} at={[150 + i * 260, 1500]} scale={mid} uid={`pmf${i}`} {...m.props} />
        </g>
      ))}
      {smalls.map((k, i) => (
        <g key={i}>
          <CovidContactShadow at={[70 + i * 117, 1860]} scale={sm} uid={`ps${i}`} />
          <CovidFigure kind={k} variant={i % COVID_VARIANTS[k]} pose={i % 2 ? POSES.stand(1) : POSES.walk(-1, i * 0.13)} at={[70 + i * 117, 1860]} scale={sm} uid={`psf${i}`} infected={i % 3 === 1 ? 1 : 0} />
        </g>
      ))}
    </SheetAir>
  );
};
// ---------------------------------------------------------------------------
// HEADS: hero-size heads (a figure ~1500 px), every kind at three yaws: hair, hats, faces
// ---------------------------------------------------------------------------
const HEAD_CELLS: { kind: CovidKind; v: number }[] = [
  { kind: "carrier", v: 0 },
  { kind: "officer", v: 0 },
  { kind: "commuter", v: 0 },
  { kind: "commuter", v: 1 },
  { kind: "commuter", v: 2 },
  { kind: "commuter", v: 3 },
  { kind: "elder", v: 0 },
  { kind: "elder", v: 1 },
  { kind: "elder", v: 2 },
  { kind: "youth", v: 1 },
  { kind: "youth", v: 2 },
  { kind: "child", v: 0 },
];
export const HEADS_W = 4 * 3 * 300 + 80;
export const HEADS_H = 3 * 420 + 40;
export const CovidFolkHeads: React.FC<{ sick?: number }> = ({ sick = 0 }) => {
  const s = scaleForPx(1150);
  const yaws = [0, 0.66, -1.25];
  return (
    <SheetAir w={HEADS_W} h={HEADS_H} base={[HEADS_H + 200]} id="hd">
      {HEAD_CELLS.map((c, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        return yaws.map((y, j) => {
          const cx = 190 + (col * 3 + j) * 300;
          const top = 60 + row * 420;
          const q = { ...POSES.turnTo(y), headYaw: y };
          const a = covidAnchors(c.kind, q, [0, 0], s, { variant: c.v });
          const at: P2 = [cx - a.headC[0], top + 170 - a.headC[1]];
          return <CovidFigure key={`${i}-${j}`} kind={c.kind} variant={c.v} pose={q} at={at} scale={s} uid={`hd${i}x${j}`} sick={sick} />;
        });
      })}
    </SheetAir>
  );
};
// ---------------------------------------------------------------------------
// GLOW: the director's fix (two lobes, a light from inside that shows through the straps): v1 (the first version)
// above v2, the Carrier with his backpack at yaw 0 / 0.3 / 0.6 / 0.9, hero size (~1200 px) and mid size (~400 px);
// then the LAUGH next to the open "o" and the tired lids
// ---------------------------------------------------------------------------
export const GLOW_W = 4 * 620 + 2 * 4 * 0 + 160;
export const GLOW_H = 5320;
const GLOW_YAWS = [0, 0.3, 0.6, 0.9];
export const CovidFolkGlow: React.FC = () => {
  const hero = scaleForPx(1200);
  const mid = scaleForPx(400);
  const rowsHero = [1290, 2640];
  const rowsMid = [3200, 3760];
  const faceRow = 4300;
  const pose = (y: number): CovidPose => ({ ...POSES.turnTo(y), headYaw: y * 0.9, mouth: 0.2 });
  const faces: { label: string; pose: CovidPose; kind: CovidKind; v: number; props?: Partial<CovidFigureProps> }[] = [
    { label: "LAUGH (laugh 1)", kind: "carrier", v: 0, pose: POSES.laugh({ ...POSES.turnTo(0.4), headYaw: 0.4 }, 10) },
    { label: "laugh, three-quarter", kind: "commuter", v: 2, pose: POSES.laugh({ ...POSES.turnTo(-0.6), headYaw: -0.6 }, 20) },
    { label: "open 'o' (surprise / breath)", kind: "carrier", v: 0, pose: { ...POSES.turnTo(0.4), headYaw: 0.4, open: 0.6 } },
    { label: "droopy lids (tired / sick)", kind: "carrier", v: 0, pose: { ...POSES.turnTo(0.4), headYaw: 0.4, lids: 0.7, worry: 0.6 } },
  ];
  const fs = scaleForPx(1500);
  return (
    <SheetAir w={GLOW_W} h={GLOW_H} base={[...rowsHero, ...rowsMid]} id="gl">
      {GLOW_YAWS.map((y, j) =>
        (["v1", "v2"] as const).map((gs, r) => {
          const x = 380 + j * 620;
          return (
            <g key={`h${j}${gs}`}>
              <CovidContactShadow at={[x, rowsHero[r]]} scale={hero} uid={`gh${j}${r}`} />
              <CovidFigure kind="carrier" pose={pose(y)} at={[x, rowsHero[r]]} scale={hero} uid={`gh${j}${gs}`} infected={1} frame={40} glowStyle={gs} />
              <Lbl x={x} y={rowsHero[r] + 46} t={`${gs === "v1" ? "BEFORE (v1)" : "NEW (v2)"} · yaw ${y}`} size={30} />
            </g>
          );
        }),
      )}
      {GLOW_YAWS.map((y, j) =>
        (["v1", "v2"] as const).map((gs, r) => {
          const x = 380 + j * 620;
          return (
            <g key={`m${j}${gs}`}>
              <CovidContactShadow at={[x, rowsMid[r]]} scale={mid} uid={`gm${j}${r}`} />
              <CovidFigure kind="carrier" pose={pose(y)} at={[x, rowsMid[r]]} scale={mid} uid={`gm${j}${gs}`} infected={1} frame={40} glowStyle={gs} />
              <Lbl x={x} y={rowsMid[r] + 34} t={`${gs === "v1" ? "BEFORE" : "NEW"} · yaw ${y} · ~400 px`} size={24} />
            </g>
          );
        }),
      )}
      {faces.map((f, j) => {
        const x = 380 + j * 620;
        const a = covidAnchors(f.kind, f.pose, [0, 0], fs, { variant: f.v });
        const at: P2 = [x - a.headC[0], faceRow + 220 - a.headC[1]];
        return (
          <g key={`f${j}`}>
            <CovidFigure kind={f.kind} variant={f.v} pose={f.pose} at={at} scale={fs} uid={`gf${j}`} {...f.props} />
            <rect x={x - 300} y={faceRow + 440} width={600} height={60} fill="#2B3A38" />
            <Lbl x={x} y={faceRow + 482} t={f.label} size={28} />
          </g>
        );
      })}
    </SheetAir>
  );
};
// ---------------------------------------------------------------------------
// GLOW 3 (round 3: light, not paint, with the windpipe): the Carrier, the Officer and a woman in a coat with a
// shoulder bag at yaw 0 / 0.6 / 0.9, at 1200 / 500 / 150 px, v2 (round 2) above v3 (the new default)
// ---------------------------------------------------------------------------
const G3_KINDS: { kind: CovidKind; v: number }[] = [
  { kind: "carrier", v: 0 },
  { kind: "officer", v: 0 },
  { kind: "commuter", v: 2 },
];
const G3_YAWS = [0, 0.6, 0.9];
const G3_COL = 560;
export const G3_W = 9 * G3_COL + 80;
export const G3_H = 4300;
export const CovidFolkGlow3: React.FC = () => {
  const sizes: { px: number; rows: [number, number]; col: number }[] = [
    { px: 1200, rows: [1290, 2620], col: G3_COL },
    { px: 500, rows: [3200, 3760], col: G3_COL },
    { px: 150, rows: [3990, 4220], col: G3_COL },
  ];
  return (
    <SheetAir w={G3_W} h={G3_H} base={sizes.flatMap((z) => z.rows)} id="g3">
      {sizes.map((z) =>
        G3_KINDS.map((k, ki) =>
          G3_YAWS.map((y, yi) =>
            (["v2", "v3"] as const).map((gs, r) => {
              const x = 330 + (ki * 3 + yi) * z.col;
              const sc = scaleForPx(z.px);
              const at: P2 = [x, z.rows[r]];
              const q: CovidPose = { ...POSES.turnTo(k.kind === "carrier" ? y : -y), headYaw: (k.kind === "carrier" ? y : -y) * 0.9, mouth: 0.2 };
              return (
                <g key={`${z.px}-${ki}-${yi}-${gs}`}>
                  <CovidContactShadow at={at} scale={sc} uid={`g3s${z.px}${ki}${yi}${r}`} />
                  <CovidFigure kind={k.kind} variant={k.v} pose={q} at={at} scale={sc} uid={`g3f${z.px}${ki}${yi}${gs}`} infected={1} frame={40} glowStyle={gs} />
                  <Lbl x={x} y={z.rows[r] + (z.px > 400 ? 44 : 30)} t={`${gs === "v2" ? "round 2 (v2)" : "NEW (v3)"} · yaw ${y}${z.px < 1000 ? ` · ${z.px}px` : ""}`} size={z.px > 400 ? 30 : 20} />
                </g>
              );
            }),
          ),
        ),
      )}
    </SheetAir>
  );
};
/** a row of four infected people (~520 px) as a cut would show them: v2 above v3 (downscale to 270 px wide) */
export const CovidFolkRow4: React.FC = () => {
  const people: { kind: CovidKind; v: number; pose: CovidPose }[] = [
    { kind: "commuter", v: 3, pose: POSES.stand(1) },
    { kind: "elder", v: 1, pose: POSES.front() },
    { kind: "youth", v: 0, pose: POSES.stand(-1) },
    { kind: "parent", v: 0, pose: POSES.stand(1) },
  ];
  const sc = scaleForPx(520);
  return (
    <SheetAir w={1080} h={1240} base={[600, 1220]} id="r4" grain={1}>
      {(["v2", "v3"] as const).map((gs, r) =>
        people.map((p, i) => {
          const at: P2 = [150 + i * 260, 590 + r * 620];
          return (
            <g key={`${gs}${i}`}>
              <CovidContactShadow at={at} scale={sc} uid={`r4s${r}${i}`} />
              <CovidFigure kind={p.kind} variant={p.v} pose={p.pose} at={at} scale={sc} uid={`r4f${gs}${i}`} infected={1} frame={30 + i * 7} glowStyle={gs} />
            </g>
          );
        }),
      )}
    </SheetAir>
  );
};
// ---------------------------------------------------------------------------
// GLOW 4 (round 4: the suit): v3 above v4, the Officer standing at yaw 0 / 0.6 / 0.9 and seated slumped, and the other
// kinds with lapels or an open coat front (Commuter 1 coat + scarf, Elder 0 cardigan, Elder 2 coat, Elder 1 coat)
// ---------------------------------------------------------------------------
type G4Cell = { kind: CovidKind; v: number; pose: CovidPose; label: string; seat?: boolean; props?: Partial<CovidFigureProps> };
const G4_CELLS: G4Cell[] = [
  { kind: "officer", v: 0, pose: { ...POSES.turnTo(0), headYaw: 0 }, label: "Officer yaw 0" },
  { kind: "officer", v: 0, pose: { ...POSES.turnTo(-0.6), headYaw: -0.55 }, label: "Officer yaw 0.6" },
  { kind: "officer", v: 0, pose: { ...POSES.turnTo(-0.9), headYaw: -0.8 }, label: "Officer yaw 0.9" },
  { kind: "officer", v: 0, pose: POSES.slump(1, 20), label: "Officer slump, sick", seat: true, props: { sick: 1 } },
  { kind: "commuter", v: 1, pose: POSES.stand(1), label: "Commuter 1 (coat, scarf)" },
  { kind: "elder", v: 0, pose: POSES.stand(-1), label: "Elder 0 (cardigan)" },
  { kind: "elder", v: 2, pose: POSES.front(), label: "Elder 2 (coat, scarf)" },
  { kind: "officer", v: 3, pose: { ...POSES.turnTo(-0.6), headYaw: -0.55 }, label: "Officer v3 shirtsleeves 0.6" },
  { kind: "officer", v: 3, pose: POSES.slump(1, 20), label: "Officer v3 slump", seat: true, props: { sick: 1 } },
];
export const G4_W = G4_CELLS.length * 560 + 80;
export const G4_H = 2700;
export const CovidFolkGlow4: React.FC = () => {
  const sc = scaleForPx(1200);
  const rows = [1290, 2600];
  return (
    <SheetAir w={G4_W} h={G4_H} base={rows} id="g4">
      {G4_CELLS.map((c, i) =>
        (["v3", "v4"] as const).map((gs, r) => {
          const x = 330 + i * 560;
          const at: P2 = [x, rows[r]];
          return (
            <g key={`${i}${gs}`}>
              {c.seat ? <Bench hip={at} s={sc} dir={1} /> : null}
              <CovidContactShadow at={at} scale={sc} uid={`g4s${i}${r}`} />
              <CovidFigure kind={c.kind} variant={c.v} pose={c.pose} at={at} scale={sc} uid={`g4f${i}${gs}`} infected={1} frame={40} glowStyle={gs} {...c.props} />
              <Lbl x={x} y={rows[r] + 44} t={`${gs === "v3" ? "round 3 (v3)" : "NEW (v4)"} · ${c.label}`} size={26} />
            </g>
          );
        }),
      )}
    </SheetAir>
  );
};
/** the 270-px check: the Officer standing and slumped with two coat-front kinds (~520 px), v3 above v4 */
export const CovidFolkRow4Suit: React.FC = () => {
  const rowsP: G4Cell[][] = [
    [G4_CELLS[0], G4_CELLS[1], G4_CELLS[3], G4_CELLS[4]],
    [G4_CELLS[0], G4_CELLS[1], G4_CELLS[3], G4_CELLS[4]],
    [{ ...G4_CELLS[0], v: 3 }, G4_CELLS[7], G4_CELLS[8], G4_CELLS[6]],
  ];
  const sc = scaleForPx(520);
  return (
    <SheetAir w={1080} h={1860} base={[600, 1220, 1840]} id="r4s" grain={1}>
      {(["v3", "v4", "v4"] as const).map((gs, r) =>
        rowsP[r].map((p, i) => {
          const at: P2 = [150 + i * 260, 590 + r * 620];
          return (
            <g key={`${gs}${i}`}>
              {p.seat ? <Bench hip={at} s={sc} dir={1} /> : null}
              <CovidContactShadow at={at} scale={sc} uid={`r4ss${r}${i}`} />
              <CovidFigure kind={p.kind} variant={p.v} pose={p.pose} at={at} scale={sc} uid={`r4sf${gs}${i}`} infected={1} frame={30 + i * 7} glowStyle={gs} {...p.props} />
            </g>
          );
        }),
      )}
    </SheetAir>
  );
};
export { covidAnchors };
