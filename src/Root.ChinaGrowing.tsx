import {Composition} from 'remotion';
import ChinaGrowing, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ChinaGrowing';

// Private render entry for the Logan Wright growth clip (ChinaGrowing, S 0-368),
// so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="ChinaGrowing"
      component={ChinaGrowing}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
