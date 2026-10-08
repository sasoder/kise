import {Composition} from 'remotion';
import BothSides, {
  BothSidesSheet,
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/BothSides';

// Private render entry for BothSides (Si Sheppard, "Texcoco"): the passed-over
// brother walks to the Spaniards, and an orange kin bracket ties the two
// brothers across the gap between the two sides. Continues GaveTheTitle (frame
// 0 = its last frame). Opaque umber page, 1080x1920, 23.976 fps, 126 frames.
// BothSidesSheet is the review sheet of the two conquistadors.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="BothSides"
        component={BothSides}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition id="BothSidesSheet" component={BothSidesSheet} durationInFrames={1} fps={24} width={1080} height={1920} />
    </>
  );
};
