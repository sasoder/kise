import {Composition} from 'remotion';
import MuseHomeRun, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/MuseHomeRun';

// Private render entry for the Cheeky Pint S4 "Muse home run" cut (MuseHomeRun, stout system),
// so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="MuseHomeRun"
      component={MuseHomeRun}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
