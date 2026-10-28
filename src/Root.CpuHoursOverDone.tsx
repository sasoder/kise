import {Composition} from 'remotion';
import CpuHoursOverDone, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-pricing-tokens/CpuHoursOverDone';

// Private render entry for CpuHoursOverDone (sam-pricing-tokens; Cheeky Pint style (stout)): a real CPU lying on the board, its tall amber bill rising from behind it under a ticking hour meter, outbills a cheaper "done" check card.
// Opaque 1080x1920, 23.976 fps, 83 frames.
export const RemotionRoot = () => (
  <Composition
    id="CpuHoursOverDone"
    component={CpuHoursOverDone}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
