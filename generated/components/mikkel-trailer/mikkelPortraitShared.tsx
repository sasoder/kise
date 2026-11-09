import React from "react";
import { AbsoluteFill } from "remotion";
import { NealFilmLife9x16, NealTallPaper } from "../neal-stephenson-trailer/nealPortraitShared";

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
export const W = 1080;
export const H = 1920;

/** The user's burned-in captions sit in these SCREEN y ranges (of 1080): nothing readable there. */
export const CAPTION_BANDS: readonly (readonly [number, number])[] = [
  [1080, 1250],
  [1360, 1460],
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

export const MikkelPaper: React.FC<{ frame: number; cam: MikkelCam }> = ({ frame, cam }) => <NealTallPaper frame={frame} cam={{...cam,x0:cam.x0 ?? W/2,y0:cam.y0 ?? H/2}} />;
export const MikkelFilmLife: React.FC<{frame:number;children?:React.ReactNode;seed?:string}> = ({frame,children}) => <NealFilmLife9x16 frame={frame}>{children}</NealFilmLife9x16>;
