import {Composition} from 'remotion';
import GarrottedToDeath, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/GarrottedToDeath';

// Private render entry for GarrottedToDeath (file 71_GarrottedToDeath, round 2
// of the Sheppard "Why captured emperors cooperated" strings set), so this cut
// renders while other builders own src/Root.tsx. Opens on FillThatRoom's end
// state, ends on the gold. Opaque umber page, 1080x1920, 24 fps, 105 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="GarrottedToDeath"
        component={GarrottedToDeath}
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
