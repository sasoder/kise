import {Composition} from 'remotion';
import HuCrowdPan, {DURATION, FPS, defaultProps, schema} from '../generated/components/HuCrowdPan';
import HuLiveToPrint, {
  DURATION as LIVE_DURATION,
  FPS as LIVE_FPS,
  defaultProps as liveDefaultProps,
  schema as liveSchema,
} from '../generated/components/HuLiveToPrint';

// Private render entry for the Hu Jintao crowd pan (opaque: one panorama, one
// whip pan, baked), so it renders while other sessions own src/Root.tsx.
// HuCrowdPan is panorama A; HuCrowdPanB is the alternate panorama, same move.
// HuLiveToPrint opens on the real footage, prints it into newsprint and then
// does the same pan on its own panorama, onto a printed 25M -> 100M figure;
// HuLiveToPrintNumberOnly is the same clip without the figure's caption.
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
      <Composition
        id="HuLiveToPrint"
        component={HuLiveToPrint}
        schema={liveSchema}
        defaultProps={liveDefaultProps}
        durationInFrames={LIVE_DURATION}
        fps={LIVE_FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="HuLiveToPrintNumberOnly"
        component={HuLiveToPrint}
        schema={liveSchema}
        defaultProps={liveSchema.parse({showCaption: false})}
        durationInFrames={LIVE_DURATION}
        fps={LIVE_FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
