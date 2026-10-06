import {Composition} from 'remotion';
import IncasEvenKnewTheAztecs, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/IncasEvenKnewTheAztecs';

// Private render entry for IncasEvenKnewTheAztecs (cut B of Sheppard_Vikings),
// so this cut renders while other builders own src/Root.tsx. Si Sheppard: "It's
// not clear to me that the Incas even knew the Aztecs existed." Dwarkesh map
// style on the shared Americas world, opaque, 1080x1920, 24 fps, 79 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="IncasEvenKnewTheAztecs"
        component={IncasEvenKnewTheAztecs}
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
