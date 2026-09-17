import {Composition} from 'remotion';
import LiveLoop, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/LiveLoop';

// Private render entry for LiveLoop, so this cut renders while another builder
// owns src/Root.tsx. Orange Dwarkesh on the grid background: one orange model
// dot alone, a living white loop drawn around it, and experiences riding the
// loop in and updating it on the spot. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="LiveLoop"
        component={LiveLoop}
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
