import {Composition} from 'remotion';
import HundredAgainstHundredThousand, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/HundredAgainstHundredThousand';

// Private render entry for HundredAgainstHundredThousand, so this cut renders
// while other builders own src/Root.tsx. Si Sheppard on Pizarro at Cajamarca:
// "100 something against almost 100,000. What is astonishing is that these 100
// conquistadors kill close to 10,000 of the enemy. They suffer zero
// casualties. This is the first encounter." Opaque engraved plan, 1080x1920,
// 24fps, 232 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HundredAgainstHundredThousand"
        component={HundredAgainstHundredThousand}
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
