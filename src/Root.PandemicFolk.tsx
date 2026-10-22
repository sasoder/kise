import {Composition} from 'remotion';
import {FolkRowA, FolkPeopleA, FolkAnimalsA, FolkInSituA, ROW_W, ROW_H, PEOPLE_W, ANIMALS_W} from '../generated/components/kyle-pandemics/pandemicFolkFrames';
import {FolkTurnaround, FolkTurnStrip, FolkReachStrip, FolkSeeThrough, FolkCrowdSheet, FolkFallStrip, FolkTurnMotion, FolkReachMotion, FolkSlackMotion, FolkFallMotion, TA_W, TA_H, STRIP_W, STRIP_H, SEE_W, SEE_H, CROWD_W, CROWD_H, FALL_W, FALL_H, TURN_N, REACH_N, FALL_MOTION_N} from '../generated/components/kyle-pandemics/pandemicFolkProbe';

// The kyle-pandemics V3 drawn cast, take 2 (pandemicFolk*): style frames (style A) and the probe sheets of the people.
// Stills: bunx remotion still src/entry.PandemicFolk.ts <id> out.png
const FPS = 30000 / 1001;
export const RemotionRoot = () => (
  <>
    <Composition id="FolkRowA" component={FolkRowA} durationInFrames={1} fps={FPS} width={ROW_W} height={ROW_H} />
    <Composition id="FolkPeopleA" component={FolkPeopleA} durationInFrames={1} fps={FPS} width={PEOPLE_W} height={ROW_H} />
    <Composition id="FolkAnimalsA" component={FolkAnimalsA} durationInFrames={1} fps={FPS} width={ANIMALS_W} height={ROW_H} />
    <Composition id="FolkInSituA" component={FolkInSituA} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition id="FolkTurnaround" component={FolkTurnaround} durationInFrames={1} fps={FPS} width={TA_W} height={TA_H} />
    <Composition id="FolkTurnStrip" component={FolkTurnStrip} durationInFrames={1} fps={FPS} width={STRIP_W} height={STRIP_H} />
    <Composition id="FolkReachStrip" component={FolkReachStrip} durationInFrames={1} fps={FPS} width={STRIP_W} height={STRIP_H} />
    <Composition id="FolkSeeThrough" component={FolkSeeThrough} durationInFrames={1} fps={FPS} width={SEE_W} height={SEE_H} />
    <Composition id="FolkCrowdSheet" component={FolkCrowdSheet} durationInFrames={1} fps={FPS} width={CROWD_W} height={CROWD_H} />
    <Composition id="FolkFallStrip" component={FolkFallStrip} durationInFrames={1} fps={FPS} width={FALL_W} height={FALL_H} />
    <Composition id="FolkTurnMotion" component={FolkTurnMotion} durationInFrames={TURN_N + 6} fps={FPS} width={1080} height={1920} />
    <Composition id="FolkReachMotion" component={FolkReachMotion} durationInFrames={REACH_N + 6} fps={FPS} width={1080} height={1920} />
    <Composition id="FolkSlackMotion" component={FolkSlackMotion} durationInFrames={150} fps={FPS} width={1080} height={1920} />
    <Composition id="FolkFallMotion" component={FolkFallMotion} durationInFrames={FALL_MOTION_N} fps={FPS} width={1080} height={1920} />
  </>
);
