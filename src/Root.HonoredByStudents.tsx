import {Composition} from 'remotion';
import HonoredByStudents, {DURATION, FPS, defaultProps, schema} from '../generated/components/caro-mr-moses-chant/HonoredByStudents';

// Private render entry for HonoredByStudents (caro-mr-moses-chant; the show's own NYT clipping, re-staged 9:16): the page torn under the caption, one push and tilt from the medal hand-over to HONORED BY STUDENTS at the centre of the screen, the real highlighter sweeps behind it.
// Opaque 1080x1920, 24 fps, 72 frames. Default framing 'centre' (rev 3, 19_HonoredByStudents.mov); 'faces' (rev 2) with --props='{"framing":"faces"}'; the alternate 19_HonoredByStudentsCaption.mov renders with --props='{"framing":"caption"}'.
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
