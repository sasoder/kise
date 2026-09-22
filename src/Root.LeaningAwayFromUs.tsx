import {Composition} from 'remotion';
import LeaningAwayFromUs, {
  DURATION,
  defaultProps,
  schema,
} from '../generated/components/LeaningAwayFromUs';
import {FPS} from '../generated/components/towerShared';

// Private render entry for cut 4 of Noam_Alignment_Degradation v2,
// "LeaningAwayFromUs" (in at 0:25.940): the chain of births runs on to gen 16,
// the tower bends away from the plumb line, and the distance is measured.
// Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="LeaningAwayFromUs"
        component={LeaningAwayFromUs}
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
