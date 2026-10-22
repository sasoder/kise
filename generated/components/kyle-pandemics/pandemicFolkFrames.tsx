// ---------------------------------------------------------------------------
// pandemicFolkFrames — STYLE FRAMES of the drawn cast, take 2 (kyle-pandemics V3; brief_V3_cast2.md step 1), style A
// (gouache, the director's pick). Stills only.
//   FolkRowA      the A row: the old londonCastV2 Worker (reference), the Worker front / profile / back, three crowd
//                 people (a woman c.1900 in the orange ink of TB's toll, a boy c.1900 in cream, an old medieval man in
//                 DEAD), the marmot at its burrow, the carpenter ant (orange threads = the infection), the greylag goose
//                 (orange bill and feet = the bird-flu carrier), and two head close-ups: dot eyes / the glance. On the
//                 clip's palette-A air (AirStage, pandemicAir.tsx) with a sand-umber floor.
//   FolkPeopleA   a crop of the row (the people only) for quick iterations.
//   FolkInSituA   1080x1920 in AirStage (day): the Worker at 720 px, a crowd at 150 px behind, crowd rows at 200 and
//                 70 px — the phone check (look at it 270 px wide).
// Stills: bunx remotion still src/entry.PandemicFolk.ts FolkRowA <out>.png
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill } from "remotion";
import { AirStage, H as AH, makeAirView, mixHex, type AirScene } from "./pandemicAir";
import { CREAM as OLD_CREAM, POSES as OLD_POSES, Worker as OldWorker, scaleForPx as oldScaleForPx } from "../kyle-london/londonCastV2";
import { FolkFigure, FolkShadow, INK_CREAM, INK_DEAD, INK_ORANGE, VARIANTS, ant, boy, goose, marmot, oldMan, woman, workerBack, workerFront, workerProfile, type Drawing } from "./pandemicFolkSketch";

const SCENE: AirScene = { look: "A", mood: "day", F: 1000, fogNear: 800, fogVis: 2200, fogMax: 0.97, hLow: 0, hHigh: 300, moteUnit: 100 };
const FONT = "Helvetica, Arial, sans-serif";
const CREAMTXT = "#F3EBDD";
const V = VARIANTS.A;

const airCss = (v: ReturnType<typeof makeAirView>, f: number) => {
  const c = v.airAtScreen(f * AH);
  return `rgb(${c.map((x) => Math.round(x)).join(",")})`;
};

