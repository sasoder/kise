import {Composition, registerRoot} from 'remotion';
import FrukostBarChart, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/FrukostBarChart';

const Root = () => (
  <Composition
    id="FrukostBarChart"
    component={FrukostBarChart}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);

registerRoot(Root);
