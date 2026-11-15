import {Composition} from 'remotion';
import {FPS, GeniusCrowd, GeniusPhone, GeniusPoses, GeniusStrip, GeniusStyle, POSES_H, POSES_W, STRIPS, STYLE_H, STYLE_W, stripSize} from '../generated/components/rsi-ten-earths/tenEarthsGeniusProbe';

// Probe sheets of THE GENIUS (rsi-ten-earths shared cast module tenEarthsGenius.tsx).
export const RemotionRoot = () => (
  <>
    <Composition id="GeniusStyle" component={GeniusStyle} durationInFrames={1} fps={FPS} width={STYLE_W} height={STYLE_H} />
    <Composition id="GeniusPoses" component={GeniusPoses} durationInFrames={1} fps={FPS} width={POSES_W} height={POSES_H} />
    <Composition id="GeniusCrowd" component={GeniusCrowd} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition id="GeniusPhone" component={GeniusPhone} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    {STRIPS.map((s) => (
      <Composition key={s} id={`GeniusStrip-${s}`} component={GeniusStrip} durationInFrames={1} fps={FPS} width={stripSize(s).w} height={stripSize(s).h} defaultProps={{strip: s}} />
    ))}
  </>
);
