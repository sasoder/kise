// ---------------------------------------------------------------------------
// EveryCostGoesDown (sam-gigawatt-cost, cut 22). Cheeky Pint style, the Scott "air" variant (styles/cheeky-pint.md;
// the world scott-aircraft-order/aircraftShared.tsx: AirStage, imported read-only). Opaque 1080x1920, 23.976 fps,
// 93 frames.
//
// CHECK LINE: "energy gets cheaper, chips get cheaper, and everything else in the supply chain gets cheaper — one
// after another."
//
// THE LINE (Sam Altman): "if I look at the fundamental cost of turning the sand into intelligence, the cost of
// energy should go down, the cost of chips should go down, the rest of the cost of the supply chain should go
// down." This slot holds "the cost of energy should go down, the cost of chips should go down, the rest of the cost
// of the supply chain should go down."
// WORD -> FRAME (from f0; whisper, may run ~5 f early): intelligence -20 · the -2 · cost 2 · of 6 · energy 8 ·
// should 13 · go 18 · down 20 · the 29 · cost 31 · of 35 · chips 38 · should 42 · go 45 · down 48 · the 53 ·
// rest 55 · of 57 · the 59 · cost 60 · of 65 · the 68 · supply 69 · chain 73 · should 78 · go 81 · down 84 ·
// (on camera) If 92.
// DURATION: slot 22.105 -> 25.984 s = 3.879 s x 24000/1001 = 93 frames (f0..f92).
//
// THE MOTION: side view on the desert apron at golden hour. Three real things stand in one row just behind the
// apron's cut edge, each a lit cream object with its cost beside it, an amber fill in a glass column out of a slot
// in the apron, all three filled to the same level at f0: ENERGY (a double-circuit lattice pylon on its footings,
// its conductors running off frame left to the next towers), CHIPS (an AI accelerator package, die and HBM stacks,
// standing in a socket block), the SUPPLY CHAIN (a container yard: a stack of 20 ft containers five high and one
// three high, its column standing between them). One camera glide runs left to right along the row with the words
// (the pylon group centre-left at f8, the chip group centred ~f38), and on each "should go down" that column's
// amber drains down into its slot, the emptied glass and its rungs keeping the old level in view: energy to 56 %,
// chips to 48 %, the supply chain to 40 % (three equal steps, each a little deeper). From f50 the glide turns into
// one blended pull-back (the yard's column stays at screen x ~860 through its drain, k 1.0 -> 0.7) that lands on
// the whole row, all three lower, at ~95 % of the width by f92: a living creep, dust, shimmer, the conductors' sway.
// REV 2 (director): the ground is a real floor, not a cut-away. The eye is raised to 30 m with the lens shift
// keeping the chart plane where rev 1 put it (everyCostPlan.ts EYE), so the concrete apron and its 7.5 m slab joints
// recede from the bottom edge to the row; the low golden-hour sun, low behind the row on the upper left where the
// sky glows, throws each thing's long shadow forward and right across the slabs (SUN_SHADOW; the fills' shadows
// shorten as they drain), with a warm haze bounce on the concrete in front of the row. No earth section.
// Cause before effect: each drain starts and lands at energy f11 -> f20 ("down" 20), chips f40 -> f48 ("down" 48),
// supply chain f75 -> f84 ("down" 84); each slot's mouth opens a hair while its fill runs into it.
// AMBER = the dollars (the three costs); cream = the three objects; board/umber = cables, recesses, context.
// No labels: each object reads on its own (pylon, chip, containers).
// Geometry, beats, drains and camera: everyCostPlan.ts. Pieces: everyCostParts.tsx; the slots and the earth
// section are scott-radar-map/npsColumnsParts.tsx (imported read-only).
//
// SOURCES: no figures on screen (the speaker gives none; the levels are illustrative, equal at the start).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { amberBandFor } from "../kits/cheeky-pint/stoutShared";
import { makeClockCam } from "../kits/cheeky-pint/museShared";
import { AirStage, fogAmount, type GroundSpec } from "../scott-aircraft-order/aircraftShared";
import { Slot, SlotLip } from "../scott-radar-map/npsColumnsParts";
import { BOX_L, BOX_R, BOX_W, CAM_GLIDES, CAM_START, CHIP, COL, COLS, FOOT, GROUND, PYLON, S0, ZC, airCamOf, drainingAt, fillAt } from "./everyCostPlan";
import { APRON_NEAR, CHIP_GEO, CastShadows, Chip, ContactShadow, ContainerStack, CostColumn, PowerLines, Pylon, chipCasters, objTones, pylonCasters, rectCaster, stackCasters } from "./everyCostParts";

