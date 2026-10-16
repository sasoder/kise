import {Composition} from 'remotion';
import AnotherPandemic, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/kyle-plague/AnotherPandemic';

// Private render entry for AnotherPandemic (plague clip): a row of pandemic
// marker posts on a ruler of years, and an orange one rising. 1080x1920, 29.97 fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="AnotherPandemic"
        component={AnotherPandemic}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
