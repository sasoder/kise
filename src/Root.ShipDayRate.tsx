import {Composition} from 'remotion';
import ShipDayRate, {DURATION, FPS, defaultProps, schema} from '../generated/components/ShipDayRate';

// Private render entry for ShipDayRate (Cheeky Pint S4E02, Will O'Brien / Ulysses, cut 2 "14_ShipDayRate", stout):
// opaque 1080x1920 at 23.976 fps.
export const RemotionRoot = () => {
  return (
    <Composition
      id="ShipDayRate"
      component={ShipDayRate}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
