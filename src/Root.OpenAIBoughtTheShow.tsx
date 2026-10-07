import {Composition} from 'remotion';
import OpenAIBoughtTheShow, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/OpenAIBoughtTheShow';

// Private render entry for OpenAIBoughtTheShow (TBPN 03 narrated, 21.375 s ->
// 25.750 s): money runs down from the OpenAI mark, the show docks into it.
// Opaque paper, 1080x1920, 24fps, 105 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="OpenAIBoughtTheShow"
        component={OpenAIBoughtTheShow}
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
