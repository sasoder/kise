// ---------------------------------------------------------------------------
// farOutProbe: probe stills of FarOutOfAustin's own set pieces (src/Root.FarOutProbe.tsx), on the cast-sheet pattern:
//   FarOutProbe view "city"     the skyline at the cut's opening distance (Capitol + towers + low blocks, a car)
//   FarOutProbe view "capitol"  the Capitol close (dome, drum, portico, wings)
//   FarOutProbe view "cars"     the sedan: side, three-quarter front, front, three-quarter rear, rear, turned wheels
//   FarOutProbe view "guard"    the cattle guard in its fence line with the car crossing it
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AirHorizonHazeW, AirStage, WorldSvg } from "../kits/dwarkesh-3d/dwarkesh3d";
import { HillGround, cam3, ranchAirOf, type Item, type Terrain } from "./ranchWorld";
import { BarbedFence, CAR_MAT, CattleGuard, Sedan } from "./farOutCar";
import { AustinCity, Capitol, cityToner } from "./farOutCity";
import { CITY_X, DIRT_NODES, FARM_X, FARM_Z, GUARD_AT, ROUTE, camAt, carAt, cityZ, toScreen } from "./farOutPlan";

const FLAT: Terrain = { H: () => 0 };
const Label: React.FC<{ x: number; y: number; t: string }> = ({ x, y, t }) => (
  <text x={x} y={y} fill="#F3EBDD" fontFamily="Helvetica, Arial" fontSize={22} textAnchor="middle" opacity={0.85}>
    {t}
  </text>
);

/** the camera plot for the review: the plan (top view) of the route and the camera, and the camera's and the car's
 *  numbers per frame */
