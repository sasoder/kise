import {Composition} from 'remotion';
import {FPS, PROBE_FRAMES, SWEEP_FRAMES, TenEarthsGlobeBench, TenEarthsGlobeProbe, TenEarthsGlobeSweep} from '../generated/components/rsi-ten-earths/tenEarthsGlobeProbe';

// Private render entry for the rsi-ten-earths globe probe (Dwarkesh 3D style): the shared Earth globe module's states
// one per frame (TenEarthsGlobeProbe) and a 90-frame cover/sea sweep (TenEarthsGlobeSweep). Not a cut.
// Opaque 1080x1920, 23.976 fps.
export const RemotionRoot = () => (
  <>
    <Composition id="TenEarthsGlobeProbe" component={TenEarthsGlobeProbe} durationInFrames={PROBE_FRAMES} fps={FPS} width={1080} height={1920} />
    <Composition id="TenEarthsGlobeBench" component={TenEarthsGlobeBench} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition id="TenEarthsGlobeSweep" component={TenEarthsGlobeSweep} durationInFrames={SWEEP_FRAMES} fps={FPS} width={1080} height={1920} />
  </>
);
