import {Composition} from 'remotion';
import EuropeAlreadyTheirs, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-revolut-ipo/EuropeAlreadyTheirs';

// Private render entry for EuropeAlreadyTheirs (nik-revolut-ipo; Cheeky Pint style (stout), 3D): a cream wave spreads from London over every European market Revolut serves, then "1 in 5" rises above the lit continent. Render with --gl=angle.
// Opaque 1080x1920, 23.976 fps, 61 frames.
export const RemotionRoot = () => (
  <Composition
    id="EuropeAlreadyTheirs"
    component={EuropeAlreadyTheirs}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
