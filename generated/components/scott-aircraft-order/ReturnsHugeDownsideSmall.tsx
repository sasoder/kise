// ---------------------------------------------------------------------------
// ReturnsHugeDownsideSmall (scott-aircraft-order, cut 54). Cheeky Pint style, realistic variant carried into the
// air (styles/cheeky-pint.md; the clip's world aircraftShared.tsx: AirStage, the United 787-10).
// Opaque 1080x1920, 23.976 fps, 96 frames. The LAST graphic of the clip: the sequence ends on its last frame.
//
// CHECK LINE: "if the bet works it pays off enormously; if it fails, you lose only a little" — a huge rise next to
// a small dip.
//
// THE LINE: "And if it works, the returns are huge. You know, and the downsides are smaller."
// WORD -> FRAME: And -8 · if 3 · it 4 · works 7-12 · the 14 · returns 15-23 · are 23 · huge 27-39 · You 33 ·
// know 44 · and 47 · the 49 · downsides 51-64 · are 64 · smaller 69-91 (notes/word_frames.txt, S6).
// DURATION: slot 54.179 -> 58.183 s = 4.004 s x 24000/1001 = 96 frames.
//
// THE MOTION: side view at the airfield. The apron slab's NEAR cut edge is break-even; the two outcomes are glass
// columns of one width (120 px) standing on / hanging from it in the foreground, and United's 787-10 (the bet)
// stands far back on the apron behind and between them (~290 px, fogged a touch by its distance). From f4 ("if it
// works") the up column, an amber fill in glass, comes out of its slot left of centre (its slot parts f0-5; the
// column is hidden behind the slab's lip until it clears) and keeps climbing through "returns" and "huge" (lands
// f38), a cream "+" on an ink disc riding its cap from f20, while the camera climbs with its top; in ONE blended
// move the camera turns over and pulls back to the whole picture (settled ~f52). On "and the downsides" the slot
// right of centre opens (f44-50) and the same glass column with a drained umber fill sinks into the earth (f50-64,
// 190 px; the up column is 4.3x longer), a cream "−" on an ink disc riding its foot from f55, settled before
// "smaller" (f69). Same rung pitch on both (64 px): 12 rungs up, 2 down. Then the living hold: a slow creep
// (k 1.00 -> 1.02 by f95), dust, clouds, shimmer, grain.
// Cause before effect: the up slot parts f0-5, the column's first pixel above the lip on f5; the down slot opens
// f44-50, the column's first pixel below the edge on f51.
// AMBER = United and the bet's outcome (the up column; the jet's fin); cream = the jet; board = the downside.
// Geometry, beats, camera and the chart-plane <-> AirCam mapping: returnsHugePlan.ts. Pieces: returnsHugeParts.tsx.
//
// SOURCES: no figures on screen (the speaker's claim is qualitative). United 787-10 and its tail from aircraftShared.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, FONT_LABEL, amberBandFor } from "../kits/cheeky-pint/stoutShared";
import { makeClockCam } from "../kits/cheeky-pint/museShared";
import { AirStage, B787, fogAmount, type GroundSpec } from "./aircraftShared";
import { CAM_GLIDES, CAM_START, DOWN, GROUND, JET_AT, RUNG, SIGNS, SLOT_OPEN, SLOT_UP, UP, ZC, airCamOf, downH, upH } from "./returnsHugePlan";
import { DownColumn, EarthSection, Sign, Slot, SlotLip, UpColumn } from "./returnsHugeParts";

export const FPS = 24000 / 1001;
export const DURATION = 96;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const CAM = makeClockCam({ ...CAM_START }, CAM_GLIDES.map((g) => ({ ...g })), DURATION);
const REST = airCamOf(CAM.rest);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** concrete from the cut edge back to the far apron, desert beyond (the plane in front of ZC is under the cutaway) */
const GROUND_SPEC: GroundSpec = { aprons: [[-1400, ZC - 2, 1400, 760]], joints: 7.5 };
const FOG = fogAmount(ZC);

const ReturnsHugeDownsideSmall: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const look = CAM.at(f);
  const k = look.k;
  const cam = airCamOf(look);
  const tf = `translate(540 960) scale(${k}) translate(${-look.x} ${-look.y})`;
  const h = upH(f);
  const d = downH(f);
  const open = clamp01((f - SLOT_OPEN.f0) / (SLOT_OPEN.f1 - SLOT_OPEN.f0));
  return (
    <AirStage
      cam={cam}
      S={f}
      rest={REST}
      ground={GROUND_SPEC}
      world={<B787 variant="10" airline="united" at={JET_AT} />}
      overlay={
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <g transform={tf}>
            <EarthSection x0={-2400} x1={3400} top={GROUND} depth={2600} k={k} fog={FOG} pockets={[{ x: DOWN.x, w: DOWN.w, d }]} />
            <Slot x={UP.x} top={GROUND} w={UP.w} k={k} open={clamp01((f - SLOT_UP.f0) / (SLOT_UP.f1 - SLOT_UP.f0))} />
            <Slot x={DOWN.x} top={GROUND} w={DOWN.w} k={k} open={open} />
            <UpColumn x={UP.x} base={GROUND} w={UP.w} h={h} headroom={UP.headroom} rung={RUNG} k={k} band={amberBandFor(look)} fog={FOG} />
            <SlotLip x={UP.x} top={GROUND} w={UP.w} k={k} />
            <DownColumn x={DOWN.x} base={GROUND} w={DOWN.w} d={d} gap={DOWN.gap} rung={RUNG} k={k} fog={FOG} />
            {SIGNS.on ? (
              <>
                <Sign x={UP.x} y={GROUND - h + UP.headroom + SIGNS.inset} k={k} text="+" px={SIGNS.px} color={COLOR.inkCream} font={FONT_LABEL} enter={(f - SIGNS.plus) / 12} disc={{ d: SIGNS.disc, color: COLOR.inkDark }} />
                <Sign x={DOWN.x} y={GROUND + d - DOWN.gap - SIGNS.inset} k={k} text={"\u2212"} px={SIGNS.px} color={COLOR.inkCream} font={FONT_LABEL} enter={(f - SIGNS.minus) / 12} disc={{ d: SIGNS.disc, color: COLOR.inkDark }} />
              </>
            ) : null}
          </g>
        </svg>
      }
    />
  );
};

export default ReturnsHugeDownsideSmall;
