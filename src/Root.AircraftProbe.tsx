import {Composition} from 'remotion';
import AircraftProbe, {AircraftMotion, DURATION, FPS, MOTION_DURATION, defaultProps, schema} from '../generated/components/scott-aircraft-order/AircraftProbe';

// Private render entry for the scott-aircraft-order world builder's probes: AircraftProbe (one style still per
// frame) and AircraftMotion (a motion check). Opaque 1080x1920 at 23.976 fps. Render with --gl=angle.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="AircraftProbe"
        component={AircraftProbe}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition id="AircraftMotion" component={AircraftMotion} durationInFrames={MOTION_DURATION} fps={FPS} width={1080} height={1920} />
    </>
  );
};
