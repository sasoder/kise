import {Composition} from 'remotion';
import FormatWorks, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/FormatWorks';

// Private render entry for FormatWorks, so this cut renders while other
// builders own src/Root.tsx. Toto Wolff / Cheeky Pint S4E01, "why does the
// format work particularly well for F1": one pull-out from the lit DTS screen
// to three identical screens, only F1's lit. Opaque, 1920x1080, 24fps, 73 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="FormatWorks"
        component={FormatWorks}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
