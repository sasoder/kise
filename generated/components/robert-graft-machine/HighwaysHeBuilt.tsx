// ---------------------------------------------------------------------------
// HighwaysHeBuilt (robert-graft-machine, cut 3). Style: the show's own 16:9 map graphic (notes/COMMON.md), translated
// to 9:16. Opaque 1080x1920, 24 fps, 194 frames.
//
// CHECK LINE: "Of all the highways around New York, Moses built most of them — his black roads take over nearly the
// whole map."
//
// THE LINE: "Of the 899 miles of highways completed in New York state by 1964, Moses had built 672 of them."
// WORD -> FRAME: Of -1 · the 3 · 899 5 · miles 20 · of 36 · highways 46 · completed 52 · in 63 · New 74 · York 81 ·
// state 85 · by 90 · 1964 97 · Moses 122 · had 132 · built 142 · 672 147 · of 181 · them 186.
// DURATION: the slot 3.000 -> 11.0833 s = 8.0833 s x 24 = 194 frames (f0..f193).
//
// THE MOTION: the map fades up from dark (f0-7) with the thin grey road web and a grey "899 MILES" in the black ocean,
// readable on "899" (f5); one slow push on the five boroughs runs the whole cut while New Jersey recedes to the
// original's darker grey (f90-135). On "built" the grey 899 leaves (f139-143) and a glowing white count rises in its
// place (f143-147, MILES crossfades grey -> white f141-147) while the
// thick black highways draw on along the roads outward from upper Manhattan (geodesic spread, baked in 48 steps),
// across the boroughs and out along Long Island, the camera drifting east with the spread; the count is the revealed
// share of the network x builtMiles, stepped on twos, and lands with the last road at f172, before "of them" (f181).
// Below the source frame (y > 1900) the plate continues as a synthesised New Jersey shore receding west, so the
// readout sits in open black ocean; at the top the plate eases into the flat dark ground on one smoothstep from world
// y -320 to +230 (~340 screen px; its top row smeared up, capped at the mainland grey), so there is no seam.
// f172-193: settled hold on the full network, grain alive, camera still creeping.
//
// SOURCES: map artwork traced from the show's own graphic (Robert_Graft_machine_media.mov, frames map_src4.5.png =
// base and map_src10.25.png = final; highways = final minus base after an ECC affine alignment), bake scripts in
// assets-src/robert-graft-machine/highways_*.py. Figures: 899 miles completed in NY state by 1964 and "672" as spoken
// and as shown in the original graphic. FLAG: Caro (The Power Broker, ch. "Point of No Return") gives 627 of the 899;
// builtMiles is a prop (672 default; null hides the count and keeps "899 MILES").
// Fonts: count Montserrat 800 / MILES Montserrat 700 (the original's heavy geometric sans); borough names Roboto Slab
// 700 (the original's slab caps) with a light halo. STATEN ISLAND is dropped: on every camera state its land sits in
// the caption bands.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadRobotoSlab } from "@remotion/google-fonts/RobotoSlab";
import { z } from "zod";
import { HW } from "./highwaysData";

export const FPS = 24;
export const DURATION = 194;
export const schema = z.object({
  builtMiles: z.number().nullable(),
});
export const defaultProps = schema.parse({ builtMiles: 672 });

const NUM_FONT = loadMontserrat("normal", { weights: ["700", "800"], subsets: ["latin"] }).fontFamily;
const LABEL_FONT = loadRobotoSlab("normal", { weights: ["700"], subsets: ["latin"] }).fontFamily;

const DIR = "robert-graft-machine/highways";
const OCEAN = "#181818"; // sampled 24/255 from the source ocean
const FOCUS_Y = 900; // screen y the camera centre maps to

// ---- timing
const FADE_IN = [0, 7];
const DIM = [90, 135]; // New Jersey recedes 193 -> 121 (as in the original before the draw)
const SWAP = [141, 147]; // MILES grey -> white glowing
const NUM_OUT = [139, 143]; // grey 899 leaves first, then the count rises in: never two numbers on top of each other
const NUM_IN = [143, 147];
const DRAW = [141, 172]; // highways draw on; count lands with the last road

