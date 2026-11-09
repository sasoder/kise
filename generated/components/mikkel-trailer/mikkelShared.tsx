import React from "react";
import { AbsoluteFill, Img, random, staticFile } from "remotion";
import { PAPER_BASE, PaperGround, filmWeave } from "../neal-stephenson-trailer/nealShared";

// ---------------------------------------------------------------------------
// MIKKEL TRAILER: the clip's shared module (Core Memory trailer, Mikkel Vestergaard Frandsen / Sceye), 16:9.
//
// The ARCHIVE COLLAGE look of the Pushp (Airbound) trailer, on nealShared: the Core Memory squared paper is the world,
// every real thing is a black-and-white photo cut-out lying on it with the Core Memory hard shadow; white Barlow 900 type
// on the hard shadow; old-film life over everything. The sequence is 4096 x 2160: compose at 2048 x 1080 (W, H here)
// and render finals --scale 2. nealShared's own W is 1920: everything frame-sized is re-made here at 2048 (the camera
// planes, the caption-band aid, the film life); the photo pieces (PhotoCutOut, Silhouette, ChainPhotoCutOut, CutOut)
// are size-free and are imported from nealShared directly.
//
// LEGEND
//   * Ground: cerroShared's PaperGround (unrotated at 16:9, brightness 0.88 blur 3 px). The paper is the sky.
//   * Photos: greyscale cut-outs graded MIKKEL_FILTER (= the Pushp aircraft grade: grayscale, sepia 0.14, a little
//     contrast). Hard shadow: a pure black silhouette at +SHADOW_OFF/+SHADOW_OFF px, zero blur.
//   * The CHAIN (orange #FFB765 back, purple #BC37FF, blue #0046FF front, the core on top) has ONE meaning in this clip:
//     SCEYE'S ADVANTAGE (what the airship has that the alternatives do not). At most one chain moment per cut.
//   * Caption bands (screen y of 1080): 607-703 and 765-821. Nothing readable in them.
//
// EXPORTS
//   FPS, W, H, CAPTION_BANDS, inCaptionBand, CaptionBands, MIKKEL_FILTER
//   MikkelCam (type), depthTransform(cam, d), MikkelPlane, MikkelSvg, MikkelPaper
//   MikkelFilmLife (grain sized for 2048)
// ---------------------------------------------------------------------------

export const FPS = 24000 / 1001;
export const W = 2048;
export const H = 1080;

/** The user's burned-in captions sit in these SCREEN y ranges (of 1080): nothing readable there. */
export const CAPTION_BANDS: readonly (readonly [number, number])[] = [
  [607, 703],
  [765, 821],
];
export const inCaptionBand = (y0: number, y1: number) => CAPTION_BANDS.some(([a, b]) => y1 > a && y0 < b);

/** Preview aid: the caption bands as translucent red strips (screen space). Never on in a final. */
export const CaptionBands: React.FC<{ on?: boolean }> = ({ on = false }) =>
  on ? (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {CAPTION_BANDS.map(([a, b]) => (
        <div key={a} style={{ position: "absolute", left: 0, top: a, width: W, height: b - a, background: "rgba(255,0,0,0.22)" }} />
      ))}
    </AbsoluteFill>
  ) : null;

/** The clip's photo grade (the Pushp aircraft grade). Photo nodes only, never the chain or the type. */
export const MIKKEL_FILTER = "grayscale(1) sepia(0.14) contrast(1.12) brightness(1.02)";

// -- the camera (nealShared's dolly at 2048 x 1080) ---------------------------------------------------------------
export type MikkelCam = { x: number; y: number; k: number; x0?: number; y0?: number };

const depthScale = (k: number, d: number) => {
  if (d === 1) return k;
  const den = d - (1 - 1 / k);
  if (den <= 0.02) throw new Error(`depthScale: the camera (k ${k}) has passed the plane at depth ${d}`);
  return d / den;
};

