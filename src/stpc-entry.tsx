import {Composition, registerRoot} from 'remotion';
import SporttouchenPlateC, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/SporttouchenPlateC';

// Sporttouchen question plate, option C — "Skylten".
const Root = () => (
  <Composition
    id="SporttouchenPlateC"
    component={SporttouchenPlateC}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);

registerRoot(Root);
