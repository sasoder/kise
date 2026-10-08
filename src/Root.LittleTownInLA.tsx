import {Composition} from 'remotion';
import LittleTownInLA, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/LittleTownInLA';

// Private render entry for LittleTownInLA, so this cut renders while other
// builders own src/Root.tsx. Hadrian 05: "This little town in L.A. might be
// our last chance to compete with China." A normal map of the LA basin, one
// push-in, a core-memory pin on El Segundo. 1080x1920, 24fps, 86 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="LittleTownInLA"
        component={LittleTownInLA}
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
