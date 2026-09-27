import {Composition} from 'remotion';
import EverybodyWants, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/EverybodyWants';

// Private render entry for EverybodyWants, so this cut renders while other
// builders own src/Root.tsx. Sarah Paine on WWI war aims: one 1914 Europe +
// Africa map on one global clock (in-point 18.10 s), opaque 1080x1920, 24 fps,
// 936 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="EverybodyWants"
        component={EverybodyWants}
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
