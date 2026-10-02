import {Composition} from 'remotion';
import CovidExcuseV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/CovidExcuseV2';

// Private render entry for the Logan Wright growth clip, V2 china theme
// (CovidExcuseV2, S 601-829), so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="CovidExcuseV2"
      component={CovidExcuseV2}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
