import {Composition} from 'remotion';
import FillThatRoom, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/FillThatRoom';

// Private render entry for FillThatRoom (cut H of the Sheppard "strings" set),
// so this cut renders while other builders own src/Root.tsx. Atahualpa under
// Pizarro's three orange strings marks the wall, the room fills with goldwork
// to his line, the strings slacken as a promise. Opaque 1080x1920, 24 fps,
// 190 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="FillThatRoom"
        component={FillThatRoom}
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
