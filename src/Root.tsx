import {Composition} from 'remotion';
import DesertSolarFill, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/DesertSolarFill';

// Five seconds, top down: a desert fills up with a real solar farm while the
// camera pushes in. The fill runs from the first frame to the last.
// Opaque 1080x1920.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="DesertSolarFill"
        component={DesertSolarFill}
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
