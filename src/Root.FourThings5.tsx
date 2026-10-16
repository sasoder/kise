import {Composition} from 'remotion';
import {FourThingsClip} from '../generated/components/meta-four-things/fourThingsClip';
import {FPS, SEQ} from '../generated/components/meta-four-things/fourThingsShared';

// Private render entry for FourThings5 (META4 set, Cheeky Pint S4 / stout): opaque 1080x1920 at
// 23.976 fps, sequence frames 1463-1607.
const Clip = () => <FourThingsClip n={5} />;

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id={SEQ[5].id}
        component={Clip}
        durationInFrames={SEQ[5].len}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
