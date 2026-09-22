import {Composition} from 'remotion';
import HumansMakeTheFirst, {
  DURATION,
  defaultProps,
  schema,
} from '../generated/components/HumansMakeTheFirst';
import {FPS} from '../generated/components/towerShared';

// Private render entry for cut 1 of Noam_Alignment_Degradation v2,
// "HumansMakeTheFirst" (in at 0:04.440): the humans make generation 1 and the
// plumb line of "aligned" draws up through it. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HumansMakeTheFirst"
        component={HumansMakeTheFirst}
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
