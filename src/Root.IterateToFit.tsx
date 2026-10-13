import {Composition} from 'remotion';
import IterateToFit, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/IterateToFit';

// Private render entry for IterateToFit (Cheeky Pint S4, stout system), so it renders while other
// sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="IterateToFit"
      component={IterateToFit}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
