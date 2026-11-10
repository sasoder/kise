// AbassMistakeOne (abass-brushing-mistakes). Humble style transparent overlay.
// CHECK LINE: The back edges of the final molars are easy to miss.
// THE LINE: "Nummer ett längst bak på de allra sista kindtänderna"
// WORD -> FRAME (60 fps): nummer f8 · längst f64 · bak f92 · kindtänderna f224
// DURATION: sequence f315 -> f589 = 274 frames = 4.566666667s.
// MOTION: Roba's white hollow tube carries the earlier revealed stations.
// Purple flows to the next station, then the region icon and label rise in.
// Final state is static and matches the next clip's first frame exactly.
// SOURCE: Tom's edited Abass speech and approved Roba BrushingMistakes.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import AbassBrushingTube from './AbassBrushingTube';
export const FPS = 60;
export const DURATION = 274;
export const schema = z.object({});
export const defaultProps = schema.parse({});
const AbassMistakeOne: React.FC = () => {
 const frame = useCurrentFrame();
 return <AbsoluteFill><AbassBrushingTube step={1} frame={frame / 2}/></AbsoluteFill>;
};
export default AbassMistakeOne;
