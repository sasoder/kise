import {Composition} from 'remotion';
import FilteringPipeline, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/FilteringPipeline';

// Private render entry for FilteringPipeline, so this cut renders while another
// builder owns src/Root.tsx. Orange Dwarkesh on the grid background: a stream of
// deployment data falls through four gates and what survives builds the model.
// Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="FilteringPipeline"
        component={FilteringPipeline}
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
