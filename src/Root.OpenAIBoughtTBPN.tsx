import {Composition} from 'remotion';
import OpenAIBoughtTBPN, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/OpenAIBoughtTBPN';

// Private render entry for OpenAIBoughtTBPN, so this cut renders while other
// builders own src/Root.tsx. "OpenAI bought this podcast for over 100 million
// dollars": coins drop from the OpenAI knot into the TBPN wordmark, the price
// counts to $100M+, the chain crown rises behind the wordmark. Core memory
// podcast graphic standard, opaque paper, 1080x1920, 24fps, 113 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="OpenAIBoughtTBPN"
        component={OpenAIBoughtTBPN}
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
