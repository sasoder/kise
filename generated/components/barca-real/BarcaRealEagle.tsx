// ---------------------------------------------------------------------------
// BarcaRealEagle (barca-real, cut 30). Sporttouchen overlay; original asset colours.
// CHECK LINE: The Texas answer gets a knowingly excessive American eagle reveal.
// THE LINE: "I'm from Texas bro."
// WORD -> FRAME: marker f0; "I'm" ~f1; "from" ~f6; "Texas" ~f8; "bro" ~f19.
// Word guide: current dialogue.transcript.json. Parent supplies the eagle SFX.
// DURATION: sequence frames 858..891; 30.729613198648902 -> 31.947336798595366 s.
// 34 frames at 254016000000 / 9097684646 fps, matching Premiere's frame duration.
// MOTION: The whole full-size bird follows one 18-frame eased arc from beyond
// the right edge, banking gently from 7 degrees to level. It starts at rest,
// accelerates gradually, then eases into the original centre (540, 1485) and
// holds to f33. No image wrapper clips the wing, and no opacity/scale pop.
// Revised 2026-10-25: old f1 jumped ~490 px; ease-in-out now starts at ~5 px.
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
  // A symmetric ease makes the first visible feather travel only a few pixels.
  // Use the same progress for translation and banking: no independent resets.
  const travel = interpolate(frame, [0, 18], [0, 1], {
    ...clamped,
    easing: Easing.bezier(0.42, 0, 0.58, 1),
  });
  const x = 1400 - 860 * travel;
  const y = (1 - travel) ** 2 * 1540
    + 2 * (1 - travel) * travel * 1430
    + travel ** 2 * 1485;
  const height = 620 * 749 / 1870;


  return (
    <AbsoluteFill style={{
      backgroundColor: backdrop === 'grey' ? '#808080' : transparent ? undefined : BG,
      backgroundImage: !transparent && backdrop !== 'grey' ? GLOW : undefined,
    }}>
      <Img
        src={staticFile('barca-real/eagle.png')}
        style={{
          position: 'absolute',
          left: x - 310,
          top: y - height / 2,
          width: 620,
          height,
          rotate: `${7 * (1 - travel)}deg`,
          transformOrigin: 'center center',
        }}
      />
    </AbsoluteFill>
  );
};

export default BarcaRealEagle;
