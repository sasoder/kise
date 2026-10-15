import {Composition, useCurrentFrame} from 'remotion';
import {PlanPage} from '../generated/components/incaShared';
import {HundredOpeningLayers, openingCam} from '../generated/components/hundredOpening';

// TEMPORARY join-test reference for HisConquistadors (builder C's scratch; to
// be deleted after the join test): cut A's own opening layers on A's camera at
// A's frame (this frame - 91), so frame 90 here = A's frame -1.
const Ref = () => {
  const f = useCurrentFrame() - 91;
  const cam = openingCam(f);
  return (
    <PlanPage cam={cam} vignette={0.55}>
      <HundredOpeningLayers cam={cam} frame={f} />
    </PlanPage>
  );
};
export const RemotionRoot = () => (
  <Composition id="HisConquistadorsJoinRef" component={Ref} durationInFrames={92} fps={24} width={1080} height={1920} />
);
