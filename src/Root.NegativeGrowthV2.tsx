import {Composition} from 'remotion';
import NegativeGrowthV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/NegativeGrowthV2';

// Private render entry for the Logan Wright growth clip, V2 china theme
// (NegativeGrowthV2, S 353-601), so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="NegativeGrowthV2"
      component={NegativeGrowthV2}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
