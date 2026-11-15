// ---------------------------------------------------------------------------
// tenEarthsGeniusProbe — probe sheets of THE GENIUS (tenEarthsGenius.tsx). Render entry src/entry.TenEarthsGenius.ts.
//   GeniusStyle   THE STYLE SHEET on palette A's air: a covidFolk Commuter, the pandemics Worker and the covidFolk
//                 Officer in shirtsleeves (the build he is drawn on) beside the Genius v0..v4 at the same height
//   GeniusPoses   every pose: stand, front, back, the walk, stepOut, typeAtDesk (placeholder chair and desk),
//                 writeTick (a placeholder sheet + the drawn tick), cheer
//   GeniusCrowd   ~2,000 Geniuses receding into the air on the depth kit (sprites near, dots far), 1080 x 1920
//   GeniusPhone   the three sizes in one 1080 x 1920 frame: hero ~520 px, mid ~160 px, crowd 40 / 24 / 14 / 9 px
//   GeniusStrip   one cycle, EVERY frame (props.strip): walk | stepOut | type | tick | cheer | stand
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { AirFloor, AirHorizonHazeW, AirStage, H as AH, MAT, WorldSvg, airWorldOf, makeAirView, mixHex, type AirScene, type DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";
import { screenOf } from "../kits/maps/incaShared";
import { FolkWorker, stand as workerStand } from "../kyle-pandemics/pandemicFolk";
import { Commuter, CovidContactShadow, Officer, POSES as COVID_POSES, scaleForPx as covidScale } from "../kyle-covid/covidFolk";
import {
  FolkCanvas,
  GENIUS_DESK,
  GENIUS_POSES,
  GENIUS_TICK,
  GENIUS_UNITS,
  GENIUS_WALK_CYCLE,
  Genius,
  STEP_OUT_FRAMES,
  blitGenius,
  geniusAnchors,
  geniusCrowdReqs,
  geniusLookName,
  geniusScaleForPx,
  stepOutShift,
  tickDrawn,
  useGeniusSprites,
  type GeniusPose,
  type GeniusView,
} from "./tenEarthsGenius";

type P2 = [number, number];
export const FPS = 24000 / 1001;
const SCENE: AirScene = { look: "A", mood: "day", F: 1000, fogNear: 800, fogVis: 2200, fogMax: 0.97, hLow: 0, hHigh: 300, moteUnit: 100 };
const FONT = "Helvetica, Arial, sans-serif";
const TXT = "#F3EBDD";
const airCss = (v: ReturnType<typeof makeAirView>, f: number) => {
  const c = v.airAtScreen(f * AH);
  return `rgb(${c.map((x) => Math.round(x)).join(",")})`;
};
/** a sheet's backdrop: AirStage + a sand-umber floor band under each row (covidFolkProbe's SheetAir) */
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
// THE STYLE SHEET
// ---------------------------------------------------------------------------
const MANPX = 600;
export const STYLE_W = 8 * 330 + 120;
export const STYLE_H = 860;
export const GeniusStyle: React.FC = () => {
  const s = geniusScaleForPx(MANPX);
  const base = 740;
  const cells: React.ReactNode[] = [];
  const X = (j: number) => 200 + j * 330;
  cells.push(
    <g key="w">
      <CovidContactShadow at={[X(0), base]} scale={s} uid="csw" />
      <FolkWorker pose={workerStand(0.6)} x={X(0)} y={base} scale={(MANPX * 1.04) / 513} uid="wk" />
      <Lbl x={X(0)} y={base + 60} t="pandemics Worker" />
    </g>,
  );
  cells.push(
    <g key="c">
      <CovidContactShadow at={[X(1), base]} scale={s} uid="csc" />
      <Commuter variant={0} pose={COVID_POSES.stand(1)} at={[X(1), base]} scale={covidScale(MANPX)} uid="cm" frame={0} />
      <Lbl x={X(1)} y={base + 60} t="covidFolk Commuter" />
    </g>,
  );
  cells.push(
    <g key="o">
      <CovidContactShadow at={[X(2), base]} scale={s} uid="cso" />
      <Officer variant={3} pose={COVID_POSES.stand(1)} at={[X(2), base]} scale={covidScale(MANPX)} uid="of" frame={0} />
      <Lbl x={X(2)} y={base + 60} t="covidFolk Officer v3 (the build)" />
    </g>,
  );
  for (let v = 0; v < 5; v++) {
    const x = X(3 + v);
    const dir: 1 | -1 = v % 2 === 0 ? 1 : -1;
    cells.push(
      <g key={`g${v}`}>
        <CovidContactShadow at={[x, base]} scale={s} uid={`csg${v}`} />
        <Genius variant={v} pose={v === 4 ? GENIUS_POSES.front(0) : GENIUS_POSES.stand(dir, 0)} at={[x, base]} scale={s} uid={`g${v}`} />
        <Lbl x={x} y={base + 60} t={geniusLookName(v).split(":")[0].split(" ").slice(0, 1).join(" ") + (v === 0 ? " THE Genius" : "")} />
        <Lbl x={x} y={base + 88} t={geniusLookName(v).replace(/^v\d (THE Genius: )?/, "")} size={17} op={0.7} />
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
// EVERY POSE
// ---------------------------------------------------------------------------
const CHAIR = "#5A6266";
const DESK = "#73583B";
/** placeholder chair + desk + monitor around a seated Genius (units from his at, facing dir) */
const DeskStub: React.FC<{ at: P2; s: number; dir: 1 | -1; front?: boolean }> = ({ at, s, dir, front }) => {
  const P = (x: number, y: number): string => `${at[0] + dir * x * s},${at[1] + y * s}`;
  const D = GENIUS_DESK;
  if (front)
    return (
      <g>
        <polygon points={[P(50, -D.deskH), P(230, -D.deskH), P(230, -D.deskH + 8), P(50, -D.deskH + 8)].join(" ")} fill={DESK} />
        <polygon points={[P(205, -D.deskH + 8), P(215, -D.deskH + 8), P(215, 0), P(205, 0)].join(" ")} fill={mixHex(DESK, "#22180F", 0.3)} />
        <polygon points={[P(58, -D.deskH), P(84, -D.deskH), P(84, -D.deskH - 4), P(58, -D.deskH - 4)].join(" ")} fill="#3A3F44" />
        <polygon points={[P(150, -D.deskH), P(158, -D.deskH), P(158, -170), P(150, -170)].join(" ")} fill="#3A3F44" />
        <polygon points={[P(140, -180), P(160, -180), P(166, -268), P(146, -268)].join(" ")} fill="#30363A" />
        <polygon points={[P(143, -184), P(157, -184), P(163, -264), P(149, -264)].join(" ")} fill="#E9E2D0" opacity={0.85} />
      </g>
    );
  return (
    <g>
      <polygon points={[P(D.seat.x0, -D.seatH), P(D.seat.x1, -D.seatH), P(D.seat.x1, -D.seatH + 8), P(D.seat.x0, -D.seatH + 8)].join(" ")} fill={CHAIR} />
      <polygon points={[P(-3, -D.seatH + 8), P(3, -D.seatH + 8), P(3, -12), P(-3, -12)].join(" ")} fill={mixHex(CHAIR, "#22180F", 0.3)} />
      <polygon points={[P(-30, -4), P(30, -4), P(30, 0), P(-30, 0)].join(" ")} fill={mixHex(CHAIR, "#22180F", 0.3)} />
      <polygon points={[P(D.chairBackX - 6, -D.seatH - 110), P(D.chairBackX + 2, -D.seatH - 110), P(D.chairBackX + 4, -D.seatH + 4), P(D.chairBackX - 4, -D.seatH + 4)].join(" ")} fill={CHAIR} />
    </g>
  );
};
type PoseCell = { label: string; pose: GeniusPose; v?: number; dx?: number; desk?: boolean; tick?: number };
const POSE_ROWS: PoseCell[][] = [
  [
    { label: "stand (right)", pose: GENIUS_POSES.stand(1, 0) },
    { label: "stand (left)", pose: GENIUS_POSES.stand(-1, 0) },
    { label: "front", pose: GENIUS_POSES.front(0) },
    { label: "turnTo 1.3 (profile)", pose: GENIUS_POSES.turnTo(1.3, 0) },
    { label: "back three-quarter", pose: GENIUS_POSES.turnTo(2.4, 0) },
    { label: "back", pose: GENIUS_POSES.turnTo(Math.PI, 0) },
    { label: "cheer", pose: GENIUS_POSES.cheer(4, 1) },
    { label: "cheer, three-quarter", pose: GENIUS_POSES.cheer(13, 1, 0.5) },
  ],
  [
    ...[0, 6, 12, 18].map((f) => ({ label: `walk f${f}`, pose: GENIUS_POSES.walk(1, f) })),
    ...[0.2, 0.45, 0.7, 1].map((t) => ({ label: `stepOut t ${t}`, pose: GENIUS_POSES.stepOut(1, t), dx: stepOutShift(1, t) - 40 })),
  ],
  [
    { label: "typeAtDesk", pose: GENIUS_POSES.typeAtDesk(1, 0), desk: true },
    { label: "typeAtDesk (left)", pose: GENIUS_POSES.typeAtDesk(-1, 7), desk: true },
    ...[0.15, 0.3, 0.44, 0.6, 0.72, 1].map((t) => ({ label: `writeTick t ${t}`, pose: GENIUS_POSES.writeTick(1, t), tick: t, dx: -40 })),
  ],
];
const PCOLW = 330;
const PROWH = 640;
const PPX = 430;
export const POSES_W = 8 * PCOLW + 80;
export const POSES_H = POSE_ROWS.length * PROWH + 60;
export const GeniusPoses: React.FC = () => {
  const s = geniusScaleForPx(PPX);
  const bases = POSE_ROWS.map((_, i) => 540 + i * PROWH);
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
            const T = GENIUS_TICK;
            const sx = (u: number) => at[0] + u * s;
            const sy = (u: number) => at[1] + u * s;
            const tk = tickDrawn(1, c.tick);
            sheet = (
              <g>
                <rect x={sx(52)} y={sy(-300)} width={80 * s} height={104 * s} fill="#EFE7D6" />
                <rect x={sx(52)} y={sy(-300)} width={80 * s} height={104 * s} fill="none" stroke="#C9BEA5" strokeWidth={1} />
                {tk.length > 1 ? <polyline points={tk.map((p) => `${sx(p[0])},${sy(p[1])}`).join(" ")} fill="none" stroke="#3A2D25" strokeWidth={3.2 * s} strokeLinecap="round" strokeLinejoin="round" /> : null}
                <circle cx={sx(T.p2[0])} cy={sy(T.p2[1])} r={1.2} fill="#3A2D25" opacity={0} />
              </g>
            );
          }
          const an = geniusAnchors(c.v ?? 0, c.pose, at, s);
          return (
            <g key={key}>
              {c.desk ? <DeskStub at={at} s={s} dir={dir} /> : <CovidContactShadow at={at} scale={s} uid={`pcs${key}`} />}
              {sheet}
              <Genius variant={c.v ?? 0} pose={c.pose} at={at} scale={s} uid={`p${key}`} />
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
// THE CROWD: ~2,000 receding into the air (the depth kit; sprites near, dots far)
// ---------------------------------------------------------------------------
const U = 178;
// a high eye (9 m) on a wide lens: the far end vanishes at screen y ~400, the front row stands at y ~1060
const C_DEPTH: DepthOpts = { eyeY: -9 * U, dRef: 1800, kRef: 1, dolly: 0.5 };
const C_CAM = { k: 0.6, cx: 0, cy: -602 };
type Inst = { X: number; Z: number; v: number; view: GeniusView; wf: number };
const crowdLayout = (): Inst[] => {
  const out: Inst[] = [];
  // a long block 15 abreast (0.8 m apart) and 134 deep: a parade receding to the vanishing point
  const cols = 15;
  const rows = 134;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const h1 = Math.sin(r * 12.9898 + c * 78.233) * 43758.5453;
      const h2 = Math.sin(r * 39.346 + c * 11.135) * 24634.6345;
      const j1 = h1 - Math.floor(h1);
      const j2 = h2 - Math.floor(h2);
      const X = (c - (cols - 1) / 2) * 142 + (j1 - 0.5) * 40;
      // rows open out with depth (250 -> ~910 apart): the front row stands at Z 868 (feet at y ~1060,
      // ~136 px tall), row ~65 crosses the 13 px dot threshold, the last row is ~5 px at Z ~88,000
      const Z = 868 + 250 * r * (1 + r / 80) + (j2 - 0.5) * 60;
      const views: GeniusView[] = ["front", "front", "left", "right", "front", "front", "walkLeft", "walkRight"];
      out.push({ X, Z, v: (r * 7 + c * 3) % 5, view: views[Math.floor(j1 * 8) % 8], wf: Math.floor(j2 * 4) });
    }
  return out;
};
export const GeniusCrowd: React.FC = () => {
  const frame = 0;
  const A = airWorldOf({ cam: C_CAM, rest: C_CAM, depth: C_DEPTH, frame, fogBy: "depth" });
  const reqs = useMemo(() => geniusCrowdReqs(), []);
  const get = useGeniusSprites(reqs);
  const inst = useMemo(() => crowdLayout(), []);
  const draw = (ctx: CanvasRenderingContext2D) => {
    const t0 = performance.now();
    const sorted = [...inst].sort((a, b) => b.Z - a.Z);
    for (const p of sorted) {
      const { at, scale } = A.P.at(p.X, p.Z);
      const sp = screenOf(at, C_CAM);
      const hPx = GENIUS_UNITS * scale * C_CAM.k;
      if (sp[0] < -40 || sp[0] > 1120 || sp[1] < -40 || sp[1] > 2000) continue;
      blitGenius(ctx, get, sp[0], sp[1], hPx, { variant: p.v, view: p.view, walkFrame: p.wf, fog: A.folkFog(p.Z), shadow: true });
    }
    const ms = performance.now() - t0;
    ctx.fillStyle = "rgba(243,235,221,0.8)";
    ctx.font = "22px Helvetica";
    ctx.fillText(`${inst.length} instances, ${ms.toFixed(1)} ms`, 30, 1880);
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
// THE PHONE FRAME: the three sizes
// ---------------------------------------------------------------------------
export const GeniusPhone: React.FC = () => {
  const reqs = useMemo(() => geniusCrowdReqs(["front", "right", "left"], [24, 48]), []);
  const get = useGeniusSprites(reqs);
  const v = makeAirView({ scene: SCENE, frame: 0, horizon: 1250 });
  const small: [number, number, number][] = [
    [40, 140, 1300],
    [24, 330, 1300],
    [14, 500, 1300],
    [9, 640, 1300],
  ];
  const draw = (ctx: CanvasRenderingContext2D) => {
    for (const [h, x, y] of small) for (let i = 0; i < 5; i++) blitGenius(ctx, get, x + i * h * 0.75, y - (i % 2) * 2, h, { variant: i, view: i % 2 ? "front" : "right", shadow: true });
  };
  return (
    <div style={{ position: "relative", width: 1080, height: 1920 }}>
      <AirStage v={v} shafts={1} motes={0} grain={1} bloom={0.22}>
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <rect x={0} y={1000} width={1080} height={920} fill={mixHex("#6B5E49", "#3A3128", 0.3)} opacity={0.85} />
          <CovidContactShadow at={[330, 1000]} scale={geniusScaleForPx(520)} uid="ph1s" />
          <Genius variant={0} pose={GENIUS_POSES.stand(1, 0)} at={[330, 1000]} scale={geniusScaleForPx(520)} uid="ph1" />
          <CovidContactShadow at={[780, 1000]} scale={geniusScaleForPx(160)} uid="ph2s" />
          <Genius variant={0} pose={GENIUS_POSES.stand(-1, 0)} at={[780, 1000]} scale={geniusScaleForPx(160)} uid="ph2" />
          <Genius variant={2} pose={GENIUS_POSES.front(0)} at={[900, 1000]} scale={geniusScaleForPx(160)} uid="ph3" />
          <Lbl x={330} y={1060} t="hero 520 px" />
          <Lbl x={840} y={1060} t="mid 160 px" />
          {small.map(([h, x, y]) => (
            <Lbl key={h} x={x + h} y={y + 40} t={`${h} px`} size={18} />
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
export const STRIPS = ["walk", "stepOut", "type", "tick", "cheer", "stand"] as const;
export type StripName = (typeof STRIPS)[number];
const stripFrames = (s: StripName) => (s === "walk" ? GENIUS_WALK_CYCLE : s === "stepOut" ? STEP_OUT_FRAMES + 1 : s === "type" ? 30 : s === "tick" ? 45 : s === "cheer" ? 36 : 24);
const SCOLS = 8;
const SCW = 230;
const SRH = 380;
export const stripSize = (s: StripName) => ({ w: SCOLS * SCW + 40, h: Math.ceil(stripFrames(s) / SCOLS) * SRH + 40 });
const stripPose = (s: StripName, f: number, n: number): { pose: GeniusPose; dx: number; desk?: boolean; tick?: number } => {
  switch (s) {
    case "walk":
      return { pose: GENIUS_POSES.walk(1, f), dx: 0 };
    case "stepOut": {
      const t = f / (n - 1);
      return { pose: GENIUS_POSES.stepOut(1, t), dx: stepOutShift(1, t) - 40 };
    }
    case "type":
      return { pose: GENIUS_POSES.typeAtDesk(1, f), dx: -30, desk: true };
    case "tick": {
      const t = f / (n - 1);
      return { pose: GENIUS_POSES.writeTick(1, t, f), dx: -50, tick: t };
    }
    case "cheer":
      return { pose: GENIUS_POSES.cheer(f, Math.min(1, f / 14)), dx: 0 };
    default:
      return { pose: GENIUS_POSES.stand(1, f * 4), dx: 0 };
  }
};
export const GeniusStrip: React.FC<{ strip: StripName }> = ({ strip }) => {
  const n = stripFrames(strip);
  const { w, h } = stripSize(strip);
  const s = geniusScaleForPx(300);
  const bases = Array.from({ length: Math.ceil(n / SCOLS) }, (_, i) => 20 + (i + 1) * SRH - 50);
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
            {st.desk ? <DeskStub at={at} s={s} dir={1} /> : <CovidContactShadow at={at} scale={s} uid={`sc${f}`} />}
            {st.tick !== undefined ? <rect x={at[0] + 52 * s} y={at[1] - 300 * s} width={80 * s} height={104 * s} fill="#EFE7D6" /> : null}
            {tk.length > 1 ? <polyline points={tk.map((p) => `${at[0] + p[0] * s},${at[1] + p[1] * s}`).join(" ")} fill="none" stroke="#3A2D25" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" /> : null}
            <Genius variant={0} pose={st.pose} at={at} scale={s} uid={`s${f}`} />
            {st.desk ? <DeskStub at={at} s={s} dir={1} front /> : null}
            <Lbl x={20 + c * SCW + 22} y={20 + r * SRH + 26} t={`${f}`} size={20} />
          </g>
        );
      })}
    </SheetAir>
  );
};
