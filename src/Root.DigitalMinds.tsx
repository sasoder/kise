import {Composition} from 'remotion';
import DigitalMinds, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/DigitalMinds';

// Private render entry for DigitalMinds, so this cut renders while another
// builder owns src/Root.tsx. Orange Dwarkesh on the grid background: experience
// streams in from everywhere and gathers into a cloud, the AI companies' marks
// burst out of it, and each takes its own share of the cloud. Opaque 1080x1920
// at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="DigitalMinds"
        component={DigitalMinds}
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
