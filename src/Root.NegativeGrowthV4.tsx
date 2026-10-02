import {Composition} from 'remotion';
import NegativeGrowthV4, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/NegativeGrowthV4';

// Private render entry for the Logan Wright growth clip, V4 (china theme + the
// title flag in world space; NegativeGrowthV4, S 353-601), so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="NegativeGrowthV4"
      component={NegativeGrowthV4}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
