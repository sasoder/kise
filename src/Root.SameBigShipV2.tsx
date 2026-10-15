import {Composition} from 'remotion';
import SameBigShipV2, {DURATION, FPS, defaultProps, schema} from '../generated/components/SameBigShipV2';

// Private render entry for SameBigShipV2 (improvement loop on the delivered 1_SameBigShip, Cheeky Pint S4E02,
// Will O'Brien / Ulysses): opaque 1080x1920 at 23.976 fps.
export const RemotionRoot = () => {
  return (
    <Composition
      id="SameBigShipV2"
      component={SameBigShipV2}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
