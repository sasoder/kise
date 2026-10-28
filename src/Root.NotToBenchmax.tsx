import {Composition} from 'remotion';
import NotToBenchmax, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-benchmaxxing/NotToBenchmax';

// Private render entry for NotToBenchmax (sam-benchmaxxing; Cheeky Pint style (stout)): the OpenAI tile rises alone into the sky and glitters with a shine on "benchmax". Render with --gl=angle.
// Opaque 1080x1920, 23.976 fps, 50 frames.
export const RemotionRoot = () => (
  <Composition
    id="NotToBenchmax"
    component={NotToBenchmax}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
