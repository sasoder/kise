import {Composition} from 'remotion';
import {LondonCastHeads, LondonCastSheet, LondonCastWorkSheet} from '../generated/components/kyle-london/londonCast';

// Probe sheets of the kyle-london cast (londonCast.tsx): every character in every pose, the work poses and props, the heads.
export const RemotionRoot = () => (
  <>
    <Composition id="LondonCastSheet" component={LondonCastSheet} durationInFrames={1} fps={30} width={2160} height={1920} />
    <Composition id="LondonCastWorkSheet" component={LondonCastWorkSheet} durationInFrames={1} fps={30} width={2160} height={1920} />
    <Composition id="LondonCastHeads" component={LondonCastHeads} durationInFrames={1} fps={30} width={2160} height={1920} />
  </>
);
