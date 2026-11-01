import {Composition} from 'remotion';
import OnlyGoesOneWay, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-self-replicating/OnlyGoesOneWay';

// Private render entry for OnlyGoesOneWay (sam-self-replicating; Cheeky Pint style (stout)): OpenAI tile, tag lands, crowd rises, amber climbs the glass..
// Opaque 1080x1920, 23.976 fps, 119 frames.
export const RemotionRoot = () => (
  <Composition
    id="OnlyGoesOneWay"
    component={OnlyGoesOneWay}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