export const FPS = 24000 / 1001;
export const DURATION = 93;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const CAM = makeClockCam({ ...CAM_START }, CAM_GLIDES.map((g) => ({ ...g })), DURATION);
const REST = airCamOf(CAM.rest);
/** rev 2: no cut-away. The apron is one concrete floor from under the camera (APRON_NEAR) to its far edge, desert
 *  beyond; the 7.5 m slab joints recede from the bottom of the frame to the row. */
const GROUND_SPEC: GroundSpec = { aprons: [[-1400, APRON_NEAR, 1400, 760]], joints: 7.5 };
/** the casters of the solid objects (pylon, chip, the two stacks) at their feet */
const SOLID_CASTERS = [
  { x: PYLON.x, casters: pylonCasters() },
  { x: CHIP.x, casters: chipCasters() },
  { x: BOX_L.x, casters: stackCasters(BOX_L.levels) },
  { x: BOX_R.x, casters: stackCasters(BOX_R.levels) },
];
const FOG = fogAmount(ZC);
const T = objTones(FOG);

/** the pylon in metres, and the two towers its conductors run to (off frame: along the row to the left, and
 *  back-left into the haze, an angle tower) */
const PYLON_X = (PYLON.x - 540) / S0;
const TOWERS = [
  { at: { X: PYLON_X - 150, Z: ZC }, sag: 5 },
  { at: { X: PYLON_X - 250, Z: ZC + 400 }, sag: 12 },
];

const EveryCostGoesDown: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const look = CAM.at(f);
  const k = look.k;
  const cam = airCamOf(look);
  const tf = `translate(540 960) scale(${k}) translate(${-look.x} ${-look.y})`;
  const band = amberBandFor(look);
  /** the row's feet line on screen (the slots' joint) */
  const feetY = 960 + (GROUND - look.y) * k;
  return (
    <AirStage
      cam={cam}
      S={f}
      rest={REST}
      ground={GROUND_SPEC}
      overlay={
        <>
          {/* the warm haze's bounce on the concrete in front of the row */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 1080,
              height: 1920,
              mixBlendMode: "screen",
              background: `radial-gradient(ellipse 900px ${Math.round(260 + 160 * k)}px at 380px ${feetY + 150}px, rgba(251,226,182,0.2) 0%, rgba(251,226,182,0.07) 55%, rgba(251,226,182,0) 100%)`,
            }}
          />
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
            {/* the low sun's long shadows across the slabs, forward and right: the objects, then the columns (the
                amber fill a mid shadow, the glass a faint one; the fill's shadow shortens as it drains) */}
            <CastShadows cam={cam} items={SOLID_CASTERS} opacity={0.36} />
            <CastShadows cam={cam} items={COLS.map((c, i) => ({ x: c.x, casters: [rectCaster(-COL.w / 2, COL.w / 2, 0, fillAt(i, f))] }))} opacity={0.2} />
            <CastShadows cam={cam} items={COLS.map((c) => ({ x: c.x, casters: [rectCaster(-COL.w / 2, COL.w / 2, 0, COL.H)] }))} opacity={0.07} />
            <PowerLines cam={cam} frontX={PYLON.x} frontFoot={FOOT} towers={TOWERS} S={f} />
          </svg>
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
            <g transform={tf}>
              {/* contact shadows on the apron */}
              <ContactShadow x={PYLON.x - 78} foot={FOOT} w={44} />
              <ContactShadow x={PYLON.x + 78} foot={FOOT} w={44} />
              <ContactShadow x={CHIP.x} foot={FOOT} w={CHIP_GEO.baseW} />
              <ContactShadow x={BOX_L.x} foot={FOOT} w={BOX_W} a={0.5} />
              <ContactShadow x={BOX_R.x} foot={FOOT} w={BOX_W} a={0.5} />
              {/* the objects */}
              <g transform={`translate(${PYLON.x} ${FOOT})`}>
                <Pylon T={T} px={k} />
              </g>
              <g transform={`translate(${CHIP.x} ${FOOT})`}>
                <Chip T={T} k={k} />
              </g>
              <g transform={`translate(${BOX_L.x} ${FOOT})`}>
                <ContainerStack T={T} k={k} levels={BOX_L.levels} />
              </g>
              <g transform={`translate(${BOX_R.x} ${FOOT})`}>
                <ContainerStack T={T} k={k} levels={BOX_R.levels} variant={1} />
              </g>
              {/* the costs */}
              {COLS.map((c, i) => (
                <g key={c.key}>
                  <Slot x={c.x} top={GROUND} w={COL.w} k={k} open={0.85 + 0.15 * drainingAt(i, f)} />
                  <CostColumn x={c.x} base={GROUND} w={COL.w} h={COL.H} fill={fillAt(i, f)} rung={COL.rung} k={k} band={band} />
                  <SlotLip x={c.x} top={GROUND} w={COL.w} k={k} />
                </g>
              ))}
            </g>
          </svg>
        </>
      }
    />
  );
};

export default EveryCostGoesDown;
