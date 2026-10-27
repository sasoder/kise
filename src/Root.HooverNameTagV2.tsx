import {Composition} from 'remotion';
import HooverNameTagV2, {DURATION, FPS, defaultProps, schema} from '../generated/components/sarah-pearl-harbor/HooverNameTagV2';

// Private render entry for the cold-review V2 of the Hoover name tag (Sarah Pearl Harbor, cut 15). Transparent overlay.
export const RemotionRoot = () => {
  return (
    <Composition
      id="HooverNameTagV2"
      component={HooverNameTagV2}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
