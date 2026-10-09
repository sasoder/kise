import {Composition} from 'remotion';
import ClosedWorldsTide, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ClosedWorldsTide';

// Private render entry for ClosedWorldsTide (Si Sheppard, "Texcoco"; delivered
// as 38_ClosedWorlds.mov): ONE continuous graphic through "Their closed worlds
// ... such huge numbers. And in the end, as happened in, for example, Australia
// and New Zealand ... the minority in our own country", replacing ClosedWorlds
// and MinorityInOwnCountry. Opaque map, 1080x1920, 23.976 fps, 235 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ClosedWorldsTide"
        component={ClosedWorldsTide}
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
