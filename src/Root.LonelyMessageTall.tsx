import {Composition} from 'remotion';
import LonelyMessageTall, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/cm-early-js-trailer/LonelyMessageTall';

// Private render entry for "LonelyMessageTall" (CM_EARLY_JS trailer, the
// 1080x1920 version of LonelyMessage, 24000/1001 fps), so it renders without
// src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="LonelyMessageTall"
      component={LonelyMessageTall}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
