// ---------------------------------------------------------------------------------------------------------------
// DenverProbe (scott-weather-fired): the world's probe stills, one per frame of a 6-frame composition.
//   f0 (a) DEN_CAM_ESTABLISH with three mature storms
//   f1 (b) DEN_CAM_RING, the ring lit amber, a strike at the ring's west edge, rampActive 0
//   f2 (c) DEN_CAM_RING, the ring cream, a cell east of the airport drifting east
//   f3 (d) a storm growth strip (growth 0, .2, .4, .6, .8, 1 side by side; scratch only)
//   f4 (e) DEN_CAM_AREA with four streams, the posts and the blanket at cover 0.6
//   f5 (f) a close crop of the terminal peaks and Concourse B
//   f6 (g) scratch: the traced layout (red) over the aerial from a raised oblique (pitch 50): registration + mask edge
// ---------------------------------------------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  AirStage,
  ArrivalStream,
  CELL_DRIFT,
  CONCOURSES,
  RUNWAYS,
  TAXIWAYS,
  projectLine,
  CELL_POS,
  CONCOURSE_B,
  CornerPost,
  DEN_CAM_AREA,
  DEN_CAM_ESTABLISH,
  DEN_CAM_RING,
  LightningStrike,
  POPUP_END,
  RING_MI,
  STRIKE,
  ThreeMileRing,
  WorstCaseBlanket,
  makeView,
  strikeGlow,
  type DenCam,
  type PostId,
  type StormState,
} from "./denverWorld";

export const FPS = 24000 / 1001;
export const DURATION = 7;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const S = 64;
const mature = (id: string, x: number, y: number, seed: number, g = 1, size = 1): StormState => ({ id, x, y, seed, growth: g, size, vx: 0, vy: 0 });

const ProbeA: React.FC = () => {
  const v = makeView(DEN_CAM_ESTABLISH);
  const cells = [mature("NW", CELL_POS.NW.x, CELL_POS.NW.y, 11, 1, 1.05), mature("W", CELL_POS.W.x, CELL_POS.W.y, 23, 0.95, 0.78), mature("NE", CELL_POS.NE.x, CELL_POS.NE.y, 37, 0.9)];
  return <AirStage S={S} v={v} cells={cells} />;
};
const ProbeB: React.FC = () => {
  const v = makeView(DEN_CAM_RING);
  const t = STRIKE.contact + 2;
  const w = mature("W", CELL_POS.W.x, CELL_POS.W.y, 23, 0.95, 0.78);
  w.glow = strikeGlow(t);
  const cells = [w, ...POPUP_END.filter((c) => c.id !== "W").map((c) => ({ ...c, vx: 0, vy: 0 }))];
  return (
    <AirStage
      S={S}
      v={v}
      cells={cells}
      rampActive={0}
      ground={<ThreeMileRing v={v} draw={1} lit={1} label />}
      over={<LightningStrike v={v} from={CELL_POS.W} to={{ x: -RING_MI + 0.12, y: 0.35 }} t={t} seed={5} />}
    />
  );
};
const ProbeC: React.FC = () => {
  const v = makeView(DEN_CAM_RING);
  const east: StormState = { id: "E", x: 3.4, y: 1.4, seed: 61, growth: 0.88, size: 0.8, vx: CELL_DRIFT.vx * 4, vy: 0 };
  const cells = [east, ...POPUP_END.filter((c) => c.id === "NW" || c.id.startsWith("cu"))];
  return <AirStage S={S} v={v} cells={cells} ground={<ThreeMileRing v={v} draw={1} lit={0} label />} />;
};
const ProbeD: React.FC = () => {
  const cam: DenCam = { tx: 0, ty: 30, dist: 46, pitch: 4, heading: 0, fov: 60 };
  const v = makeView(cam);
  const cells = [0, 0.2, 0.4, 0.6, 0.8, 1].map((g, i) => mature(`g${i}`, -12.5 + i * 4.6, 30, 101 + i, g));
  return <AirStage S={S} v={v} cells={cells} />;
};
const ProbeE: React.FC = () => {
  const v = makeView(DEN_CAM_AREA);
  const posts: PostId[] = ["NE", "SE", "SW", "NW"];
  return (
    <AirStage
      S={S}
      v={v}
      cells={POPUP_END.filter((c) => c.id === "cu2" || c.id === "cu4")}
      ground={<WorstCaseBlanket v={v} cover={0.6} S={S} />}
      over={
        <>
          {posts.map((p) => (
            <ArrivalStream key={`s${p}`} v={v} post={p} S={S} rateAt={() => 1} />
          ))}
          {posts.map((p) => (
            <CornerPost key={p} v={v} post={p} narrow={0.3} />
          ))}
        </>
      }
    />
  );
};
const ProbeF: React.FC = () => {
  const cam: DenCam = { tx: CONCOURSE_B.x * 0.5, ty: 0.1, dist: 3.4, pitch: 18, heading: -32, fov: 60 };
  const v = makeView(cam);
  return <AirStage S={S} v={v} cells={POPUP_END.filter((c) => c.id === "NW" || c.id === "cu1" || c.id === "cu4")} />;
};

/** (g, scratch) registration check: top-down over the airfield, the aerial with the traced layout's runways,
 *  taxiways and concourses drawn over it as thin red lines. */
const ProbeG: React.FC = () => {
  const v = makeView({ tx: 0, ty: 0.9, dist: 30, pitch: 50, heading: -10, fov: 60 });
  const lines = [...RUNWAYS.map((r) => [[r.x0, r.y0], [r.x1, r.y1]] as [number, number][]), ...TAXIWAYS.map((t) => t.pts), ...CONCOURSES.map((c) => [[c.x0, (c.y0 + c.y1) / 2], [c.x1, (c.y0 + c.y1) / 2]] as [number, number][])];
  return (
    <AirStage
      S={S}
      v={v}
      cells={[]}
      dust={0}
      over={
        <g>
          {lines.map((l, i) => (
            <path key={i} d={projectLine(v, l.map(([x, y]) => [x, y, 0])).map((run) => `M${run.map((q) => `${q.x} ${q.y}`).join("L")}`).join("")} stroke="#FF2020" strokeWidth={1.2} fill="none" opacity={0.8} />
          ))}
        </g>
      }
    />
  );
};
const PROBES = [ProbeA, ProbeB, ProbeC, ProbeD, ProbeE, ProbeF, ProbeG];
const DenverProbe: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const P = PROBES[Math.max(0, Math.min(PROBES.length - 1, f))];
  return <P />;
};
export default DenverProbe;
