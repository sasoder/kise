import {Composition, registerRoot} from 'remotion';
import ValueCaptureStack, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ValueCaptureStack';

const Root = () => (
  <Composition
    id="ValueCaptureStack"
    component={ValueCaptureStack}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);

registerRoot(Root);
