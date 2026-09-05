import {Composition, registerRoot} from 'remotion';
import SkipLevelReview, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/SkipLevelReview';

// elon - no prep or you get glazed — 0:11.759 -> 0:18.500.
const Root = () => (
  <Composition
    id="SkipLevelReview"
    component={SkipLevelReview}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);

registerRoot(Root);
