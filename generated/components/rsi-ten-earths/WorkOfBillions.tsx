// ---------------------------------------------------------------------------
// WorkOfBillions (rsi-ten-earths, cut 45, revision 1). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 149 frames. Shared modules (read-only): tenEarthsBot (the robot, v0 THE robot for the
// hero, typeAtDesk, BotPaint for this cut's seated sprites, the crowd's back-view sprites), tenEarthsHall (Desk, the
// materials, YearPlate), tenEarthsGlobe (drawGlobe / globePoint: a normal Earth). This cut's own parts:
// workOfBillionsWorld.ts (the world and the camera, pure), workOfBillionsParts.tsx (the drawing),
// workOfBillionsLights.ts (13,338 city lights baked by scripts/clips/rsi-ten-earths/bake-work-of-billions-lights.mjs
// from world-atlas land and countries: ~330 metros by population plus a national scatter, deterministic).
//
// CHECK LINE: "From one AI robot at a desk up to the whole planet lit with them: by 2030 it's work on the scale of
//   2.5 billion workers."
//
// THE LINE: "by 2030, there will be enough compute for AIs to do the work of about 2 .5 billion full -time human
//   workers. And"
// WORD -> FRAME (from the composition start): 2030 0 · there 14 · will 22 · be 24 · enough 27 · compute 35 · for 44 ·
//   AIs 52 · to 63 · do 67 · the 69 · work 73 · of 79 · about 83 · 2 90 · .5 95 · billion 105 · full 115 · -time 125 ·
//   human 131 · workers. 138
// DURATION: the slot 45.0450 -> 51.2595 s = 6.2145 s x 23.976 = 149 frames (f0..f148).
//
// THE MOTION: ONE powers-of-ten climb in log space (the eye's distance D = 660 e^lambda, lambda eased in from a slow
//   start, fastest through the city ~f79-85, decelerating over the globe's reveal f86-104, then a slow pull-back that never stops):
//   f0 "2030": close on ONE robot (v0) typing at its desk by the window of an office building's 5th floor, seen from
//   outside through the glass (hero ~400 px, face y ~700, the monitor's glow); beside it, on the pillar, a wall
//   planner with "2030" in Caslon (~75 px cap), readable on the first beat.
//   f14-35 "enough compute": the camera backs off and cranes up inside the double-height window: its row of desks,
//   then the whole floor of robots, row after row into the room.
//   f44-60 "for AIs": out past the facade: the building, every storey's window full of robots, its roof; the block;
//   f60-79 "to do the work of": the city to the horizon. Its buildings are neutral stone (cream, warm grey), fogged
//   into the air; their windows small and distinct, dim rooms with a robot in most (an orange bean with a head
//   block), far off a scatter of orange specks: orange = the robots, to the horizon.
//   f75-88: a short rise through a thin, broken cloud layer (the city faintly below through its gaps); under it the
//   city fades out and the planet in (f81.5-84.5), the Earth's curve showing from f82-83 (its bottom limb at y 1040).
//   f86-100 "about 2 .5": the cloud falls away; the WHOLE EARTH, a normal Earth, its land speckled with robots drawn
//   with the robot's own dot LOD, clustered where the cities are (partial: cut 99 covers China, then the Earth); it
//   turns from the city we left (Chongqing) to its rest face; its bottom held at y 1040, clear of the caption bands.
//   f97-109 "billion": the plate "2.5 billion" slides up while fading in, just above the globe (no shadow); it rides
//   with the globe's top through the hold.
//   f109-148 "full-time human workers": the pull-back carries on slowly (globe 630 -> 583 px across), the planet turns
//   (0.11 deg/frame), the specks twinkle and a few more arrive (f104-146).
// Orange = the AIs only: the robots (live, silhouettes on the other floors, specks in the city's windows and on the
//   planet). Everything else is stone, glass, laminate, the land and the sea.
//
// DEPTH: a shift-lens eye (verticals stay vertical), F = 1100 px, the eye at (0, -He, -D): x = 540 + X F / d,
//   y = yh + (Y + He) F / d, d = D + Z (the kit's WorldSvg/londonDepth as cam {k: F/D, cx: 0, cy: -He - (yh-960)/k},
//   depth {eyeY: -He, dRef: D, kRef: k, dolly: 0}). The air: the kit's medium (look A, day) with its fog scaled to
//   the eye's distance (one medium at every power of ten).
// CHECKS: scripts/clips/rsi-ten-earths/check-work-of-billions.ts (the camera's one lobe, faces vs the caption bands,
//   the plate's keep-in, the eye never inside a building, the globe's bottom <= 1060 from the swap on, the hold never stalls).
//
// SOURCES: "2.5 billion full-time human workers" by 2030 is the SPEAKER'S OWN ESTIMATE (Dwarkesh Patel's essay, as
//   spoken), kept exactly as spoken; not a sourced figure. On screen only "2030" and "2.5 billion". The city specks' places:
//   Natural Earth 1:110m land and countries (world-atlas, public domain) and approximate metro populations; an
//   illustration of where people live, not a dataset.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AIR, AirBox, AirStage, MAT, WorldSvg, airWorldOf, c01, mixHex, type AirWorld } from "../kits/dwarkesh-3d/dwarkesh3d";
import { BOT_POSES, Bot, botCrowdReqs, useBotSprites } from "./tenEarthsBot";
import { CREAM, DESK, Desk, MAT_OATMEAL, PLATE_FONT, YearPlate, yearPlateT } from "./tenEarthsHall";
import type { GlobeSpec } from "./tenEarthsGlobe";
import {
  CpuCanvas,
  airOfEye,
  burstOf,
  camOfEye,
  drawCity,
  drawCloud,
  drawGround,
  drawHeroExterior,
  drawPlanet,
  drawStorey,
  lookOf,
  openingOf,
  painterOf,
  seedOf,
  useSeatSprites,
} from "./workOfBillionsParts";
import {
  DURATION as W_DURATION,
  FPS as W_FPS,
  globeAt,
  plateY,
  PLATE_SIZE,
  HERO_PILLAR,
  LIVE_COLS,
  STOREY_MAX,
  STOREY_MIN,
  PILLAR_W,
  PLANNER,
  PLATE_DUR,
  PLATE_F0,
  colX,
  eyeAt,
  lambdaAt,
  pillarX,
  sst,
  storeyCeil,
  type Eye,
} from "./workOfBillionsWorld";

