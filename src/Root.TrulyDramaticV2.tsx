import {Composition} from 'remotion';
import TrulyDramaticV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/TrulyDramaticV2';

// Private render entry for the Logan Wright growth clip, V2 china theme
// (TrulyDramaticV2, S 829-1087), so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="TrulyDramaticV2"
      component={TrulyDramaticV2}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
