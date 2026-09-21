import {Composition} from 'remotion';
import TranslateDirectly, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/TranslateDirectly';

// Private render entry for TranslateDirectly (Noam_Alignment cut 4, in at
// 0:38.280), so this cut renders while the other builders of the set own their
// own entries and nobody touches src/Root.tsx. Orange Dwarkesh on the grid
// background: a white line leaves the tight flock led by Agent A and winds round
// bar after bar on its way to the loose flock led by a person, and the pull-back
// shows the straight route it could not take. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="TranslateDirectly"
        component={TranslateDirectly}
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
