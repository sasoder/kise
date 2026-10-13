import {Composition} from 'remotion';
import OverwhelmingNumbers, {DURATION, FPS, defaultProps, schema} from '../generated/components/OverwhelmingNumbers';
import OverwhelmingNumbersDots from '../generated/components/OverwhelmingNumbersDots';
import {OverwhelmingCastSheet} from '../generated/components/overwhelmingFigures';

// Private render entry for OverwhelmingNumbers (Si Sheppard, "Conquistador
// Advantages", cut C): one pull-back off the Spanish knot (the orange horse,
// its rider, seven pikemen) to the host of cream warriors marching round it.
// Opaque umber page, 1080x1920, 23.976 fps, 89 frames. OverwhelmingNumbersDots
// is the earlier dot version, kept for reference; OverwhelmingCastSheet is the
// review sheet of the warrior variants and the men on foot.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="OverwhelmingNumbers"
        component={OverwhelmingNumbers}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition id="OverwhelmingNumbersDots" component={OverwhelmingNumbersDots} schema={schema} defaultProps={defaultProps} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
      <Composition id="OverwhelmingCastSheet" component={OverwhelmingCastSheet} durationInFrames={1} fps={24} width={1080} height={1920} />
    </>
  );
};
