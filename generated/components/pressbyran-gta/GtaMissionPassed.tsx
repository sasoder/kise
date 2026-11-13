/*
 * GtaMissionPassed: the end title of the Pressbyrån GTA cut, its own layer so it can be switched off in Premiere.
 * Check: 40.474 -> 43.644 s (the last V1 clip, he heads out with the bag), transparent overlay.
 * DURATION: 43.644 - 40.474 = 3.170 s x 30000/1001 = 95 frames.
 * Motion (v2, San Andreas look of the reference): the gold title punches in big and settles over the picture, the
 * white RESPECT + rises in under it; both hold to the end of the video.
 */
import {AbsoluteFill, Easing, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {z} from 'zod';

export const FPS = 30000 / 1001;
export const DURATION = 95;

const CHUNK = 'GtaChunk';
loadFont({family: CHUNK, url: staticFile('pressbyran-gta/burbankbigcondensed_bold.otf'), weight: '700'});

const GOLD = '#e0a83a';
const INK = '#08090a';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const schema = z.object({title: z.string(), sub: z.string()});
export const defaultProps = schema.parse({title: 'MISSION PASSED!', sub: 'RESPECT +'});

const stroke = (px: number, c = INK) => {
  const s: string[] = [];
  for (let a = 0; a < 20; a++) {
    const r = (a / 20) * Math.PI * 2;
    s.push(`${(Math.cos(r) * px).toFixed(1)}px ${(Math.sin(r) * px).toFixed(1)}px 0 ${c}`);
  }
  return s.join(',');
};

const GtaMissionPassed: React.FC<z.infer<typeof schema>> = ({title, sub}) => {
  const frame = useCurrentFrame();
  const pop = spring({frame: frame - 3, fps: FPS, config: {damping: 11, stiffness: 170}});
  const scale = interpolate(pop, [0, 1], [1.9, 1]);
  const subOp = interpolate(frame, [14, 22], [0, 1], clamp);
  const subY = interpolate(frame, [14, 24], [16, 0], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 960, textAlign: 'center', opacity: Math.min(1, pop * 2),
        transform: `scale(${scale})`, fontFamily: CHUNK, fontWeight: 700, fontSize: 128, lineHeight: 1, color: GOLD,
        letterSpacing: 2, textShadow: stroke(8)}}>
        {title}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1092, textAlign: 'center', opacity: subOp,
        transform: `translateY(${subY}px)`, fontFamily: CHUNK, fontWeight: 700, fontSize: 78, lineHeight: 1,
        color: '#fff', letterSpacing: 2, textShadow: stroke(5)}}>
        {sub}
      </div>
    </AbsoluteFill>
  );
};

export default GtaMissionPassed;
