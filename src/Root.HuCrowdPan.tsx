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
// does the same pan on its own panorama, along a printed "25 MILLION" that runs
// across the whole white band. HuLiveToPrintLockup prints the phrase as a
// two-line block in the end frame instead; HuLiveToPrintCounter is the earlier
// 25M -> 100M counter with its caption, HuLiveToPrintNumberOnly without it.
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
        id="HuLiveToPrintLockup"
        component={HuLiveToPrint}
        schema={liveSchema}
        defaultProps={liveSchema.parse({headline: 'lockup'})}
        durationInFrames={LIVE_DURATION}
        fps={LIVE_FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="HuLiveToPrintCounter"
        component={HuLiveToPrint}
        schema={liveSchema}
        defaultProps={liveSchema.parse({headline: 'counter', showCaption: true})}
        durationInFrames={LIVE_DURATION}
        fps={LIVE_FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="HuLiveToPrintNumberOnly"
        component={HuLiveToPrint}
        schema={liveSchema}
        defaultProps={liveSchema.parse({headline: 'counter', showCaption: false})}
        durationInFrames={LIVE_DURATION}
        fps={LIVE_FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
