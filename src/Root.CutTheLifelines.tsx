import {Composition} from 'remotion';
import CutTheLifelines, {DURATION, FPS, defaultProps, schema} from '../generated/components/sarah-pearl-harbor/CutTheLifelines';

// Private render entry for CutTheLifelines (Sarah Paine, Pearl Harbor clip,
// Dwarkesh map style): the aid routes into Nationalist China are cut — Japan's
// front seizes the Yunnan railway in Tonkin, a dashed closure bar stops the
// Burma Road — and Japan's imagined conquest sweeps over all of free China.
// Opaque, 1080x1920, 24 fps, 230 frames.
export const RemotionRoot = () => {
  return (
    <Composition
      id="CutTheLifelines"
      component={CutTheLifelines}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
