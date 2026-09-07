import {Composition} from 'remotion';
import InTheDarkAboutTheScope, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/InTheDarkAboutTheScope';

// the crowd, one lit patch, and the dark — "all of this happened while humans
// remained more or less in the dark about the scope of the conspiracy."
export const RemotionRoot = () => {
  return (
    <>
      {/* 0:13.000 -> 0:17.899 (+16 frame tail) */}
      <Composition
        id="InTheDarkAboutTheScope"
        component={InTheDarkAboutTheScope}
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
