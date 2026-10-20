import {Composition} from 'remotion';
import {LondonCastV2Heads, LondonCastV2Phone, LondonCastV2Sheet, LondonCastV2Zoom, LondonCastV2Swap, HEADS_W, HEADS_H} from '../generated/components/kyle-london/londonCastV2Probe';
import {LondonCastSheet, LondonCastWorkSheet, LondonCastHeads} from '../generated/components/kyle-london/londonCastV2';

// Probe sheets of the redesigned kyle-london cast (londonCastV2.tsx), beside the current cast (londonCast.tsx).
export const RemotionRoot = () => (
  <>
    <Composition id="LondonCastV2Heads" component={LondonCastV2Heads} durationInFrames={1} fps={30} width={HEADS_W} height={HEADS_H} />
    <Composition id="LondonCastV2Phone" component={LondonCastV2Phone} durationInFrames={1} fps={30} width={2160} height={1920} />
    <Composition id="LondonCastV2Sheet" component={LondonCastV2Sheet} durationInFrames={1} fps={30} width={2400} height={2700} />
    <Composition id="LondonCastV2Zoom" component={LondonCastV2Zoom} durationInFrames={1} fps={30} width={2400} height={1920} />
    <Composition id="LondonCastV2Swap" component={LondonCastV2Swap} durationInFrames={1} fps={30} width={3300} height={1800} />
    <Composition id="LondonCastV2CastSheet" component={LondonCastSheet} durationInFrames={1} fps={30} width={2160} height={1920} />
    <Composition id="LondonCastV2WorkSheet" component={LondonCastWorkSheet} durationInFrames={1} fps={30} width={2160} height={1920} />
    <Composition id="LondonCastV2HeadsOwn" component={LondonCastHeads} durationInFrames={1} fps={30} width={2160} height={1920} />
  </>
);
