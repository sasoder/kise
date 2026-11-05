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
// THE MOTION (rev1, the user's notes Nov 5): a hard cut in, no fade. f0 is the map with NO roads at all (a road-free
// land/water plate) and a grey "899 MILES" top-left. The whole thin grey highway web draws on along the roads outward
// from upper Manhattan (geodesic spread, 40 baked steps) f2-52, done on "completed" (f52); the readout holds 899 MILES.
// New Jersey recedes to the original's darker grey (f90-135) under one slow push on the five boroughs. On "built"
// (f142) the readout warms from grey to glowing white (f141-147) and from f145 the number counts up while Moses' roads,
// the SAME thin lines already on the map, thicken along their length outward from Manhattan (each road widens from its
// centre line over ~520 source px behind the front, 48 baked steps); the count is the thickened share of his network x
// builtMiles, stepped on twos, landing with the last road at f172, before "of them" (f181). f172-193: settled hold,
// grain alive, camera still creeping. Framing for short-form apps: readout top-left (cap top ~y 250), the five-borough
// land inside x ~115-965, y ~585-1400; every name and the number inside x 90-920, y 220-1520 and out of the bands.
// Above world y 0 the plate eases into the flat dark ground (smoothstep, world y -320 to +230), so the readout sits on
// dark; a top-left corner shade keeps it there.
// SOURCES: map artwork traced from the show's own graphic (Robert_Graft_machine_media.mov, frames map_src4.5.png =
// base and map_src10.25.png = final; highways = final minus base after an ECC affine alignment), bake scripts in
// assets-src/robert-graft-machine/highways_*.py. Figures: 899 miles completed in NY state by 1964 and "672" as spoken
// and as shown in the original graphic. FLAG: Caro (The Power Broker, ch. "Point of No Return") gives 627 of the 899;
// builtMiles is a prop (672 default; null hides the count and keeps "899 MILES").
// Fonts: count Montserrat 800 / MILES Montserrat 700 (the original's heavy geometric sans); borough names Roboto Slab
// 700 (the original's slab caps) with a light halo. STATEN ISLAND is dropped: on every camera state its land sits in
// the caption bands. BROOKLYN sits a little north of the source's spot (still on Brooklyn) to stay above the band.
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

// ---- timing
const THIN = [2, 52]; // the thin web draws on, done on "completed"
const DIM = [90, 135]; // New Jersey recedes 193 -> 121 (as in the original before the draw)
const SWAP = [141, 147]; // the readout's grey -> glowing white crossfade (number and MILES, same text in both layers)
const COUNT_FROM = 145; // the number reads 899 to f144 and the count from f145 (its first value, 1; 32 on f146): one number on every frame
const DRAW = [142, 172]; // his roads thicken; count lands with the last road

// ---- camera (world = px of the 4K source frame). screen = ANCHOR + (world - W0) * k: one slow push about a point
// just above the boroughs, so the land stays in x ~115-965 and the readout above it barely moves.
const ANCHOR_Y = 700;
const W0 = { x: 1674, y: 398 };
const camera = (f: number) => {
  const k = interpolate(f, [0, DURATION], [0.49, 0.505], { easing: Easing.bezier(0.3, 0, 0.6, 1) });
  return { k, cx: W0.x, cy: W0.y };
};

// ---- labels, world positions measured from the source glyphs (centre, rotation)
const LABELS: { text: string; x: number; y: number; rot: number }[] = [
  { text: "THE BRONX", x: 2078, y: 220, rot: 0 },
  { text: "MANHATTAN", x: 1755, y: 630, rot: -62 },
  { text: "QUEENS", x: 2200, y: 979, rot: 0 },
  { text: "BROOKLYN", x: 1840, y: 1100, rot: 0 },
];
const LABEL_SIZE = 78; // world px; cap ~55 world = ~27 screen px
const LABEL_INK = "#4b4b4b";
const LABEL_HALO = "#f1f1f1";

// ---- readout, world space, left-aligned like the original, top-left on the dark ground: at f0 the number's cap top
// sits at screen (100, 255), cap ~165 px
const K0 = 0.49;
const NUM_X = W0.x + (100 - 540) / K0;
const NUM_TOP = W0.y + (255 - ANCHOR_Y) / K0; // cap top
const NUM_SIZE = 236 / K0; // cap ~0.7 em
const MILES_SIZE = NUM_SIZE * 0.275;

