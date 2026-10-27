import {Composition} from 'remotion';
import SCurveGuy, {DURATION, FPS, defaultProps, schema} from '../generated/components/neal-stephenson-trailer/SCurveGuy';
import {NEAL_PROBE_DURATION, NealProbe} from '../generated/components/neal-stephenson-trailer/nealShared';

// Private render entry for SCurveGuy (neal-stephenson-trailer; Core memory podcast style): one graph on the squared
// paper, the exponential rockets off the top and the S-curve peels off it into a crowned plateau.
// Opaque 1920x1080, 23.976 fps, 99 frames. Also registers NealProbe, the probe of the clip's shared module.
export const RemotionRoot = () => (
  <>
    <Composition
      id="SCurveGuy"
      component={SCurveGuy}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1920}
      height={1080}
    />
    <Composition id="NealProbe" component={NealProbe} durationInFrames={NEAL_PROBE_DURATION} fps={FPS} width={1920} height={1080} />
  </>
);
