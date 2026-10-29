import {Composition} from 'remotion';
import {InsurgencyWorldProbe, PROBE_FRAMES} from '../generated/components/sarah-insurgency/InsurgencyWorldProbe';

// The sarah-insurgency world probe (not a cut): five scenes of 48 frames, props { grade: "A" | "B", debug, bands }.
export const RemotionRoot = () => (
  <Composition id="InsurgencyWorldProbe" component={InsurgencyWorldProbe} durationInFrames={PROBE_FRAMES} fps={24} width={1080} height={1920} defaultProps={{grade: 'A' as const, debug: false, bands: false}} />
);
