// ---------------------------------------------------------------------------
// SaddamsPointOfView (sarah-gulf-war, cut 26). Dwarkesh 3D style (styles/dwarkesh-3d.md): the shared Gulf map world
// (gulfMapWorld.tsx, read-only; its header is the API) under one camera, opening on cut 12's last frame exactly.
// Opaque 1080x1920, 24 fps, 68 frames. RENDER WITH --gl=angle (the ground is WebGL2).
//
// CHECK LINE: "With Kuwait's oil added to his own, Saddam would sit on a huge share of the world's oil, and he liked it."
//
// THE LINE: "And so that looked good from Saddam's point of view."
// WORD -> FRAME (Whisper, ~5-9 f early; the real words ~6 f later): so 1 · that 6 · looked 11 · good 17 · from 25 ·
//   Saddam's 33 (really ~39) · point 47 · of 52 · view 55 (point of view really ~53-61) · (slot ends 68).
// DURATION: the slot 26.541667 -> 29.375 s = 2.833 s x 24 = 68 frames (f0..f67).
//
// THE MOTION: f0 = cut 12's f173 (same camera, air, grain, labels, tanks, derricks, Kuwait's five fields lit). One
// eased pull-back and tilt-up (saddamPovCam: target north toward Basra, D 125 -> 250, pitch 54 -> 27, yaw held ~176,
// moving from f1, fastest ~f10, settled ~f50, a creep to the end) opens the wide: Iraq's southern fields come up from
// the bottom of the frame and light orange one after another as each comes well into view (Zubair f8, Rumaila f14,
// Majnoon f18, West Qurna f21.5, all lit by ~f40; derricks rise as each glow passes), joining Kuwait's into one glowing cluster in y ~650-1070.
// Beyond Kuwait, out in the haze, Saddam's real photo (the ITN interview, smiling, hand to cheek) rises out of the
// haze bank f12 -> f39 like one of his giant murals (timed on screen: the hair's top climbs to y ~240 by f39, never
// overshooting) and lands smiling on "Saddam's", his hair into the sky over the far horizon, his chest dissolving into
// the haze; he goes on emerging a hair (more chest) while the camera settles, so he holds still on screen. f40-67: the creep, the mural looms a hair and breathes, motes drift
// across it, the fields breathe. Cut 12's ground labels drain f2-20 (they would shrink to unreadable in the wide).
// CAUSE -> EFFECT: each Iraqi field's glow starts the frame it is due AND in view; its derricks rise as the glow front
// passes them (derrickRise on that same curve). Orange = OIL only.
//
// DEPTH: gulfMapWorld's pinhole (F 1300). The mural is an upright sprite anchored at the ground point B under screen
// (500, 640) at the wide (~85 km south of Kuwait City, just past Burgan), sized in world km (0.6 screen px per photo px
// at the wide, ~64 % of the frame width), so it moves with the world; everything nearer (the fields) is below its base
// line, where a soft mask dissolves it. An air-coloured haze bank lies over the far ground between the horizon and that
// base line, rising with the pull-back (0 at f0). Tanks and derricks keep cut 12's sizes (grown, they hid Kuwait's small far glows).
//
// SOURCES: map, fields, column: gulfMapWorld / MAP_READY.md (Natural Earth; field centroids approximate). Iraq's fields
//   Rumaila, West Qurna, Zubair, Majnoon (COMMON.md). Photo: Saddam Hussein interviewed by ITN, Baghdad, Nov 1990,
//   https://www.youtube.com/watch?v=H-2Zj86_Z9A (copyright ITN; flagged to the user by the director); the director's
//   cut-out, baked into saddamPortraitData.ts (source PNG in assets-src/sarah-gulf-war/). The ITN logo is outside the
//   cut-out's mask (alpha 0, RGB zeroed in the bake).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirStage, AIR, mixHex } from "../kits/dwarkesh-3d/dwarkesh3d";
import {
  CUT12_END_TANK_SCALE,
  CUT12_REST,
  DERRICKS,
  DERRICK_SCALE,
  GroundLabel,
  GulfGround,
  KUWAIT_FIELDS,
  PLACES,
  STACK_S,
  TANKS,
  borderItems,
  cityDot,
  derrickItem,
  derrickRise,
  derrickShadowItem,
  distTo,
  fieldLitAt,
  gulfAir,
  horizonY,
  paint,
  roadItem,
  sstep,
  tankAt,
  tankItems,
  tankShadowItem,
  toScreen,
  type FieldKey,
  type Item,
  type Lit,
  type P2,
} from "./gulfMapWorld";
import { ABS0, B, BASE_SRC, DURATION as CAM_DURATION, FACE_SRC_X, FADE_SRC, camAt, iraqLitAt, portraitAt, progress } from "./saddamPovCam";
import { PORTRAIT_PNG, PORTRAIT_SRC } from "./saddamPortraitData";

