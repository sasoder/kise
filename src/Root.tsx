import {Composition} from 'remotion';
import ChangingUnderYou, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ChangingUnderYou';

// dario - always the first day — "the technology is changing under you".
export const RemotionRoot = () => {
  return (
    <>
      {/* 0:08.080 -> 0:12.419 */}
      <Composition
        id="ChangingUnderYou"
        component={ChangingUnderYou}
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
