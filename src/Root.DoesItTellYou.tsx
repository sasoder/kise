import {Composition} from 'remotion';
import DoesItTellYou, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/DoesItTellYou';

// Private render entry for DoesItTellYou (Noam_Trap, the bridge between cuts 3
// and 4), so this cut renders while other builders own src/Root.tsx. Orange
// Dwarkesh on the grid background: cut 3's standing picture carried on, the
// hovering needle forking into two dashed (imagined) branches — the look it
// might take and the report it might make — and both withdrawn again, leaving
// exactly cut 4's opening frame. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="DoesItTellYou"
        component={DoesItTellYou}
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
