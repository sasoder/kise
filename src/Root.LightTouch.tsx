import {Composition} from 'remotion';
import LightTouch, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/LightTouch';

// Private render entry for `Noam_Punishing_AIs` cut 5, LightTouch (in at
// 0:33.000): pressure is a press, and the text remembers it — five
// interventions, each one flattening a phrase and lowering the ceiling the
// caret writes at, until the model is writing hairlines. Opaque 1080x1920 at
// 24fps on the grid. Seven sibling cuts share this checkout, so this file and
// `src/entry.LightTouch.ts` exist instead of touching `src/Root.tsx`.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="LightTouch"
        component={LightTouch}
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
