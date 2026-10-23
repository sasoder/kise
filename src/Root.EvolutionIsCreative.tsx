import {Composition} from 'remotion';
import EvolutionIsCreative, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-covid/EvolutionIsCreative';

// Private render entry for EvolutionIsCreative (kyle-covid; Dwarkesh 3D style): a living family tree of cream microbes divides and drifts into weird forms, some drain, and the one whose club spike fits a human cell's receptor turns orange, is taken in and the cell pushes out copies.
// Opaque 1080x1920, 29.97 fps, 174 frames.
export const RemotionRoot = () => (
  <Composition
    id="EvolutionIsCreative"
    component={EvolutionIsCreative}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
