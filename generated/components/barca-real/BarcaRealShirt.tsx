// ---------------------------------------------------------------------------
// BarcaRealShirt (barca-real, cut 9). Sporttouchen overlay; original asset colours.
// CHECK LINE: The giveaway is the Barcelona GOLF shirt the presenter is wearing.
// THE LINE: "Den som är svensk ... tröja hemskickad ... hundra procent."
// WORD -> FRAME: marker f0; "svensk" ~f13; "tröja" ~f42; "hundra" ~f67.
// Word guide: current dialogue.transcript.json; garment identity confirmed by Tom.
// DURATION: sequence frames 271..374; 9.705973399573255 -> 13.430774999409486 s.
// 104 frames at 254016000000 / 9097684646 fps, matching Premiere's frame duration.
// MOTION: A full-size shirt rises from below the frame and straightens. It lands
// at f12, settles by f15 and holds still; the editor cuts away without a fade.
// SOURCES: Real product photo from the official FC Barcelona shop, supplied by
// director; jersey.png preserves the photographed garment and removes the backdrop.
// https://store.fcbarcelona.com/products/limited-edition-mens-shirt-fc-barcelona-x-golf-wang-26-27-players-edition
// No numerical claims. Native captions remain above y1190.
// ---------------------------------------------------------------------------
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';

export const FPS = 254016000000 / 9097684646;
export const DURATION = 104;
export const schema = z.object({
  transparent: z.boolean(),
  backdrop: z.enum(['none', 'grey']),
});
export const defaultProps = schema.parse({transparent: true, backdrop: 'none'});

const BG = '#0B0A12';
const GLOW = 'radial-gradient(900px 900px at 540px 1400px, rgba(82,14,241,0.18) 0%, rgba(82,14,241,0) 70%)';
const clamped = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const BarcaRealShirt: React.FC<z.infer<typeof schema>> = ({transparent, backdrop}) => {
  const frame = useCurrentFrame();
  const y = frame <= 12
    ? interpolate(frame, [0, 12], [2260, 1482], {...clamped, easing: Easing.bezier(0.18, 0.78, 0.25, 1)})
    : interpolate(frame, [12, 15], [1482, 1490], {...clamped, easing: Easing.inOut(Easing.quad)});

  return (
    <AbsoluteFill style={{
      overflow: 'hidden',
      backgroundColor: backdrop === 'grey' ? '#808080' : transparent ? undefined : BG,
      backgroundImage: !transparent && backdrop !== 'grey' ? GLOW : undefined,
    }}>
      <Img
        src={staticFile('barca-real/jersey.png')}
        style={{
          position: 'absolute',
          left: 240,
          top: y - 260,
          width: 600,
          height: 520,
          objectFit: 'contain',
          rotate: `${interpolate(frame, [0, 15], [4, 0], {...clamped, easing: Easing.out(Easing.cubic)})}deg`,
        }}
      />
    </AbsoluteFill>
  );
};

export default BarcaRealShirt;
