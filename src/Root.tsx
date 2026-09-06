import {Composition} from 'remotion';
import HumansInTheDark, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/HumansInTheDark';

// three secret ai societies — "all of this happened while humans remained more
// or less in the dark about the scope of the conspiracy." Opens on the resolved
// frame of ThreeSecretSocieties.
export const RemotionRoot = () => {
  return (
    <>
      {/* 0:13.000 -> 0:17.899 (+10 frame tail) */}
      <Composition
        id="HumansInTheDark"
        component={HumansInTheDark}
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
