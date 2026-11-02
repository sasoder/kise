import {Composition} from 'remotion';
import BalfourNameTag, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-victorians/BalfourNameTag';

// Private render entry for BalfourNameTag (wip-victorians; Name tag): Arthur Balfour named as Prime Minister, 1902–05.
// Transparent overlay 1080x1920, 24 fps, 71 frames.
export const RemotionRoot = () => (
  <Composition
    id="BalfourNameTag"
    component={BalfourNameTag}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
