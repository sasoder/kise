import {Composition} from 'remotion';
import {FourThingsClip} from '../generated/components/meta-four-things/fourThingsClip';
import {FPS, SEQ} from '../generated/components/meta-four-things/fourThingsShared';

// Private render entry for FourThings2 (META4 set, Cheeky Pint S4 / stout): opaque 1080x1920 at
// 23.976 fps, sequence frames 550-831. Scene: generated/components/meta-four-things/fourThingsScene2.tsx.
const Clip = () => <FourThingsClip n={2} />;

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id={SEQ[2].id}
        component={Clip}
        durationInFrames={SEQ[2].len}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