export const FPS = 24;
export const DURATION = 68;
export const schema = z.object({});
export const defaultProps = schema.parse({});
if (CAM_DURATION !== DURATION) throw new Error("SaddamsPointOfView: camera and cut durations differ");

const PAL = AIR.A;

// ---- cut 12's end labels (InvadedKuwaitForOil LBL at f173, all fully up; MAP_READY rev 2) ------------------------
const C12_LABELS: { text: string; at: P2; cap: number; up: number; plate: number; track?: number; slide?: number }[] = [
  { text: "IRAQ", at: [-12.8, -82.3], cap: 2.2, up: 178, plate: 0.4, slide: 12 },
  { text: "KUWAIT", at: [-44, 4], cap: 4, up: 210, plate: 0.4 },
  { text: "2 AUG 1990", at: [-41.75, 0.1], cap: 2.2, up: 210, plate: 0.6, track: 0.12 },
  { text: "KUWAIT CITY", at: [6.5, -1.2], cap: 2.6, up: 190, plate: 0.7, track: 0.1 },
  { text: "PERSIAN GULF", at: [43.9, 39.7], cap: 2.4, up: 178, plate: 0.2, track: 0.22 },
];
/** the labels drain into the air as the wide opens */
const labelOp = (f: number) => 1 - sstep(2, 20, f);

const litAt = (f: number): Lit => {
  const o: Lit = {};
  for (const k of KUWAIT_FIELDS) o[k] = 1;
  for (const k of ["rumaila", "zubair", "westQurna", "majnoon"] as FieldKey[]) o[k] = iraqLitAt(k, f);
  return o;
};

