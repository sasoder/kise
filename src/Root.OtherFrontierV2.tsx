import {Composition} from 'remotion';
import OtherFrontierV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/will-mars-ocean/OtherFrontierV2';

// Private render entry for OtherFrontierV2 (improvement loop; Cheeky Pint S4E02, Will O'Brien / Ulysses), so this cut
// renders while other builders own src/Root.tsx. Opaque 1080x1920 at 23.976 fps, 157 frames
// (145 + a 12-frame hold handle).
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="OtherFrontierV2"
        component={OtherFrontierV2}
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
