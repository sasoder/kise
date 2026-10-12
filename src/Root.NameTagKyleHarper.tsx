import {Composition} from 'remotion';
import NameTagMapStyle, {schema} from '../generated/components/NameTagMapStyle';

// Private render entry for the Kyle Harper name tag of the plague clip (29.97 fps sequence; the tag is
// frame-based, on screen for the first 86 frames, 10 spare).
const FRAMES = 96;

export const RemotionRoot = () => {
  return (
    <Composition
      id="NameTag-KyleHarper"
      component={NameTagMapStyle}
      schema={schema}
      defaultProps={{name: 'Kyle Harper', job: 'Historian', durationInFrames: FRAMES}}
      durationInFrames={FRAMES}
      fps={30000 / 1001}
      width={1080}
      height={1920}
    />
  );
};
