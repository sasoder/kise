import {Composition} from 'remotion';
import DarkAboutTheScope, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/DarkAboutTheScope';

// three secret ai societies — "all of this happened while humans remained more
// or less in the dark about the scope of the conspiracy."
export const RemotionRoot = () => {
  return (
    <>
      {/* 0:13.000 -> 0:17.899 (+16 frame tail) */}
      <Composition
        id="DarkAboutTheScope"
        component={DarkAboutTheScope}
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
