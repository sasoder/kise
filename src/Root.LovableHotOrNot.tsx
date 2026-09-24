import {Composition} from 'remotion';
import LovableHotOrNot, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/LovableHotOrNot';

// Private render entry for LovableHotOrNot, so this cut renders while
// another builder owns src/Root.tsx. Lovable "Hot or not" temperature-slider
// card as a transparent 1080x1920 overlay at 24fps for the whole 57.989 s cut.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="LovableHotOrNot"
        component={LovableHotOrNot}
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
