import {Composition} from 'remotion';
import ShipDayRateV2, {DURATION, FPS, defaultProps, schema} from '../generated/components/will-drone-cost/ShipDayRateV2';

// Private render entry for ShipDayRateV2 (Cheeky Pint S4E02, Will O'Brien / Ulysses, cut 2 "14_ShipDayRateV2", realistic ocean look; cold-review loop V2):
// opaque 1080x1920 at 23.976 fps.
export const RemotionRoot = () => {
  return (
    <Composition
      id="ShipDayRateV2"
      component={ShipDayRateV2}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
