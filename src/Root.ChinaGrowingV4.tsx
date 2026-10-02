import {Composition} from 'remotion';
import ChinaGrowingV4, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ChinaGrowingV4';

// Private render entry for the Logan Wright growth clip, V4 (china theme + the
// title flag in world space; ChinaGrowingV4, S 0-368), so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="ChinaGrowingV4"
      component={ChinaGrowingV4}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
