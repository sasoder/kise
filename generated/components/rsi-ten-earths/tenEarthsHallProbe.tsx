// ---------------------------------------------------------------------------
// tenEarthsHallProbe — probes of the shared hall module (tenEarthsHall.tsx) for rsi-ten-earths. Not a cut.
// One composition, TenEarthsHallProbe, with a `view` prop (src/Root.TenEarthsHallProbe.tsx):
//   rack       (a) a hero rack powered beside one dark, a mid row and a tiny row behind (interior mood)
//   wave       the hero rack's power wave: off over f8-f16, back on over f40-f48 (stills at any frame)
//   hall243    (b) GRID_243 in the hall at the cut-3 wide (crane-up height, fog by depth)
//   hall243Move  the same with a slow camera creep and a band of racks waving off and on (ms/frame)
//   block27    (c) BLOCK_27, 26 dark and the last lit one, a stand-in Genius in front of it
//   exterior   (d) the building shut, from above its roof (day)
//   cutaway    (d) the front wall half way down (cutaway 0.5)
//   cutawayIn  the front wall down, the eye under the ceiling looking in (cut 1's view)
//   compact    the cut-1 resolved frame: HALL_COMPACT open (cutaway 1), the eye under its ceiling, REAL Geniuses
//              (tenEarthsGenius, read-only) typing at profile desks and standing in the aisles
//   compactRoof  the cut-2 opening: the same compact building from outside and above, skylights glowing (skyGlow)
//   desk       (e) desks in three seatings with placeholder seated figures (and a covidFolk sitter for scale)
//   plates     (f) YearPlate states (t 0.25 / 0.5 / 0.75 / 1)
// The orange bean is a stand-in for the Genius (tenEarthsGenius.tsx).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, ACCENT_DEEP, AirFloor, AirShadow, AirStage, MAT, WorldSvg, airWorldOf, type AirWorld, type Cam, type DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";
import { Officer, POSES as COVID_POSES } from "../kyle-covid/covidFolk";
import { Genius, GENIUS_POSES } from "./tenEarthsGenius";
import {
  BLOCK_27,
  BLOCK_27_LAST,
  DataCenter,
  Desk,
  GRID_243,
  HALL,
  HALL_COMPACT,
  HallInterior,
  MAT_FLOOR,
  Rack,
  RackField,
  U,
  YearPlate,
  deskAnchors,
  powerWave,
  rackGrid,
  shiftRacks,
  type DeskSeat,
  type RackSpec,
} from "./tenEarthsHall";

export const FPS = 24000 / 1001;
export const DURATION = 96;
export const VIEWS = ["rack", "wave", "hall243", "hall243Move", "block27", "exterior", "cutaway", "cutawayIn", "desk", "plates", "compact", "compactRoof"] as const;
export const schema = z.object({ view: z.enum(VIEWS).default("rack"), cutaway: z.number().default(-1) });
export const defaultProps = schema.parse({});

/** the 2D camera that puts world point (wx, wy) at screen (540, sy) at zoom k */
const camAt = (wx: number, wy: number, k: number, sy = 860): Cam => ({ k, cx: wx, cy: wy - (sy - 960) / k });

