import {Composition} from 'remotion';
import CoalMiningLand, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/CoalMiningLand';

// Private render entry for CoalMiningLand, so this cut renders while another
// builder owns src/Root.tsx. The continuation of PowerTheEntireUs: opens on the
// wide contiguous US with the white outline already drawn, then one push-in
// dives into the central Appalachian coalfield, which fills with the same solar
// strings and takes a "coal mining land" label. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="CoalMiningLand"
        component={CoalMiningLand}
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
