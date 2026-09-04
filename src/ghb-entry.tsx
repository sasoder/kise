import {Composition, registerRoot} from 'remotion';
import GigawattHundredBillion, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/GigawattHundredBillion';

const Root = () => (
  <Composition
    id="GigawattHundredBillion"
    component={GigawattHundredBillion}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);

registerRoot(Root);
