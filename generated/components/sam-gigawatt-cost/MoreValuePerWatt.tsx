// ---------------------------------------------------------------------------
// MoreValuePerWatt (sam-gigawatt-cost, cut 3). Cheeky Pint style, the realistic variant carried into the AIR (the
// Scott "air" look: scott-aircraft-order/aircraftShared.tsx AirStage, imported read-only). Opaque 1080x1920,
// 23.976 fps, 78 frames. Render with --gl=angle.
//
// CHECK LINE: "the same small amount of power keeps buying more and more value — and the gain speeds up."
//
// THE LINE (Sam Altman): "the reason it could go up is that if AI just gets increases in value per what it can do
// per watt so quickly, and there's such a supply shortage..." — this slot holds "increases in value per what it can
// do per watt so quickly, and".
// WORD -> FRAME (from f0; whisper, may run ~5 f early): AI -14 · just -9 · increases -2 · in 11 · value 16 · what 24 ·
// it 35 · can 38 · do 40 · per 44 · watt 47 · so 53 · quickly 58 · and 74 · (on camera) there's 80.
// DURATION: the slot 7.799 -> 11.053 s = 3.254 s x 24000/1001 = 78 frames (f0..f77).
//
// THE MOTION: on the desert apron at golden hour a small power pole (post, crossarm, insulators, a transformer box)
// stands behind-left of the chip; ONE cream cable drops from its insulator into an upright boot on the chip's top (a
// cream ceramic package on pins, a board-toned die, on a low plinth). A metronome of identical cream-white light
// pulses travels the cable, one every 13 f at one speed; each pulse enters the chip, its light crosses the die, and
// gold bars are tossed out of the TWO outlets in the chip's right face: each slides out, curves up off the slot's lip
// and flies one ballistic arc under one gravity (0.013 m/f^2, the bars are big) toward the camera and down onto its
// place, where it stops dead (weight, no bounce; nothing hovers, nothing pops in). The pile is a stepped, two-row-deep
// pyramid (6-5-4-3-2-1 per row) anchored at its far foot (nearest the camera) and laid back toward the chip, base
// first, so every arc lands with no neighbour on its near side. The input never changes; the output visibly
// accelerates: the gap between bars leaving the chip goes 13 f -> 4 -> 2.4 (from f31) -> 1.8 (from f43.5, the pour
// under "so quickly" f53-58) -> 1.4-1.9 (from ~f65), and from ~f31 the two outlets run as one quickening stream.
// THE FRAME: the camera stands beyond the pile, low-ish and looking down 37-38 deg back up the throw, so the chip and
// pole sit small at the upper left (chip y ~685-985, pole top y ~65) and the pile builds big and close in the lower
// middle (x 302-1068 = 71 % of the width, base y ~1613 at f77; the bars may cross the caption bands, they are not
// readable detail). ONE slow drift, eased over the whole cut: a slight pull back and orbit (d 8.85 -> 8.95 m, yaw
// -52.5 -> -55 deg), no other move. The "1 W" flag on the cable near the pole slides up on "watt" (f39-47) and stays
// above y 320 at every frame.
// Cause before effect: pulse k touches the plug on CONTACT f = 2 + 13 (k-1) (f2, 15, 28, 41, 54, 67; the 7th on f80,
// still on the cable at the end); its light crosses the die over the next 3 f; no bar of pulse k shows at the slot
// before contact + 3: first bars emerge f5.5 (k1), 18.5 (k2), 31.5 (k3), 45.3 (k4), 65.4 (k5, queued behind k4's).
// First landing f35.2; landed bars: 2 by f47, 6 by f53, 10 by f58, 15 by f74, 17 by f77, with 11 more in the air at
// the end (29 scheduled). Launch speeds 0.24-0.30 m/f, angles 7-39 deg, flights 11-25.5 f, nothing lands faster than
// 0.29 m/f; the fastest bar on screen moves 60.4 px/f (full res, camera motion included; it is the first bar, just
// before it lands on the far foot nearest the camera).
// Every bar's path, launch and landing come from valuePerWattPlan.ts, which schedules each bar only where its whole
// path (sampled at 1/8 f, SAT on the trapezoid profile) stays clear of every bar in its lane (3 cm while moving), the
// pile, the chip and the plinth, and lands no bar before the bars it rests on; an independent 1/64-f check: 0 hits.
// AMBER = the dollars (the value a watt earns: the gold bars). Cream = the cable, the pulses' light, the chip, the
// plinth. Nothing else glows.
//
// SOURCES: none on screen (no figures; the doubling is the speaker's claim drawn as a mechanism, not data).
// Pieces: valuePerWattPlan.ts (geometry, schedule, camera), valuePerWattWorld.tsx (the 3D world).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, FONT_NUM } from "../kits/cheeky-pint/stoutShared";
import { AirStage, airProject, type GroundSpec } from "../scott-aircraft-order/aircraftShared";
import { CABLE_LEN, CAM_REST, DURATION as PLAN_DURATION, FPS as PLAN_FPS, PULSE, PULSE_KS, TAG, camAt, cableAt, contactFrame } from "./valuePerWattPlan";
import { ValueWorld } from "./valuePerWattWorld";

