import {Composition} from 'remotion';
import {MarmotMask, MarmotProbe} from '../generated/components/kyle-pandemics/creaturesProbeMarmot';

// Private probe entry (kyle-pandemics V3, not a cut): the marmot of cut 1 alone in the medium (MarmotProbe) and on black
// (MarmotMask, to measure its head's clearance). Render with --gl=angle.
const FPS = 30000 / 1001;
export const RemotionRoot = () => (
  <>
    {(['A', 'B'] as const).map((air) => (
      <Composition key={`m${air}`} id={`Marmot-${air}`} component={MarmotProbe} defaultProps={{air}} durationInFrames={207} fps={FPS} width={1080} height={1920} />
    ))}
    <Composition id="MarmotMask" component={MarmotMask} durationInFrames={207} fps={FPS} width={1080} height={1920} />
  </>
);