/** the stand-in Genius: an orange bean with a head, standing at (X, Z) */
const Bean: React.FC<{ A: AirWorld; X: number; Z: number; uid: string; seated?: { hipsY: number; hands?: [number, number, number]; view: "back" | "front" | "profile"; dir?: number } }> = ({ A, X, Z, uid, seated }) => {
  const P = A.P;
  const r = P.r(Z);
  const col = A.toneO(ACCENT, Z, 150);
  const deep = A.toneO(ACCENT_DEEP, Z, 150);
  if (seated) {
    const hip = P.p(X, seated.hipsY, Z);
    const sh = P.p(X, seated.hipsY - 118, Z);
    const head = P.p(X, seated.hipsY - 172, Z);
    const hands = seated.hands ? P.p(seated.hands[0], seated.hands[1], seated.hands[2]) : null;
    return (
      <g>
        <ellipse cx={(hip[0] + sh[0]) / 2} cy={(hip[1] + sh[1]) / 2} rx={44 * r} ry={74 * r} fill={col} />
        {hands ? <path d={`M${sh[0] - 30 * r},${sh[1] + 14 * r}L${hands[0]},${hands[1]}M${sh[0] + 30 * r},${sh[1] + 14 * r}L${hands[0]},${hands[1]}`} stroke={deep} strokeWidth={14 * r} strokeLinecap="round" /> : null}
        <circle cx={head[0]} cy={head[1]} r={36 * r} fill={col} />
        {seated.view !== "back" ? <circle cx={head[0] + (seated.dir ?? 0) * 14 * r} cy={head[1] - 2 * r} r={4 * r} fill="#3A2A1A" /> : null}
      </g>
    );
  }
  const { at } = P.at(X, Z);
  return (
    <g>
      <AirShadow A={A} X={X} Z={Z} w={60} d={30} uid={`${uid}-s`} amt={0.8} />
      <ellipse cx={at[0]} cy={at[1] - 110 * r} rx={46 * r} ry={108 * r} fill={col} />
      <ellipse cx={at[0] + 14 * r} cy={at[1] - 110 * r} rx={30 * r} ry={96 * r} fill={deep} fillOpacity={0.35} />
      <circle cx={at[0]} cy={at[1] - 262 * r} r={44 * r} fill={col} />
      <circle cx={at[0] - 13 * r} cy={at[1] - 266 * r} r={4.5 * r} fill="#3A2A1A" />
      <circle cx={at[0] + 13 * r} cy={at[1] - 266 * r} r={4.5 * r} fill="#3A2A1A" />
    </g>
  );
};

type Setup = { cam: Cam; depth: DepthOpts; scene?: Parameters<typeof airWorldOf>[0]["scene"]; fogBy?: "eye" | "depth" };
const INTERIOR = { mood: "interior" as const, eyeT: 0.17 };

const setupOf = (view: (typeof VIEWS)[number], frame: number): Setup => {
  switch (view) {
    case "rack":
    case "wave":
      return { cam: camAt(0, -178, 1.15, 820), depth: { eyeY: -1.7 * U, dRef: 1500, kRef: 1.15, dolly: 0.5 }, scene: INTERIOR };
    case "hall243":
      return { cam: camAt(0, -1760, 0.327, 860), depth: { eyeY: -4800, dRef: 3000, kRef: 0.327, dolly: 0.4 }, scene: { ...INTERIOR, fogVis: 9000 }, fogBy: "depth" };
    case "hall243Move": {
      const k = 0.327 * (1 + 0.04 * (frame / DURATION));
      return { cam: camAt(-40 + frame * 0.8, -1760, k, 860), depth: { eyeY: -4800, dRef: 3000, kRef: 0.327, dolly: 0.4 }, scene: { ...INTERIOR, fogVis: 9000 }, fogBy: "depth" };
    }
    case "block27":
      return { cam: camAt(0, 0, 0.5, 1000), depth: { eyeY: -1300, dRef: 2400, kRef: 0.5, dolly: 0.5 }, scene: { ...INTERIOR, fogVis: 6000 }, fogBy: "depth" };
    case "compact":
      return { cam: camAt(0, -374, 0.61, 800), depth: { eyeY: -3.2 * U, dRef: 2600, kRef: 0.61, dolly: 0.5 }, scene: { mood: "day", fogVis: 9000 }, fogBy: "depth" };
    case "compactRoof":
      return { cam: camAt(0, -890, 0.4, 980), depth: { eyeY: -2400, dRef: 5000, kRef: 0.4, dolly: 0.5 }, scene: { mood: "day", fogVis: 14000 }, fogBy: "depth" };
    case "exterior":
    case "cutaway":
      return { cam: camAt(0, -1500, 0.19, 820), depth: { eyeY: -5000, dRef: 7000, kRef: 0.19, dolly: 0.5 }, scene: { mood: "day", fogVis: 16000 }, fogBy: "depth" };
    case "cutawayIn":
      return { cam: camAt(0, -520, 0.33, 820), depth: { eyeY: -3.4 * U, dRef: 4200, kRef: 0.33, dolly: 0.5 }, scene: { mood: "day", fogVis: 14000 }, fogBy: "depth" };
    case "desk":
      return { cam: camAt(0, -150, 1.0, 840), depth: { eyeY: -2.6 * U, dRef: 1700, kRef: 1.0, dolly: 0.5 }, scene: INTERIOR };
    case "plates":
    default:
      return { cam: camAt(0, -400, 0.9, 860), depth: { eyeY: -2 * U, dRef: 2000, kRef: 0.9, dolly: 0.5 }, scene: INTERIOR };
  }
};

