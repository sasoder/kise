import {Composition} from 'remotion';
import IntelligenceDiluted, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-stupidest-species/IntelligenceDiluted';

// Private render entry for IntelligenceDiluted (rsi-stupidest-species; Dwarkesh 3D style): the glowing brain rises on an orange updraft until three ropes from the stomach, the pelvis and an immune cell clip onto it and drag it back down, dimming.
// Opaque 1080x1920, 23.976 fps, 101 frames.
export const RemotionRoot = () => (
  <Composition
    id="IntelligenceDiluted"
    component={IntelligenceDiluted}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