const ease01 = (f: number, r: number[], e: (t: number) => number) =>
  interpolate(f, r, [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
const drawProgress = (f: number) => ease01(f, DRAW, Easing.bezier(0.25, 0.1, 0.4, 1));
const thinProgress = (f: number) => ease01(f, THIN, Easing.bezier(0.3, 0.05, 0.45, 1));

const revealedShare = (f: number) => {
  const s = drawProgress(f) * HW.steps;
  const i = Math.min(HW.steps - 1, Math.floor(s));
  const t = s - i;
  return HW.frac[i] + (HW.frac[i + 1] - HW.frac[i]) * t;
};

const pad = (n: number) => String(n).padStart(2, "0");
// two neighbouring baked steps, crossfaded
const Steps: React.FC<{ name: string; p: number; n: number; x: number; y: number; w: number; h: number }> = ({
  name,
  p,
  n,
  x,
  y,
  w,
  h,
}) => {
  const s = p * n;
  const i0 = Math.min(n, Math.floor(s));
  const i1 = Math.min(n, i0 + 1);
  const t = s - i0;
  const st: React.CSSProperties = { position: "absolute", left: x, top: y, width: w, height: h };
  return (
    <>
      <Img src={staticFile(`${DIR}/${name}_${pad(i0)}.png`)} style={st} />
      {i1 !== i0 && t > 0.001 ? <Img src={staticFile(`${DIR}/${name}_${pad(i1)}.png`)} style={{ ...st, opacity: t }} /> : null}
    </>
  );
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

  const lx = (x: number) => HW.X0 + x / HW.PS;
  const ly = (y: number) => -HW.PADTOP + y / HW.PS;

  // readout
  const swap = interpolate(frame, SWAP, [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const showCount = builtMiles !== null;
  const fq = frame - (frame % 2); // the original counts on twos
  const count = showCount ? Math.round((builtMiles as number) * revealedShare(fq)) : 899;
  const swapT = showCount ? swap : 0;
  const numText = showCount && frame >= COUNT_FROM ? String(Math.max(1, count)) : "899";

  const dim = interpolate(frame, DIM, [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
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
  const world: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    transformOrigin: "0 0",
    transform: `translate(${540 - cx * k}px, ${ANCHOR_Y - cy * k}px) scale(${k})`,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: OCEAN, overflow: "hidden" }}>
      <div style={world}>
        <Img
          src={staticFile(`${DIR}/plate.jpg`)}
          style={{ position: "absolute", left: HW.X0, top: -HW.PADTOP, width: HW.plateW / HW.PS, height: HW.plateH / HW.PS }}
        />
        {frame >= THIN[0] ? (
          <Steps name="thin" p={thinProgress(frame)} n={HW.thinSteps} x={lx(HW.thinX)} y={ly(HW.thinY)} w={HW.thinW / HW.PS} h={HW.thinH / HW.PS} />
        ) : null}
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
          <Steps name="roads" p={drawProgress(frame)} n={HW.steps} x={lx(HW.roadsX)} y={ly(HW.roadsY)} w={HW.roadsW / HW.PS} h={HW.roadsH / HW.PS} />
        ) : null}
        {LABELS.map((l) => (
          <Label key={l.text} {...l} />
        ))}
      </div>

      {/* soft vignette (the plate's own top rows fade into the dark ground, baked); a top-left shade under the readout */}
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse 85% 70% at 50% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.32) 100%)" }}
      />
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse 95% 30% at 18% 13%, rgba(0,0,0,0.62) 45%, rgba(0,0,0,0) 100%)" }}
      />
      {/* readout: world space like the map, but above the shades so the corner darkens behind it, not on it */}
      <div style={world}>
        <div style={{ position: "absolute", left: NUM_X, top: numTop }}>
          <div style={{ ...numStyle, color: GREY, opacity: 1 - swapT }}>{numText}</div>
          <div style={{ ...milesStyle, color: GREY, opacity: 1 - swapT }}>MILES</div>
          {showCount ? (
            <>
              <div style={{ ...numStyle, color: WHITE, textShadow: GLOW, opacity: swapT }}>{numText}</div>
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
    </AbsoluteFill>
  );
};

export default HighwaysHeBuilt;
