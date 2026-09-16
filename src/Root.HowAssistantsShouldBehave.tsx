import {Composition} from 'remotion';
import HowAssistantsShouldBehave, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/HowAssistantsShouldBehave';

// Private render entry for HowAssistantsShouldBehave, so this cut renders while
// another builder owns src/Root.tsx. Orange Dwarkesh style on the grid
// background: an orange reward curve drawn by a human decision, redrawn once,
// then climbed by white sample dots. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HowAssistantsShouldBehave"
        component={HowAssistantsShouldBehave}
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
