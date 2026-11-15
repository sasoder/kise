import {Composition} from 'remotion';
import ChipTicksNeuronFires, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-since-writing/ChipTicksNeuronFires';

// Private render entry for ChipTicksNeuronFires (rsi-since-writing; Dwarkesh 3D style): a chip counts 1,000,000 clock ticks while one pulse crosses a neuron and it fires once.
// Opaque 1080x1920, 23.976 fps, 114 frames.
export const RemotionRoot = () => (
  <Composition
    id="ChipTicksNeuronFires"
    component={ChipTicksNeuronFires}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
