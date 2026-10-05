import {Composition} from 'remotion';
import SmashingSuccess, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/SmashingSuccess';

// Private render entry for SmashingSuccess, so this cut renders while other
// builders own src/Root.tsx. Toto Wolff / Cheeky Pint S4E01, "why Drive to
// Survive worked", cut A: "Drive to Survive has been a smashing success for
// Netflix and a big success for F1 ... brought lots of new people into the
// sport". The screen's light turns passers-by into fans who fill the F1 stand.
// Opaque Cheeky Pint S4 (stout, B1), pass 3: 9:16 1080x1920, 24fps, 169 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SmashingSuccess"
        component={SmashingSuccess}
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
