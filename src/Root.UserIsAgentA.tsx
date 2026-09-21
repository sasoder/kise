import {Composition} from 'remotion';
import UserIsAgentA, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/UserIsAgentA';

// Private render entry for UserIsAgentA (cut 2 of Noam_Alignment), so this cut
// renders while the other builders of the set own their own entries and
// src/Root.tsx is left alone. Orange Dwarkesh on the grid background: one agent
// named A flies up past a loosely-following flock of 70 and takes the person's
// place in the ring marked "user", and the flock starts snapping into line
// behind it. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="UserIsAgentA"
        component={UserIsAgentA}
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
