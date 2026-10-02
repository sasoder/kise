import {Composition} from 'remotion';
import VastExpanseOfHisArmy, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/VastExpanseOfHisArmy';

// Private render entry for VastExpanseOfHisArmy, so this cut renders while
// other builders own src/Root.tsx. Si Sheppard on Atahualpa: "And then he
// proceeds to meet with Pizarro at Cajamarca with the vast expanse of his
// army." Opaque vintage local plan, 1080x1920, 24fps, 149 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="VastExpanseOfHisArmy"
        component={VastExpanseOfHisArmy}
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
