import {Composition} from 'remotion';
import OverwhelmingNumbers, {DURATION, FPS, defaultProps, schema} from '../generated/components/OverwhelmingNumbers';

// Private render entry for OverwhelmingNumbers (Si Sheppard, "Conquistador
// Advantages", cut C): one pull-back off the Spanish company (200 orange dots)
// to the allied host behind it (40,000 cream dots in companies). Opaque umber
// page, 1080x1920, 23.976 fps, 89 frames.
export const RemotionRoot = () => {
  return (
    <Composition
      id="OverwhelmingNumbers"
      component={OverwhelmingNumbers}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
