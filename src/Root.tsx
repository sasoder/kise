import {Composition} from 'remotion';
import DesertSolarFill, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/DesertSolarFill';

// Four seconds, top down: a desert fills up with a real solar farm while the
// camera pushes in. Opaque 1080x1920.
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
