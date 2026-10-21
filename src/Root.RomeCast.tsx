import {Composition} from 'remotion';
import {
  RomeCastAudit,
  RomeCastDebug,
  RomeCastRecline,
  RomeCastFetters,
  RomeCastHeads,
  RomeCastHeroes,
  RomeCastPhone,
  RomeCastPoses,
  RomeCastWork,
  FETTER_H,
  FETTER_W,
  HEADS_H,
  HEADS_W,
  HERO_H,
  HERO_W,
  POSES_H,
  POSES_W,
  WORK_H,
  WORK_W,
} from '../generated/components/kyle-rome-slavery/romeCastProbe';

// Probe sheets of the kyle-rome-slavery Roman cast (romeCast.tsx).
export const RemotionRoot = () => (
  <>
    <Composition id="RomeCastHeroes" component={RomeCastHeroes} durationInFrames={1} fps={30} width={HERO_W} height={HERO_H} />
    <Composition id="RomeCastPhone" component={RomeCastPhone} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="RomeCastPoses" component={RomeCastPoses} durationInFrames={1} fps={30} width={POSES_W} height={POSES_H} />
    <Composition id="RomeCastWork" component={RomeCastWork} durationInFrames={1} fps={30} width={WORK_W} height={WORK_H} />
    <Composition id="RomeCastFetters" component={RomeCastFetters} durationInFrames={1} fps={30} width={FETTER_W} height={FETTER_H} />
    <Composition id="RomeCastHeads" component={RomeCastHeads} durationInFrames={1} fps={30} width={HEADS_W} height={HEADS_H} />
    <Composition id="RomeCastAudit" component={RomeCastAudit} durationInFrames={1} fps={30} width={2000} height={800} />
    <Composition id="RomeCastDebug" component={RomeCastDebug} durationInFrames={1} fps={30} width={1600} height={900} />
    <Composition id="RomeCastRecline" component={RomeCastRecline} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