export const ProbeView: React.FC<z.infer<typeof schema> & { frame: number }> = ({ view, cutaway, frame }) => {
  const S = setupOf(view, frame);
  const A = airWorldOf({ cam: S.cam, rest: S.cam, depth: S.depth, frame, scene: S.scene, fogBy: S.fogBy });
  let world: React.ReactNode = null;
  if (view === "rack" || view === "wave") {
    const w = view === "wave" ? (frame < 32 ? powerWave(frame, 8, "off") : powerWave(frame, 40, "on")) : { power: 1, relight: false };
    const mid = shiftRacks(rackGrid({ cols: 9, rows: 1, seed0: 40 }), 0, 1100);
    const tiny = shiftRacks(rackGrid({ cols: 27, rows: 2, seed0: 80 }), 0, 4200);
    world = (
      <>
        <AirFloor A={A} x0={-4000} x1={4000} z0={-8000} z1={9000} mat={MAT_FLOOR} course={0.6 * U} plank={0.6 * U} />
        <RackField A={A} racks={[...tiny, ...mid]} frame={frame} uid="bg" />
        <Rack A={A} X={-68} Z={0} frame={frame} uid="hero" seed={3} power={w.power} relight={w.relight} />
        <Rack A={A} X={68} Z={0} frame={frame} uid="dark" seed={10} power={view === "wave" ? 1 : 0} />
      </>
    );
  } else if (view === "hall243" || view === "hall243Move") {
    const racks: RackSpec[] = shiftRacks(GRID_243, 0, 420).map((rk) => {
      if (view !== "hall243Move") return rk;
      const band = (rk.row ?? 0) * 3 + Math.abs((rk.col ?? 0) - 13) * 0.6;
      const w = frame < 50 ? powerWave(frame, 10 + band, "off", 8) : powerWave(frame, 54 + band, "on", 8);
      return { ...rk, ...w };
    });
    world = (
      <>
        <AirFloor A={A} x0={-6000} x1={6000} z0={-8000} z1={0} mat={MAT_FLOOR} course={0.6 * U} plank={0.6 * U} melt={0} />
        <HallInterior A={A} uid="hi" />
        <RackField A={A} racks={racks} frame={frame} uid="g243" />
      </>
    );
  } else if (view === "block27") {
    const racks = BLOCK_27.map((rk) => ({ ...rk, power: rk.id === BLOCK_27_LAST ? 1 : 0 }));
    world = (
      <>
        <AirFloor A={A} x0={-3200} x1={3200} z0={-8000} z1={7000} mat={MAT_FLOOR} course={0.6 * U} plank={0.6 * U} />
        <RackField A={A} racks={racks} frame={frame} uid="b27" extras={[{ Z: -250, node: <Bean A={A} X={0} Z={-250} uid="bean" /> }]} />
      </>
    );
  } else if (view === "exterior" || view === "cutaway" || view === "cutawayIn") {
    const cw = cutaway >= 0 ? cutaway : view === "exterior" ? 0 : view === "cutaway" ? 0.5 : 1;
    const beans = [
      { X: -620, Z: 470 },
      { X: 540, Z: 430 },
      { X: 30, Z: 1060 },
      { X: -50, Z: 2050 },
      { X: 60, Z: 3000 },
    ];
    world = (
      <>
        <AirFloor A={A} x0={-12000} x1={12000} z0={-20000} z1={30000} mat={MAT.ground} course={420} />
        <DataCenter
          A={A}
          frame={frame}
          uid="dc"
          cutaway={cw}
          extras={beans.map((b, i) => ({ Z: b.Z, node: <Bean key={i} A={A} X={b.X} Z={b.Z} uid={`bn${i}`} /> }))}
        />
      </>
    );
  } else if (view === "compact" || view === "compactRoof") {
    const g = (X: number, Z: number, pose: ReturnType<typeof GENIUS_POSES.stand>, i: number) => {
      const { at, scale } = A.P.at(X, Z);
      return <Genius key={`g${i}`} variant={i % 5} pose={pose} at={at} scale={scale} uid={`gn${i}`} frame={frame} fog={A.folkFog(Z)} unitPx={A.k} />;
    };
    const extras: { Z: number; node: React.ReactNode }[] = [];
    if (view === "compact") {
      ([
        { X: -520, Z: 60, seat: "left" },
        { X: 520, Z: 60, seat: "right" },
      ] as { X: number; Z: number; seat: DeskSeat }[]).forEach((d, i) => {
        const an = deskAnchors(d.X, d.Z, d.seat);
        extras.push({
          Z: d.Z,
          node: (
            <g key={`d${i}`}>
              <Desk A={A} X={d.X} Z={d.Z} seat={d.seat} uid={`cd${i}`} layer="back" />
              {g(an.at.X, an.at.Z, GENIUS_POSES.typeAtDesk(an.dir === 1 ? 1 : -1, frame, i), i)}
              <Desk A={A} X={d.X} Z={d.Z} seat={d.seat} uid={`cdf${i}`} layer="front" />
            </g>
          ),
        });
      });
      [
        { X: -70, Z: 210, dir: 1 as const },
        { X: 120, Z: 700, dir: -1 as const },
        { X: -620, Z: 760, dir: 1 as const },
        { X: 40, Z: 1150, dir: -1 as const },
      ].forEach((s0, i) => extras.push({ Z: s0.Z, node: <g key={`s${i}`}><AirShadow A={A} X={s0.X} Z={s0.Z} w={62} d={30} uid={`gs${i}`} amt={0.8} />{g(s0.X, s0.Z, GENIUS_POSES.stand(s0.dir, frame, i), i + 2)}</g> }));
    }
    world = (
      <>
        <AirFloor A={A} x0={-12000} x1={12000} z0={-20000} z1={30000} mat={MAT.ground} course={420} />
        <DataCenter A={A} frame={frame} uid="dcc" hall={HALL_COMPACT} cutaway={view === "compact" ? (cutaway >= 0 ? cutaway : 1) : 0} extras={extras} skyGlow={{ color: ACCENT, amount: view === "compactRoof" ? 0.8 : 0 }} />
      </>
    );
  } else if (view === "desk") {
    const desks: { X: number; Z: number; seat: DeskSeat }[] = [
      { X: -330, Z: 120, seat: "front" },
      { X: 330, Z: 120, seat: "behind" },
      { X: -60, Z: 1000, seat: "left" },
    ];
    const items: React.ReactNode[] = [];
    // back to front by Z
    [...desks].sort((a, b) => b.Z - a.Z).forEach((d, i) => {
      const an = deskAnchors(d.X, d.Z, d.seat);
      items.push(<Desk key={`b${i}`} A={A} X={d.X} Z={d.Z} seat={d.seat} uid={`dk${i}`} layer="back" />);
      if (d.seat === "left") {
        const { at, scale } = A.P.at(an.at.X, an.at.Z);
        items.push(<Officer key={`o${i}`} variant={3} pose={COVID_POSES.sit(1)} at={at} scale={scale} uid={`of${i}`} fog={A.folkFog(an.at.Z)} unitPx={A.k} />);
      } else {
        items.push(<Bean key={`f${i}`} A={A} X={an.hips.X} Z={an.hips.Z} uid={`sb${i}`} seated={{ hipsY: an.hips.Y, hands: [an.hands.X, an.hands.Y, an.hands.Z], view: an.view === "back" ? "back" : "front" }} />);
      }
      items.push(<Desk key={`f${i}`} A={A} X={d.X} Z={d.Z} seat={d.seat} uid={`dkf${i}`} layer="front" />);
    });
    world = (
      <>
        <AirFloor A={A} x0={-3000} x1={3000} z0={-8000} z1={8000} mat={MAT_FLOOR} course={0.6 * U} plank={0.6 * U} />
        {items}
      </>
    );
  } else if (view === "plates") {
    const ts = [0.25, 0.5, 0.75, 1];
    world = (
      <>
        <AirFloor A={A} x0={-4000} x1={4000} z0={-8000} z1={9000} mat={MAT_FLOOR} course={0.6 * U} plank={0.6 * U} />
        <RackField A={A} racks={shiftRacks(rackGrid({ cols: 27, rows: 3, seed0: 300 }), 0, 1400)} frame={frame} uid="pbg" />
        {ts.map((t, i) => (
          <YearPlate key={i} A={A} X={-405 + i * 270} Y={-660} Z={0} text="2026" t={t} uid={`yp${i}`} size={80} />
        ))}
        <YearPlate A={A} X={-250} Y={-330} Z={0} text="×3" t={1} uid="ypx" size={140} />
        <YearPlate A={A} X={250} Y={-330} Z={0} text="2.5 billion" t={1} uid="ypb" size={96} />
        <YearPlate A={A} X={0} Y={-60} Z={0} text="2030" t={1} uid="yp4" size={110} weight={400} />
      </>
    );
  }
  return (
    <AirStage v={A.v} bloom={0.22}>
      <WorldSvg cam={S.cam}>{world}</WorldSvg>
    </AirStage>
  );
};

