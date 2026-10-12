import {Composition} from 'remotion';
import UnderCerroGordo, {DURATION, FPS, defaultProps, schema} from '../generated/components/UnderCerroGordo';

// Private render entry for UnderCerroGordo (cut X of the Brent mine-death-count
// clip: the photo, the pan into the ground, the workings, the 1897 clipping and
// its highlight in one opaque graphic), so it renders while other sessions own
// src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="UnderCerroGordo"
      component={UnderCerroGordo}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
