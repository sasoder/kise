import {Composition} from 'remotion';
import TheseConquests, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/TheseConquests';

// Private render entry for TheseConquests (cut J, the opening of the Sheppard
// "strings" set), so this cut renders while other builders own src/Root.tsx.
// The map from Mexico to Peru: two empires take form, their emperors rise on
// the capitals, a gauntlet takes each by one orange string. Opaque 1080x1920,
// 24 fps, 84 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="TheseConquests"
        component={TheseConquests}
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
