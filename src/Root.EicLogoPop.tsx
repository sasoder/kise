import {Composition} from 'remotion';
import EicLogoPop, {DURATION, FPS} from '../generated/components/EicLogoPop';

// Private render entry for the East India Company logo pop (transparent
// overlay), so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="EicLogoPop"
      component={EicLogoPop}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
