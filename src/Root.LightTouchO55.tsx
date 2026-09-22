import {Composition} from 'remotion';
import LightTouchO55, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/LightTouchO55';

// Private render entry for LightTouchO55 (Noam_Punishing_AIs cut 5, O55
// rebuild): a press on each found phrase, a ceiling the caret writes under,
// hairlines by "hide". Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="LightTouchO55"
        component={LightTouchO55}
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
