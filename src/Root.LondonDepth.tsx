import {Composition} from 'remotion';
import {LondonDepthProbe, LondonDepthProbeClose} from '../generated/components/kyle-london/londonDepthProbe';

// Probe of the kyle-london depth kit (londonDepth.tsx) and the cast's form shadow (londonCastV2 `shade`).
export const RemotionRoot = () => (
  <>
    <Composition id="LondonDepthProbe" component={LondonDepthProbe} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="LondonDepthProbeClose" component={LondonDepthProbeClose} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
