// ---------------------------------------------------------------------------
// BarcaRealEagle (barca-real, cut 30). Sporttouchen overlay; original asset colours.
// CHECK LINE: The Texas answer gets a knowingly excessive American eagle reveal.
// THE LINE: "I'm from Texas bro."
// WORD -> FRAME: marker f0; "I'm" ~f1; "from" ~f6; "Texas" ~f8; "bro" ~f19.
// Word guide: current dialogue.transcript.json. Parent supplies the eagle SFX.
// DURATION: sequence frames 858..891; 30.729613198648902 -> 31.947336798595366 s.
// 34 frames at 254016000000 / 9097684646 fps, matching Premiere's frame duration.
// MOTION: A full-size bald eagle glides in from the right, reaching its perch at
// f9. It settles vertically by f12 and holds still; no scale-in, fade or exit.
// SOURCES: Real bald eagle photo by Courtney Celley/USFWS, public domain.
// https://commons.wikimedia.org/wiki/File:Bald_eagle_in_flight_(53543289441).jpg
// Sky removed with Apple Vision foreground mask and blue-edge alpha cleanup.
// Bird RGB pixels are retained, not AI-regenerated.
// No text or numerical claims. All wings remain visible at rest below captions.
// ---------------------------------------------------------------------------
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';

export const FPS = 254016000000 / 9097684646;
export const DURATION = 34;
export const schema = z.object({
  transparent: z.boolean(),
  backdrop: z.enum(['none', 'grey']),
});
export const defaultProps = schema.parse({transparent: true, backdrop: 'none'});

const BG = '#0B0A12';
const GLOW = 'radial-gradient(900px 900px at 540px 1400px, rgba(82,14,241,0.18) 0%, rgba(82,14,241,0) 70%)';
const clamped = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const BarcaRealEagle: React.FC<z.infer<typeof schema>> = ({transparent, backdrop}) => {
  const frame = useCurrentFrame();
  const y = frame <= 9
    ? interpolate(frame, [0, 9], [1530, 1478], {...clamped, easing: Easing.out(Easing.cubic)})
    : interpolate(frame, [9, 12], [1478, 1485], {...clamped, easing: Easing.inOut(Easing.quad)});

  return (
    <AbsoluteFill style={{
      overflow: 'hidden',
      backgroundColor: backdrop === 'grey' ? '#808080' : transparent ? undefined : BG,
      backgroundImage: !transparent && backdrop !== 'grey' ? GLOW : undefined,
    }}>
      <Img
        src={staticFile('barca-real/eagle.png')}
        style={{
          position: 'absolute',
          left: interpolate(frame, [0, 9], [1430, 540], {...clamped, easing: Easing.bezier(0.1, 0.72, 0.2, 1)}) - 310,
          top: y - 220,
          width: 620,
          height: 440,
          objectFit: 'contain',
        }}
      />
    </AbsoluteFill>
  );
};

export default BarcaRealEagle;
