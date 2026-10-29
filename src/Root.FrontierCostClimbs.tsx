import {Composition} from 'remotion';
import FrontierCostClimbs, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-gigawatt-cost/FrontierCostClimbs';

// Private render entry for FrontierCostClimbs (sam-gigawatt-cost; Cheeky Pint style (stout)): rev 3, a line graph: the amber line climbs from Llama 3.1 through Grok 3 and GPT-4.5 to Grok 4 while one pull-back widens to the whole recent climb.
// Opaque 1080x1920, 23.976 fps, 37 frames.
export const RemotionRoot = () => (
  <Composition
    id="FrontierCostClimbs"
    component={FrontierCostClimbs}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
