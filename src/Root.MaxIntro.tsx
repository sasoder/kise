import {Composition} from 'remotion';
import MaxIntro, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/MaxIntro';

// Private render entry for MaxIntro, so this cut renders while another
// builder owns src/Root.tsx. Lovable "Full Stack Fika" freeze-frame intro of
// Max: opaque 1080x1080 at 24fps, 162 frames (6.75 s).
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="MaxIntro"
        component={MaxIntro}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1080}
      />
    </>
  );
};
