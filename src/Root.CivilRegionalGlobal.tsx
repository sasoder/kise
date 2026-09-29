import {Composition} from 'remotion';
import CivilRegionalGlobal, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/CivilRegionalGlobal';

// Private render entry for CivilRegionalGlobal (the Korea 1950 world pair, one global clock
// in generated/components/worldCamera.ts). Opaque, 1080x1920, 24 fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="CivilRegionalGlobal"
        component={CivilRegionalGlobal}
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
