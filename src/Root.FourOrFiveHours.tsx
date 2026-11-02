import {Composition} from 'remotion';
import FourOrFiveHours, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-victorians/FourOrFiveHours';

// Private render entry for FourOrFiveHours (wip-victorians; Works in Progress style): a real pocket watch whose red-inked dial winds back from a whole 996 day to a five-hour wedge.
// Opaque 1080x1920, 24 fps, 97 frames.
export const RemotionRoot = () => (
  <Composition
    id="FourOrFiveHours"
    component={FourOrFiveHours}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
