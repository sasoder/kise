import {Composition} from 'remotion';
import OwnTheWholeStack, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-neobanks-us/OwnTheWholeStack';

// Private render entry for OwnTheWholeStack (nik-neobanks-us; Cheeky Pint style (stout)): one amber stack, the bank license rising under it, and a pile of paperwork towering beside it.
// Opaque 1080x1920, 23.976 fps, 169 frames.
export const RemotionRoot = () => (
  <Composition
    id="OwnTheWholeStack"
    component={OwnTheWholeStack}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
