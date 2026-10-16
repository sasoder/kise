import {Composition} from 'remotion';
import {FourThingsClip} from '../generated/components/meta-four-things/fourThingsClip';
import {FPS, SEQ} from '../generated/components/meta-four-things/fourThingsShared';

// Private render entry for FourThings4 (META4 set, clip 4: "cleared the calendar for two months"),
// so this clip renders while other builders own their own entries. 1080x1920, 23.976 fps, 280 f.
const Clip = () => <FourThingsClip n={4} />;

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id={SEQ[4].id}
        component={Clip}
        durationInFrames={SEQ[4].len}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
