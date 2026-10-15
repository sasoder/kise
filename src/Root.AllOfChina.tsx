import {Composition} from 'remotion';
import AllOfChina, {DURATION, FPS, defaultProps, schema} from '../generated/components/AllOfChina';

// Private render entry for AllOfChina (Sarah Paine, Pearl Harbor clip, cut C):
// a dashed orange pen draws Japan's plan round all of China while the real
// conquest advances as one solid orange front out of Manchukuo and the Shanghai
// coast, decelerates and stalls on the 1938 front. Dwarkesh map style on the
// PearlKit ASIA world; opaque 1080x1920, 24 fps, 124 frames.
export const RemotionRoot = () => {
  return (
    <Composition
      id="AllOfChina"
      component={AllOfChina}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
