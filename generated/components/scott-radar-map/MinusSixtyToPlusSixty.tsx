// ---------------------------------------------------------------------------
// MinusSixtyToPlusSixty (scott-radar-map, cut 24). Cheeky Pint style, the realistic variant carried into the air
// (styles/cheeky-pint.md; the sister clip's world scott-aircraft-order/aircraftShared.tsx: AirStage, the United
// 787-10, imported read-only). Opaque 1080x1920, 23.976 fps, 150 frames.
//
// CHECK LINE: "the same one-hour delay scored −60 NPS with the plain text and +60 with the radar picture — the plain
// column sinks deep below zero, the radar column rises just as high above it."
//
// THE LINE: "I think the numbers were negative 60 NPS on the normal way of sending it. Plus 60 when we sent out a
// picture of the map." (then on camera: "120 point difference.")
// WORD -> FRAME: think 2 · the 6 · numbers 9 · were 16 · negative 20 · 60 32 · NPS 44 · on 57 · the 67 · normal 69 ·
// way 75 · of 80 · sending 83 · it 88 · Plus 98 · 60 108 · when 118 · we 128 · sent 130 · out 134 · a 136 ·
// picture 138 · of 142 · the 145 · map 146 (notes/word_frames.txt, CUT 3) · on camera: 120 f161 · point 171 ·
// difference 181.
// DURATION: slot 24.983 -> 31.240 s = 6.257 s x 24000/1001 = 150 frames (f0..f149).
//
// THE MOTION: side view at the airfield. The apron slab's near cut edge is ZERO on an NPS scale (a cream tick and
// "0 NPS" on the soil at the left margin); two glass columns of one width, one rung = 10 NPS on both. The camera opens
// pushed in on the plain phone (one text bubble) standing at the left slot; the slot parts on "numbers" (f9-19) and
// a drained umber column sinks into the earth cutaway (f20-43), the camera dipping with it to frame the whole column;
// the column is the count: as it lands a cream "−60" enters whole under its foot (f43-53, blur-in + slide up). On "the normal way of sending it" the camera rises back past
// zero while the radar phone slides in lifted from the right and settles at the right slot (f70-92); its slot parts
// (f89-97) and the amber column rises out of it (f97-116), the camera climbing with its cap; as it lands "+60"
// enters whole above the cap (f116-126, blur-in + slide down);
// then one blended pull-back to the whole picture (f116-146): −60 below, +60 above, equal lengths either side of
// zero, both phones at the zero line, United's 787 far back; the living hold (creep, dust, shimmer, grain).
// Cause before effect: the left slot parts f9-19, the column's first pixel below the edge on f21; the radar phone
// is down on the apron by f92, its slot parts f89-97, the column's first pixel above the lip on f98.
// AMBER = the radar picture and what it earned (the phone's radar returns, the +60 column); board/umber = the
// downside; cream = the phones, the numerals.
// Geometry, beats, camera and the chart-plane <-> AirCam mapping: npsColumnsPlan.ts. Pieces: npsColumnsParts.tsx.
//
// SOURCES: −60 and +60 NPS for one-hour weather delays are the speaker's own figures (Scott Kirby, United CEO, on
// the episode), shown as he says them; not independently verified (the director checks). United 787-10 and its tail
// from scott-aircraft-order/aircraftShared.tsx. The phone and radar map: scott-radar-map/radarPhone.tsx.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, FONT_LABEL, FONT_NUM, Numeral, amberBandFor } from "../kits/cheeky-pint/stoutShared";
import { makeClockCam } from "../kits/cheeky-pint/museShared";
import { AirStage, B787, fogAmount, type GroundSpec } from "../scott-aircraft-order/aircraftShared";
import {
  CAM_GLIDES,
  CAM_START,
  DOWN,
  GROUND,
  JET_AT,
  NUM,
  PHONE,
  PHONE_FOOT,
  PHONE_IN,
  PHONE_L_X,
  RUNG,
  SLOT_DOWN,
  SLOT_UP,
  UP,
  ZC,
  ZERO_TICK,
  airCamOf,
  downD,
  phoneRLift,
  phoneRX,
  upH,
} from "./npsColumnsPlan";
import { PHONE_H, PHONE_W, Phone } from "./radarPhone";
import { DownColumn, EarthSection, Slot, SlotLip, UpColumn, ZeroTick } from "./npsColumnsParts";

export const FPS = 24000 / 1001;
export const DURATION = 150;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const CAM = makeClockCam({ ...CAM_START }, CAM_GLIDES.map((g) => ({ ...g })), DURATION);
const REST = airCamOf(CAM.rest);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** concrete from the cut edge back to the far apron, desert beyond (the plane in front of ZC is under the cutaway) */
const GROUND_SPEC: GroundSpec = { aprons: [[-1400, ZC - 2, 1400, 760]], joints: 7.5 };
const FOG = fogAmount(ZC);

/** the phone body height in world px */
const PHONE_H_W = (PHONE.w * PHONE_H) / PHONE_W;

/** the kit entrance's ease (stoutShared easeOutCubic on enter 0..1) */
const easeOut3 = (e: number) => 1 - Math.pow(1 - clamp01(e), 3);

/** The phones' scene shadow (radarPhone's own card shadow is off: a phone standing on the apron casts onto the
 *  concrete): one soft contact shadow behind-right of its foot; lifted, it spreads, softens and fades. World px. */
