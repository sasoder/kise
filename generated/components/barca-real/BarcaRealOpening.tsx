// BarcaRealOpening (barca-real, cut 2). Sporttouchen overlay, 1080x1920.
// CHECK LINE: Sweden is the setting; Real Madrid versus Barcelona is the matchup.
// THE LINE / CUES: Swedish people, then El Clásico (director's cue transcription).
// WORD -> FRAME: flag begins f0 (editable); El Clásico logos land f78 (MMS: El 5.6104s, Clásico 5.7507s).
// DURATION: (7.4137878 - 2.9368626) * (254016000000 / 9097684646) = 125 frames.
// MOTION: The Swedish flag rises into a local mask. As the real team crests slide
// into the foreground over twelve frames, the flag blurs and dims behind them.
// The transparent overlay then holds still to the editorial cut.
// SOURCES: Tom's existing Sweden.png, barcelona.png and real madrid.webp assets;
// actual colours and blur specifically requested, overriding default style limits.
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';

export const FPS = 254016000000 / 9097684646;
export const DURATION = 125;
export const FLAG_ENTER_FRAME = 0;
export const LOGOS_LAND_FRAME = 78;
export const schema = z.object({
  transparent: z.boolean(),
  backdrop: z.enum(['none', 'grey']),
  flagEnterFrame: z.number(),
  logosLandFrame: z.number(),
});
export const defaultProps = schema.parse({transparent: true, backdrop: 'none', flagEnterFrame: FLAG_ENTER_FRAME, logosLandFrame: LOGOS_LAND_FRAME});
const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const EASE = Easing.bezier(0.2, 0.8, 0.2, 1);
const BG = '#0B0A12';
const GLOW = 'radial-gradient(900px 900px at 540px 1400px, rgba(82,14,241,0.18) 0%, rgba(82,14,241,0) 70%)';

const BarcaRealOpening: React.FC<z.infer<typeof schema>> = ({transparent, backdrop, flagEnterFrame, logosLandFrame}) => {
  const f = useCurrentFrame();
  const entry = interpolate(f, [flagEnterFrame, flagEnterFrame + 12], [0, 1], {...CLAMP, easing: EASE});
  const reveal = interpolate(f, [logosLandFrame - 12, logosLandFrame], [0, 1], {...CLAMP, easing: EASE});
  const ground = backdrop === 'grey' ? {backgroundColor: '#888888'} : transparent ? {} : {backgroundColor: BG, backgroundImage: GLOW};
  return <AbsoluteFill style={ground}>
    <div style={{position: 'absolute', left: 120, top: 1280, width: 840, height: 460, overflow: 'hidden'}}>
      <Img src={staticFile('barca-real/opening-sweden.png')} style={{position: 'absolute', left: 150, top: 31 + (1 - entry) * 460, width: 540, height: 337.5, opacity: 1 - reveal * 0.36, filter: `blur(${reveal * 7}px) brightness(${1 - reveal * 0.17})`}} />
      <Img src={staticFile('barca-real/opening-real-madrid.webp')} style={{position: 'absolute', left: 230 - 96.7742 - (1 - reveal) * 420, top: 70, width: 193.5484, height: 260, objectFit: 'contain'}} />
      <Img src={staticFile('barca-real/opening-barcelona.png')} style={{position: 'absolute', left: 610 - 128.2227 + (1 - reveal) * 450, top: 70, width: 256.4453, height: 260, objectFit: 'contain'}} />
    </div>
  </AbsoluteFill>;
};
export default BarcaRealOpening;
