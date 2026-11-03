import {Composition} from 'remotion';
import CancanLegible, {DURATION, FPS, defaultProps, schema} from '../generated/components/klaas-feedback/CancanLegible';

export const RemotionRoot = () => (
  <Composition
    id="CancanLegible"
    component={CancanLegible}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