const PhoneShadow: React.FC<{ x: number; foot: number; lift: number }> = ({ x, foot, lift }) => {
  const u = clamp01(lift / PHONE_IN.lift);
  return (
    <ellipse
      cx={x + 22 + 10 * u}
      cy={foot - 1}
      rx={PHONE.w * (0.6 + 0.12 * u)}
      ry={6 + 4 * u}
      fill={COLOR.shadow}
      opacity={0.5 - 0.22 * u}
      style={{ filter: `blur(${4 + 6 * u}px)` }}
    />
  );
};
/** A phone placed in world space (DOM, above the chart overlay): body width PHONE.w world px, feet on `foot`. */
const PlacedPhone: React.FC<{ look: { x: number; y: number; k: number }; x: number; foot: number; lift: number; variant: "plain" | "radar"; S: number; id: string }> = ({
  look,
  x,
  foot,
  lift,
  variant,
  S,
  id,
}) => {
  const k = look.k;
  const scale = (PHONE.w * k) / PHONE_W;
  const left = 540 + (x - PHONE.w / 2 - look.x) * k;
  const top = 960 + (foot - lift - PHONE_H_W - look.y) * k;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, transform: `translate(${left}px, ${top}px)` }}>
      <Phone variant={variant} scale={scale} reveal={1} drift={S} shadow={false} glow={0.7} res={0.5} id={id} />
    </div>
  );
};

/** A cream numeral that casts one soft shadow down-right (the key light is above-left): the +60 stands in the
 *  bright haze, where cream alone would wash out; the same treatment on the −60 keeps the pair one family. */
const CastNumeral: React.FC<React.ComponentProps<typeof Numeral>> = (p) => (
  <>
    <g transform={`translate(${4 / p.k} ${7 / p.k})`} style={{ filter: `blur(${9 / p.k}px)` }} opacity={0.78}>
      <Numeral {...p} tone="dark" />
    </g>
    <Numeral {...p} tone="cream" />
  </>
);

const MinusSixtyToPlusSixty: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const look = CAM.at(f);
  const k = look.k;
  const cam = airCamOf(look);
  const tf = `translate(540 960) scale(${k}) translate(${-look.x} ${-look.y})`;
  const d = downD(f);
  const h = upH(f);
  const numPx = NUM.px * k;
  const rx = phoneRX(f);
  const rLift = PHONE_IN.lift * phoneRLift(f);
  return (
    <AirStage
      cam={cam}
      S={f}
      rest={REST}
      ground={GROUND_SPEC}
      world={<B787 variant="10" airline="united" at={JET_AT} />}
      overlay={
        <>
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <g transform={tf}>
            <EarthSection x0={-1400} x1={2600} top={GROUND} depth={2600} k={k} fog={FOG} pockets={[{ x: DOWN.x, w: DOWN.w, d }]} />
            <ZeroTick x={ZERO_TICK.x} top={GROUND} len={ZERO_TICK.len} k={k} baseline={ZERO_TICK.baseline} zeroPx={ZERO_TICK.zeroPx} npsPx={ZERO_TICK.npsPx} gap={ZERO_TICK.gap} numFont={FONT_NUM} labelFont={FONT_LABEL} />
            <Slot x={DOWN.x} top={GROUND} w={DOWN.w} k={k} open={clamp01((f - SLOT_DOWN.f0) / (SLOT_DOWN.f1 - SLOT_DOWN.f0))} />
            <Slot x={UP.x} top={GROUND} w={UP.w} k={k} open={clamp01((f - SLOT_UP.f0) / (SLOT_UP.f1 - SLOT_UP.f0))} />
            <PhoneShadow x={PHONE_L_X} foot={PHONE_FOOT} lift={0} />
            {f >= PHONE_IN.f0 ? <PhoneShadow x={rx} foot={PHONE_FOOT} lift={rLift} /> : null}
            <UpColumn x={UP.x} base={GROUND} w={UP.w} h={h} headroom={UP.headroom} rung={RUNG} k={k} band={amberBandFor(look)} fog={FOG} />
            <SlotLip x={UP.x} top={GROUND} w={UP.w} k={k} />
            <DownColumn x={DOWN.x} base={GROUND} w={DOWN.w} d={d} gap={DOWN.gap} rung={RUNG} k={k} fog={FOG} />
            {/* −60 slides UP toward its column's foot (the kit's own entrance direction) */}
            <CastNumeral x={DOWN.x} y={GROUND + d + NUM.gap + NUM.cap} k={k} px={numPx} text={"\u221260"} enter={(f - NUM.minusIn) / NUM.enterF} />
            {/* +60 slides DOWN toward its column's cap: twice the kit's upward lift subtracted, a net 24 px from above */}
            <CastNumeral
              x={UP.x}
              y={GROUND - h - NUM.gap - (2 * NUM.slide * (1 - easeOut3((f - NUM.plusIn) / NUM.enterF))) / k}
              k={k}
              px={numPx}
              text="+60"
              enter={(f - NUM.plusIn) / NUM.enterF}
            />
          </g>
        </svg>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, overflow: "hidden" }}>
          <PlacedPhone look={look} x={PHONE_L_X} foot={PHONE_FOOT} lift={0} variant="plain" S={f} id="pPlain" />
          {f >= PHONE_IN.f0 ? <PlacedPhone look={look} x={rx} foot={PHONE_FOOT} lift={rLift} variant="radar" S={f} id="pRadar" /> : null}
        </div>
        </>
      }
    />
  );
};

export default MinusSixtyToPlusSixty;
