import {Composition} from 'remotion';
import NegativeGrowthV3, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/NegativeGrowthV3';

// Private render entry for the Logan Wright growth clip, V3 (china theme + the
// title flag; NegativeGrowthV3, S 353-601), so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="NegativeGrowthV3"
      component={NegativeGrowthV3}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
