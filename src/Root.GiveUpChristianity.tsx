import {Composition} from 'remotion';
import GiveUpChristianity, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/sheppard-capture-not-kill/GiveUpChristianity';

// Private render entry for GiveUpChristianity (Si Sheppard, "Capture, not
// kill", file 83): an engraved cross-section plate; the villagers cannot haul
// the orange cross off the church because its foundations go on as orange
// roots under the whole village. Opaque umber page, 1080x1920, 23.976 fps,
// 242 frames.
export const RemotionRoot = () => {
  return (
    <Composition
      id="GiveUpChristianity"
      component={GiveUpChristianity}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
