// BarcaRealPrediction (barca-real, cut 34). Sporttouchen overlay, 1080x1920.
// CHECK LINE: A Barcelona supporter thinks, then predicts five–two.
// THE LINE / CUES: Barcelona ... five–two (director's cue transcription).
// WORD -> FRAME: Barcelona crest f0–12; loading begins f38; 5–2 lands f72 (V1 cut 37.176385s; MMS five 37.1829s).
// DURATION: (39.3253092 - 34.5976764) * (254016000000 / 9097684646) = 132 frames.
// MOTION: A crest slides up. A YouTube-like loading arc turns over it while
// the speaker considers the answer, then clears as the score rises into place.
// No result claim: this is the speaker's prediction. Static final hold, no fade.
// SOURCES: Tom's existing barcelona.png. 5–2 is the spoken prediction in the brief.
import React from 'react';
import {loadFont} from '@remotion/fonts';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
const fontFamily = 'MADETommySoft';
loadFont({family: fontFamily, url: staticFile('MADETommySoft-ExtraBold.otf'), weight: '800'});
loadFont({family: fontFamily, url: staticFile('MADETommySoft-Medium.otf'), weight: '500'});
export const FPS = 254016000000 / 9097684646;
export const DURATION = 132;
export const LOADING_START_FRAME = 38;
export const SCORE_REVEAL_FRAME = 72;
export const schema = z.object({transparent: z.boolean(), backdrop: z.enum(['none', 'grey']), loadingStartFrame: z.number(), scoreRevealFrame: z.number()});
export const defaultProps = schema.parse({transparent: true, backdrop: 'none', loadingStartFrame: LOADING_START_FRAME, scoreRevealFrame: SCORE_REVEAL_FRAME});
const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const EASE = Easing.bezier(0.2, 0.8, 0.2, 1);
const BG = '#0B0A12';
const GLOW = 'radial-gradient(900px 900px at 540px 1400px, rgba(82,14,241,0.18) 0%, rgba(82,14,241,0) 70%)';
const BarcaRealPrediction: React.FC<z.infer<typeof schema>> = ({transparent, backdrop, loadingStartFrame, scoreRevealFrame}) => {
  const f = useCurrentFrame();
  const entry = interpolate(f, [0, 12], [0, 1], {...CLAMP, easing: EASE});
  const score = interpolate(f, [scoreRevealFrame - 8, scoreRevealFrame], [0, 1], {...CLAMP, easing: EASE});
  const loadOpacity = interpolate(f, [loadingStartFrame, loadingStartFrame + 4, scoreRevealFrame - 8, scoreRevealFrame - 4], [0, 1, 1, 0], CLAMP);
  const pop = interpolate(f, [scoreRevealFrame - 8, scoreRevealFrame - 3, scoreRevealFrame + 3], [1, 1.04, 1], CLAMP);
  const ground = backdrop === 'grey' ? {backgroundColor: '#888888'} : transparent ? {} : {backgroundColor: BG, backgroundImage: GLOW};
  return <AbsoluteFill style={ground}>
    <div style={{position: 'absolute', left: 200, top: 1265, width: 680, height: 480, overflow: 'hidden'}}>
      <Img src={staticFile('barca-real/opening-barcelona.png')} style={{position: 'absolute', left: 192.0508, top: 15 + (1 - entry) * 480, width: 295.8984, height: 300, objectFit: 'contain'}} />
      <div style={{position: 'absolute', left: 270, top: 95, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(0,0,0,0.72)', opacity: loadOpacity}}>
        <svg viewBox="0 0 140 140" style={{width: 140, height: 140, rotate: `${(f - loadingStartFrame) * 12 - 90}deg`}}>
          <circle cx="70" cy="70" r="44" fill="none" stroke="#FFFFFF" strokeOpacity="0.2" strokeWidth="8" />
          <circle cx="70" cy="70" r="44" fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" strokeDasharray="198 79" />
        </svg>
      </div>
      <div style={{position: 'absolute', left: 60, top: 276, width: 560, height: 190, overflow: 'hidden'}}>
        <div style={{position: 'absolute', inset: 0, textAlign: 'center', fontFamily, fontWeight: 800, fontSize: 190, lineHeight: 1, letterSpacing: '-0.02em', marginRight: '-0.02em', translate: `0 ${(1 - score) * 190}px`, scale: pop}}>
          <div style={{position: 'absolute', inset: 0, color: 'transparent', WebkitTextStroke: '8px #000000'}}>5–2</div>
          <div style={{position: 'absolute', inset: 0, color: '#FFFFFF'}}>5–2</div>
        </div>
      </div>
    </div>
  </AbsoluteFill>;
};
export default BarcaRealPrediction;
