import {Composition} from 'remotion';
import MessyProbe, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-entertainment/MessyProbe';

// Private render entry for MessyProbe (wip-entertainment; Works in Progress style): scratch probe of messyShared.tsx (every piece of the messy variant on one page).
// Opaque 1080x1920, 24 fps, 48 frames.
export const RemotionRoot = () => (
  <Composition
    id="MessyProbe"
    component={MessyProbe}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