export const FPS = W_FPS;
export const DURATION = W_DURATION;
export const schema = z.object({ camFrame: z.number().default(-1) });
export const defaultProps = schema.parse({});

const PAL = AIR.A;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ===================================================================================================================
// THE AIR PASS AND THE PLANET (by frame)
// ===================================================================================================================
/** a short rise through a thin, broken cloud layer: a light veil and the deck's cover (the city stays faintly visible
 *  through its gaps, the Earth's curve shows through as soon as it is there) */
export const veilAt = (f: number) => 0.42 * sst(75, 80.5, f) * (1 - sst(84, 87.5, f));
export const coverAt = (f: number) => 0.55 * sst(73, 80, f) * (1 - sst(84.5, 91, f));
/** the swap under the cloud: the city fades out as the planet fades in (f81.5-84.5) */
export const WORLD_A = (f: number) => 1 - sst(81.5, 84.5, f);
export const PLANET_A = (f: number) => sst(81.5, 84.5, f);
export const globeSpecAt = (f: number): GlobeSpec => ({ ...globeAt(f), fog: 0, air: mixHex(PAL.ramp[1][1], PAL.ramp[0][1], 0.5) });

// ===================================================================================================================
// THE PLANNER ("2030" on the pillar beside the hero, toward the window)
// ===================================================================================================================
const Planner: React.FC<{ A: AirWorld }> = ({ A }) => {
  const P = A.P;
  const Z = PLANNER.z;
  const a = P.p(PLANNER.x0, PLANNER.y0, Z);
  const b = P.p(PLANNER.x1, PLANNER.y1, Z);
  const s = P.r(Z);
  const w = b[0] - a[0];
  const h = b[1] - a[1];
  const ink = A.tone(mixHex(PAL.shadow, "#2A2620", 0.5), Z, 250);
  const paper = A.tone(CREAM, Z, 250);
  const grid: React.ReactNode[] = [];
  const gx0 = a[0] + 0.1 * w;
  const gx1 = b[0] - 0.1 * w;
  const gy0 = a[1] + 0.55 * h;
  const gy1 = b[1] - 0.08 * h;
  const cols = 7;
  const rows = 5;
  for (let rI = 0; rI < rows; rI++)
    for (let cI = 0; cI < cols; cI++) {
      const cw = (gx1 - gx0) / cols;
      const ch = (gy1 - gy0) / rows;
      grid.push(<rect key={`${rI}_${cI}`} x={gx0 + cI * cw + cw * 0.12} y={gy0 + rI * ch + ch * 0.18} width={cw * 0.76} height={ch * 0.64} fill={ink} opacity={rI === 1 && cI === 3 ? 0.55 : 0.14} rx={0.6} />);
    }
  return (
    <g>
      {/* the sheet's soft shadow on the pillar, the sheet, a binder clip */}
      <rect x={a[0] + 4 * s} y={a[1] + 6 * s} width={w} height={h} fill={PAL.shadow} opacity={0.18} rx={2 * s} />
      <rect x={a[0]} y={a[1]} width={w} height={h} fill={paper} rx={2 * s} />
      <rect x={a[0] + w * 0.4} y={a[1] - 6 * s} width={w * 0.2} height={12 * s} fill={A.tone(MAT.iron.mid, Z, 300)} rx={2 * s} />
      <text
        x={(a[0] + b[0]) / 2}
        y={P.p(0, PLANNER.yText + PLANNER.font * 0.34, Z)[1]}
        fontFamily={PLATE_FONT}
        fontWeight={700}
        fontSize={PLANNER.font * s}
        textAnchor="middle"
        fill={ink}
        letterSpacing={0.02 * PLANNER.font * s}
      >
        2030
      </text>
      <rect x={gx0} y={a[1] + 0.48 * h} width={gx1 - gx0} height={Math.max(0.8, 1.6 * s)} fill={ink} opacity={0.5} />
      {grid}
    </g>
  );
};

