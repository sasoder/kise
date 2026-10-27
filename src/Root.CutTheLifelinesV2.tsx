import {Composition} from 'remotion';
import CutTheLifelinesV2, {DURATION, FPS, defaultProps, schema} from '../generated/components/sarah-pearl-harbor/CutTheLifelinesV2';

// Private render entry for CutTheLifelinesV2 (cold-review V2 of CutTheLifelines,
// Sarah Paine Pearl Harbor clip, Dwarkesh map style). Opaque, 1080x1920, 24 fps, 230 frames.
export const RemotionRoot = () => {
  return (
    <Composition
      id="CutTheLifelinesV2"
      component={CutTheLifelinesV2}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
