import {Composition} from 'remotion';
import HonoredByStudents, {DURATION, FPS, defaultProps, schema} from '../generated/components/caro-mr-moses-chant/HonoredByStudents';

// Private render entry for HonoredByStudents (caro-mr-moses-chant; the show's own NYT clipping, re-staged 9:16): a gentle push on Moses, the student and the medal, the real highlighter sweeps behind HONORED BY STUDENTS.
// Opaque 1080x1920, 24 fps, 72 frames. Default framing 'faces'; the alternate 19_HonoredByStudentsCaption.mov renders with --props='{"framing":"caption"}'.
export const RemotionRoot = () => (
  <Composition
    id="HonoredByStudents"
    component={HonoredByStudents}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