// ---- camera (world = px of the 4K source frame). One slow push the whole cut; the eastward drift gathers pace
// with the draw so the spread out along Long Island stays in shot.
const camera = (f: number) => {
  const t = f / DURATION;
  const k = interpolate(t, [0, 1], [0.6, 0.64], { easing: Easing.bezier(0.3, 0, 0.6, 1) });
  const cx = interpolate(f, [0, 214], [1720, 1840], { easing: Easing.bezier(0.55, 0, 0.45, 1) });
  const cy = interpolate(t, [0, 1], [1000, 990]);
  return { k, cx, cy };
};

// ---- labels, world positions measured from the source glyphs (centre, rotation)
const LABELS: { text: string; x: number; y: number; rot: number }[] = [
  { text: "THE BRONX", x: 2078, y: 220, rot: 0 },
  { text: "MANHATTAN", x: 1755, y: 630, rot: -62 },
  { text: "QUEENS", x: 2270, y: 979, rot: 0 },
  { text: "BROOKLYN", x: 1856, y: 1184, rot: 0 },
];
const LABEL_SIZE = 70; // world px; cap ~50 world = ~31 screen px
const LABEL_INK = "#4b4b4b";
const LABEL_HALO = "#f1f1f1";

// ---- readout, world space (left-aligned like the original), in the ocean below the caption bands
const NUM_X = 1700;
const NUM_TOP = 1985; // cap top
const NUM_SIZE = 407; // cap ~285 world = ~175 screen px
const MILES_SIZE = 112;

const drawProgress = (f: number) =>
  interpolate(f, DRAW, [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.4, 1),
  });

const revealedShare = (f: number) => {
  const s = drawProgress(f) * HW.steps;
  const i = Math.min(HW.steps - 1, Math.floor(s));
  const t = s - i;
  return HW.frac[i] + (HW.frac[i + 1] - HW.frac[i]) * t;
};

