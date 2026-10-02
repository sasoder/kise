import {Composition} from 'remotion';
import ChinaGrowingV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ChinaGrowingV2';

// Private render entry for the Logan Wright growth clip, V2 china theme
// (ChinaGrowingV2, S 0-368), so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="ChinaGrowingV2"
      component={ChinaGrowingV2}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
