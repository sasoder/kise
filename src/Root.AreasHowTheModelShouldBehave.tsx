import {Composition} from 'remotion';
import AreasHowTheModelShouldBehave, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/AreasHowTheModelShouldBehave';

// Private render entry for AreasHowTheModelShouldBehave, so this cut renders
// while another builder owns src/Root.tsx. Orange Dwarkesh on the grid
// background: six areas of life in a 3 x 2 grid, each a Lucide outline glyph
// in a station ring with its own person under it and a question mark over his
// shoulder, and the AI dots milling in every ring. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="AreasHowTheModelShouldBehave"
        component={AreasHowTheModelShouldBehave}
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
