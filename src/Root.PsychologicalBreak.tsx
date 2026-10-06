import {Composition} from 'remotion';
import PsychologicalBreak, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/PsychologicalBreak';

// Private render entry for PsychologicalBreak (cut 2 of the Sheppard "Why
// captured emperors cooperated" strings set), so this cut renders while other
// builders own src/Root.tsx. Opens on state E1, ends on state E2. Opaque umber
// page, 1080x1920, 24 fps, 91 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="PsychologicalBreak"
        component={PsychologicalBreak}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
