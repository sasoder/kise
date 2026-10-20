// ---------------------------------------------------------------------------
// HowTheUniverseWorksV5 (kyle-london, cut 10, V5). Dwarkesh map style (styles/dwarkesh-map.md).
// Opaque 1080x1920, 29.97 fps, 204 frames. V5 = V4 with the pan brought in sooner and the final DEPTH pass
// (animation_source/notes/DEPTH.md): one camera in one-point perspective (the VP on the frame's centre line, the eye
// 1.5 men up, looking slightly down), a flagstone ground plane receding to it, every layer at its depth (parallax on
// the truck), the engine as volumes (boiler set and pedestal foot as boxes, the wagon-boiler drum and the A-frame as
// depth extrusions with lit tops / dark sides, the flywheel rim band), contact shadows and the cast's form shadow
// (the shared depth kit ./londonDepth.tsx). People from ./londonCastV2.tsx; the orrery (./howTheUniverseWorksOrreryV5.tsx)
// draws every horizontal circle with this eye's openness on a solid turned stand; the engine is orbitWorld's
// SunAndPlanetMachine, settled, and its Pedestal (read only), with cut 42's engine-house parts. Layout, timeline,
// camera and depths: ./howTheUniverseWorksPlanV5.ts.
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
// THE MOTION: one continuous sideways camera move through one room. f0-88: close on an 18th-century orrery
// (orange Earth on its orange arm round the cream Sun) with the Fellow (orange coat) standing well behind it, his
// near hand on the tall handle of the crank on its drum (two turns per year of the orrery), breathing, his head
// turning down into it and following the Earth, the camera already drifting right and easing back a hair. f86-152
// (right after "intellects"): one zoom lobe, with the sideways lobe 8 frames behind it, pans right and pulls back over
// the floor past him to the engine. The orrery's "universe" swing (f134) happens as it leaves frame. The engine is
// the sun-and-planet gear and flywheel (cut 42's engine: orange gears, cream rim, the rod running up out of frame)
// with a stoker (cream) shovelling coal into the boiler's fire door and the engineer (orange coat) presenting the
// gears on "make". It runs because they work it: each throw flares the fire, the flywheel turns, and the sun gear
// turns twice per orbit of the planet. Landed by ~f150 (men ~455 px tall, the gears large, the flywheel cropping at
// the top and right), then working to f203 under a slow creep.
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
import { FRAME_H, FRAME_W, camTransform, mixColor } from "../kits/maps/incaShared";
import { ACCENT, ACCENT_DEEP, DARK, HUB_RING_R, INK, Pedestal, RIM_R, SPOKE_INK, SUN, SunAndPlanetMachine, type Cam, type P2 } from "./orbitWorld";
import { OrreryBack, OrreryFront } from "./howTheUniverseWorksOrreryV5";
import { Box, ContactShadow, GroundPlane, perspective, type DepthOpts, type VolInk } from "./londonDepth";
import { Fellow, ORANGE, POSES, Worker, castAnchors, headTurn, idle, lerpFig, scaleForPx, type FigPose } from "./londonCastV2";
import {
  BOILER,
  CAM_D,
  DZ,
  ENG_S,
  EX,
  EYE_Y,
  OX,
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
  camAtDepth,
  project,
  unproject,
  crankPhi,
  crankPin,
  earthAngle,
  engineCamOf,
  engineFrameAt,
  orrToWorld,
  orreryCamOf,
  shovelPhase,
} from "./howTheUniverseWorksPlanV5";

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
// DEPTH (V5): the shared kit (./londonDepth.tsx) on this cut's camera. The kit's floor is Y = 0, so it draws under
// the camera shifted by FLOOR; with dolly 0 its depth ratio is this plan's camAtDepth (CAM_D, EYE_Y).
// ---------------------------------------------------------------------------
const depthOpts: DepthOpts = { eyeY: EYE_Y - FLOOR, dRef: CAM_D, kRef: 1, dolly: 0 };
const floorCam = (cam: Cam): Cam => ({ k: cam.k, cx: cam.cx, cy: cam.cy - FLOOR });
/** the iron's three tones (dark umber planes), lit from the upper left */
const IRON_VOL: VolInk = { lit: "#5E4D38", mid: "#2F261C", dark: "#18130E" };
/** front faces lifted to the iron's mid tone; a horizontal drum's receding upper surface in its lit tone */
const FRONT_CSS = `.u5front [fill="${STRUCT_FILL}"]{fill:${IRON_VOL.mid}}.u5top *{fill:${IRON_VOL.lit} !important;stroke:${IRON_VOL.lit} !important}`;

