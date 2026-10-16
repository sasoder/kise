import {Composition} from 'remotion';
import ArrivedAtTheDoorstep, {DURATION, FPS, defaultProps, schema} from '../generated/components/sheppard-capture-not-kill/ArrivedAtTheDoorstep';

// Private render entry for ArrivedAtTheDoorstep (Si Sheppard, "Capture, not
// kill"): three cream carracks reach the anchorage off San Juan de Ulua while
// the camera pulls back inland and the 1519 Aztec empire rises in orange,
// bristling with shields. Opaque map, 1080x1920, 23.976 fps, 150 frames.
export const RemotionRoot = () => {
  return (
    <Composition
      id="ArrivedAtTheDoorstep"
      component={ArrivedAtTheDoorstep}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
