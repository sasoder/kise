import {Composition} from 'remotion';
import TranslateDirectlyV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/TranslateDirectlyV2';

// Private render entry for TranslateDirectlyV2 (Noam_Alignment cut 4, in at
// 0:38.280), so this cut renders while the other builders of the set own their
// own entries and nobody touches src/Root.tsx. V2 on the user's note that V1
// was "super crowded and overstimulating" and needed to show WHY it is
// challenging: the frame is emptied down to five kinds of thing, and the
// alignment gains become cargo — accent beads riding the line, a hashed third
// of which fail to make the turn at each bar and stop against it. Opaque
// 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="TranslateDirectlyV2"
        component={TranslateDirectlyV2}
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