// ===================================================================================================================
// THE LIVE TIER: the hero's row near the camera (the module's Desk + live robots), its pillar and the planner
// ===================================================================================================================
const LiveTier: React.FC<{ A: AirWorld; frame: number }> = ({ A, frame }) => {
  const out: React.ReactNode[] = [];
  const items = LIVE_COLS.map((c) => ({ c, X: colX(c, 0) })).sort((p, q) => Math.abs(q.X + 60) - Math.abs(p.X + 60));
  const pill = pillarX(0);
  let pillarDone = false;
  const pillarNode = (
    <g key="pillar">
      <AirBox A={A} X0={HERO_PILLAR.x0} X1={HERO_PILLAR.x1} Y0={storeyCeil(0)} Y1={0} Z0={HERO_PILLAR.z0} Z1={HERO_PILLAR.z1} mat={MAT_OATMEAL} uid="wob-pil" rim={0.5} />
      <Planner A={A} />
    </g>
  );
  for (const it of items) {
    if (!pillarDone && Math.abs(pill) >= Math.abs(it.X + 60)) {
      out.push(pillarNode);
      pillarDone = true;
    }
    const seed = seedOf(0, it.c, 0);
    const hero = it.c === 0;
    const v = hero ? 0 : lookOf(0, it.c, 0);
    const { at, scale } = A.P.at(it.X, 0);
    out.push(
      <g key={`l${it.c}`}>
        <Desk A={A} X={it.X + 114.5} Z={-DESK.w / 2} seat="left" uid={`wobd${it.c}`} layer="all" frame={frame} screen={0.82 + 0.18 * burstOf(frame, seed)} mug={hero} />
        <Bot variant={v} pose={BOT_POSES.typeAtDesk(1, frame, seed)} at={at} scale={scale} uid={`wobb${it.c}`} frame={frame} fog={A.folkFog(0)} unitPx={A.k} />
      </g>,
    );
  }
  if (!pillarDone) out.push(pillarNode);
  void PILLAR_W;
  return <>{out}</>;
};

