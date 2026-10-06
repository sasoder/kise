import {Composition} from 'remotion';
import TitleCardCheekyPint, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/TitleCardCheekyPint';

// Private render entry for the Cheeky Pint opening title card (transparent overlay),
// so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="TitleCardCheekyPint"
      component={TitleCardCheekyPint}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
