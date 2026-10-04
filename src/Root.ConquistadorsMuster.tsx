import {Composition} from 'remotion';
import ConquistadorsMuster, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ConquistadorsMuster';

// Private render entry for ConquistadorsMuster, so this cut renders while
// other builders own src/Root.tsx. Si Sheppard on Cajamarca: "he has some
// 160, 190 conquistadors." Opaque engraved page, 1080x1920, 24fps, 91 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ConquistadorsMuster"
        component={ConquistadorsMuster}
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
