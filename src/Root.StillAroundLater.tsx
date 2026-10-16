import {Composition} from 'remotion';
import StillAroundLater, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/sarah-death-ground/StillAroundLater';

// Private render entry for StillAroundLater (Sarah Paine, "Death ground: why
// regime change is brutal"): a peace table in side elevation, the cream general
// and the orange king kneeling across the bamboo-slip treaty; the camera drifts
// over the king's shoulder as his host rises over the ridge behind him.
// Opaque umber page, 1080x1920, 24 fps, 235 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="StillAroundLater"
        component={StillAroundLater}
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
