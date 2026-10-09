import {Composition} from 'remotion';
import EightyKeysTall, {DURATION, FPS, defaultProps, schema} from '../generated/components/EightyKeysTall';

// Private render entry for the Brent / Cerro Gordo trailer cut 4, 9:16
// (EightyKeysTall, 1080x1920), so it renders while other builders own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="EightyKeysTall"
      component={EightyKeysTall}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
