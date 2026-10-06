import {Composition} from 'remotion';
import TiedToTheDataTall, {DURATION, FPS, defaultProps, schema} from '../generated/components/TiedToTheDataTall';

// Private render entry for the Bharat "Project Maven's data problem" clip,
// cut D in 9:16 (TiedToTheDataTall), so it renders while other builders own
// src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="TiedToTheDataTall"
      component={TiedToTheDataTall}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
