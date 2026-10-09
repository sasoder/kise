import {Composition} from 'remotion';
import HuCrowdPan, {DURATION, FPS, defaultProps, schema} from '../generated/components/HuCrowdPan';

// Private render entry for the Hu Jintao crowd pan (opaque: one panorama, one
// whip pan, baked), so it renders while other sessions own src/Root.tsx.
// HuCrowdPan is panorama A; HuCrowdPanB is the alternate panorama, same move.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HuCrowdPan"
        component={HuCrowdPan}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="HuCrowdPanB"
        component={HuCrowdPan}
        schema={schema}
        defaultProps={schema.parse({src: 'jordanhu/hu_crowd_b.jpg', startX: 284, endX: 3350})}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
