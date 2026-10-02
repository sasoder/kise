import {Composition} from 'remotion';
import BrushingMistakes, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/BrushingMistakes';

// Private render entry for The Humble Co. brushing-mistakes timeline (option A,
// Tube): three clips selected with the `step` prop (1, 2, 3), so it renders
// while another builder owns src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="BrushingMistakes"
      component={BrushingMistakes}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
