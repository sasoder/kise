import {Composition} from 'remotion';
import OpenAIMission, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/OpenAIMission';

// OpenAI mission lockup: the mark starts dead centre and acts as a curtain —
// it eases right while the quote slides left out from behind it, resolving as
// one row with the mark at the text's right end. Transparent overlay asset,
// 1080x1920 at 24fps.
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
