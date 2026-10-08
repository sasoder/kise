import {Composition} from 'remotion';
import HadrianLogoSting, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/HadrianLogoSting';

// Private render entry for HadrianLogoSting: the Hadrian wordmark as a core
// memory logo sting with one glint, TRANSPARENT overlay on factory b-roll,
// 1080x1920, 24 fps, 71 frames.

export const RemotionRoot = () => {
  return (
    <Composition
      id="HadrianLogoSting"
      component={HadrianLogoSting}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
