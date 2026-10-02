import {Composition} from 'remotion';
import ChinaGrowingV3, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ChinaGrowingV3';

// Private render entry for the Logan Wright growth clip, V3 (china theme + the
// title flag; ChinaGrowingV3, S 0-368), so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="ChinaGrowingV3"
      component={ChinaGrowingV3}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
