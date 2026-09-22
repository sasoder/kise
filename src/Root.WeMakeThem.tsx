import {Composition} from 'remotion';
import WeMakeThem, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/WeMakeThem';

// Private render entry for WeMakeThem (Noam_Alignment_Degradation, cut 1), so
// this cut renders while other builders own src/Root.tsx. Orange Dwarkesh on the
// grid background: five people send a white arrow straight up — what they think
// aligned is — build the first generation of models along it, and then copy that
// same arrow up onto the generation so the next one can be made the same way.
// Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="WeMakeThem"
        component={WeMakeThem}
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
