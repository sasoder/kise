import {Composition} from 'remotion';
import BillGEmail, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/BillGEmail';

// the living caret — an email compose card typed live on the beats, the chain
// colours smearing behind the caret. 0:09.519 -> 0:13.740 (+24 frame tail).
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="BillGEmail"
        component={BillGEmail}
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
