import {Composition} from 'remotion';
import HalfTheContinent, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-plague/HalfTheContinent';

// Private render entry for HalfTheContinent (plague clip, the map cut): one
// zoom out from Muetzel's marmot plate to the Earth, Europe half orange.
// Opaque, 1080x1920, 29.97 fps, 235 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HalfTheContinent"
        component={HalfTheContinent}
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