const CamPlot: React.FC = () => {
  const F = Array.from({ length: 322 }, (_, f) => f);
  const cams = F.map((f) => camAt(f));
  const cars = F.map((f) => carAt(f));
  const scr = F.map((f) => toScreen(cams[f], cars[f].X, cars[f].H + 120, cars[f].Z));
  // plan view: X right, Z up (toward Austin)
  const box = { x: 60, y: 90, w: 960, h: 760 };
  const xs = [...ROUTE.pts.map((p) => p.X), ...cams.map((c) => c.X)];
  const zs = [...ROUTE.pts.filter((p) => p.Z < 50000).map((p) => p.Z), ...cams.map((c) => c.Z)];
  const x0 = Math.min(...xs) - 2000;
  const x1 = Math.max(...xs) + 2000;
  const z0 = Math.min(...zs) - 2000;
  const z1 = Math.max(...zs) + 2000;
  const sc = Math.min(box.w / (x1 - x0), box.h / (z1 - z0));
  const P = (X: number, Z: number) => `${(box.x + (X - x0) * sc).toFixed(1)},${(box.y + box.h - (Z - z0) * sc).toFixed(1)}`;
  const route = ROUTE.pts.filter((p) => p.Z < z1).map((p) => P(p.X, p.Z)).join(" ");
  const camPath = cams.map((c) => P(c.X, c.Z)).join(" ");
  const ticks = F.filter((f) => f % 20 === 0 || f === 321);
  // time series
  const ts = (y0: number, h: number, vals: number[], lo: number, hi: number) => vals.map((v, f) => `${(60 + (f / 321) * 960).toFixed(1)},${(y0 + h - ((v - lo) / (hi - lo)) * h).toFixed(1)}`).join(" ");
  const T = (x: number, y: number, t: string, c = "#E8E2D2", sz = 20) => (
    <text x={x} y={y} fill={c} fontFamily="Helvetica, Arial" fontSize={sz}>
      {t}
    </text>
  );
  const series: { y: number; label: string; lines: { v: number[]; lo: number; hi: number; c: string; name: string }[] }[] = [
    { y: 920, label: "camera distance D (log) and height E over the target's ground", lines: [
      { v: cams.map((c) => Math.log(c.D)), lo: Math.log(3500), hi: Math.log(14000), c: "#E9B35A", name: `D ${(cams[0].D / 1000).toFixed(1)}k -> ${(cams[135].D / 1000).toFixed(1)}k (guard) -> ${(cams[cams.length - 1].D / 1000).toFixed(1)}k` },
      { v: cams.map((c) => c.E - c.tH), lo: 0, hi: 5200, c: "#7FC6D9", name: `E ${((cams[0].E - cams[0].tH) / 1000).toFixed(1)}k -> ${((cams[135].E - cams[135].tH) / 1000).toFixed(1)}k (guard) -> ${((cams[cams.length - 1].E - cams[cams.length - 1].tH) / 1000).toFixed(1)}k` },
    ] },
    { y: 1190, label: "focal C (lens) and the city's world Z (log, the receding cheat)", lines: [
      { v: cams.map((c) => c.C), lo: 900, hi: 2000, c: "#C9A2E0", name: "C 1500 -> 1900 (guard) -> 1000" },
      { v: F.map((f) => Math.log(cityZ(f))), lo: Math.log(100000), hi: Math.log(700000), c: "#9AD08A", name: "city Z 116k -> 630k" },
    ] },
    { y: 1460, label: "the car on screen: x, y (px) and length (px)", lines: [
      { v: scr.map((q) => q.x), lo: 0, hi: 1080, c: "#E9B35A", name: "x" },
      { v: scr.map((q) => q.y), lo: 0, hi: 1920, c: "#7FC6D9", name: "y" },
      { v: F.map((f) => (1000 * cams[f].C) / scr[f].d), lo: 0, hi: 400, c: "#F08080", name: "length" },
    ] },
  ];
  return (
    <AbsoluteFill style={{ background: "#26302C" }}>
      <svg width={1080} height={1920}>
        {T(60, 50, "FarOutOfAustin camera plot (plan: X right, Z up toward Austin)", "#F3EBDD", 26)}
        <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="none" stroke="#56645E" />
        <polyline points={route} fill="none" stroke="#C2B898" strokeWidth={3} />
        <polyline points={camPath} fill="none" stroke="#E9B35A" strokeWidth={2} />
        {ticks.map((f) => {
          const [a, b] = P(cams[f].X, cams[f].Z).split(",").map(Number);
          const [c, d] = P(cars[f].X, cars[f].Z).split(",").map(Number);
          return (
            <g key={f}>
              <line x1={a} y1={b} x2={c} y2={d} stroke="#E9B35A" strokeOpacity={0.35} />
              <circle cx={a} cy={b} r={4} fill="#E9B35A" />
              <circle cx={c} cy={d} r={4} fill="#7FC6D9" />
              {T(c + 6, d - 6, `${f}`, "#7FC6D9", 15)}
            </g>
          );
        })}
        {(() => {
          const [gx, gy] = P(GUARD_AT[0], GUARD_AT[1]).split(",").map(Number);
          const [fx, fy] = P(FARM_X, FARM_Z).split(",").map(Number);
          return (
            <g>
              <rect x={gx - 7} y={gy - 7} width={14} height={14} fill="#F08080" />
              {T(gx + 10, gy + 20, "cattle guard", "#F08080", 17)}
              <rect x={fx - 8} y={fy - 8} width={16} height={16} fill="#F3EBDD" />
              {T(fx - 30, fy + 26, "farm", "#F3EBDD", 17)}
              {T(box.x + 8, box.y + 24, `Austin (Capitol at X ${CITY_X}) is far up this axis, beyond the frame`, "#9AD08A", 16)}
              {T(box.x + 8, box.y + box.h - 12, "camera (orange) -> car (blue) every 20 frames; ranch road nodes " + DIRT_NODES.length, "#E8E2D2", 16)}
            </g>
          );
        })()}
        {series.map((sr, i) => (
          <g key={i}>
            <rect x={60} y={sr.y} width={960} height={220} fill="none" stroke="#56645E" />
            {T(60, sr.y - 10, sr.label, "#E8E2D2", 18)}
            {[0, 46, 102, 130, 155, 180, 213, 219, 261, 303].map((f) => (
              <line key={f} x1={60 + (f / 321) * 960} y1={sr.y} x2={60 + (f / 321) * 960} y2={sr.y + 220} stroke="#56645E" strokeDasharray="3 5" />
            ))}
            {sr.lines.map((l, j) => (
              <g key={j}>
                <polyline points={ts(sr.y, 220, l.v, l.lo, l.hi)} fill="none" stroke={l.c} strokeWidth={2.5} />
                {T(70 + j * 330, sr.y + 210, l.name, l.c, 16)}
              </g>
            ))}
          </g>
        ))}
        {T(60, 1720, "dashed: AUSTIN 23 ... 22 46 · LEFT 102 · CATTLE 130 · TURN 155 · DIRT 180 · TURN LEFT 213 · 22 MILES 261 · FARM 303", "#E8E2D2", 15)}
      </svg>
    </AbsoluteFill>
  );
};

