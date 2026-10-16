import {Composition} from 'remotion';
import EightyKeys, {DURATION, FPS, defaultProps, schema} from '../generated/components/brent-cerro-gordo-trailer/EightyKeys';

// Private render entry for EightyKeys (Brent / Cerro Gordo trailer), 16:9 (1920x1080).
export const RemotionRoot = () => (
  <Composition
    id="EightyKeys"
    component={EightyKeys}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
