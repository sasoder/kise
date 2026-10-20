// ---------------------------------------------------------------------------
// HowTheUniverseWorksV4 (kyle-london, cut 10, V4). Dwarkesh map style (styles/dwarkesh-map.md).
// Opaque 1080x1920, 29.97 fps, 204 frames. The umber page with no map (kits/maps TexcocoPage): one floor line
// and below it a darker engraved flagstone floor receding to it. People from the shared London cast
// (./londonCastV2.tsx, read only); the orrery is orbitWorld's orrery drawing on a shorter pillar and stand
// (./howTheUniverseWorksOrreryV4.tsx), the engine orbitWorld's SunAndPlanetMachine, settled (read only); the engine
// house parts (boiler, fire door, coal heap, the stoker and the orange-coated engineer) are drawn the way cut 42
// (MachinesAndOutputCold) draws them. Layout, timeline and camera: ./howTheUniverseWorksPlanV4.ts.
//
// CHECK LINE: "The scientists who modelled how the universe moves were, a few steps away, the men building and
// running the machines."
//
// THE LINE: "these scientists and people with like towering intellects were basically figuring out how the
// universe works and how to make all these machines and so forth."
// WORD -> FRAME: these 9 · scientists 11 · people 43 · towering 70 · intellects 82 · figuring 105 · out 113 ·
// how 124 · universe 134 · works 142 · and 157 · how 165 · make 172 · machines 181 · and 187 · so 192 ·
// forth 194 · (cut at 204)
// DURATION: the slot 10.577 -> 17.384 s = 6.807 s x 29.97 = 204 frames (f0..f203).
//
// THE MOTION: one continuous sideways camera move through one room on the umber page. f0-145: close on an
// 18th-century orrery (orange Earth on its orange arm round the cream Sun) and the Fellow (orange coat) standing
// behind it (its orbit ring below his waist), his near hand on the tall handle of the crank on its drum (two
// turns per year of the orrery), breathing, his head turning
// down into it and following the Earth; the camera already drifting right and easing back a hair. "universe"
// (f134) finds the Earth swinging across the front of its orbit. f119-191: one zoom lobe and one pan lobe 9 frames
// behind it pan right and pull back (log zoom, the same progress) past him along the floor line to the engine: the sun-and-planet gear
// and flywheel (cut 42's engine: orange gears, cream rim, the rod running up out of frame) with a stoker (cream)
// shovelling coal into the boiler's fire door and the engineer (orange coat) checking the gears; the engine runs
// because they work it (each throw flares the fire, the flywheel turns, the sun gear twice per orbit of the
// planet). Reading by f181 ("machines"): the men ~455 px tall, the gears large, the flywheel cropping at the top
// and right; f181-203 the settled, working frame under a slow creep.
// CAUSE BEFORE EFFECT: each shovel throw (coal leaves the blade at phase SHOVEL_THROW) reaches the fire door
// 6 frames later; the fire flares from that frame (first reaction) and decays over ~14 frames.
// Orange = the new: the scientists' coats, the orrery's Earth and arm, the engine's gears, the fire. The workers,
// the Sun and works, the rim and structure are cream / dark umber.
//
// SOURCES: the orrery after the instrument in Wright of Derby, "A Philosopher Lecturing on the Orrery" (1766);
// Watt's sun-and-planet gear (William Murdoch's design, patented by Watt in 1781); illustrative. No figures.
// ---------------------------------------------------------------------------
import React from "react";
import { random, useCurrentFrame } from "remotion";
import { z } from "zod";
import { TexcocoPage, WorldSvg } from "../kits/maps/texcocoShared";
import { mixColor } from "../kits/maps/incaShared";
import { ACCENT, ACCENT_DEEP, DARK, INK, SPOKE_INK, SunAndPlanetMachine, type Cam, type P2 } from "./orbitWorld";
import { OrreryBack, OrreryFront } from "./howTheUniverseWorksOrreryV4";
import { Fellow, ORANGE, POSES, Worker, castAnchors, headTurn, idle, lerpFig, scaleForPx, type FigPose } from "./londonCastV2";
import {
  BOILER,
  COAL_HEAP,
  CRANK_C,
  CREW_PX,
  DURATION as PLAN_DURATION,
  ENGINEER_X,
  FLOOR,
  KNOB_L,
  SCI_X,
  SHOVEL_PERIOD,
  SHOVEL_THROW,
  STOKER_X,
  UNIVERSE_F,
  camAt,
  crankPhi,
  crankPin,
  earthAngle,
  engineCamOf,
  engineFrameAt,
  orrToWorld,
  orreryCamOf,
  shovelPhase,
} from "./howTheUniverseWorksPlanV4";

