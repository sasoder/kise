import {Composition} from 'remotion';
import OnlyDivergenceV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/OnlyDivergenceV2';

// Private render entry for OnlyDivergenceV2 (cut C, second take, of the clip
// Sheppard_Vikings), so this cut renders while other builders own
// src/Root.tsx. The clock runs backwards on the Americas map: the year readout
// counts down from 1532 and the orange chain retracts. Opaque, 1080x1920,
// 24fps, 141 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="OnlyDivergenceV2"
        component={OnlyDivergenceV2}
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
