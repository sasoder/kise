import {Composition} from 'remotion';
import Generations, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/Generations';

// Private render entry for Generations (cut E of Toto Wolff's "why Drive to Survive worked", Cheeky Pint
// S4E01), so this cut renders while other builders own src/Root.tsx. "From the granddaughter to the
// grandparent": the screen comes on and its light reaches the family nearest to furthest. Opaque,
// 1920x1080, 24fps, 131 frames.
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
        width={1920}
        height={1080}
      />
    </>
  );
};
