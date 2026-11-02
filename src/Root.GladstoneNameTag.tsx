import {Composition} from 'remotion';
import GladstoneNameTag, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-victorians/GladstoneNameTag';

// Private render entry for GladstoneNameTag (wip-victorians; Name tag): William Gladstone named as a four-time Prime Minister.
// Transparent overlay 1080x1920, 24 fps, 63 frames.
export const RemotionRoot = () => (
  <Composition
    id="GladstoneNameTag"
    component={GladstoneNameTag}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