export const TenEarthsHallProbe: React.FC<z.infer<typeof schema>> = (p) => {
  const frame = useCurrentFrame();
  return <ProbeView {...p} frame={frame} />;
};

/** every probe still in one render (--sequence): frame i draws STILLS[i] */
export const STILLS: { name: string; view: (typeof VIEWS)[number]; frame: number; cutaway?: number }[] = [
  { name: "a_rack", view: "rack", frame: 20 },
  ...[6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((f) => ({ name: `wave_off_f${f}`, view: "wave" as const, frame: f })),
  ...[38, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49].map((f) => ({ name: `wave_on_f${f}`, view: "wave" as const, frame: f })),
  { name: "b_hall243", view: "hall243", frame: 20 },
  { name: "c_block27", view: "block27", frame: 20 },
  { name: "d_exterior", view: "exterior", frame: 20 },
  { name: "d_cutaway25", view: "cutaway", frame: 20, cutaway: 0.25 },
  { name: "d_cutaway50", view: "cutaway", frame: 20, cutaway: 0.5 },
  { name: "d_cutaway75", view: "cutaway", frame: 20, cutaway: 0.75 },
  { name: "d_cutaway100", view: "cutaway", frame: 20, cutaway: 1 },
  { name: "d_cutawayIn", view: "cutawayIn", frame: 20 },
  { name: "e_desk", view: "desk", frame: 20 },
  { name: "f_plates", view: "plates", frame: 20 },
  { name: "g_compact", view: "compact", frame: 20 },
  { name: "g_compact50", view: "compact", frame: 20, cutaway: 0.5 },
  { name: "g_compactRoof", view: "compactRoof", frame: 20 },
];
export const stillsSchema = z.object({ only: z.string().default("") });
export const TenEarthsHallStills: React.FC<z.infer<typeof stillsSchema>> = ({ only }) => {
  const i = useCurrentFrame();
  const list = only ? STILLS.filter((s) => only.split(",").some((o) => s.name.startsWith(o))) : STILLS;
  const s = list[Math.min(i, list.length - 1)];
  return <ProbeView view={s.view} cutaway={s.cutaway ?? -1} frame={s.frame} />;
};

export default TenEarthsHallProbe;
export { HALL };
