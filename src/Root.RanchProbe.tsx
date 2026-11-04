import {Composition} from 'remotion';
import {RanchCastSheet, RanchWalkProbe, RanchRockProbe, RanchWorldProbe, RanchFarmWomanSheet} from '../generated/components/robert-johnson-ranch/ranchProbe';

// robert-johnson-ranch: probes of the shared world (ranchWorld) and cast (ranchFolk).
// Stills: bunx remotion still src/entry.RanchProbe.ts <id> out.png
const FPS = 24000 / 1001;
export const RemotionRoot = () => (
  <>
    <Composition id="RanchCastSheet" component={RanchCastSheet} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition id="RanchWalkProbe" component={RanchWalkProbe} durationInFrames={72} fps={FPS} width={1080} height={1920} />
    <Composition id="RanchRockProbe" component={RanchRockProbe} durationInFrames={64} fps={FPS} width={1080} height={1920} />
    <Composition id="RanchWorldProbe" component={RanchWorldProbe} durationInFrames={48} fps={FPS} width={1080} height={1920} defaultProps={{view: 'dogrun' as const}} />
    <Composition id="RanchFarmWomanSheet" component={RanchFarmWomanSheet} durationInFrames={64} fps={FPS} width={1080} height={1920} />
  </>
);
