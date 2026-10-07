import {Composition} from 'remotion';
import GarrottedToDeathV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/GarrottedToDeathV2';

// Private render entry for GarrottedToDeathV2 (71_GarrottedToDeath, the
// rebuild): the gauntlet closes, the bar twists the three strings into one
// cord, and the gold is what is left. Opaque 1080x1920, 24 fps, 105 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="GarrottedToDeathV2"
        component={GarrottedToDeathV2}
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
