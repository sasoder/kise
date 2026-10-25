// BarcaRealPrediction (barca-real, cut34). Sporttouchen overlay,1080x1920.
// CHECK LINE: The Barcelona supporter pauses to think before answering.
// THE LINE / CUES: Barcelona ... thinking pause (director's cue transcription).
// WORD -> FRAME: Barcelona crest f0–12; real loading asset f38–71, gone at f72.
// DURATION: (39.3253092 - 34.5976764) * (254016000000 / 9097684646) =132frames.
// MOTION: Preserve the crest's upward entry. During the pause, play Tom's actual
// dotted Loading Youtube asset, keyed from green without recreating its shapes.
// At the incoming V1 cut, remove loading and hold the crest to the end. No score.
// SOURCES: Tom's barcelona.png and PERMANENT ASSETS/VISUAL/Loading Youtube.mp4.
// The latter's30fps source frames are cropped/keyed by bakeLoadingYoutube.py.
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
export const FPS = 254016000000 / 9097684646;
export const DURATION = 132;
export const LOADING_START_FRAME = 38;
export const LOADING_END_FRAME = 72;
export const schema = z.object({transparent: z.boolean(), backdrop: z.enum(['none', 'grey']), loadingStartFrame: z.number(), loadingEndFrame: z.number()});
export const defaultProps = schema.parse({transparent: true, backdrop: 'none', loadingStartFrame: LOADING_START_FRAME, loadingEndFrame: LOADING_END_FRAME});
const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const EASE = Easing.bezier(0.2, 0.8, 0.2, 1);
const BG = '#0B0A12';
const GLOW = 'radial-gradient(900px 900px at 540px 1400px, rgba(82,14,241,0.18) 0%, rgba(82,14,241,0) 70%)';
const BarcaRealPrediction: React.FC<z.infer<typeof schema>> = ({transparent, backdrop, loadingStartFrame, loadingEndFrame}) => {
  const f = useCurrentFrame();
  const entry = interpolate(f, [0, 12], [0, 1], {...CLAMP, easing: EASE});
  const loading = f >= loadingStartFrame && f < loadingEndFrame;
  const sourceFrame = Math.max(0, Math.min(36, Math.floor((f - loadingStartFrame) * 30 / FPS)));
  const ground = backdrop === 'grey' ? {backgroundColor: '#888888'} : transparent ? {} : {backgroundColor: BG, backgroundImage: GLOW};
  return <AbsoluteFill style={ground}>
    <div style={{position: 'absolute', left: 200, top: 1265, width: 680, height: 480, overflow: 'hidden'}}>
      <Img src={staticFile('barca-real/opening-barcelona.png')} style={{position: 'absolute', left: 192.0508, top: 15 + (1 - entry) * 480, width: 295.8984, height: 300, objectFit: 'contain'}} />
      {loading ? <Img src={staticFile(`barca-real/loading-youtube/frame-${String(sourceFrame).padStart(3, '0')}.png`)} style={{position: 'absolute', left: 250, top: 75, width: 180, height: 180}} /> : null}
    </div>
  </AbsoluteFill>;
};
export default BarcaRealPrediction;
