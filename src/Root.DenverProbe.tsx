import {Composition} from 'remotion';
import DenverProbe, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-weather-fired/DenverProbe';

// Private render entry for the Denver world's probe stills (scott-weather-fired): one probe per frame.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="DenverProbe"
        component={DenverProbe}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
