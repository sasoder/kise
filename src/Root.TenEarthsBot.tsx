import {Composition} from 'remotion';
import {BotCrowd, BotDesk, BotPhone, BotPoses, BotStrip, BotStyle, FPS, POSES_H, POSES_W, STRIPS, STYLE_H, STYLE_W, stripSize} from '../generated/components/rsi-ten-earths/tenEarthsBotProbe';

// Probe sheets of THE ROBOT (rsi-ten-earths shared cast module tenEarthsBot.tsx).
export const RemotionRoot = () => (
  <>
    <Composition id="BotStyle" component={BotStyle} durationInFrames={1} fps={FPS} width={STYLE_W} height={STYLE_H} />
    <Composition id="BotPoses" component={BotPoses} durationInFrames={1} fps={FPS} width={POSES_W} height={POSES_H} />
    <Composition id="BotDesk" component={BotDesk} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition id="BotCrowd" component={BotCrowd} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition id="BotPhone" component={BotPhone} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    {STRIPS.map((s) => (
      <Composition key={s} id={`BotStrip-${s}`} component={BotStrip} durationInFrames={1} fps={FPS} width={stripSize(s).w} height={stripSize(s).h} defaultProps={{strip: s}} />
    ))}
  </>
);
