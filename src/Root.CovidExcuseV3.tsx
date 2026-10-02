import {Composition} from 'remotion';
import CovidExcuseV3, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/CovidExcuseV3';

// Private render entry for the Logan Wright growth clip, V3 (china theme + the
// title flag; CovidExcuseV3, S 601-829), so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="CovidExcuseV3"
      component={CovidExcuseV3}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
