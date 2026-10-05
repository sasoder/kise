import {Composition} from 'remotion';
import Generations, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/Generations';

// Private render entry for Generations (cut E of Toto Wolff's "why Drive to Survive worked", Cheeky Pint
// S4E01), so this cut renders while other builders own src/Root.tsx. "From the granddaughter to the
// grandparent": seen from behind, the screen comes on and its light falls on the family. Opaque,
// 1080x1920 (9:16), 24fps, 131 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="Generations"
        component={Generations}
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
