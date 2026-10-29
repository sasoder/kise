import {Composition} from 'remotion';
import EveryCostGoesDown, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-gigawatt-cost/EveryCostGoesDown';

// Private render entry for EveryCostGoesDown (sam-gigawatt-cost; Cheeky Pint style (stout)): energy, chips and the supply chain in one row on the apron, each cost column draining lower in turn.
// Opaque 1080x1920, 23.976 fps, 93 frames.
export const RemotionRoot = () => (
  <Composition
    id="EveryCostGoesDown"
    component={EveryCostGoesDown}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
