import {Composition} from 'remotion';
import OpenAiUpgradeSurge, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/OpenAiUpgradeSurge';

// OpenAI mark, upgraded: light gathers, surges out through the arms, and
// leaves the ink heavier. Transparent 1080x1080 overlay asset.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="OpenAiUpgradeSurge"
        component={OpenAiUpgradeSurge}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1080}
      />
    </>
  );
};
