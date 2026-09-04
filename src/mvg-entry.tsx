import {Composition, registerRoot} from 'remotion';
import MegawattsVersusGigawatts, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/MegawattsVersusGigawatts';

const Root = () => (
  <Composition
    id="MegawattsVersusGigawatts"
    component={MegawattsVersusGigawatts}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);

registerRoot(Root);
