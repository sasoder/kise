import {Composition} from 'remotion';
import {FPS, H, SKYROOT_PROBE_DURATION, SkyrootProbe, W} from '../generated/components/skyroot-trailer/skyrootShared';

// Private render entry for the skyroot-trailer world builder's probe: every cut-out (Vikram-1, LVM3, the Earth disc,
// the ISRO and Skyroot marks) on the paper with film life and the caption bands. Opaque 2048x1080 at 23.976 fps.
export const RemotionRoot = () => {
  return <Composition id="SkyrootProbe" component={SkyrootProbe} durationInFrames={SKYROOT_PROBE_DURATION} fps={FPS} width={W} height={H} />;
};
