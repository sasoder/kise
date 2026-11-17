import {Composition} from 'remotion';
import RateIcons, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-europe-worst-market/RateIcons';
import InterchangeIcon, {
  DURATION as INTERCHANGE_DURATION,
  defaultProps as interchangeProps,
  schema as interchangeSchema,
} from '../generated/components/nik-europe-worst-market/InterchangeIcon';
import LendingIcon, {
  DURATION as LENDING_DURATION,
  defaultProps as lendingProps,
  schema as lendingSchema,
} from '../generated/components/nik-europe-worst-market/LendingIcon';

// Private render entry for RateIcons (nik-europe-worst-market; Cheeky Pint style (stout)): the interchange and lending
// rate icons as a centred pair on the line, plus each icon's seamless loop master.
// RateIcons: transparent overlay 1080x1920, 23.976 fps, 76 frames.
// InterchangeIcon, LendingIcon: transparent 1080x1080, 23.976 fps, 96 frames (one loop each).
export const RemotionRoot = () => (
  <>
    <Composition
      id="RateIcons"
      component={RateIcons}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Composition
      id="InterchangeIcon"
      component={InterchangeIcon}
      schema={interchangeSchema}
      defaultProps={interchangeProps}
      durationInFrames={INTERCHANGE_DURATION}
      fps={FPS}
      width={1080}
      height={1080}
    />
    <Composition
      id="LendingIcon"
      component={LendingIcon}
      schema={lendingSchema}
      defaultProps={lendingProps}
      durationInFrames={LENDING_DURATION}
      fps={FPS}
      width={1080}
      height={1080}
    />
  </>
);
