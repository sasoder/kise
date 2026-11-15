import {Composition} from 'remotion';
import NotOptimallyAdapted, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-stupidest-species/NotOptimallyAdapted';

// Private render entry for NotOptimallyAdapted (rsi-stupidest-species; Dwarkesh 3D style): a push-in on the human's lit alcove while a dashed orange tip draws the far bigger occupant it was made for.
// Opaque 1080x1920, 23.976 fps, 73 frames.
export const RemotionRoot = () => (
  <Composition
    id="NotOptimallyAdapted"
    component={NotOptimallyAdapted}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