export const FPS = 30000 / 1001;
export const DURATION = 204;
if (PLAN_DURATION !== DURATION) throw new Error("plan / component DURATION mismatch");
export const schema = z.object({});
export const defaultProps = schema.parse({});

const fx = (v: number) => v.toFixed(3);
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => {
  const x = c01(v);
  return x * x * (3 - 2 * x);
};
const SCALE = scaleForPx(CREW_PX);
/** structure: orbitWorld's dark-umber plane (PED_FILL) in the context cream line, as cut 42 */
const STRUCT_FILL = "#2B231A";
const iron = { fill: STRUCT_FILL, stroke: SPOKE_INK, strokeWidth: 3.2, strokeLinejoin: "round" as const };

/** ONE INK WEIGHT (cut 42's recipe): the figures' strokes are in world units, so the close camera would thicken
 *  them; above the end framing's zoom every stroke inside .u4ink is scaled by (INK_K0 / k)^0.75. */
const INK_K0 = 1.38;
const inkFactor = (k: number) => Math.min(1, Math.pow(INK_K0 / k, 0.75));
const INK_CSS = ".u4ink [stroke-width]{stroke-width:calc(attr(stroke-width type(<number>)) * var(--inkf))}";

// ---------------------------------------------------------------------------
// THE FLOOR: one engraved line (screen-weight), cased
// ---------------------------------------------------------------------------
const Floor: React.FC<{ cam: Cam }> = ({ cam }) => {
  const k = cam.k;
  const x0 = cam.cx - 700 / k;
  const x1 = cam.cx + 700 / k;
  const d = `M${fx(x0)} ${fx(FLOOR)}L${fx(x1)} ${fx(FLOOR)}`;
  return (
    <g fill="none" strokeLinecap="round">
      <path d={d} stroke={DARK} strokeOpacity={0.8} strokeWidth={9 / k} />
      <path d={d} stroke={INK} strokeOpacity={0.62} strokeWidth={4 / k} />
    </g>
  );
};

/** the ground below the floor line: a darker engraved floor of flagstones in the cut-42 bed's manner (dark umber
 *  plane, context cream joints), its courses closing up towards the floor line (receding), lower contrast and
 *  darkening towards the bottom of the frame. World space; screen-weight lines. */
