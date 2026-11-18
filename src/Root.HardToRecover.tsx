import {Composition} from 'remotion';
import HardToRecover, {DURATION, FPS, defaultProps, schema} from '../generated/components/paul-hugging-face/HardToRecover';

// Private render entry for HardToRecover (paul-hugging-face, cut G, look C on the shared world): a clay globe whose
// land the AIs' orange takes over from a few robots, a last patch with houses swallowed on "recover".
// Opaque 1080x1920, 23.976 fps, 82 frames.
export const RemotionRoot = () => (
  <Composition
    id="HardToRecover"
    component={HardToRecover}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
