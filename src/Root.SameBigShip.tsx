import {Composition} from 'remotion';
import SameBigShip, {DURATION, FPS, defaultProps, schema} from '../generated/components/will-drone-cost/SameBigShip';
import {SurveyShipStyleFrame} from '../generated/components/kits/cheeky-pint/droneShipShared';
import {SeaShipStyleFrame} from '../generated/components/kits/cheeky-pint/droneSeaShared';

// Private render entry for SameBigShip (Cheeky Pint S4E02, Will O'Brien / Ulysses, cut 1 "1_SameBigShip", stout):
// opaque 1080x1920 at 23.976 fps. Also registers the clip's ship alone: the realistic one (droneSeaShared.tsx,
// SeaShipStyleFrame) and the stout one of the delivered set (droneShipShared.tsx, SurveyShipStyleFrame).
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SameBigShip"
        component={SameBigShip}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition id="SurveyShipStyleFrame" component={SurveyShipStyleFrame} durationInFrames={1} fps={FPS} width={1080} height={1920} />
      <Composition id="SeaShipStyleFrame" component={SeaShipStyleFrame} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    </>
  );
};
