import {Composition} from 'remotion';
import BigSwathsNoJob, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/BigSwathsNoJob';
import BigSwathsGlyphSheet from '../generated/components/bigSwathsSheet';

// Private render entry for Jordan Schneider "Hu Jintao's 25 million jobs",
// graphic B (48_BigSwathsNoJob), so it renders while other builders own
// src/Root.tsx. BigSwathsGlyphSheet is a one-frame drawing check of the icon set.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="BigSwathsNoJob"
        component={BigSwathsNoJob}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="BigSwathsGlyphSheet"
        component={BigSwathsGlyphSheet}
        durationInFrames={1}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
