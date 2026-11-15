import {Composition} from 'remotion';
import {FPS, POSES_H, POSES_W, ProbeOffice, ProbePaper, ProbePoses, ProbeStrips, ProbeStyle, STRIP_H, STRIP_W, STYLE_H, STYLE_W} from '../generated/components/rsi-since-writing/sinceWritingProbe';

// Probe stills of the rsi-since-writing shared world (sinceWritingFolk.tsx + sinceWritingWorld.tsx).
export const RemotionRoot = () => (
  <>
    <Composition id="SWStyle" component={ProbeStyle} durationInFrames={1} fps={FPS} width={STYLE_W} height={STYLE_H} />
    <Composition id="SWPoses" component={ProbePoses} durationInFrames={1} fps={FPS} width={POSES_W} height={POSES_H} />
    <Composition id="SWStrips" component={ProbeStrips} durationInFrames={1} fps={FPS} width={STRIP_W} height={STRIP_H} />
    <Composition id="SWOffice" component={ProbeOffice} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{sunT: 0.15, view: 'wide' as const}} />
    <Composition id="SWPhone" component={ProbeOffice} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{sunT: 0.3, view: 'phone' as const}} />
    <Composition id="SWPaper" component={ProbePaper} durationInFrames={1} fps={FPS} width={1080} height={1920} />
  </>
);
