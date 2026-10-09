import {Composition} from 'remotion';
import EastIndiaHousePan, {DURATION, FPS} from '../generated/components/EastIndiaHousePan';

// Private render entry for the East India House pan (opaque: the painting, the
// dim/blur, the anchored Company mark and the editor's pan in one graphic), so
// it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="EastIndiaHousePan"
      component={EastIndiaHousePan}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
