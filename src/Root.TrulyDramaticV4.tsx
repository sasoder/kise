import {Composition} from 'remotion';
import TrulyDramaticV4, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/TrulyDramaticV4';

// Private render entry for the Logan Wright growth clip, V4 (china theme + the
// title flag in world space; TrulyDramaticV4, S 829-1087), so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="TrulyDramaticV4"
      component={TrulyDramaticV4}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