export const FarOutProbe: React.FC<{ view: "city" | "capitol" | "cars" | "guard" | "camplot" }> = ({ view }) => {
  const frame = useCurrentFrame();
  if (view === "camplot") return <CamPlot />;
  if (view === "city" || view === "capitol") {
    const c = view === "city" ? { X: 0, Z: -62000, E: 1600, C: 1000, yH: 700 } : { X: -3000, Z: -26000, E: 900, C: 1300, yH: 900 };
    const { cam, depth } = cam3(c);
    const A = ranchAirOf({ cam, depth, rest: cam, frame, scene: { fogVis: 45000 } });
    const tone = cityToner(A, view === "city" ? 0.12 : 0.05, A.screenAir(-1600));
    const items: Item[] = [
      { Z: -1000, node: view === "city" ? <AustinCity key="c" A={A} o={[2000, 0, 0]} tone={tone} frame={frame} uid="ac" /> : <Capitol key="c" A={A} o={[0, 0, 0]} tone={tone} uid="cp" /> },
    ];
    if (view === "city")
      items.push({ Z: -56500, node: <Sedan key="car" A={A} o={[-150, 0, -56000]} heading={[-0.2, -0.98]} mat={CAR_MAT.blueGrey} uid="car" roll={frame / 6} /> });
    return (
      <AirStage v={A.v} shafts={0.5} motes={0.3} bloom={0.12}>
        <WorldSvg cam={A.cam}>
          <AirHorizonHazeW A={A} id="hz" />
          <HillGround A={A} T={FLAT} z0={-60000} z1={60000} items={items} frame={frame} uid="hg" />
        </WorldSvg>
      </AirStage>
    );
  }
  if (view === "cars") {
    const { cam, depth } = cam3({ X: 0, Z: -9000, E: 2400, C: 2600, yH: 200 });
    const A = ranchAirOf({ cam, depth, rest: cam, frame });
    const rows: { Z: number; xs: number[]; hs: [number, number][]; steer?: number }[] = [
      { Z: -2600, xs: [-560, 560], hs: [[1, 0], [-0.7, -0.7]] },
      { Z: -1000, xs: [-640, 0, 640], hs: [[0, -1], [0.6, -0.8], [0.8, 0.6]] },
      { Z: 900, xs: [-700, 0, 700], hs: [[0, 1], [-0.95, 0.3], [0.5, -0.86]], steer: 0.45 },
    ];
    const items: Item[] = [];
    rows.forEach((rw, ri) =>
      rw.xs.forEach((x, i) => {
        items.push({ Z: rw.Z - 500, node: <Sedan key={`${ri}${i}`} A={A} o={[x, 0, rw.Z]} heading={rw.hs[i]} roll={frame / 10 + i} steer={rw.steer ?? 0} uid={`s${ri}${i}`} mat={ri === 2 && i === 2 ? CAR_MAT.oatmeal : CAR_MAT.blueGrey} /> });
      }),
    );
    return (
      <AirStage v={A.v} shafts={0.3} motes={0} bloom={0.1}>
        <WorldSvg cam={A.cam}>
          <HillGround A={A} T={FLAT} z0={-4000} z1={12000} items={items} frame={frame} uid="hg" />
        </WorldSvg>
        <AbsoluteFill>
          <svg width={1080} height={1920}>
            <Label x={540} y={60} t="FarOutProbe cars: side / 3-4 front / front / 3-4 rear / rear / steered" />
          </svg>
        </AbsoluteFill>
      </AirStage>
    );
  }
  // the guard: the cut's f135 framing (camera ahead of the car, the guard on its left / screen right)
  const { cam, depth } = cam3({ X: -500, Z: -5000, E: 1400, C: 1400, yH: 460 });
  const A = ranchAirOf({ cam, depth, rest: cam, frame });
  const across: [number, number] = [-0.8, -0.6];
  const G: [number, number] = [0, -1200];
  const fenceL: [number, number][] = [
    [G[0] - across[0] * 9000, G[1] - across[1] * 9000],
    [G[0] - across[0] * 1100, G[1] - across[1] * 1100],
  ];
  const fenceR: [number, number][] = [
    [G[0] + across[0] * 1100, G[1] + across[1] * 1100],
    [G[0] + across[0] * 9000, G[1] + across[1] * 9000],
  ];
  const tr: [number, number] = [-across[1], across[0]];
  const carAt = (s: number): [number, number, number] => [G[0] + tr[0] * s, 0, G[1] + tr[1] * s];
  const s = -900 + ((frame * 20) % 1800);
  const items: Item[] = [
    { Z: G[1] - 500, node: <CattleGuard key="g" A={A} X={G[0]} Z={G[1]} H={0} across={across} uid="cg" part="bed" /> },
    { Z: G[1] - 900, node: <CattleGuard key="gp" A={A} X={G[0]} Z={G[1]} H={0} across={across} uid="cgp" part="posts" /> },
    { Z: Math.min(...fenceL.map((p) => p[1])) , node: <BarbedFence key="fl" A={A} pts={fenceL} ground={() => 0} /> },
    { Z: Math.min(...fenceR.map((p) => p[1])), node: <BarbedFence key="fr" A={A} pts={fenceR} ground={() => 0} /> },
    { Z: carAt(s)[2] - 500, node: <Sedan key="car" A={A} o={carAt(s)} heading={tr} roll={s / 66} uid="car" /> },
  ];
  return (
    <AirStage v={A.v} shafts={0.5} motes={0.3} bloom={0.12}>
      <WorldSvg cam={A.cam}>
        <AirHorizonHazeW A={A} id="hz" />
        <HillGround A={A} T={FLAT} z0={-4000} z1={30000} items={items} tufts={[{ x0: -6000, x1: 6000, z0: -4000, z1: 8000, step: 110, seed: 2 }]} frame={frame} uid="hg" />
      </WorldSvg>
    </AirStage>
  );
};
