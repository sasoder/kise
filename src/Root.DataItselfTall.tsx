import {Composition} from 'remotion';
import DataItselfTall, {DURATION, FPS, defaultProps, schema} from '../generated/components/DataItselfTall';

// Private render entry for Bharat "Project Maven's data problem" cut A, 9:16
// (DataItselfTall, 1080x1920), so it renders while other builders own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="DataItselfTall"
      component={DataItselfTall}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