export const depthTransform = (cam: MikkelCam, d = 1) => {
  const x0 = cam.x0 ?? W / 2;
  const y0 = cam.y0 ?? H / 2;
  const kd = depthScale(cam.k, d);
  const xd = d === 1 ? cam.x : x0 + (cam.x - x0) / d;
  const yd = d === 1 ? cam.y : y0 + (cam.y - y0) / d;
  const tx = W / 2 - xd * kd;
  const ty = H / 2 - yd * kd;
  return { k: kd, tx, ty, transform: `translate(${tx}px, ${ty}px) scale(${kd})`, toScreen: (x: number, y: number) => ({ x: tx + x * kd, y: ty + y * kd }) };
};

export const MikkelPlane: React.FC<{ cam: MikkelCam; d?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ cam, d = 1, children, style }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: depthTransform(cam, d).transform, ...style }}>{children}</div>
);

export const MikkelSvg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    {children}
  </svg>
);

export const MikkelPaper: React.FC<{ frame: number; cam: MikkelCam }> = ({ frame, cam }) => (
  <PaperGround frame={frame} cx={cam.x} cy={cam.y} cxRest={cam.x0 ?? W / 2} cyRest={cam.y0 ?? H / 2} k={cam.k} />
);

// -- film life at 2048 ------------------------------------------------------------------------------------------------
// The DownTheShaft grain tile (1216 x 2048 portrait) turned 90 degrees is exactly 2048 wide: it is scaled 1.12 so a new
// random offset every frame still covers the frame.
const GRAIN = "cerro/shaft/grain_tile.png";
const GRAIN_W = 1216;
const GRAIN_H = 2048;
const GS = 1.12;

/** nealShared's NealFilmLife at 2048 x 1080: gate weave, exposure flicker, soft vignette, fine grain (overlay). */
export const MikkelFilmLife: React.FC<{
  frame: number;
  children?: React.ReactNode;
  grain?: number;
  weave?: number;
  flicker?: number;
  vignette?: number;
  seed?: string;
}> = ({ frame, children, grain = 0.16, weave = 0.8, flicker = 0.015, vignette = 0.3, seed = "mikkel" }) => {
  const f = Math.floor(frame);
  const wv = filmWeave(frame, weave);
  const tw = GRAIN_H * GS;
  const th = GRAIN_W * GS;
  const gx = Math.floor(random(`${seed}-gx-${f}`) * (tw - W));
  const gy = Math.floor(random(`${seed}-gy-${f}`) * (th - H));
  const fx = random(`${seed}-gfx-${f}`) < 0.5 ? -1 : 1;
  const fy = random(`${seed}-gfy-${f}`) < 0.5 ? -1 : 1;
  const n = Math.max(-1, Math.min(1, 0.45 * Math.sin((2 * Math.PI * frame) / 9.3 + 0.4) + 0.55 * (2 * random(`${seed}-fl-${f}`) - 1)));
  const veil = flicker * (1 + n);
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: PAPER_BASE }}>
      {children ? (
        <AbsoluteFill style={{ transform: `translate(${wv.dx}px, ${wv.dy}px) scale(1.0025)`, transformOrigin: "50% 50%" }}>{children}</AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: `rgba(0,0,0,${veil})` }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse farthest-corner at 50% 48%, rgba(0,0,0,0) 46%, rgba(0,0,0,${0.35 * vignette}) 72%, rgba(0,0,0,${vignette}) 100%)`,
        }}
      />
      <AbsoluteFill style={{ overflow: "hidden", mixBlendMode: "overlay", opacity: grain }}>
        <div style={{ position: "absolute", left: -gx, top: -gy, width: tw, height: th, transform: `scale(${fx}, ${fy})` }}>
          <Img
            src={staticFile(GRAIN)}
            style={{
              position: "absolute",
              left: (tw - GRAIN_W * GS) / 2,
              top: (th - GRAIN_H * GS) / 2,
              width: GRAIN_W * GS,
              height: GRAIN_H * GS,
              maxWidth: "none",
              transform: "rotate(90deg)",
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
