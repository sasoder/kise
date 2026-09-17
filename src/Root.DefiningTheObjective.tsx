import {Composition} from 'remotion';
import DefiningTheObjective, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/DefiningTheObjective';

// Private render entry for DefiningTheObjective, so this cut renders while
// another builder owns src/Root.tsx. Orange Dwarkesh on the grid background:
// the establishing shot of the objective — a person, a line, and the Lucide
// trophy drawn head-led above him. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="DefiningTheObjective"
        component={DefiningTheObjective}
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
