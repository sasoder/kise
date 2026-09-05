import {Composition} from 'remotion';
import CrowdComesToIt, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/CrowdComesToIt';

// dario - always the first day — "what's going to catch on".
export const RemotionRoot = () => {
  return (
    <>
      {/* 0:21.219 -> 0:28.780, +tail */}
      <Composition
        id="CrowdComesToIt"
        component={CrowdComesToIt}
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
