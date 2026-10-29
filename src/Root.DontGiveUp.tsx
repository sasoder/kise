import {Composition} from 'remotion';
import DontGiveUp, {DURATION, FPS, defaultProps, schema} from '../generated/components/sarah-insurgency/DontGiveUp';

// Private render entry for DontGiveUp (sarah-insurgency; Dwarkesh 3D style): the invader topples the army, its pawns rise round him.
// Opaque 1080x1920, 24 fps, 91 frames.
export const RemotionRoot = () => (
  <Composition
    id="DontGiveUp"
    component={DontGiveUp}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
