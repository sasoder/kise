import {Composition} from 'remotion';
import DiophantusPopsUp, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-greek-math/DiophantusPopsUp';

// Private render entry for DiophantusPopsUp (kyle-greek-math; Dwarkesh 3D style): from behind Euclid into the fog, lone columns rise, Diophantus in the Roman world.
// Opaque 1080x1920, 29.97 fps, 186 frames.
export const RemotionRoot = () => (
  <Composition
    id="DiophantusPopsUp"
    component={DiophantusPopsUp}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