// ---- a row's backdrop: AirStage (graded air, glow, grade, vignette) + a sand-umber floor + a few soft shafts --------
const RowAir: React.FC<{ w: number; h: number; base: number; id: string; children?: React.ReactNode }> = ({ w, h, base, id, children }) => {
  const v = makeAirView({ scene: SCENE, frame: 0, horizon: 1250 });
  return (
    <div style={{ position: "relative", width: w, height: h, overflow: "hidden" }}>
      <AirStage v={v} shafts={0} motes={0} grain={0} bloom={0.22}>
        <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
          <defs>
            <linearGradient id={`fl${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={airCss(v, (base - 150) / h)} stopOpacity={0} />
              <stop offset="0.35" stopColor={mixHex("#857659", "#5F877D", 0.35)} stopOpacity={0.55} />
              <stop offset="1" stopColor={mixHex("#6B5E49", "#3A3128", 0.3)} stopOpacity={1} />
            </linearGradient>
            <linearGradient id={`sh${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#F3EBDD" stopOpacity={0.16} />
              <stop offset="1" stopColor="#F3EBDD" stopOpacity={0} />
            </linearGradient>
          </defs>
          {[0.04, 0.19, 0.31, 0.52, 0.66, 0.83].map((f, i) => {
            const x0 = f * w;
            const ww = 60 + ((i * 37) % 90);
            const run = h * 0.4;
            return <polygon key={i} points={`${x0},0 ${x0 + ww},0 ${x0 + ww + run},${h} ${x0 + run},${h}`} fill={`url(#sh${id})`} style={{ mixBlendMode: "screen" }} />;
          })}
          <rect x={0} y={base - 150} width={w} height={h - base + 150} fill={`url(#fl${id})`} />
          {children}
        </svg>
      </AirStage>
    </div>
  );
};

const Lbl: React.FC<{ x: number; y: number; t: string; size?: number; anchor?: "start" | "middle"; op?: number; weight?: number }> = ({ x, y, t, size = 26, anchor = "middle", op = 0.82, weight = 400 }) => (
  <text x={x} y={y} fill={CREAMTXT} fontFamily={FONT} fontSize={size} textAnchor={anchor} opacity={op} fontWeight={weight}>
    {t}
  </text>
);

// ---- the A row ---------------------------------------------------------------------------------------------------
export const ROW_W = 5180;
export const ROW_H = 1220;
export const PEOPLE_W = 2860;
const PEOPLE_PX = 860; // the Worker, soles to cap top
const SP = PEOPLE_PX / 512;
const BASE = 1040;

type Item = { x: number; d: () => Drawing; s: number; label: string; shadowW: number };
const ITEMS: Item[] = [
  { x: 650, d: () => workerFront(), s: SP, label: "Worker, front", shadowW: 190 },
  { x: 1040, d: workerProfile, s: SP, label: "profile", shadowW: 150 },
  { x: 1420, d: workerBack, s: SP, label: "back", shadowW: 190 },
  { x: 1850, d: () => woman(INK_ORANGE), s: SP, label: "woman c.1900 (orange: TB)", shadowW: 200 },
  { x: 2230, d: () => boy(INK_CREAM), s: SP, label: "boy c.1900 (cream)", shadowW: 120 },
  { x: 2600, d: () => oldMan(INK_DEAD), s: SP, label: "medieval man (DEAD)", shadowW: 200 },
  { x: 3110, d: marmot, s: 2.3, label: "marmot", shadowW: 0 },
  { x: 3610, d: ant, s: 1.6, label: "carpenter ant", shadowW: 300 },
  { x: 4300, d: goose, s: 1.9, label: "greylag goose", shadowW: 260 },
];

const RowContent: React.FC = () => (
  <>
    <Lbl x={40} y={70} t={V.name} size={40} anchor="start" op={0.95} weight={700} />
    <g opacity={0.92}>
      <FolkShadow x={240} y={BASE} w={210} uid="os" />
      <OldWorker pose={OLD_POSES.front()} at={[240, BASE]} scale={oldScaleForPx(PEOPLE_PX * 0.97)} uid="oldA" coat={OLD_CREAM} ink={OLD_CREAM} cap shade={1} />
    </g>
    <Lbl x={240} y={BASE + 80} t="old (londonCastV2)" op={0.6} />
    <line x1={455} y1={150} x2={455} y2={ROW_H - 40} stroke={CREAMTXT} strokeOpacity={0.25} strokeWidth={2} strokeDasharray="6 10" />
    <line x1={2810} y1={150} x2={2810} y2={ROW_H - 40} stroke={CREAMTXT} strokeOpacity={0.25} strokeWidth={2} strokeDasharray="6 10" />
    {ITEMS.map((it, i) => (
      <g key={i}>
        {it.shadowW > 0 ? <FolkShadow x={it.x} y={BASE} w={it.shadowW} uid={`fs${i}`} /> : null}
        <FolkFigure d={it.d()} v={V} x={it.x} y={BASE} scale={it.s} uid={`f${i}`} />
        <Lbl x={it.x} y={BASE + 80} t={it.label} />
      </g>
    ))}
    <Lbl x={3700} y={150} t="animals at their own scale" size={22} op={0.5} />
    {/* head close-ups: dot eyes (default) and the glance (for moments that act, e.g. cut 74's turn) */}
    <line x1={4600} y1={150} x2={4600} y2={ROW_H - 40} stroke={CREAMTXT} strokeOpacity={0.25} strokeWidth={2} strokeDasharray="6 10" />
    <g>
      <defs>
        <clipPath id="hc1">
          <rect x={4640} y={150} width={500} height={400} rx={18} />
        </clipPath>
        <clipPath id="hc2">
          <rect x={4640} y={590} width={500} height={400} rx={18} />
        </clipPath>
      </defs>
      <g clipPath="url(#hc1)">
        <FolkFigure d={workerFront()} v={V} x={4890} y={150 + 1120} scale={2.1} uid="hz1" />
      </g>
      <g clipPath="url(#hc2)">
        <FolkFigure d={workerFront({ look: 0.85 })} v={V} x={4890} y={590 + 1120} scale={2.1} uid="hz2" />
      </g>
      <Lbl x={4890} y={575} t="dot eyes (default)" size={24} />
      <Lbl x={4890} y={1015} t="the glance (acting moments)" size={24} />
    </g>
  </>
);

export const FolkRowA: React.FC = () => (
  <AbsoluteFill>
    <RowAir w={ROW_W} h={ROW_H} base={BASE} id="ra">
      <RowContent />
    </RowAir>
  </AbsoluteFill>
);
export const FolkPeopleA: React.FC = () => (
  <AbsoluteFill>
    <RowAir w={PEOPLE_W} h={ROW_H} base={BASE} id="pa">
      <RowContent />
    </RowAir>
  </AbsoluteFill>
);
export const ANIMALS_W = 2400;
export const FolkAnimalsA: React.FC = () => (
  <AbsoluteFill>
    <div style={{ position: "absolute", left: -2800, top: 0 }}>
      <RowAir w={ROW_W} h={ROW_H} base={BASE} id="aa">
        <RowContent />
      </RowAir>
    </div>
  </AbsoluteFill>
);

// ---- in situ: one 1080x1920 frame (the phone check) -----------------------------------------------------------------
const CROWD = [() => woman(INK_ORANGE), () => boy(INK_CREAM), () => oldMan(INK_DEAD), () => woman(INK_CREAM), () => oldMan(INK_ORANGE), () => boy(INK_ORANGE), () => woman(INK_DEAD)];
export const FolkInSituA: React.FC = () => {
  const air = makeAirView({ scene: SCENE, frame: 0, horizon: 760 });
  const rowOf = (y: number, px: number, n: number, x0: number, dx: number, key: string, start = 0) =>
    Array.from({ length: n }, (_, i) => {
      const dd = CROWD[(i + start) % CROWD.length]();
      return (
        <g key={`${key}${i}`}>
          <FolkShadow x={x0 + i * dx} y={y} w={px * 0.32} uid={`${key}s${i}`} />
          <FolkFigure d={dd} v={V} x={x0 + i * dx} y={y} scale={px / 512} uid={`${key}${i}`} />
        </g>
      );
    });
  return (
    <AirStage v={air} bloom={0.22}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="gis" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={mixHex("#857659", "#5F877D", 0.7)} stopOpacity={0} />
            <stop offset="0.08" stopColor={mixHex("#857659", "#5F877D", 0.55)} />
            <stop offset="0.5" stopColor={mixHex("#857659", "#466C66", 0.25)} />
            <stop offset="1" stopColor={mixHex("#6B5E49", "#3A3128", 0.4)} />
          </linearGradient>
        </defs>
        <rect x={0} y={700} width={1080} height={1220} fill="url(#gis)" />
        {/* a crowd at mid distance (150 px), a little veiled by the air */}
        <g opacity={0.88}>{rowOf(880, 150, 7, 80, 152, "m", 2)}</g>
        {/* the Worker big */}
        <FolkShadow x={540} y={1060} w={220} uid="ws" />
        <FolkFigure d={workerFront()} v={V} x={540} y={1060} scale={720 / 512} uid="w" />
        {/* cut-13 sizes: 200 px and 70 px rows */}
        {rowOf(1590, 200, 6, 110, 172, "r")}
        {rowOf(1800, 70, 12, 66, 86, "t", 3)}
      </svg>
    </AirStage>
  );
};
