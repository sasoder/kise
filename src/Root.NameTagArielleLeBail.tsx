import {AbsoluteFill, Composition} from 'remotion';
import NameTagStripe from '../generated/components/kits/name-tags/NameTagStripe';

// Stripe L3 for the Slush portrait clip. Reuses the client template unchanged.
// Identity/title: https://summit.sifted.eu/speakers/le-bail-le-bail (2026 speaker bio).
// 0–6.25s = 150 frames at 24 fps. The 0.8 wrap keeps the complete role on one line.
const ArielleTag = () => (
  <AbsoluteFill style={{transformOrigin: '127px 1215px', transform: 'scale(0.8)'}}>
    <NameTagStripe
      name="Arielle Le Bail"
      job="Head of Product EMEA, AI & Startups"
      company="Stripe"
      align="left"
    />
  </AbsoluteFill>
);

export const RemotionRoot = () => (
  <Composition
    id="NameTagStripe-ArielleLeBail"
    component={ArielleTag}
    durationInFrames={150}
    fps={24}
    width={1080}
    height={1920}
  />
);
