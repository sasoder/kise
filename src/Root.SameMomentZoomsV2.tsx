import {Composition} from 'remotion';
import SameMomentZoomsV2, {DURATION, FPS, defaultProps, schema} from '../generated/components/sarah-pearl-harbor/SameMomentZoomsV2';

// Private render entry for SameMomentZoomsV2 (Sarah Paine, Pearl Harbor clip,
// cold-review V2 of 88_SameMoment_Zooms_SP): gentle place-by-place zooms in the
// spoken order; every strike lands on its word and stays lit, so the earlier marks
// keep burning in every later frame. Dwarkesh map style, PACIFIC world of the Pearl
// kit. Opaque, 1080x1920, 24 fps, 268 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SameMomentZoomsV2"
        component={SameMomentZoomsV2}
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
