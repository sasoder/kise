import {Composition} from 'remotion';
import LargerForce, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/LargerForce';

// Private render entry for LargerForce, so this cut renders while other
// builders own src/Root.tsx. Si Sheppard on Cortés: Velázquez sends, under
// Pánfilo de Narváez, a larger force than the one Cortés brought originally.
// Opaque vintage map (the shared Cortés world), 1080x1920, 24fps, 151 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="LargerForce"
        component={LargerForce}
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
