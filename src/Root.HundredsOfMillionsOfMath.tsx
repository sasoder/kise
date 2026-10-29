import {Composition} from 'remotion';
import HundredsOfMillionsOfMath, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-navier-stokes/HundredsOfMillionsOfMath';

// Private render entry for HundredsOfMillionsOfMath (sam-navier-stokes; Cheeky Pint style (stout)): from the one big amber Navier-Stokes vortex out over a deck of hundreds of smaller ones, each a little amber at its base. Render --gl=angle.
// Opaque 1080x1920, 23.976 fps, 110 frames.
export const RemotionRoot = () => (
  <Composition
    id="HundredsOfMillionsOfMath"
    component={HundredsOfMillionsOfMath}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
