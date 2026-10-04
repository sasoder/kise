import {Composition} from 'remotion';
import CarvedOutOfTheAztecs, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/CarvedOutOfTheAztecs';

// Private render entry for CarvedOutOfTheAztecs (cut A of the Tlaxcala clip,
// Dwarkesh with Si Sheppard), so it renders while other builders own
// src/Root.tsx. "we want territory carved out of the Aztecs. We want our own
// fortress in Tenochtitlan after this is over." Opaque Dwarkesh map style,
// 1080x1920, 24fps, 132 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="CarvedOutOfTheAztecs"
        component={CarvedOutOfTheAztecs}
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