// ===================================================================================================================
// THE PLATE "2.5 billion" (screen-true world: one unit = one px at Z 0)
// ===================================================================================================================
const PLATE_A = airWorldOf({ cam: { k: 1, cx: 540, cy: 960 }, rest: { k: 1, cx: 540, cy: 960 }, depth: { eyeY: -300, dRef: 1000, kRef: 1, dolly: 0 }, frame: 0 });

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
const WorkOfBillions: React.FC<z.infer<typeof schema>> = ({ camFrame }) => {
  const frame = useCurrentFrame();
  const cf = camFrame >= 0 ? camFrame : frame;
  useSeatSprites();
  const get = useBotSprites(React.useMemo(() => botCrowdReqs(["back"]), []));
  const e: Eye = eyeAt(cf);
  const lam = lambdaAt(cf);
  const wA = WORLD_A(cf);
  const pA = PLANET_A(cf);
  const world = wA > 0.001;
  const planet = pA > 0.001;
  const A = airOfEye(e, frame, { motes: { y: 0.9 * lam, z: -2.2 * lam }, horizon: lerp(700, 2300, sst(81, 86, cf)), fogMul: 1 - 0.35 * sst(3.5, 5, e.lam) });
  const Pn = painterOf(e, A);
  const { cam } = camOfEye(e);
  const o0 = openingOf(Pn, 0);
  const live = world && o0.y1 - o0.y0 > 12;
  const veil = veilAt(cf);
  const cover = coverAt(cf);
  const tPlate = yearPlateT(frame, PLATE_F0, PLATE_DUR);
  // the planet's anchor for the cloud deck (the city we left, then the globe's centre)
  const g = planet ? globeSpecAt(cf) : null;
  const ax = 540;
  const ay = 800;
  return (
    <AirStage v={A.v} bloom={0.22} shafts={0.3}>
      {world ? (
        <div style={{ position: "absolute", inset: 0, opacity: wA }}>
          <CpuCanvas
            draw={(ctx) => {
              drawGround(ctx, Pn);
              drawCity(ctx, Pn, get, frame, "behind");
              for (let i = STOREY_MAX; i >= STOREY_MIN; i--) drawStorey(ctx, Pn, i, frame, i === 0 && live);
            }}
          />
          {live ? (
            <div style={{ position: "absolute", inset: 0, clipPath: `inset(${Math.max(0, o0.y0).toFixed(1)}px ${Math.max(0, 1080 - o0.x1).toFixed(1)}px ${Math.max(0, 1920 - o0.y1).toFixed(1)}px ${Math.max(0, o0.x0).toFixed(1)}px)` }}>
              <WorldSvg cam={cam}>
                <LiveTier A={A} frame={frame} />
              </WorldSvg>
            </div>
          ) : null}
          <CpuCanvas
            draw={(ctx) => {
              drawHeroExterior(ctx, Pn, get, frame);
              drawCity(ctx, Pn, get, frame, "front");
            }}
          />
        </div>
      ) : null}
      {planet && g ? <CpuCanvas style={{ opacity: pA }} draw={(ctx) => drawPlanet(ctx, g, frame, 1)} /> : null}
      {veil > 0.003 || cover > 0.003 ? <CpuCanvas draw={(ctx) => drawCloud(ctx, veil, cover, lam, ax, ay, frame)} /> : null}
      {tPlate > 0 ? (
        <WorldSvg cam={PLATE_A.cam}>
          <YearPlate A={PLATE_A} X={540} Y={plateY(cf)} Z={0} text="2.5 billion" t={tPlate} uid="wob-pbn" size={PLATE_SIZE} plate={0} />
        </WorldSvg>
      ) : null}
    </AirStage>
  );
};
void c01;

export default WorkOfBillions;
