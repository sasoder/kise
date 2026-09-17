import {Composition} from 'remotion';
import HiveMind, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/HiveMind';

// Private render entry for HiveMind, so this cut renders while other builders
// own src/Root.tsx. It stands in MillionsOfYears' world: frame 0 is that cut's
// frame 219 to the pixel, and the six kinds of work then wire themselves into
// one mind. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HiveMind"
        component={HiveMind}
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
