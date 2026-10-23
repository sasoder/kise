import {Composition} from 'remotion';
import TryUsStayForTech, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-free-wifi/TryUsStayForTech';

// Private render entry for TryUsStayForTech (scott-free-wifi; Cheeky Pint style (stout)): a glide through a cutaway
// United cabin: Starlink's cream light wakes the passengers' devices, then United's amber seatback screens keep them.
// Opaque 1080x1920, 23.976 fps, 100 frames. Render with --gl=angle (AirStage is WebGL).
export const RemotionRoot = () => (
  <>
    <Composition
      id="TryUsStayForTech"
      component={TryUsStayForTech}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  </>
);
