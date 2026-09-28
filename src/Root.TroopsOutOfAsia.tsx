import {Composition} from 'remotion';
import TroopsOutOfAsia, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/TroopsOutOfAsia';

// Private render entry for TroopsOutOfAsia, so this cut renders while other
// builders own src/Root.tsx. Sarah Paine 0:50.42 "simply to transport its
// troops out of Asia back to European Russia": Dwarkesh map style, the troops'
// railway home Harbin -> Moscow as one dot column. Opaque, 1080x1920, 24 fps,
// 136 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="TroopsOutOfAsia"
        component={TroopsOutOfAsia}
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
