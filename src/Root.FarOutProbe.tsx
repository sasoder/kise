import {Composition} from 'remotion';
import {FarOutProbe} from '../generated/components/robert-johnson-ranch/farOutProbe';

// FarOutOfAustin (robert-johnson-ranch cut 6, take 2): probes of its own set pieces (farOutCity, farOutCar).
// Stills: bunx remotion still src/entry.FarOutProbe.ts FarOutProbe out.png --props='{"view":"cars"}'
const FPS = 24000 / 1001;
export const RemotionRoot = () => (
  <>
    <Composition id="FarOutProbe" component={FarOutProbe} durationInFrames={48} fps={FPS} width={1080} height={1920} defaultProps={{view: 'city' as const}} />
  </>
);
