import {Composition} from 'remotion';
import DriveOutOfAustin, {DURATION, FPS, defaultProps, schema} from '../generated/components/robert-johnson-ranch/DriveOutOfAustin';

// Private render entry for DriveOutOfAustin (robert-johnson-ranch; Dwarkesh 3D style): a slate sedan drives out of Austin over the real Hill Country, through a cattle guard and 22 miles of dirt road to the one orange farmhouse.
// Opaque 1080x1920, 23.976 fps, 322 frames.
export const RemotionRoot = () => (
  <Composition
    id="DriveOutOfAustin"
    component={DriveOutOfAustin}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
