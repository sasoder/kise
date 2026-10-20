import {Composition} from 'remotion';
import {FarmersProbe, FarmersSheet, SHEET_FRAMES} from '../generated/components/kyle-first-farmers/farmersFigures';
import {FPS} from '../generated/components/kyle-first-farmers/firstFarmersShared';

// Private render entry for the review sheet of the first-farmers world (Kyle Harper, "Did disease help the first
// farmers replace hunter-gatherers?"): every figure, pose, animal and prop, the germs at close and wide range.
// FarmersSheet is a 2160x3840 world seen at k = 0.5 (render stills with --scale 2 to judge detail). The probes are
// 1080x1920 at k 1 (the fall, the walk, the germs travelling, the germ haze on a wide).
export const RemotionRoot = () => {
  return (
    <>
      <Composition id="FarmersSheet" component={FarmersSheet} durationInFrames={SHEET_FRAMES} fps={FPS} width={1080} height={1920} />
      <Composition id="FarmersFallProbe" component={FarmersProbe} durationInFrames={90} fps={FPS} width={1080} height={1920} defaultProps={{which: 'fall' as const}} />
      <Composition id="FarmersWalkProbe" component={FarmersProbe} durationInFrames={90} fps={FPS} width={1080} height={1920} defaultProps={{which: 'walk' as const}} />
      <Composition id="FarmersGermsProbe" component={FarmersProbe} durationInFrames={150} fps={FPS} width={1080} height={1920} defaultProps={{which: 'germs' as const}} />
      <Composition id="FarmersGermsWideProbe" component={FarmersProbe} durationInFrames={120} fps={FPS} width={1080} height={1920} defaultProps={{which: 'wide' as const}} />
    </>
  );
};
