import {Composition} from 'remotion';
import CantImagineLifeWithout, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-macintosh-moment/CantImagineLifeWithout';

// Private render entry for CantImagineLifeWithout (sam-macintosh-moment; Cheeky Pint style (stout)): five picture-book people, speech bubbles with Codex and ChatGPT marks and names, amber hearts on "they do say".
// Opaque 1080x1920, 23.976 fps, 98 frames.
export const RemotionRoot = () => (
  <Composition
    id="CantImagineLifeWithout"
    component={CantImagineLifeWithout}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
