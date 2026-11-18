import {Composition} from 'remotion';
import FortyTwoPercent, {DURATION, FPS, defaultProps, schema} from '../generated/components/toto-female-fans/FortyTwoPercent';

// Private render entry for FortyTwoPercent (toto-female-fans; Cheeky Pint style (stout)): the screen over the full stand rolls up 42%, the men drain to board and the 42 women keep their amber.
// Opaque 1080x1920, 25 fps, 65 frames.
export const RemotionRoot = () => (
  <Composition
    id="FortyTwoPercent"
    component={FortyTwoPercent}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