export const FPS = PLAN_FPS;
export const DURATION = PLAN_DURATION;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const GROUND: GroundSpec = { aprons: [[-90, -40, 140, 260]], joints: 9 };
const c01 = (v: number) => Math.max(0, Math.min(1, v));

/** The pulses' light in the air: a soft warm-white halo around each pulse on the cable (screen px, pinned to the
 *  world); it closes as the pulse goes into the plug. */
const PulseHalos: React.FC<{ f: number; cam: ReturnType<typeof camAt> }> = ({ f, cam }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, mixBlendMode: "screen" }}>
    <defs>
      <radialGradient id="vpwHalo">
        <stop offset="0" stopColor="#FFF8EA" stopOpacity="0.85" />
        <stop offset="0.3" stopColor="#FFF1D8" stopOpacity="0.35" />
        <stop offset="1" stopColor="#FFF1D8" stopOpacity="0" />
      </radialGradient>
    </defs>
    {PULSE_KS.map((k) => {
      const s = CABLE_LEN + (f - contactFrame(k)) * PULSE.speed - PULSE.len * 0.5;
      if (s < 0 || s > CABLE_LEN + 0.4) return null;
      const p = airProject(cam, cableAt(s));
      if (p.d <= 0.5) return null;
      const a = c01((CABLE_LEN + 0.35 - s) / 0.7);
      const r = 1.1 * p.s;
      return <circle key={k} cx={p.x} cy={p.y} r={r} fill="url(#vpwHalo)" opacity={a} />;
    })}
  </svg>
);

/** The "1 W" cable flag: a cream card wrapped round the cable a few metres before the chip, standing out to its
 *  right, ink numerals; world size (TAG, metres) at the anchor's depth, so it moves and scales with the camera. It
 *  enters on "watt" (lands f47) sliding up 24 px while fading in, then stays. */
const CableFlag: React.FC<{ f: number; cam: ReturnType<typeof camAt> }> = ({ f, cam }) => {
  const e = c01((f - TAG.in) / TAG.enterF);
  if (e <= 0.001) return null;
  const a = 1 - Math.pow(1 - e, 3);
  const p = airProject(cam, cableAt(TAG.s));
  const k = p.s;
  const w = TAG.w * k;
  const h = TAG.h * k;
  const x = p.x + CABLE_R_PX(k);
  const y = p.y - h / 2 + (1 - a) * 24;
  const r = 0.08 * k;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }} opacity={a}>
      {/* one soft shadow down-right (the key light is upper left) */}
      <rect x={x + 0.05 * k} y={y + 0.09 * k} width={w} height={h} rx={r} fill={COLOR.shadow} opacity={0.32} style={{ filter: `blur(${(0.07 * k).toFixed(2)}px)` }} />
      {/* the wrap round the cable */}
      <rect x={p.x - CABLE_R_PX(k) * 1.6} y={y + h * 0.18} width={CABLE_R_PX(k) * 3.2} height={h * 0.64} rx={CABLE_R_PX(k) * 0.8} fill={COLOR.creamFoot} />
      <rect x={x} y={y} width={w} height={h} rx={r} fill={COLOR.cream} />
      <text x={x + w / 2} y={y + h / 2 + TAG.cap * k * 0.5} textAnchor="middle" fontFamily={FONT_NUM} fontSize={TAG.cap * k * 1.4} fill={COLOR.inkDark}>
        1 W
      </text>
    </svg>
  );
};
const CABLE_R_PX = (k: number) => 0.085 * k;

const MoreValuePerWatt: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  return <AirStage cam={cam} S={f} rest={CAM_REST} ground={GROUND} world={<ValueWorld f={f} />} overlay={
        <>
          <PulseHalos f={f} cam={cam} />
          <CableFlag f={f} cam={cam} />
        </>
      } />;
};

export default MoreValuePerWatt;
