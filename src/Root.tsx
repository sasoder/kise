import {Composition} from 'remotion';
import PowerTheEntireUs, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/PowerTheEntireUs';

// Joel solar clip: one 100 x 100 mile square of solar strings fills in on the
// satellite plate, one label names it, then a single pull-back drops it into
// the tracing contiguous-US outline. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="PowerTheEntireUs"
        component={PowerTheEntireUs}
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
