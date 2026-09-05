import {Composition, registerRoot} from 'remotion';
import DetailLens, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/DetailLens';

// elon - no prep or you get glazed — 0:02.980 -> 0:08.400.
const Root = () => (
  <Composition
    id="DetailLens"
    component={DetailLens}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);

registerRoot(Root);
