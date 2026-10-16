import {Composition} from 'remotion';
import CaptivesToTenochtitlan, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/sheppard-capture-not-kill/CaptivesToTenochtitlan';

// Private render entry for CaptivesToTenochtitlan (Si Sheppard, "Capture, not
// kill", file 53): an orange warrior leads a bound captive to the foot of the
// great temple's stair and his furled feather back-standard opens. Opaque umber
// page, 1080x1920, 23.976 fps, 126 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="CaptivesToTenochtitlan"
        component={CaptivesToTenochtitlan}
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
