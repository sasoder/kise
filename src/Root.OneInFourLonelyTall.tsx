import {Composition} from 'remotion';
import OneInFourLonelyTall, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/cm-early-js-trailer/OneInFourLonelyTall';

// Private render entry for the 9:16 version of cut 5 of the CM_EARLY_JS
// trailer (OneInFourLonelyTall, 1080x1920, 24000/1001 fps), so it renders
// without src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="OneInFourLonelyTall"
      component={OneInFourLonelyTall}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
