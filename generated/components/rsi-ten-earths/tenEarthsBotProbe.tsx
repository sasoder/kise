// ---------------------------------------------------------------------------
// tenEarthsBotProbe — probe sheets of THE ROBOT (tenEarthsBot.tsx). Render entry src/entry.TenEarthsBot.ts.
//   BotStyle   (a) THE STYLE SHEET: a covidFolk Commuter and the old Genius v0 beside the robot v0..v4, one scale
//   BotPoses   (b) every pose, plus four frames of bootUp
//   BotDesk    (c) one robot typing at the hall's Desk (profile seat) and one standing beside a hero Rack, 1080 x 1920
//   BotCrowd   (d) ~3,000 robots receding into the air (sprites near, dots far), 1080 x 1920
//   BotPhone   (e) the phone check: 520, 160, 40, 14 and 9 px tall in one 1080 x 1920 frame
//   BotStrip   one cycle, EVERY frame (props.strip): walk | stepOut | type | tick | cheer | stand | boot | turn
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { AirFloor, AirHorizonHazeW, AirShadow, AirStage, H as AH, MAT, WorldSvg, airWorldOf, makeAirView, mixHex, type AirScene, type Cam, type DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";
import { screenOf } from "../kits/maps/incaShared";
import { Commuter, CovidContactShadow, POSES as COVID_POSES, scaleForPx as covidScale } from "../kyle-covid/covidFolk";
import { GENIUS_POSES, Genius, geniusScaleForPx } from "./tenEarthsGenius";
import { Desk, MAT_FLOOR, Rack, RackField, deskAnchors, rackGrid, shiftRacks, RACK } from "./tenEarthsHall";
import {
  BOT_DESK,
  BOT_POSES,
  BOT_SHADOW,
  BOT_TICK,
  BOT_UNITS,
  BOT_WALK_CYCLE,
  BOOT_FRAMES,
  Bot,
  FolkCanvas,
  STEP_OUT_FRAMES,
  blitBot,
  botAnchors,
  botCrowdReqs,
  botLookName,
  botScaleForPx,
  stepOutShift,
  tickDrawn,
  useBotSprites,
  type BotPose,
  type BotView,
} from "./tenEarthsBot";

type P2 = [number, number];
export const FPS = 24000 / 1001;
const SCENE: AirScene = { look: "A", mood: "day", F: 1000, fogNear: 800, fogVis: 2200, fogMax: 0.97, hLow: 0, hHigh: 300, moteUnit: 100 };
const FONT = "Helvetica, Arial, sans-serif";
const TXT = "#F3EBDD";
const airCss = (v: ReturnType<typeof makeAirView>, f: number) => {
  const c = v.airAtScreen(f * AH);
  return `rgb(${c.map((x) => Math.round(x)).join(",")})`;
};
const SheetAir: React.FC<{ w: number; h: number; base: number[]; id: string; children?: React.ReactNode }> = ({ w, h, base, id, children }) => {
  const v = makeAirView({ scene: SCENE, frame: 0, horizon: 1250 });
  return (
    <div style={{ position: "relative", width: w, height: h, overflow: "hidden" }}>
      <AirStage v={v} shafts={0} motes={0} grain={0} bloom={0.22}>
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
const Lbl: React.FC<{ x: number; y: number; t: string; size?: number; op?: number }> = ({ x, y, t, size = 22, op = 0.85 }) => (
  <text x={x} y={y} fill={TXT} fontFamily={FONT} fontSize={size} textAnchor="middle" opacity={op}>
    {t}
  </text>
);

// ---------------------------------------------------------------------------
// (a) THE STYLE SHEET: one scale (a man 312 units = 600 px, the robot 240 units = 462 px)
// ---------------------------------------------------------------------------
const MANPX = 600;
export const STYLE_W = 7 * 330 + 120;
export const STYLE_H = 860;
export const BotStyle: React.FC = () => {
  const s = geniusScaleForPx(MANPX);
  const base = 740;
  const X = (j: number) => 200 + j * 330;
  const cells: React.ReactNode[] = [];
  cells.push(
    <g key="c">
      <CovidContactShadow at={[X(0), base]} scale={s} uid="csc" />
      <Commuter variant={0} pose={COVID_POSES.stand(1)} at={[X(0), base]} scale={covidScale(MANPX)} uid="cm" frame={0} />
      <Lbl x={X(0)} y={base + 60} t="covidFolk Commuter" />
    </g>,
  );
  cells.push(
    <g key="g">
      <CovidContactShadow at={[X(1), base]} scale={s} uid="csg" />
      <Genius variant={0} pose={GENIUS_POSES.stand(1, 0)} at={[X(1), base]} scale={s} uid="gn" />
      <Lbl x={X(1)} y={base + 60} t="the old Genius v0" />
    </g>,
  );
  for (let v = 0; v < 5; v++) {
    const x = X(2 + v);
    const dir: 1 | -1 = v % 2 === 0 ? 1 : -1;
    cells.push(
      <g key={`b${v}`}>
        <CovidContactShadow at={[x, base]} scale={s * 0.85} uid={`csb${v}`} />
        <Bot variant={v} pose={v === 4 ? BOT_POSES.front(0) : BOT_POSES.stand(dir, 0)} at={[x, base]} scale={s} uid={`b${v}`} frame={0} />
        <Lbl x={x} y={base + 60} t={botLookName(v).split(" ")[0] + (v === 0 ? " THE Bot" : "")} />
        <Lbl x={x} y={base + 88} t={botLookName(v).replace(/^v\d (THE Bot: )?/, "")} size={17} op={0.7} />
      </g>,
    );
  }
  return (
    <SheetAir w={STYLE_W} h={STYLE_H} base={[base]} id="st">
      {cells}
    </SheetAir>
  );
};

// ---------------------------------------------------------------------------
// (b) EVERY POSE
// ---------------------------------------------------------------------------
const CHAIR = "#5A6266";
const DESKC = "#73583B";
/** placeholder chair + desk + monitor around a seated robot (units from its at, facing dir) */
const DeskStub: React.FC<{ at: P2; s: number; dir: 1 | -1; front?: boolean }> = ({ at, s, dir, front }) => {
  const P = (x: number, y: number): string => `${at[0] + dir * x * s},${at[1] + y * s}`;
  const D = BOT_DESK;
  if (front)
    return (
      <g>
        <polygon points={[P(52, -D.deskH), P(230, -D.deskH), P(230, -D.deskH + 8), P(52, -D.deskH + 8)].join(" ")} fill={DESKC} />
        <polygon points={[P(205, -D.deskH + 8), P(215, -D.deskH + 8), P(215, 0), P(205, 0)].join(" ")} fill={mixHex(DESKC, "#22180F", 0.3)} />
        <polygon points={[P(54, -D.deskH), P(100, -D.deskH), P(100, -D.deskH - 4), P(54, -D.deskH - 4)].join(" ")} fill="#3A3F44" />
        <polygon points={[P(150, -D.deskH), P(158, -D.deskH), P(158, -170), P(150, -170)].join(" ")} fill="#3A3F44" />
        <polygon points={[P(140, -180), P(160, -180), P(166, -268), P(146, -268)].join(" ")} fill="#30363A" />
        <polygon points={[P(143, -184), P(157, -184), P(163, -264), P(149, -264)].join(" ")} fill="#E9E2D0" opacity={0.85} />
      </g>
    );
  return (
    <g>
      <polygon points={[P(-44, -D.seatH), P(44, -D.seatH), P(44, -D.seatH + 8), P(-44, -D.seatH + 8)].join(" ")} fill={CHAIR} />
      <polygon points={[P(-3, -D.seatH + 8), P(3, -D.seatH + 8), P(3, -12), P(-3, -12)].join(" ")} fill={mixHex(CHAIR, "#22180F", 0.3)} />
      <polygon points={[P(-30, -4), P(30, -4), P(30, 0), P(-30, 0)].join(" ")} fill={mixHex(CHAIR, "#22180F", 0.3)} />
      <polygon points={[P(-52, -232), P(-44, -232), P(-44, -112), P(-52, -112)].join(" ")} fill={CHAIR} />
    </g>
  );
};
type PoseCell = { label: string; pose: BotPose; v?: number; dx?: number; desk?: boolean; tick?: number };
const POSE_ROWS: PoseCell[][] = [
  [
    { label: "stand (right)", pose: BOT_POSES.stand(1, 0) },
    { label: "stand (left)", pose: BOT_POSES.stand(-1, 0) },
    { label: "front", pose: BOT_POSES.front(0) },
    { label: "turnTo 1.3 (profile)", pose: BOT_POSES.turnTo(1.3, 0) },
    { label: "back three-quarter", pose: BOT_POSES.turnTo(2.4, 0) },
    { label: "back", pose: BOT_POSES.turnTo(Math.PI, 0) },
    { label: "cheer", pose: BOT_POSES.cheer(4, 1) },
    { label: "cheer, three-quarter", pose: BOT_POSES.cheer(13, 1, 0.5) },
  ],
  [
    ...[0, 6, 12, 18].map((f) => ({ label: `walk f${f}`, pose: BOT_POSES.walk(1, f) })),
    ...[0.2, 0.45, 0.7, 1].map((t) => ({ label: `stepOut t ${t}`, pose: BOT_POSES.stepOut(1, t), dx: stepOutShift(1, t) - 20 })),
  ],
  [
    { label: "typeAtDesk", pose: BOT_POSES.typeAtDesk(1, 0), desk: true, dx: -40 },
    { label: "typeAtDesk (left)", pose: BOT_POSES.typeAtDesk(-1, 7), desk: true, dx: 40 },
    ...[0.15, 0.3, 0.44, 0.6, 0.72, 1].map((t) => ({ label: `writeTick t ${t}`, pose: BOT_POSES.writeTick(1, t), tick: t, dx: -30 })),
  ],
  [
    ...[0, 0.3, 0.5, 0.65, 0.8, 1].map((t) => ({ label: `bootUp t ${t}`, pose: BOT_POSES.bootUp(t) })),
    { label: "bootUp t 0.5 (3/4)", pose: BOT_POSES.bootUp(0.5, 0.62) },
    { label: "blink (stand f2)", pose: BOT_POSES.stand(1, 2) },
  ],
];
const PCOLW = 330;
const PROWH = 560;
const PPX = 380;
export const POSES_W = 8 * PCOLW + 80;
export const POSES_H = POSE_ROWS.length * PROWH + 60;
export const BotPoses: React.FC = () => {
  const s = botScaleForPx(PPX);
  const bases = POSE_ROWS.map((_, i) => 470 + i * PROWH);
  return (
    <SheetAir w={POSES_W} h={POSES_H} base={bases} id="ps">
      {POSE_ROWS.map((row, i) =>
        row.map((c, j) => {
          const x = 200 + j * PCOLW + (c.dx ?? 0) * s;
          const at: P2 = [x, bases[i]];
          const key = `${i}x${j}`;
          const dir: 1 | -1 = Math.sin(c.pose.yaw) >= 0 ? 1 : -1;
          let sheet: React.ReactNode = null;
          if (c.tick !== undefined) {
            const sx = (u: number) => at[0] + u * s;
            const sy = (u: number) => at[1] + u * s;
            const tk = tickDrawn(1, c.tick);
            sheet = (
              <g>
                <rect x={sx(46)} y={sy(-176)} width={64 * s} height={84 * s} fill="#EFE7D6" />
                {tk.length > 1 ? <polyline points={tk.map((p) => `${sx(p[0])},${sy(p[1])}`).join(" ")} fill="none" stroke="#3A2D25" strokeWidth={3.2 * s} strokeLinecap="round" strokeLinejoin="round" /> : null}
              </g>
            );
          }
          const an = botAnchors(c.v ?? 0, c.pose, at, s);
          return (
            <g key={key}>
              {c.desk ? <DeskStub at={at} s={s} dir={dir} /> : <CovidContactShadow at={at} scale={s * 0.85} uid={`pcs${key}`} />}
              {sheet}
              <Bot variant={c.v ?? 0} pose={c.pose} at={at} scale={s} uid={`p${key}`} frame={0} />
              {c.desk ? <DeskStub at={at} s={s} dir={dir} front /> : null}
              {c.tick !== undefined ? <circle cx={an.pencilTip[0]} cy={an.pencilTip[1]} r={3} fill="none" stroke="#2B6F8F" strokeWidth={1.5} /> : null}
              <Lbl x={200 + j * PCOLW} y={bases[i] + 50} t={c.label} />
            </g>
          );
        }),
      )}
    </SheetAir>
  );
};

// ---------------------------------------------------------------------------
// (c) AT THE HALL'S DESK AND BESIDE A HERO RACK (the hall module, read-only)
// ---------------------------------------------------------------------------
const camAt = (wx: number, wy: number, k: number, sy = 860): Cam => ({ k, cx: wx, cy: wy - (sy - 960) / k });
export const BotDesk: React.FC = () => {
  const frame = 20;
  const cam = camAt(-50, -170, 1.32, 840);
  const depth: DepthOpts = { eyeY: -2.2 * U, dRef: 1500, kRef: 1.32, dolly: 0.5 };
  const A = airWorldOf({ cam, rest: cam, depth, frame, scene: { mood: "interior", eyeT: 0.17 } });
  // the desk in profile at the left, the robot facing right at it; a hero rack at the right with a robot beside it
  const dX = -240;
  const dZ = 0;
  const an = deskAnchors(dX, dZ, "left");
  const sit = A.P.at(an.at.X, an.at.Z);
  const rackX = 270;
  const rackZ = 40;
  const standX = rackX - RACK.w / 2 - 62;
  const standZ = rackZ - 30;
  const st = A.P.at(standX, standZ);
  const bg = shiftRacks(rackGrid({ cols: 13, rows: 2, seed0: 60 }), 0, 1500);
  return (
    <AbsoluteFill>
      <AirStage v={A.v} bloom={0.22}>
        <WorldSvg cam={cam}>
          <AirFloor A={A} x0={-4000} x1={4000} z0={-8000} z1={9000} mat={MAT_FLOOR} course={0.6 * U} plank={0.6 * U} />
          <RackField A={A} racks={bg} frame={frame} uid="bg" />
          <Rack A={A} X={rackX} Z={rackZ} frame={frame} uid="hero" seed={3} />
          <Desk A={A} X={dX} Z={dZ} seat="left" uid="dk" layer="back" />
          <Bot variant={0} pose={BOT_POSES.typeAtDesk(1, frame)} at={sit.at} scale={sit.scale} uid="bt" frame={frame} fog={A.folkFog(an.at.Z)} unitPx={A.k} />
          <Desk A={A} X={dX} Z={dZ} seat="left" uid="dkf" layer="front" />
          <AirShadow A={A} X={standX} Z={standZ} w={BOT_SHADOW.w} d={BOT_SHADOW.d} uid="sh" amt={BOT_SHADOW.amt} />
          <Bot variant={0} pose={BOT_POSES.stand(1, frame)} at={st.at} scale={st.scale} uid="bs" frame={frame} fog={A.folkFog(standZ)} unitPx={A.k} />
        </WorldSvg>
      </AirStage>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// (d) THE CROWD: ~3,000 receding into the air
// ---------------------------------------------------------------------------
const U = 178;
const C_DEPTH: DepthOpts = { eyeY: -9 * U, dRef: 1800, kRef: 1, dolly: 0.5 };
const C_CAM = { k: 0.6, cx: 0, cy: -602 };
type Inst = { X: number; Z: number; v: number; view: BotView; wf: number };
const crowdLayout = (): Inst[] => {
  const out: Inst[] = [];
  const cols = 17;
  const rows = 178;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const h1 = Math.sin(r * 12.9898 + c * 78.233) * 43758.5453;
      const h2 = Math.sin(r * 39.346 + c * 11.135) * 24634.6345;
      const j1 = h1 - Math.floor(h1);
      const j2 = h2 - Math.floor(h2);
      const X = (c - (cols - 1) / 2) * 120 + (j1 - 0.5) * 34;
      const Z = 700 + 200 * r * (1 + r / 90) + (j2 - 0.5) * 50;
      const views: BotView[] = ["front", "front", "left", "right", "front", "front", "walkLeft", "walkRight"];
      out.push({ X, Z, v: (r * 7 + c * 3) % 5, view: views[Math.floor(j1 * 8) % 8], wf: Math.floor(j2 * 4) });
    }
  return out;
};
export const BotCrowd: React.FC = () => {
  const frame = 0;
  const A = airWorldOf({ cam: C_CAM, rest: C_CAM, depth: C_DEPTH, frame, fogBy: "depth" });
  const reqs = useMemo(() => botCrowdReqs(), []);
  const get = useBotSprites(reqs);
  const inst = useMemo(() => crowdLayout(), []);
  const draw = (ctx: CanvasRenderingContext2D) => {
    const t0 = performance.now();
    const sorted = [...inst].sort((a, b) => b.Z - a.Z);
    let n = 0;
    for (const p of sorted) {
      const { at, scale } = A.P.at(p.X, p.Z);
      const sp = screenOf(at, C_CAM);
      const hPx = BOT_UNITS * scale * C_CAM.k;
      if (sp[0] < -40 || sp[0] > 1120 || sp[1] < -40 || sp[1] > 2000) continue;
      n++;
      blitBot(ctx, get, sp[0], sp[1], hPx, { variant: p.v, view: p.view, walkFrame: p.wf, fog: A.folkFog(p.Z), shadow: true });
    }
    const ms = performance.now() - t0;
    ctx.fillStyle = "rgba(243,235,221,0.8)";
    ctx.font = "22px Helvetica";
    ctx.fillText(`${inst.length} instances (${n} on screen), ${ms.toFixed(1)} ms`, 30, 1880);
  };
  return (
    <AbsoluteFill>
      <AirStage v={A.v} bloom={0.22}>
        <WorldSvg cam={C_CAM}>
          <AirFloor A={A} x0={-9000} x1={9000} z0={-1300} z1={100000} mat={MAT.ground} course={250} />
          <AirHorizonHazeW A={A} id="haze" />
        </WorldSvg>
        <FolkCanvas draw={draw} />
      </AirStage>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// (e) THE PHONE FRAME: 520 / 160 / 40 / 14 / 9 px
// ---------------------------------------------------------------------------
export const BotPhone: React.FC = () => {
  const reqs = useMemo(() => botCrowdReqs(["front", "right", "left"], [24, 48]), []);
  const get = useBotSprites(reqs);
  const v = makeAirView({ scene: SCENE, frame: 0, horizon: 1250 });
  const small: [number, number, number][] = [
    [40, 120, 1300],
    [24, 330, 1300],
    [14, 520, 1300],
    [9, 680, 1300],
  ];
  const draw = (ctx: CanvasRenderingContext2D) => {
    for (const [h, x, y] of small) for (let i = 0; i < 5; i++) blitBot(ctx, get, x + i * h * 0.9, y - (i % 2) * 2, h, { variant: i, view: i % 2 ? "front" : "right", shadow: true });
  };
  return (
    <div style={{ position: "relative", width: 1080, height: 1920 }}>
      <AirStage v={v} shafts={1} motes={0} grain={1} bloom={0.22}>
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <rect x={0} y={1000} width={1080} height={920} fill={mixHex("#6B5E49", "#3A3128", 0.3)} opacity={0.85} />
          <CovidContactShadow at={[330, 1000]} scale={botScaleForPx(520) * 0.85} uid="ph1s" />
          <Bot variant={0} pose={BOT_POSES.stand(1, 0)} at={[330, 1000]} scale={botScaleForPx(520)} uid="ph1" frame={0} />
          <CovidContactShadow at={[760, 1000]} scale={botScaleForPx(160) * 0.85} uid="ph2s" />
          <Bot variant={0} pose={BOT_POSES.stand(-1, 0)} at={[760, 1000]} scale={botScaleForPx(160)} uid="ph2" frame={0} />
          <Bot variant={2} pose={BOT_POSES.front(0)} at={[900, 1000]} scale={botScaleForPx(160)} uid="ph3" frame={0} />
          <Lbl x={330} y={1060} t="hero 520 px" />
          <Lbl x={830} y={1060} t="mid 160 px" />
          {small.map(([h, x, y]) => (
            <Lbl key={h} x={x + h * 1.8} y={y + 40} t={`${h} px`} size={18} />
          ))}
        </svg>
        <FolkCanvas draw={draw} />
      </AirStage>
    </div>
  );
};

// ---------------------------------------------------------------------------
// EVERY-FRAME STRIPS (continuity)
// ---------------------------------------------------------------------------
export const STRIPS = ["walk", "stepOut", "type", "tick", "cheer", "stand", "boot", "turn"] as const;
export type StripName = (typeof STRIPS)[number];
const stripFrames = (s: StripName) =>
  s === "walk" ? BOT_WALK_CYCLE : s === "stepOut" ? STEP_OUT_FRAMES + 1 : s === "type" ? 30 : s === "tick" ? 45 : s === "cheer" ? 36 : s === "boot" ? BOOT_FRAMES + 1 : s === "turn" ? 48 : 24;
const SCOLS = 8;
const SCW = 230;
const SRH = 330;
export const stripSize = (s: StripName) => ({ w: SCOLS * SCW + 40, h: Math.ceil(stripFrames(s) / SCOLS) * SRH + 40 });
export const stripPose = (s: StripName, f: number, n: number): { pose: BotPose; dx: number; desk?: boolean; tick?: number } => {
  switch (s) {
    case "walk":
      return { pose: BOT_POSES.walk(1, f), dx: 0 };
    case "stepOut": {
      const t = f / (n - 1);
      return { pose: BOT_POSES.stepOut(1, t), dx: stepOutShift(1, t) - 20 };
    }
    case "type":
      return { pose: BOT_POSES.typeAtDesk(1, f), dx: -40, desk: true };
    case "tick": {
      const t = f / (n - 1);
      return { pose: BOT_POSES.writeTick(1, t, f), dx: -40, tick: t };
    }
    case "cheer":
      return { pose: BOT_POSES.cheer(f, Math.min(1, f / 14)), dx: 0 };
    case "boot":
      return { pose: BOT_POSES.bootUp(f / (n - 1), 0, f), dx: 0 };
    case "turn":
      return { pose: BOT_POSES.turnTo((f / n) * 2 * Math.PI, 0), dx: 0 };
    default:
      return { pose: BOT_POSES.stand(1, f * 4), dx: 0 };
  }
};
export const BotStrip: React.FC<{ strip: StripName }> = ({ strip }) => {
  const n = stripFrames(strip);
  const { w, h } = stripSize(strip);
  const s = botScaleForPx(230);
  const bases = Array.from({ length: Math.ceil(n / SCOLS) }, (_, i) => 20 + (i + 1) * SRH - 40);
  return (
    <SheetAir w={w} h={h} base={bases} id="sp">
      {Array.from({ length: n }, (_, f) => {
        const r = Math.floor(f / SCOLS);
        const c = f % SCOLS;
        const st = stripPose(strip, f, n);
        const at: P2 = [20 + c * SCW + SCW / 2 + st.dx * s, bases[r]];
        const tk = st.tick !== undefined ? tickDrawn(1, st.tick) : [];
        return (
          <g key={f}>
            <rect x={20 + c * SCW + 2} y={20 + r * SRH + 2} width={SCW - 4} height={SRH - 4} fill="none" stroke="#F3EBDD" strokeOpacity={0.15} />
            {st.desk ? <DeskStub at={at} s={s} dir={1} /> : <CovidContactShadow at={at} scale={s * 0.85} uid={`sc${f}`} />}
            {st.tick !== undefined ? <rect x={at[0] + 46 * s} y={at[1] - 176 * s} width={64 * s} height={84 * s} fill="#EFE7D6" /> : null}
            {tk.length > 1 ? <polyline points={tk.map((p) => `${at[0] + p[0] * s},${at[1] + p[1] * s}`).join(" ")} fill="none" stroke="#3A2D25" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" /> : null}
            <Bot variant={0} pose={st.pose} at={at} scale={s} uid={`s${f}`} frame={f} />
            {st.desk ? <DeskStub at={at} s={s} dir={1} front /> : null}
            <Lbl x={20 + c * SCW + 22} y={20 + r * SRH + 26} t={`${f}`} size={20} />
          </g>
        );
      })}
    </SheetAir>
  );
};
export { BOT_TICK };
