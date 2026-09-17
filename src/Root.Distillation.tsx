import {Composition} from 'remotion';
import Distillation, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/Distillation';

// Private render entry for Distillation, so this cut renders while another
// builder owns src/Root.tsx. Orange Dwarkesh on the grid background: a person
// pings a big orange model wrapped in its deployment data, a fraction of that
// data comes down the wire into an empty ring, and the ring's contents collapse
// into a new model. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="Distillation"
        component={Distillation}
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
