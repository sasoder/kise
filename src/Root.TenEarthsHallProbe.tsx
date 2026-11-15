import {Composition} from 'remotion';
import {STILLS, TenEarthsHallProbe, TenEarthsHallStills, DURATION, FPS, defaultProps, schema, stillsSchema} from '../generated/components/rsi-ten-earths/tenEarthsHallProbe';

// rsi-ten-earths: probes of the shared hall module (tenEarthsHall.tsx). Not a cut.
// One still: bunx remotion still src/entry.TenEarthsHallProbe.ts TenEarthsHallProbe out.png --props='{"view":"rack"}'
// Every probe still in one go (frame i = STILLS[i]): bunx remotion render src/entry.TenEarthsHallProbe.ts
//   TenEarthsHallStills <dir> --sequence --image-format=png --concurrency=4
export const RemotionRoot = () => (
  <>
    <Composition id="TenEarthsHallProbe" component={TenEarthsHallProbe} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} schema={schema} defaultProps={defaultProps} />
    <Composition id="TenEarthsHallStills" component={TenEarthsHallStills} durationInFrames={STILLS.length} fps={FPS} width={1080} height={1920} schema={stillsSchema} defaultProps={stillsSchema.parse({})} />
  </>
);
