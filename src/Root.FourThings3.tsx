import {Composition} from 'remotion';
import {FourThingsClip} from '../generated/components/fourThingsClip';
import {FPS, SEQ} from '../generated/components/fourThingsShared';

// Private render entry for FourThings3 (META4 set, Cheeky Pint S4 / stout): opaque 1080x1920 at
// 23.976 fps, sequence frames 831-1183.
const Clip = () => <FourThingsClip n={3} />;

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id={SEQ[3].id}
        component={Clip}
        durationInFrames={SEQ[3].len}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
