import {Composition} from 'remotion';
import TwitterToX, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/TwitterToX';

// Musk buys Twitter: the Twitter tile holds dead still, cracks along its
// corner-to-corner diagonal, splits in two, and the X tile comes up from inside
// the gap and shoves the halves out of frame. Transparent overlay asset,
// 1080x1080 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="TwitterToX"
        component={TwitterToX}
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
