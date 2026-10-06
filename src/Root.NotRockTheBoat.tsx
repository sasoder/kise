import {Composition} from 'remotion';
import NotRockTheBoat, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/NotRockTheBoat';

// Private render entry for NotRockTheBoat (cut D of the strings set), so this
// cut renders while other builders own src/Root.tsx. Si Sheppard on Moctezuma:
// "beneficial for his people, but would not rock the boat so much in terms of
// Cortés's authority." Opaque engraved page, 1080x1920, 24 fps, 113 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="NotRockTheBoat"
        component={NotRockTheBoat}
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
