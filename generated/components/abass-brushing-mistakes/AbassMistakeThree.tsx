// AbassMistakeThree (abass-brushing-mistakes). Humble style transparent overlay.
// CHECK LINE: The brush needs to reach the gumline.
// THE LINE: "Det sista är längs tandköttskanten"
// WORD -> FRAME (60 fps): det f3 · längs f44 · tandköttskanten f64
// DURATION: sequence f1729 -> f1890 = 161 frames = 2.683333333s.
// MOTION: Roba's white hollow tube carries the earlier revealed stations.
// Purple flows to the next station, then the region icon and label rise in.
// Final state is static and matches the next clip's first frame exactly.
// SOURCE: Tom's edited Abass speech and approved Roba BrushingMistakes.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import AbassBrushingTube from './AbassBrushingTube';
export const FPS = 60;
export const DURATION = 161;
export const schema = z.object({});
export const defaultProps = schema.parse({});
const AbassMistakeThree: React.FC = () => {
 const frame = useCurrentFrame();
 return <AbsoluteFill><AbassBrushingTube step={3} frame={frame / 2}/></AbsoluteFill>;
};
export default AbassMistakeThree;
