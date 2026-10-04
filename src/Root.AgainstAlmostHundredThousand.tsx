import {Composition} from 'remotion';
import AgainstAlmostHundredThousand, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/AgainstAlmostHundredThousand';

// Private render entry for AgainstAlmostHundredThousand, so this cut renders
// while other builders own src/Root.tsx. Si Sheppard on Cajamarca: "100
// something against almost 100,000 ... kill close to 10,000 of the enemy. They
// suffer zero casualties. This is the first encounter." Opaque engraved page,
// 1080x1920, 24fps, 232 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="AgainstAlmostHundredThousand"
        component={AgainstAlmostHundredThousand}
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
