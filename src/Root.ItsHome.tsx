import {Composition} from 'remotion';
import ItsHome, {DURATION, FPS, defaultProps, schema} from '../generated/components/sarah-insurgency/ItsHome';

// Private render entry for ItsHome (sarah-insurgency, cut 91): an orange value column rises out of the map behind a lit Hudson valley farmhouse. RENDER WITH --gl=angle.
// Opaque 1080x1920, 24 fps, 83 frames.
export const RemotionRoot = () => (
  <Composition
    id="ItsHome"
    component={ItsHome}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
