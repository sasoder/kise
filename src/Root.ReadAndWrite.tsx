import {Composition} from 'remotion';
import ReadAndWrite, {DURATION, FPS, defaultProps, schema} from '../generated/components/paul-twelve-hours/ReadAndWrite';

// Private render entry for ReadAndWrite (paul-twelve-hours; Dwarkesh 3D style): a lens reads the OpenAI code tower, then a HACKTRON panel is merged into it.
// Opaque 1080x1920, 23.976 fps, 152 frames.
export const RemotionRoot = () => (
  <Composition
    id="ReadAndWrite"
    component={ReadAndWrite}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
