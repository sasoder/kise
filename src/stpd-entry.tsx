import {Composition, registerRoot} from 'remotion';
import SporttouchenPlateD, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/SporttouchenPlateD';

// Sporttouchen question plate — option D, "Ordplattor". Private render entry.
const Root = () => (
  <Composition
    id="SporttouchenPlateD"
    component={SporttouchenPlateD}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);

registerRoot(Root);
