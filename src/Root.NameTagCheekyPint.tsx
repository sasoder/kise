import {Composition} from 'remotion';
import NameTagCheekyPint, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/NameTagCheekyPint';

// Private render entry for Toto Wolff's Cheeky Pint name tag (five options via the
// `variant` prop), so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="NameTagCheekyPint"
      component={NameTagCheekyPint}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
