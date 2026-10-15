import {Composition} from 'remotion';
import TradeSpiral, {DURATION, FPS, defaultProps, schema} from '../generated/components/TradeSpiral';

// Private render entry for TradeSpiral (Sarah Paine, "How the Depression
// pushed Japan to Pearl Harbor"): Kindleberger's contracting spiral of world
// trade, Jan 1929 - Mar 1933, drawn inward by one pen while the camera pushes
// in. Opaque umber page, 1080x1920, 24 fps, 80 frames.
export const RemotionRoot = () => {
  return (
    <Composition
      id="TradeSpiral"
      component={TradeSpiral}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
