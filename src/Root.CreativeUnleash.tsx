import {Composition} from 'remotion';
import CreativeUnleash, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-kids-mind-blown/CreativeUnleash';

// Private render entry for CreativeUnleash (sam-kids-mind-blown; Cheeky Pint style (stout)): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 136 frames.
export const RemotionRoot = () => (
  <Composition
    id="CreativeUnleash"
    component={CreativeUnleash}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
