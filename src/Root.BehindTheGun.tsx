import {Composition} from 'remotion';
import BehindTheGun, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/BehindTheGun';

// Private render entry for BehindTheGun, so this cut renders while other
// builders own src/Root.tsx. Dwarkesh (with Si Sheppard): "we often talk about
// advantages in technology, but we don't talk about advantages in sort of
// governance or in terms of organization". Dwarkesh map style (umber page),
// 1080x1920, 23.976 fps, 162 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="BehindTheGun"
        component={BehindTheGun}
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
