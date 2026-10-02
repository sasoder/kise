import {Composition} from 'remotion';
import NegativeGrowth, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/NegativeGrowth';

// Private render entry for the Logan Wright growth clip (NegativeGrowth, S 353-601),
// so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="NegativeGrowth"
      component={NegativeGrowth}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
