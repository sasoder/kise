import {Composition} from 'remotion';
import HarvardReport, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/cm-early-js-trailer/HarvardReport';

// Private render entry for cut 2 of the CM_EARLY_JS trailer
// (HarvardReport, 1080x1920, 24000/1001 fps), so it renders without
// src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="HarvardReport"
      component={HarvardReport}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