const Label: React.FC<{ text: string; x: number; y: number; rot: number }> = ({ text, x, y, rot }) => {
  const common: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    fontFamily: LABEL_FONT,
    fontWeight: 700,
    fontSize: LABEL_SIZE,
    letterSpacing: "0.07em",
    lineHeight: 1,
    whiteSpace: "nowrap",
  };
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rot}deg)`,
        transformOrigin: "50% 50%",
      }}
    >
      <div style={{ position: "relative" }}>
        <span style={{ ...common, position: "relative", color: LABEL_HALO, WebkitTextStroke: `16px ${LABEL_HALO}` }}>
          {text}
        </span>
        <span style={{ ...common, color: LABEL_INK }}>{text}</span>
      </div>
    </div>
  );
};

const HighwaysHeBuilt: React.FC<z.infer<typeof schema>> = ({ builtMiles }) => {
  const frame = useCurrentFrame();
  const { k, cx, cy } = camera(frame);

  // roads: two neighbouring baked steps, crossfaded
  const s = drawProgress(frame) * HW.steps;
  const i0 = Math.min(HW.steps, Math.floor(s));
  const i1 = Math.min(HW.steps, i0 + 1);
  const t01 = s - i0;
  const pad = (n: number) => String(n).padStart(2, "0");
  const rx = HW.X0 + HW.roadsX / HW.PS;
  const ry = -HW.PADTOP + HW.roadsY / HW.PS;
  const rw = HW.roadsW / HW.PS;
  const rh = HW.roadsH / HW.PS;

  // readout
  const swap = interpolate(frame, SWAP, [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const showCount = builtMiles !== null;
  const fq = frame - (frame % 2); // the original counts on twos
  const count = showCount ? Math.round((builtMiles as number) * revealedShare(fq)) : 899;
  const swapT = showCount ? swap : 0;
  const clampX = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const numOut = showCount ? interpolate(frame, NUM_OUT, [1, 0], clampX) : 1;
  const numIn = showCount ? interpolate(frame, NUM_IN, [0, 1], clampX) : 0;

  const dim = interpolate(frame, DIM, [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });
  const fade = interpolate(frame, FADE_IN, [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const gx = Math.floor(random(`gx${frame}`) * 110);
  const gy = Math.floor(random(`gy${frame}`) * 110);

  const numStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    fontFamily: NUM_FONT,
    fontWeight: 800,
    fontSize: NUM_SIZE,
    lineHeight: 1,
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
  };
  const milesStyle: React.CSSProperties = {
    position: "absolute",
    left: 8,
    top: NUM_SIZE * 0.92,
    fontFamily: NUM_FONT,
    fontWeight: 700,
    fontSize: MILES_SIZE,
    letterSpacing: "0.24em",
    lineHeight: 1,
    whiteSpace: "nowrap",
  };
  const GREY = "#c3c3c3";
  const WHITE = "#f5f5f5";
  const GLOW = "0 0 22px rgba(255,255,255,0.45), 0 0 60px rgba(255,255,255,0.22)";
  const MGLOW = "0 0 10px rgba(255,255,255,0.4), 0 0 28px rgba(255,255,255,0.2)";
  // cap top of Montserrat sits ~0.165 em below the em box top at lineHeight 1
  const numTop = NUM_TOP - NUM_SIZE * 0.165;

  return (
    <AbsoluteFill style={{ backgroundColor: OCEAN, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transformOrigin: "0 0",
          transform: `translate(${540 - cx * k}px, ${FOCUS_Y - cy * k}px) scale(${k})`,
        }}
      >
        <Img
          src={staticFile(`${DIR}/plate.jpg`)}
          style={{ position: "absolute", left: HW.X0, top: -HW.PADTOP, width: HW.plateW / HW.PS, height: HW.plateH / HW.PS }}
        />
        <Img
          src={staticFile(`${DIR}/nj_mask.png`)}
          style={{
            position: "absolute",
            left: HW.X0,
            top: -HW.PADTOP,
            width: HW.plateW / HW.PS,
            height: HW.plateH / HW.PS,
            opacity: 0.373 * dim,
          }}
        />
        {frame >= DRAW[0] ? (
          <>
            <Img
              src={staticFile(`${DIR}/roads_${pad(i0)}.png`)}
              style={{ position: "absolute", left: rx, top: ry, width: rw, height: rh }}
            />
            {i1 !== i0 && t01 > 0.001 ? (
              <Img
                src={staticFile(`${DIR}/roads_${pad(i1)}.png`)}
                style={{ position: "absolute", left: rx, top: ry, width: rw, height: rh, opacity: t01 }}
              />
            ) : null}
          </>
        ) : null}
        {LABELS.map((l) => (
          <Label key={l.text} {...l} />
        ))}
        {/* readout */}
        <div style={{ position: "absolute", left: NUM_X, top: numTop }}>
          <div style={{ ...numStyle, color: GREY, opacity: numOut }}>899</div>
          <div style={{ ...milesStyle, color: GREY, opacity: 1 - swapT }}>MILES</div>
          {showCount ? (
            <>
              <div style={{ ...numStyle, color: WHITE, textShadow: GLOW, opacity: numIn }}>{count}</div>
              <div style={{ ...milesStyle, color: WHITE, textShadow: MGLOW, opacity: swapT }}>MILES</div>
            </>
          ) : null}
        </div>
      </div>

      {/* grain, screen space, fresh every frame */}
      <Img
        src={staticFile(`${DIR}/grain.jpg`)}
        style={{
          position: "absolute",
          left: -gx,
          top: -gy,
          width: 1200,
          height: 2040,
          mixBlendMode: "overlay",
          opacity: 0.32,
        }}
      />
      {/* soft vignette (the plate's own top rows fade into the dark ground, baked) */}
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse 85% 70% at 50% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.32) 100%)" }}
      />
      <AbsoluteFill style={{ backgroundColor: "#0b0b0b", opacity: fade }} />
    </AbsoluteFill>
  );
};

export default HighwaysHeBuilt;
