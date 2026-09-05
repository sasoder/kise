import {Composition, registerRoot} from 'remotion';
import SuccessNotPossible, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/SuccessNotPossible';

// elon - no prep or you get glazed — 0:32.159 -> 0:37.320.
const Root = () => (
  <Composition
    id="SuccessNotPossible"
    component={SuccessNotPossible}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);

registerRoot(Root);
