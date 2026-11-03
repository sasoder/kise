import {Composition} from 'remotion';
import JuliusWrapped, {DURATION, FPS, defaultProps, schema} from '../generated/components/klaas-feedback/JuliusWrapped';

export const RemotionRoot = () => (
  <Composition
    id="JuliusWrapped"
    component={JuliusWrapped}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
