import React from 'react';
import {AbsoluteFill, Easing, Img, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {z} from 'zod';
import {backdropStyle, clamp01, LAND, runCamera} from './cheekyPintSystem';

const fontFamily = 'Sohne';
loadFont({family: fontFamily, url: staticFile('Sohne-Halbfett.otf'), weight: '600'});
export const FPS = 24;
export const DURATION = 117;
export const schema = z.object({
  ink: z.string(), accent: z.string(), backgroundSrc: z.string(),
  backgroundBlur: z.number().min(0), backgroundDim: z.number().min(0).max(1),
  beats: z.object({models: z.number().int(), stopped: z.number().int(),
    builtProducts: z.number().int(), change: z.number().int(), instantly: z.number().int()}),
});
export const defaultProps = schema.parse({
  ink: '#FFFFFF', accent: '#FFC543', backgroundSrc: 'brown-paper-backdrop.jpg',
  backgroundBlur: 16, backgroundDim: 0.68,
  beats: {models: 19, stopped: 33, builtProducts: 68, change: 85, instantly: 100},
});
type Props = z.infer<typeof schema>;
const H = 44;
const GAP = 20;
const PITCH = H + GAP;
const R = 8;
const X = 540;
const FLOOR = 1120;
const smooth = (f: number, a: number, b: number) => Easing.inOut(Easing.cubic)(clamp01((f-a)/(b-a)));
const beamWidth = (i: number) => 308 - i * 28;

const ModelProgressStops: React.FC<Props> = (props) => {
  const frame = useCurrentFrame();
  const {ink, accent, beats} = props;
  // Rising strata carry the build. Every motion is attached to a physical object.
  // When the strata stop, the same build can begin expanding across the fixed base.
  const arrival = [0, 11, 22];
  const liftAt = (at: number) => arrival.reduce((height,t) =>
    height + PITCH * Easing.out(Easing.cubic)(clamp01((Math.min(at, beats.stopped)-t)/10)),0);
  const surface = FLOOR - liftAt(frame);
  const camera = runCamera(frame, [0, 24, 46, 72, 91, 108, 117],
    [1.30, 1.26, 1.24, 1.23, 1.09, 1.015, 1.01],
    [986, 914, 876, 876, 873, 870, 870]);
  // Four blocks placed from above: an unmistakable act of construction.
  const landings = [-30, -20, 17, beats.builtProducts];
  const centreBlocks = landings.map((land,i) => {
    const released = land - 21;
    const fall = smooth(frame,released,land);
    const age = Math.max(0,frame-land);
    const settle = age < 12 ? Math.sin(age/12*Math.PI*2)*3*Math.exp(-age/5) : 0;
    // Each level follows the moving base with a slight lag, then settles square.
    const carried = liftAt(frame) - liftAt(frame-i*1.1);
    const tilt = (i % 2 === 0 ? -1 : 1) * Math.min(2,carried*0.10);
    return {i, released, land, w:beamWidth(i), y:surface-(i+1)*PITCH-(1-fall)*150+carried*0.4+settle, tilt,
      opacity:frame < released ? 0 : 0.9*smooth(frame,released,released+7)};
  });
  // Extensions arrive along the established beam axes, never floating into an
  // unrelated arrangement. Two levels extend in opposite directions, then balance.
  const wings = [
    {level:0, side:-1, width:194, delay:0},
    {level:2, side:1, width:210, delay:1},
    {level:0, side:1, width:194, delay:2},
    {level:2, side:-1, width:210, delay:3},
  ];
  return (
    <AbsoluteFill style={{backgroundColor:'#2B2118', fontFamily, overflow:'hidden'}}>
      <Img src={staticFile(props.backgroundSrc)} style={backdropStyle(frame,camera.cy,camera.k,986,props.backgroundBlur,props.backgroundDim)} />
      <AbsoluteFill style={{filter:'drop-shadow(0 2px 9px rgba(0,0,0,0.22))'}}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920">
          <g transform={`translate(${540-X*camera.k} ${960-camera.cy*camera.k}) scale(${camera.k})`}>
            {/* Successive model generations become quiet sediment under the live surface. */}
            {[0,1,2,3].map(i => {
              const p=i===0 ? 1 : Easing.out(Easing.cubic)(clamp01((Math.min(frame,beats.stopped)-arrival[i-1])/10));
              const depth = Math.max(0,liftAt(frame)/PITCH-i);
              const h=H-Math.min(2,depth)*7;
              const width=388+(3-i)*16;
              return <rect key={i} x={X-width*p/2} y={FLOOR-i*PITCH}
                width={width*p} height={h} rx={R} fill={accent}
                opacity={p*Math.max(0.1,0.92-depth*0.28)} />;
            })}
            {centreBlocks.map(b => <rect key={b.i} x={X-b.w/2} y={b.y}
              width={b.w} height={H} rx={R} fill={ink} opacity={b.opacity}
              transform={`rotate(${b.tilt} ${X} ${b.y+H/2})`} />)}
            {wings.map((wing,i) => {
              const start=beats.change+wing.delay;
              const t=clamp01((frame-start)/(beats.instantly-start));
              const p=LAND(t);
              // A new beam slides along its shelf, its bottom remaining level.
              const near=X+wing.side*(beamWidth(wing.level)/2+GAP+wing.width/2);
              const x=near+wing.side*(1-p)*80;
              const y=surface-(wing.level+1)*PITCH;
              return <rect key={i} x={x-wing.width/2} y={y}
                width={wing.width} height={H} rx={R} fill={ink}
                opacity={0.9*smooth(frame,start,start+5)} />;
            })}
          </g>
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
export default ModelProgressStops;
