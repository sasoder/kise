/*
 * GtaMissionPassed: the end title of the Pressbyrån GTA cut, its own layer so it can be switched off in Premiere.
 * Check: 40.474 -> 43.644 s (the last V1 clip, he heads out with the bag), transparent overlay.
 * DURATION: 43.644 - 40.474 = 3.170 s x 30000/1001 = 95 frames.
 * Motion: a dark band wipes open across the upper middle, the gold title punches in big and settles, the subline
 * types under it; everything holds to the end of the video.
 */
import {AbsoluteFill, Easing, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {z} from 'zod';

export const FPS = 30000 / 1001;
export const DURATION = 95;

const CHUNK = 'GtaChunk';
loadFont({family: CHUNK, url: staticFile('pressbyran-gta/burbankbigcondensed_bold.otf'), weight: '700'});

const GOLD = '#f4c443';
const INK = '#08090a';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const schema = z.object({title: z.string(), sub: z.string()});
export const defaultProps = schema.parse({title: 'MISSION PASSED', sub: 'RESPECT +'});

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
  const band = interpolate(frame, [0, 8], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const pop = spring({frame: frame - 3, fps: FPS, config: {damping: 11, stiffness: 170}});
  const scale = interpolate(pop, [0, 1], [1.9, 1]);
  const subOp = interpolate(frame, [14, 22], [0, 1], clamp);
  const subY = interpolate(frame, [14, 24], [16, 0], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 640, height: 300, transform: `scaleY(${band})`,
        background: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.62) 22%, rgba(0,0,0,0.62) 78%, rgba(0,0,0,0) 100%)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 668, textAlign: 'center', opacity: Math.min(1, pop * 2),
        transform: `scale(${scale})`, fontFamily: CHUNK, fontWeight: 700, fontSize: 150, lineHeight: 1, color: GOLD,
        letterSpacing: 2, textShadow: stroke(8)}}>
        {title}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 838, textAlign: 'center', opacity: subOp,
        transform: `translateY(${subY}px)`, fontFamily: CHUNK, fontWeight: 700, fontSize: 70, lineHeight: 1,
        color: '#fff', letterSpacing: 2, textShadow: stroke(5)}}>
        {sub}
      </div>
    </AbsoluteFill>
  );
};

export default GtaMissionPassed;