const GROUND = "#33291F";
const COURSE_N = 14;
/** course k's top edge below the floor line (world px): the gaps grow towards the viewer */
const courseY = (k: number) => FLOOR + 14 * k + 3.2 * k * k;
const FloorPlane: React.FC<{ cam: Cam }> = ({ cam }) => {
  const k = cam.k;
  const x0 = cam.cx - 620 / k;
  const x1 = cam.cx + 620 / k;
  const yB = courseY(COURSE_N + 6);
  const lines: React.ReactNode[] = [];
  for (let i = 1; i <= COURSE_N + 6; i++) {
    const y = courseY(i);
    const a = 0.42 - 0.016 * i;
    lines.push(<path key={`c${i}`} d={`M${fx(x0)} ${fx(y)}L${fx(x1)} ${fx(y)}`} stroke={SPOKE_INK} strokeOpacity={Math.max(0.08, a)} strokeWidth={1.4 / k} />);
    // the joints of the course above this line: stones get wider towards the viewer, staggered row by row
    const yt = courseY(i - 1);
    const w = 90 + 16 * i;
    const off = (i % 2) * w * 0.5 + (i * 37) % 23;
    for (let x = Math.floor((x0 - off) / w) * w + off; x < x1; x += w) {
      lines.push(<path key={`j${i}-${x.toFixed(0)}`} d={`M${fx(x)} ${fx(yt + 2)}L${fx(x - (x - cam.cx) * 0.03)} ${fx(y - 1)}`} stroke={SPOKE_INK} strokeOpacity={Math.max(0.06, a * 0.75)} strokeWidth={1.2 / k} />);
    }
  }
  return (
    <g>
      <defs>
        <linearGradient id="u4ground" x1="0" y1={FLOOR} x2="0" y2={yB} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={DARK} stopOpacity={0.1} />
          <stop offset="1" stopColor={DARK} stopOpacity={0.55} />
        </linearGradient>
      </defs>
      <rect x={x0} y={FLOOR} width={x1 - x0} height={yB - FLOOR + 3000} fill={GROUND} />
      {lines}
      <rect x={x0} y={FLOOR} width={x1 - x0} height={yB - FLOOR} fill="url(#u4ground)" />
      <rect x={x0} y={yB} width={x1 - x0} height={3000} fill={DARK} fillOpacity={0.55} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE SCIENTIST AT THE ORRERY
// ---------------------------------------------------------------------------
/** the crank's upright handle (machine units of the orrery) and its grip (world px) */
const knobAt = (f: number) => {
  const p = crankPin(crankPhi(f));
  const q: P2 = [p[0], p[1] - KNOB_L];
  return { p, q, grip: orrToWorld([p[0], p[1] - KNOB_L * 0.8]) };
};
const SCI_AT: P2 = [SCI_X, FLOOR];
const toFig = (w: P2): P2 => [(w[0] - SCI_AT[0]) / SCALE, (w[1] - SCI_AT[1]) / SCALE];
/** the base pose (facing left, three-quarter, into the orrery): knees given a little, leaning in over it */
const SCI_BASE: FigPose = { ...POSES.stand(-1), crouch: 9, lean: -8, armL: { w: [-36, -150], elbow: [-0.2, 1], fist: 0.4, hand: 0 } };
/** the head: across at first, turning down into the orrery f8-36, then following the Earth; a small nod on "universe" */
const sciHead = (f: number) => {
  const turn = ease((f - 8) / 28);
  const ex = Math.cos(earthAngle(f)); // -1 left .. 1 right
  const follow = turn * 0.16 * ex;
  const yaw = -0.3 + (-0.78 + 0.3) * turn + follow;
  const nod = 6 * Math.exp(-Math.pow((f - (UNIVERSE_F - 2)) / 6, 2));
  const pitch = 2 + 28 * turn + nod;
  return { yaw, pitch };
};
const sciPose = (f: number): FigPose => {
  const h = sciHead(f);
  let q: FigPose = headTurn(SCI_BASE, h.yaw, h.pitch - SCI_BASE.pitch);
  q = { ...q, brow: 0.35 * ease((f - 20) / 20), lids: 0.25 * ease((f - 20) / 20) };
  q = idle(q, f, 5, 0.7);
  // the breath: the hips rise and fall a hair
  q = { ...q, crouch: q.crouch + 1.1 * Math.sin(f / 13) };
  // the near (right, facing left) hand on the crank's knob: aim the wrist so the grip lands on the knob
  const want = knobAt(f).grip;
  const tryArm = (w: P2): FigPose => ({ ...q, armR: { w, elbow: [0.3, 1], fist: 1, hand: 0 } });
  let w = toFig(want);
  for (let i = 0; i < 3; i++) {
    const a = castAnchors("fellow", tryArm(w), SCI_AT, SCALE, 0);
    w = [w[0] + (want[0] - a.handR[0]) / SCALE, w[1] + (want[1] - a.handR[1]) / SCALE];
  }
  return tryArm(w);
};

/** the crank on the drum's top: its boss, the arm, the upright handle (orrery machine units under its camera) */
const CrankArm: React.FC<{ f: number }> = ({ f }) => {
  const k = knobAt(f);
  const line = { stroke: DARK, strokeLinecap: "round" as const };
  return (
    <g>
      <ellipse cx={CRANK_C[0]} cy={CRANK_C[1]} rx={16} ry={6} fill={INK} stroke={DARK} strokeWidth={4} />
      <path d={`M${fx(CRANK_C[0])} ${fx(CRANK_C[1] - 4)}L${fx(k.p[0])} ${fx(k.p[1] - 4)}`} {...line} strokeWidth={17} />
      <path d={`M${fx(CRANK_C[0])} ${fx(CRANK_C[1] - 4)}L${fx(k.p[0])} ${fx(k.p[1] - 4)}`} stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <path d={`M${fx(k.p[0])} ${fx(k.p[1])}L${fx(k.q[0])} ${fx(k.q[1])}`} {...line} strokeWidth={24} />
      <path d={`M${fx(k.p[0])} ${fx(k.p[1])}L${fx(k.q[0])} ${fx(k.q[1])}`} stroke={INK} strokeWidth={15} strokeLinecap="round" />
      <path d={`M${fx(k.p[0] + 3)} ${fx(k.p[1] - 4)}L${fx(k.q[0] + 3)} ${fx(k.q[1] + 4)}`} stroke={DARK} strokeOpacity={0.35} strokeWidth={2} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE ENGINE HOUSE PARTS (cut 42's drawings, at this layout): boiler + fire door, coal heap, flying coal
// ---------------------------------------------------------------------------
/** an engraved lift for a dark mass (cut 42's Lit) */
const Lit: React.FC<{ x0: number; y0: number; x1: number; y1: number; id: string }> = ({ x0, y0, x1, y1, id }) => {
  const hx0 = x1 - (x1 - x0) * 0.38;
  const lines: string[] = [];
  for (let x = hx0 - (y1 - y0); x < x1; x += 10) lines.push(`M${fx(x)} ${fx(y1)}L${fx(x + (y1 - y0) * 0.5)} ${fx(y0)}`);
  return (
    <g>
      <clipPath id={id}>
        <rect x={hx0} y={y0} width={x1 - hx0} height={y1 - y0} />
      </clipPath>
      <path d={lines.join("")} stroke={SPOKE_INK} strokeOpacity={0.5} strokeWidth={1.6} clipPath={`url(#${id})`} />
      <path d={`M${fx(x0 + 3)} ${fx(y1 - 4)}L${fx(x0 + 3)} ${fx(y0 + 3)}L${fx(x1 - 4)} ${fx(y0 + 3)}`} fill="none" stroke={INK} strokeOpacity={0.55} strokeWidth={3} strokeLinejoin="round" />
    </g>
  );
};
/** the throws: the frame the coal leaves the blade */
const THROWS: number[] = (() => {
  const out: number[] = [];
  for (let g = -2 * SHOVEL_PERIOD; g < 260; g++) if (shovelPhase(g) < SHOVEL_THROW && shovelPhase(g + 1) >= SHOVEL_THROW) out.push(g + 1);
  return out;
})();
const COAL_FLIGHT = 6;
/** the fire: alive from the first frame (the stoker has been at it), flaring as each throw lands */
const fireAt = (g: number) => {
  let flare = 0;
  for (const t of THROWS) {
    const d = g - (t + COAL_FLIGHT);
    if (d >= 0 && d < 16) flare = Math.max(flare, Math.exp(-d / 4) * (1 - d / 16));
  }
  const flick = 0.06 * (random(`u4fire-${Math.floor(g / 2)}`) - 0.5);
  return c01(0.62 + 0.38 * flare + flick);
};
const stokerPose = (g: number) => idle(POSES.shovel(1, shovelPhase(g)), g, 11, 0.3);
/** the blade's middle (world) for the stoker's pose at frame g: along the shaft from his near (rear) fist */
const bladeAt = (g: number): P2 => {
  const a = castAnchors("worker", stokerPose(g), [STOKER_X, FLOOR], SCALE);
  const u: P2 = [a.handR[0] - a.handL[0], a.handR[1] - a.handL[1]];
  const l = Math.hypot(u[0], u[1]) || 1;
  return [a.handL[0] + (u[0] / l) * 172 * SCALE, a.handL[1] + (u[1] / l) * 172 * SCALE];
};
const DOOR_MOUTH: P2 = [(BOILER.door.x0 + BOILER.door.x1) / 2, (BOILER.door.y0 + BOILER.door.y1) / 2 + 8];
const FlyingCoal: React.FC<{ g: number }> = ({ g }) => {
  const nodes: React.ReactNode[] = [];
  for (const t of THROWS) {
    const u = (g - t) / COAL_FLIGHT;
    if (u < 0 || u >= 1) continue;
    const b = bladeAt(t);
    for (let i = 0; i < 4; i++) {
      const ui = c01(u * (1 + 0.12 * i) - 0.04 * i);
      if (ui <= 0 || ui >= 1) continue;
      const e: P2 = [DOOR_MOUTH[0] - 18 + 14 * i, DOOR_MOUTH[1] + (i % 2) * 10];
      const x = b[0] + (e[0] - b[0]) * ui;
      const y = b[1] + (e[1] - b[1]) * ui - 46 * Math.sin(Math.PI * ui);
      const s = 5 + 2 * random(`u4lump${i}`);
      nodes.push(
        <path
          key={`${t}-${i}`}
          d={`M${fx(x - s)} ${fx(y + s * 0.4)}L${fx(x - s * 0.3)} ${fx(y - s * 0.8)}L${fx(x + s)} ${fx(y - s * 0.3)}L${fx(x + s * 0.6)} ${fx(y + s * 0.8)}Z`}
          fill={DARK}
          stroke={SPOKE_INK}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />,
      );
    }
  }
  return <g>{nodes}</g>;
};
const Boiler: React.FC<{ g: number }> = ({ g }) => {
  const b = BOILER;
  const f = fireAt(g);
  const mid = (b.x0 + b.x1) / 2;
  const drumR = (b.x1 - b.x0) / 2;
  const d = b.door;
  const glow = mixColor("#5A3A16", ACCENT, f);
  return (
    <g>
      {/* the wagon drum on its brick setting */}
      <path d={`M${fx(b.x0 + 18)} ${fx(b.setTop)}L${fx(b.x0 + 18)} ${fx(b.drumTop + drumR * 0.55)}Q${fx(b.x0 + 18)} ${fx(b.drumTop)} ${fx(mid)} ${fx(b.drumTop)}Q${fx(b.x1 - 18)} ${fx(b.drumTop)} ${fx(b.x1 - 18)} ${fx(b.drumTop + drumR * 0.55)}L${fx(b.x1 - 18)} ${fx(b.setTop)}Z`} {...iron} />
      <path d={`M${fx(b.x0 + 34)} ${fx(b.drumTop + 70)}L${fx(b.x1 - 34)} ${fx(b.drumTop + 70)}`} stroke={SPOKE_INK} strokeOpacity={0.4} strokeWidth={1.4} />
      <Lit x0={b.x0 + 18} y0={b.drumTop + drumR * 0.3} x1={b.x1 - 18} y1={b.setTop} id="u4drum" />
      <path d={`M${fx(b.x0)} ${fx(b.setTop)}L${fx(b.x1)} ${fx(b.setTop)}L${fx(b.x1)} ${fx(FLOOR)}L${fx(b.x0)} ${fx(FLOOR)}Z`} {...iron} />
      <Lit x0={b.x0} y0={b.setTop} x1={b.x1} y1={FLOOR} id="u4set" />
      {[0.25, 0.5, 0.75].map((u) => (
        <path key={u} d={`M${fx(b.x0 + 4)} ${fx(b.setTop + (FLOOR - b.setTop) * u)}L${fx(b.x1 - 4)} ${fx(b.setTop + (FLOOR - b.setTop) * u)}`} stroke={SPOKE_INK} strokeOpacity={0.3} strokeWidth={1.4} />
      ))}
      {/* the fire door: an open mouth glowing with the fire, an iron frame */}
      <path d={`M${fx(d.x0)} ${fx(d.y0)}L${fx(d.x1)} ${fx(d.y0)}L${fx(d.x1)} ${fx(d.y1)}L${fx(d.x0)} ${fx(d.y1)}Z`} fill={glow} stroke={DARK} strokeWidth={5} />
      <path
        d={`M${fx(d.x0 + 8)} ${fx(d.y1 - 6)}Q${fx(d.x0 + 22)} ${fx(d.y1 - 26 - 30 * f)} ${fx(d.x0 + 34)} ${fx(d.y1 - 8)}Q${fx(d.x0 + 48)} ${fx(d.y1 - 34 - 34 * f)} ${fx(d.x0 + 62)} ${fx(d.y1 - 8)}Q${fx(d.x0 + 74)} ${fx(d.y1 - 22 - 26 * f)} ${fx(d.x1 - 8)} ${fx(d.y1 - 6)}Z`}
        fill={mixColor(ACCENT_DEEP, "#FFE3A0", f * 0.6)}
        opacity={0.4 + 0.6 * f}
      />
      <path d={`M${fx(d.x0 - 8)} ${fx(d.y0 - 8)}L${fx(d.x1 + 8)} ${fx(d.y0 - 8)}L${fx(d.x1 + 8)} ${fx(d.y0)}L${fx(d.x0 - 8)} ${fx(d.y0)}Z`} {...iron} />
    </g>
  );
};
const CoalHeap: React.FC = () => {
  const heap = COAL_HEAP;
  const lumps = Array.from({ length: 13 }, (_, i) => {
    const u = (i + 0.5) / 13;
    const x = heap.cx - heap.hw + 2 * heap.hw * u;
    const hgt = heap.h * Math.sin(Math.PI * u);
    return [x + (random(`u4l${i}`) - 0.5) * 10, FLOOR - hgt * (0.4 + 0.5 * random(`u4m${i}`))] as P2;
  });
  return (
    <g>
      <path d={`M${fx(heap.cx - heap.hw - 14)} ${fx(FLOOR)}Q${fx(heap.cx)} ${fx(FLOOR - heap.h * 2)} ${fx(heap.cx + heap.hw + 14)} ${fx(FLOOR)}Z`} fill={DARK} stroke={SPOKE_INK} strokeWidth={2.6} />
      {lumps.map((p, i) => (
        <path key={i} d={`M${fx(p[0] - 7)} ${fx(p[1] + 3)}L${fx(p[0] - 2)} ${fx(p[1] - 5)}L${fx(p[0] + 7)} ${fx(p[1] - 2)}L${fx(p[0] + 4)} ${fx(p[1] + 5)}Z`} fill={STRUCT_FILL} stroke={SPOKE_INK} strokeWidth={1.4} />
      ))}
    </g>
  );
};

/** the engineer (Fellow variant 4, orange coat, as cut 42): facing left into the engine, looking up at the gears;
 *  on "make" his far (leading) hand comes up and points at the meshing gears, a small nod, the hand settles back */
const engineerPose = (g: number): FigPose => {
  const base = POSES.stand(-1);
  const point: FigPose = { ...base, armL: { w: [-128, -276], elbow: [-0.4, 1], fist: 0.15, hand: -20 }, brow: -0.2 };
  const pt = ease((g - 160) / 16) * (1 - 0.55 * ease((g - 190) / 14));
  let q = lerpFig(base, point, pt);
  const nod = 5 * Math.exp(-Math.pow((g - 184) / 5, 2));
  q = headTurn(q, -0.62, -22 + nod);
  return idle(q, g, 23, 0.6);
};

// ---------------------------------------------------------------------------
// THE CUT
// ---------------------------------------------------------------------------
const HowTheUniverseWorksV4: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const f = frame;
  const cam = camAt(f);
  const ocam = orreryCamOf(cam);
  const ecam = engineCamOf(cam);
  const inkStyle = { ["--inkf" as string]: inkFactor(cam.k).toFixed(4) } as React.CSSProperties;
  const sq = sciPose(f);
  const ang = earthAngle(f);
  return (
    <TexcocoPage cam={cam}>
      <WorldSvg cam={cam}>
        <style>{INK_CSS}</style>
        <FloorPlane cam={cam} />
        <Floor cam={cam} />
        <g className="u4ink" style={inkStyle}>
          <Fellow pose={sq} at={SCI_AT} scale={SCALE} uid="u4sci" variant={0} coat={ORANGE} hideArm="R" />
        </g>
        <Boiler g={f} />
      </WorldSvg>
      {/* the engine: orbitWorld's settled sun-and-planet machine, flywheel and pedestal (cut 42's engine) */}
      <SunAndPlanetMachine frame={engineFrameAt(f)} cam={ecam} idPrefix="u4e" />
      {/* the orrery: behind his crank arm (stand, drum, the ring's far half, a far-side Earth, pillar, Sun), the crank,
          his near arm on it, then in front (the ring's near half, a near-side Earth on its arm) */}
      <WorldSvg cam={ocam}>
        <OrreryBack angle={ang} idPrefix="u4ob" />
        <CrankArm f={f} />
      </WorldSvg>
      <WorldSvg cam={cam}>
        <style>{INK_CSS}</style>
        <g className="u4ink" style={inkStyle}>
          <Fellow pose={sq} at={SCI_AT} scale={SCALE} uid="u4scia" variant={0} coat={ORANGE} onlyArm="R" />
        </g>
      </WorldSvg>
      <WorldSvg cam={ocam}>
        <OrreryFront angle={ang} idPrefix="u4of" />
      </WorldSvg>
      <WorldSvg cam={cam}>
        <style>{INK_CSS}</style>
        <CoalHeap />
        <g className="u4ink" style={inkStyle}>
          <Worker pose={stokerPose(f)} at={[STOKER_X, FLOOR]} scale={SCALE} uid="u4stk" tool="shovel" />
          <Fellow pose={engineerPose(f)} at={[ENGINEER_X, FLOOR]} scale={SCALE} uid="u4eng" variant={4} coat={ORANGE} />
        </g>
        <FlyingCoal g={f} />
      </WorldSvg>
    </TexcocoPage>
  );
};
export default HowTheUniverseWorksV4;
