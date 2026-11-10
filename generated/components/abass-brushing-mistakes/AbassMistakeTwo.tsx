// AbassMistakeTwo (abass-brushing-mistakes). Humble style transparent overlay.
// CHECK LINE: The inside of the front teeth needs its own brushing angle.
// THE LINE: "Nummer två insidan av framtänderna"
// WORD -> FRAME (60 fps): nummer f4 · insidan f67 · framtänderna f146
// DURATION: sequence f1211 -> f1396 = 185 frames = 3.083333333s.
// MOTION: Roba's white hollow tube carries the earlier revealed stations.
// Purple flows to the next station, then the region icon and label rise in.
// Final state is static and matches the next clip's first frame exactly.
// SOURCE: Tom's edited Abass speech and approved Roba BrushingMistakes.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import AbassBrushingTube from './AbassBrushingTube';
export const FPS = 60;
export const DURATION = 185;
export const schema = z.object({});
export const defaultProps = schema.parse({});
const AbassMistakeTwo: React.FC = () => {
 const frame = useCurrentFrame();
 return <AbsoluteFill><AbassBrushingTube step={2} frame={frame / 2}/></AbsoluteFill>;
};
export default AbassMistakeTwo;
