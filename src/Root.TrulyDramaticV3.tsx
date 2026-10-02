import {Composition} from 'remotion';
import TrulyDramaticV3, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/TrulyDramaticV3';

// Private render entry for the Logan Wright growth clip, V3 (china theme + the
// title flag; TrulyDramaticV3, S 829-1087), so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="TrulyDramaticV3"
      component={TrulyDramaticV3}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
