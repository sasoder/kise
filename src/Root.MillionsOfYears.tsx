import {Composition} from 'remotion';
import MillionsOfYears, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/MillionsOfYears';

// Private render entry for MillionsOfYears, so this cut renders while another
// builder owns src/Root.tsx. Orange Dwarkesh on the grid background: one orange
// core pours instances out along six lanes into six kinds of work, and the ring
// around them is the economy. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="MillionsOfYears"
        component={MillionsOfYears}
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
