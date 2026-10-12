import {Composition} from 'remotion';
import BiofilmCircle, {DURATION, FPS, defaultProps, schema} from '../generated/components/BiofilmCircle';

// Private render entry for the pen circle over the blocked-flea photo (plague clip).
export const RemotionRoot = () => {
  return (
    <Composition
      id="BiofilmCircle"
      component={BiofilmCircle}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
