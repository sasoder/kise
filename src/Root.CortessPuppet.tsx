import {Composition} from 'remotion';
import CortessPuppet, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/CortessPuppet';

// Private render entry for CortessPuppet (cut C of the "strings" set), so this
// cut renders while other builders own src/Root.tsx. Si Sheppard on Moctezuma:
// "and become essentially, willingly, Cortés's puppet". Opaque umber page,
// 1080x1920, 24 fps, 69 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="CortessPuppet"
        component={CortessPuppet}
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
