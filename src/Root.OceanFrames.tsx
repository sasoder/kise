import {Composition} from 'remotion';
import OceanFrames, {
  DURATION,
  FPS,
  MOTION_DURATION,
  OceanMotion,
  defaultProps,
  schema,
} from '../generated/components/OceanFrames';

// Private render entry for the Ulysses underwater world's style frames (oceanShared.tsx), so it
// renders while other builders own src/Root.tsx. Cheeky Pint S4E02 (Will O'Brien, Ulysses).
// OceanFrames: four stills by frame range (F1 f0-23, F2 f24-47, F3 f48-71, F4 f72-95).
// OceanMotion: 72 f, F1 -> F3 with one slow camera move.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="OceanFrames"
        component={OceanFrames}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="OceanMotion"
        component={OceanMotion}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={MOTION_DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
