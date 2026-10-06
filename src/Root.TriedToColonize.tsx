import {Composition} from 'remotion';
import TriedToColonize, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/TriedToColonize';

// Private render entry for TriedToColonize (cut D of Sheppard_Vikings), so this
// cut renders while other builders own src/Root.tsx. Si Sheppard: "they knew of
// the existence of North America and they tried to colonize the new world. Their
// numbers were too few, the local resistance was too fierce and they were forced
// out." Dwarkesh map style on the North Atlantic world, opaque, 1080x1920,
// 24fps, 198 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="TriedToColonize"
        component={TriedToColonize}
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
