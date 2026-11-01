import {Composition} from 'remotion';
import AIDoesAIResearch, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-self-replicating/AIDoesAIResearch';

// Private render entry for AIDoesAIResearch (sam-self-replicating; Cheeky Pint style (stout)): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 61 frames.
export const RemotionRoot = () => (
  <Composition
    id="AIDoesAIResearch"
    component={AIDoesAIResearch}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