/** a volume's side band: the same drawing at farther depths, recoloured to the side tone (light from the upper left,
 *  the receding faces are the shaded ones) */
const SIDE = IRON_VOL.dark;
const SIDE_CSS = `.u5side *{fill:${SIDE} !important;stroke:${SIDE} !important}.u5side image{display:none}`;
const depthSteps = (front: number, back: number, n: number) => Array.from({ length: n }, (_, i) => back + ((front - back) * i) / n);

// ---------------------------------------------------------------------------
// THE SCIENTIST AT THE ORRERY
// ---------------------------------------------------------------------------
/** the crank's upright handle (machine units of the orrery) and its grip (world px) */
const knobAt = (f: number) => {
  const p = crankPin(crankPhi(f));
  const q: P2 = [p[0], p[1] - KNOB_L];
  return { p, q, grip: orrToWorld([p[0], p[1] - KNOB_L * 0.85]) };
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
const sciPose = (f: number, cam: Cam): FigPose => {
  const h = sciHead(f);
  let q: FigPose = headTurn(SCI_BASE, h.yaw, h.pitch - SCI_BASE.pitch);
  q = { ...q, brow: 0.35 * ease((f - 20) / 20), lids: 0.25 * ease((f - 20) / 20) };
  q = idle(q, f, 5, 0.7);
  // the breath: the hips rise and fall a hair
  q = { ...q, crouch: q.crouch + 1.1 * Math.sin(f / 13) };
  // the near (right, facing left) hand on the crank's knob: aim the wrist so the grip lands on the knob
  // the knob is at the orrery's depth, he at his own: aim at its projected point, mapped back into his depth
  const kg = knobAt(f).grip;
  const want = unproject(cam, project(cam, kg[0], kg[1], DZ.orrery), DZ.sci);
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
const FlyingCoal: React.FC<{ g: number; cam: Cam }> = ({ g, cam }) => {
  // the door is at the boiler's depth: its point in the stoker's depth (the stage) this frame
  const door = unproject(cam, project(cam, DOOR_MOUTH[0], DOOR_MOUTH[1], DZ.boilerFront), DZ.stoker);
  const nodes: React.ReactNode[] = [];
  for (const t of THROWS) {
    const u = (g - t) / COAL_FLIGHT;
    if (u < 0 || u >= 1) continue;
    const b = bladeAt(t);
    for (let i = 0; i < 4; i++) {
      const ui = c01(u * (1 + 0.12 * i) - 0.04 * i);
      if (ui <= 0 || ui >= 1) continue;
      const e: P2 = [door[0] - 16 + 12 * i, door[1] + (i % 2) * 9];
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
const Boiler: React.FC<{ g: number; drumOnly?: boolean; cap?: boolean; uid?: string }> = ({ g, drumOnly = false, cap = false, uid = "u5b" }) => {
  const b = BOILER;
  const f = fireAt(g);
  const mid = (b.x0 + b.x1) / 2;
  const drumR = (b.x1 - b.x0) / 2;
  const d = b.door;
  const glow = mixColor("#5A3A16", ACCENT, f);
  if (cap) {
    // the drum's rounded crown only (its receding upper surface is the lit one)
    return (
      <path
        d={`M${fx(b.x0 + 18)} ${fx(b.drumTop + drumR * 0.55)}Q${fx(b.x0 + 18)} ${fx(b.drumTop)} ${fx(mid)} ${fx(b.drumTop)}Q${fx(b.x1 - 18)} ${fx(b.drumTop)} ${fx(b.x1 - 18)} ${fx(b.drumTop + drumR * 0.55)}Z`}
        {...iron}
      />
    );
  }
  return (
    <g>
      {/* the wagon drum on its brick setting */}
      <path d={`M${fx(b.x0 + 18)} ${fx(b.setTop)}L${fx(b.x0 + 18)} ${fx(b.drumTop + drumR * 0.55)}Q${fx(b.x0 + 18)} ${fx(b.drumTop)} ${fx(mid)} ${fx(b.drumTop)}Q${fx(b.x1 - 18)} ${fx(b.drumTop)} ${fx(b.x1 - 18)} ${fx(b.drumTop + drumR * 0.55)}L${fx(b.x1 - 18)} ${fx(b.setTop)}Z`} {...iron} />
      <path d={`M${fx(b.x0 + 34)} ${fx(b.drumTop + 70)}L${fx(b.x1 - 34)} ${fx(b.drumTop + 70)}`} stroke={SPOKE_INK} strokeOpacity={0.4} strokeWidth={1.4} />
      <Lit x0={b.x0 + 18} y0={b.drumTop + drumR * 0.3} x1={b.x1 - 18} y1={b.setTop} id={`${uid}drum`} />
      {drumOnly ? null : (
        <>
      <path d={`M${fx(b.x0)} ${fx(b.setTop)}L${fx(b.x1)} ${fx(b.setTop)}L${fx(b.x1)} ${fx(FLOOR)}L${fx(b.x0)} ${fx(FLOOR)}Z`} {...iron} />
      <Lit x0={b.x0} y0={b.setTop} x1={b.x1} y1={FLOOR} id={`${uid}set`} />
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
        </>
      )}
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
/** one layer of the shot: drawn in world px at its depth (svg), or a whole component layer (el) */
type Item = { dz: number; key: string; svg?: (c: Cam) => React.ReactNode; el?: React.ReactNode; machine?: boolean };
const RimSide: React.FC = () => (
  <g fill="none">
    <circle cx={SUN[0]} cy={SUN[1]} r={RIM_R} stroke={SIDE} strokeWidth={62} />
    <circle cx={SUN[0]} cy={SUN[1]} r={HUB_RING_R} fill={SIDE} />
  </g>
);

const HowTheUniverseWorksV5: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const f = frame;
  const cam = camAt(f);
  const at = (dz: number) => camAtDepth(cam, dz);
  const inkOf = (dz: number) => ({ ["--inkf" as string]: inkFactor(at(dz).k).toFixed(4) }) as React.CSSProperties;
  const sq = sciPose(f, cam);
  const ang = earthAngle(f);
  const ocam = orreryCamOf(at(DZ.orrery));
  const scam = at(DZ.sci);
  const fcam = floorCam(cam);
  const P = perspective(fcam, depthOpts);

  // THE ENGINE HOUSE: every layer at its depth, the volumes as depth slices (side tone) under their lit front faces,
  // all sorted far -> near so the boiler, pedestal and rim interleave
  const items: Item[] = [];
  items.push({
    dz: DZ.boilerBack + 1,
    key: "bset",
    el: (
      <WorldSvg key="bset" cam={fcam}>
        <Box P={P} X0={BOILER.x0} X1={BOILER.x1} Y0={BOILER.setTop - FLOOR} Y1={0} Z0={DZ.boilerFront} Z1={DZ.boilerBack} ink={IRON_VOL} uid="u5bset" />
      </WorldSvg>
    ),
  });
  depthSteps(DZ.boilerFront, DZ.boilerBack, 18).forEach((dz, i) =>
    items.push({
      dz,
      key: `bs${i}`,
      svg: () => (
        <g>
          <g className="u5side">
            <Boiler g={f} drumOnly uid={`u5bs${i}`} />
          </g>
          <g className="u5top">
            <Boiler g={f} cap />
          </g>
        </g>
      ),
    }),
  );
  items.push({ dz: DZ.boilerFront, key: "bf", svg: () => <g className="u5front"><Boiler g={f} /></g> });
  depthSteps(DZ.pedFront, DZ.pedBack, 12).forEach((dz, i) =>
    items.push({ dz, key: `ps${i}`, machine: true, svg: () => <g className="u5side"><Pedestal idPrefix={`u5ps${i}`} /></g> }),
  );
  // the pedestal's foot and its bearing block as boxes (their lit tops / dark sides from the VP), then its front face
  items.push({
    dz: DZ.pedFront + 0.5,
    key: "pbox",
    el: (
      <WorldSvg key="pbox" cam={fcam}>
        <Box P={P} X0={EX - 460 * ENG_S} X1={EX + 460 * ENG_S} Y0={-46 * ENG_S} Y1={0} Z0={DZ.pedFront} Z1={DZ.pedBack} ink={IRON_VOL} uid="u5pfoot" />
        <Box P={P} X0={EX - 236 * ENG_S} X1={EX + 236 * ENG_S} Y0={(SUN[1] - 72 - 1910) * ENG_S} Y1={(SUN[1] + 64 - 1910) * ENG_S} Z0={DZ.pedFront} Z1={DZ.pedBack} ink={IRON_VOL} uid="u5pblk" />
      </WorldSvg>
    ),
  });
  items.push({ dz: DZ.pedFront, key: "pf", machine: true, svg: () => <g className="u5front"><Pedestal idPrefix="u5pf" /></g> });
  depthSteps(DZ.wheelFront + 1, DZ.rimBack, 7).forEach((dz, i) => items.push({ dz, key: `rs${i}`, machine: true, svg: () => <RimSide /> }));
  items.push({ dz: DZ.wheelFront, key: "wheel", el: <SunAndPlanetMachine key="wheel" frame={engineFrameAt(f)} cam={engineCamOf(at(DZ.wheelFront))} idPrefix="u5e" pedestal={false} /> });
  items.push({ dz: DZ.heap, key: "heap", svg: () => <CoalHeap /> });
  items.push({
    dz: DZ.stoker,
    key: "stoker",
    svg: (c) => (
      <g className="u4ink" style={inkOf(DZ.stoker)}>
        <Worker pose={stokerPose(f)} at={[STOKER_X, FLOOR]} scale={SCALE} uid="u5stk" tool="shovel" shade={1} />
        {c ? null : null}
      </g>
    ),
  });
  items.push({ dz: DZ.stoker - 0.5, key: "coal", svg: () => <FlyingCoal g={f} cam={cam} /> });
  items.push({
    dz: DZ.engineer,
    key: "eng",
    svg: () => (
      <g className="u4ink" style={inkOf(DZ.engineer)}>
        <Fellow pose={engineerPose(f)} at={[ENGINEER_X, FLOOR]} scale={SCALE} uid="u5eng" variant={4} coat={ORANGE} shade={1} />
      </g>
    ),
  });
  items.sort((p, q) => q.dz - p.dz);
  // fold consecutive svg items into one svg layer
  const layers: React.ReactNode[] = [];
  let run: React.ReactNode[] = [];
  const flush = () => {
    if (run.length) layers.push(<svg key={`L${layers.length}`} width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>{run}</svg>);
    run = [];
  };
  for (const it of items) {
    if (it.el) {
      flush();
      layers.push(it.el);
      continue;
    }
    const c = it.machine ? engineCamOf(at(it.dz)) : at(it.dz);
    run.push(
      <g key={it.key} transform={camTransform(c).svg}>
        {it.svg?.(c)}
      </g>,
    );
  }
  flush();

  const B = BOILER;
  return (
    <TexcocoPage cam={cam}>
      <WorldSvg cam={fcam}>
        <style>{INK_CSS + SIDE_CSS + FRONT_CSS}</style>
        <GroundPlane P={P} kind="flags" x0={-1800} x1={3000} course={130} uid="u5gp" />
        {/* contact shadows on the floor, under everything that stands on it */}
        <ContactShadow P={P} X={(B.x0 + B.x1) / 2} Z={(DZ.boilerFront + DZ.boilerBack) / 2} w={170} d={150} uid="u5csb" amt={0.6} />
        <ContactShadow P={P} X={EX} Z={(DZ.pedFront + DZ.pedBack) / 2} w={300} d={60} uid="u5csp" amt={0.7} />
        <ContactShadow P={P} X={COAL_HEAP.cx} Z={DZ.heap} w={90} d={40} uid="u5csh" />
        <ContactShadow P={P} X={STOKER_X} Z={DZ.stoker} w={80} d={36} uid="u5css" />
        <ContactShadow P={P} X={ENGINEER_X} Z={DZ.engineer} w={60} d={30} uid="u5cse" />
        <ContactShadow P={P} X={SCI_X} Z={DZ.sci} w={60} d={30} uid="u5csc" />
        <ContactShadow P={P} X={OX} Z={DZ.orrery} w={48} d={42} uid="u5cso" amt={1.1} />
      </WorldSvg>
      {layers}
      {/* the scientist at the orrery: he (behind) -> the orrery's back half and crank -> his near arm on the crank -> the
          orrery's front half (the orrery nearer, at DZ.orrery; he at DZ.sci) */}
      <WorldSvg cam={scam}>
        <g className="u4ink" style={inkOf(DZ.sci)}>
          <Fellow pose={sq} at={SCI_AT} scale={SCALE} uid="u5sci" variant={0} coat={ORANGE} hideArm="R" shade={1} />
        </g>
      </WorldSvg>
      <WorldSvg cam={ocam}>
        <OrreryBack angle={ang} idPrefix="u5ob" />
        <CrankArm f={f} />
      </WorldSvg>
      <WorldSvg cam={scam}>
        <g className="u4ink" style={inkOf(DZ.sci)}>
          <Fellow pose={sq} at={SCI_AT} scale={SCALE} uid="u5scia" variant={0} coat={ORANGE} onlyArm="R" shade={1} />
        </g>
      </WorldSvg>
      <WorldSvg cam={ocam}>
        <OrreryFront angle={ang} idPrefix="u5of" />
      </WorldSvg>
    </TexcocoPage>
  );
};
export default HowTheUniverseWorksV5;
