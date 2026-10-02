import {Composition} from 'remotion';
import CovidExcuseV4, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/CovidExcuseV4';

// Private render entry for the Logan Wright growth clip, V4 (china theme + the
// title flag in world space; CovidExcuseV4, S 601-829), so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="CovidExcuseV4"
      component={CovidExcuseV4}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
