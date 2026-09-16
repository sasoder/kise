import {Composition} from 'remotion';
import OpenAIMission, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/OpenAIMission';

// OpenAI mission lockup: the mark starts dead centre, eases right onto the
// text block's right edge, and the quote wipes in underneath on the same
// frames. Transparent overlay asset, 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="OpenAIMission"
        component={OpenAIMission}
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