const SaddamsPointOfView: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const abs = frame + ABS0;
  const cam = camAt(frame);
  const air = gulfAir(cam, abs, CUT12_REST);
  const lit = litAt(frame);
  const hz = horizonY(cam);

  // ground-level overlays (as cut 12)
  const ground: (Item | null)[] = [roadItem(cam, air, { s1: STACK_S + 1.5 }), ...borderItems(cam, air, "iraqKuwait"), ...borderItems(cam, air, "kuwaitSaudi"), ...borderItems(cam, air, "iraqSaudi"), ...borderItems(cam, air, "iraqIran", { op: 0.6 })];
  ground.push(cityDot(cam, air, PLACES.kuwaitCity as P2, 0.85, "kc"));

  // standing things: the parked column (idling) and the derricks
  const items: (Item | null)[] = [];
  TANKS.forEach((t) => {
    const st = tankAt(t, abs);
    const bob = st.speed > 0 ? 0.006 * Math.sin(abs * 1.35 + t.id * 1.7) : 0.0035 * Math.sin(abs * 2.1 + t.id);
    const pose = { at: st.at, heading: st.heading, scale: CUT12_END_TANK_SCALE, bob };
    const s = toScreen(cam, st.at[0], 0, st.at[1]);
    if (s.z < 0.5 || s.x < -200 || s.x > 1280 || s.y < -200 || s.y > 2120) return;
    items.push(tankShadowItem(cam, air, pose, `t${t.id}`), tankItems(cam, air, pose, `t${t.id}`));
  });
  DERRICKS.forEach((d) => {
    const kuwait = KUWAIT_FIELDS.includes(d.field);
    // Kuwait's on cut 12's own timeline (absolute frames), Iraq's on this cut's
    const r = kuwait ? derrickRise(d, (f) => fieldLitAt(f)[d.field], abs) : derrickRise(d, (f) => iraqLitAt(d.field, f), frame);
    if (r <= 0) return;
    items.push(derrickShadowItem(cam, air, d, r, `d${d.i}`, DERRICK_SCALE), derrickItem(cam, air, d, r, `d${d.i}`, DERRICK_SCALE));
  });

  // the mural
  const pa = portraitAt(cam, frame);
  const S = PORTRAIT_SRC.scale;
  const tx = pa.baseX + (PORTRAIT_SRC.x0 - FACE_SRC_X) * pa.k;
  const ty = pa.baseY + (PORTRAIT_SRC.y0 - BASE_SRC + pa.lift) * pa.k;
  const sc = pa.k / S;
  const fadeTop = pa.baseY - FADE_SRC * pa.k;
  const distB = distTo(cam, B[0], 0, B[1]);
  const fogC = mixHex(air.airHexAt(distB), PAL.creamLo, 0.08);
  const FOG = 0.2;
  const showMural = pa.lift < BASE_SRC - PORTRAIT_SRC.y0 && pa.z > 1;

  // the haze bank over the far ground, from the horizon (or the frame top) down to just under the mural's base line
  const hazeAmt = progress(frame);
  const hzTop = Math.max(-10, hz);
  const hazeBot = pa.baseY + 6;
  // the near ground sinks into the dense low air as the wide opens (the bottom half is open desert north of the fields)
  const lowAir = air.v.airAtScreen(1920);

  return (
    <AbsoluteFill>
      <AirStage v={air.v} bloom={0.22}>
        <GulfGround cam={cam} frame={abs} air={air} lit={lit} />
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <defs>
            <linearGradient id="spv-haze" gradientUnits="userSpaceOnUse" x1={0} y1={hzTop} x2={0} y2={hazeBot}>
              <stop offset="0" stopColor={air.airHexAt(1e6)} stopOpacity={0.92 * hazeAmt} />
              <stop offset="0.55" stopColor={air.airHexAt(distB * 1.4)} stopOpacity={0.7 * hazeAmt} />
              <stop offset="0.85" stopColor={air.airHexAt(distB)} stopOpacity={0.3 * hazeAmt} />
              <stop offset="1" stopColor={air.airHexAt(distB)} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="spv-base" gradientUnits="userSpaceOnUse" x1={0} y1={fadeTop} x2={0} y2={pa.baseY}>
              <stop offset="0" stopColor="#fff" />
              <stop offset="0.45" stopColor="#fff" stopOpacity={0.72} />
              <stop offset="1" stopColor="#fff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="spv-low" gradientUnits="userSpaceOnUse" x1={0} y1={1240} x2={0} y2={1920}>
              <stop offset="0" stopColor={`rgb(${lowAir.map(Math.round).join(",")})`} stopOpacity={0} />
              <stop offset="1" stopColor={`rgb(${lowAir.map(Math.round).join(",")})`} stopOpacity={0.4 * hazeAmt} />
            </linearGradient>
            <mask id="spv-mask" maskUnits="userSpaceOnUse" x={0} y={0} width={1080} height={1920}>
              <rect x={0} y={0} width={1080} height={1920} fill="url(#spv-base)" />
            </mask>
            <filter id="spv-tone" x="-3%" y="-3%" width="106%" height="106%" colorInterpolationFilters="sRGB">
              <feColorMatrix in="SourceGraphic" type="saturate" values="0.8" result="sat" />
              <feComponentTransfer in="sat" result="lift">
                <feFuncR type="linear" slope={0.84} intercept={0.045} />
                <feFuncG type="linear" slope={0.84} intercept={0.055} />
                <feFuncB type="linear" slope={0.82} intercept={0.05} />
              </feComponentTransfer>
              <feFlood floodColor={fogC} result="air" />
              <feComposite in="lift" in2="air" operator="arithmetic" k1={0} k2={1 - FOG} k3={FOG} k4={0} result="fogged" />
              <feComposite in="fogged" in2="SourceAlpha" operator="in" result="body" />
              <feOffset in="SourceAlpha" dx={5} dy={5} result="sh" />
              <feComposite in="SourceAlpha" in2="sh" operator="out" result="edge" />
              <feGaussianBlur in="edge" stdDeviation={2} result="edgeB" />
              <feComposite in="edgeB" in2="SourceAlpha" operator="in" result="edgeIn" />
              <feFlood floodColor={PAL.cream} floodOpacity={0.6} result="cream" />
              <feComposite in="cream" in2="edgeIn" operator="in" result="rim" />
              <feMerge>
                <feMergeNode in="body" />
                <feMergeNode in="rim" />
              </feMerge>
            </filter>
          </defs>
          {paint(ground)}
          {hazeAmt > 0.001 && hazeBot > 0 ? <rect x={0} y={hzTop} width={1080} height={Math.max(0, hazeBot - hzTop)} fill="url(#spv-haze)" /> : null}
          {hazeAmt > 0.001 ? <rect x={0} y={1240} width={1080} height={680} fill="url(#spv-low)" /> : null}
          {showMural ? (
            <g mask="url(#spv-mask)">
              <g transform={`translate(${tx.toFixed(3)},${ty.toFixed(3)}) scale(${sc.toFixed(5)})`}>
                <image href={PORTRAIT_PNG} x={0} y={0} width={PORTRAIT_SRC.w} height={PORTRAIT_SRC.h} filter="url(#spv-tone)" />
              </g>
            </g>
          ) : null}
          {C12_LABELS.map((l) => (
            <GroundLabel key={l.text} cam={cam} air={air} text={l.text} at={l.at} cap={l.cap} u={1} up={l.up} plate={l.plate} track={l.track} slide={l.slide} op={labelOp(frame)} />
          ))}
          {paint(items)}
        </svg>
      </AirStage>
    </AbsoluteFill>
  );
};

export default SaddamsPointOfView;
