import {Still} from 'remotion';
import {BetLoopProbe} from '../generated/components/nik-trend-friend/betLoop';

// Private render entry for the nik-trend-friend loop world (betLoop.tsx): two probe stills at the resolved
// whole-loop camera. "Empty": the loop, the tile, no chips, no stack. "Busy": E's stream and stack at f105.
// "Building": cut F's generic company mark and two managers in the one slot.
const Empty = () => <BetLoopProbe variant="empty" />;
const Busy = () => <BetLoopProbe variant="busy" />;
const Building = () => <BetLoopProbe variant="building" />;
export const RemotionRoot = () => (
  <>
    <Still id="BetLoopProbeEmpty" component={Empty} width={1080} height={1920} />
    <Still id="BetLoopProbeBusy" component={Busy} width={1080} height={1920} />
    <Still id="BetLoopProbeBuilding" component={Building} width={1080} height={1920} />
  </>
);
