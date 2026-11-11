import {Composition} from 'remotion';
import GovernedBySound, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-biblical/GovernedBySound';

// Private render entry for GovernedBySound (wip-biblical; Works in Progress style): red rings of a storyteller's voice spread over his seated listeners and stop at the rim of their circle.
// Opaque 1080x1920, 24 fps, 88 frames.
export const RemotionRoot = () => (
  <Composition
    id="GovernedBySound"
    component={GovernedBySound}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
