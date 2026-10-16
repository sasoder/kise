import {Composition} from 'remotion';
import LethalAdversary, {DURATION, FPS, defaultProps, schema} from '../generated/components/sarah-death-ground/LethalAdversary';

// Private render entry for LethalAdversary (Sarah Paine, "Death ground: why
// regime change is brutal", 44_LethalAdversary): a ruined town, scattered dim
// people driven into the breach by cream invader columns; they take up arms,
// turn orange, press outward, and the whole town behind the wall rises.
// Opaque umber page, 1080x1920, 24 fps, 224 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="LethalAdversary"
        component={LethalAdversary}
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
