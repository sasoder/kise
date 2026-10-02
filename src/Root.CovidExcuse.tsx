import {Composition} from 'remotion';
import CovidExcuse, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/CovidExcuse';

// Private render entry for the Logan Wright growth clip (CovidExcuse, S 601-829),
// so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="CovidExcuse"
      component={CovidExcuse}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
