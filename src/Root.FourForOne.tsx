import {Composition} from 'remotion';
import FourForOne, {DURATION, FPS, defaultProps, schema} from '../generated/components/FourForOne';

// Private render entry for FourForOne (Si Sheppard, "Capture, not kill"): four
// Totonac captives on one pan of an orange beam balance, one Chichimec on the
// other; the scale is hoisted and hangs level, and the Chichimec heaves against
// his bonds. Opaque umber page, 1080x1920, 23.976 fps, 146 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="FourForOne"
        component={FourForOne}
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
