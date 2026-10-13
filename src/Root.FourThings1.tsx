import {Composition} from 'remotion';
import {FourThingsClip} from '../generated/components/fourThingsClip';
import {FPS, SEQ} from '../generated/components/fourThingsShared';

// Private render entry for FourThings1 (META4 set, Cheeky Pint S4 / stout): opaque 1080x1920 at
// 23.976 fps, sequence frames 191-550.
const Clip = () => <FourThingsClip n={1} />;

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id={SEQ[1].id}
        component={Clip}
        durationInFrames={SEQ[1].len}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
