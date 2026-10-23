import {Composition} from 'remotion';
import WifiSkyProbe, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-free-wifi/WifiSkyProbe';

// Private render entry for the scott-free-wifi world builder's probe stills (WifiSkyProbe: one still per frame).
// Opaque 1080x1920 at 23.976 fps. Render with --gl=angle.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="WifiSkyProbe"
        component={WifiSkyProbe}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
