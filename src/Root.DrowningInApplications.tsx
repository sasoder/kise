import {Composition} from 'remotion';
import DrowningInApplications, {DURATION, FPS, defaultProps, schema} from '../generated/components/shruti-trailer/DrowningInApplications';

// Private render entry for DrowningInApplications (shruti-trailer, cut 53; Core memory podcast style): application sheets
// rain down and bury a desk, and a wave turns most of them into one identical OpenAI-marked form.
// Opaque 1920x1080, 23.976 fps, 140 frames.
export const RemotionRoot = () => (
  <Composition
    id="DrowningInApplications"
    component={DrowningInApplications}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
