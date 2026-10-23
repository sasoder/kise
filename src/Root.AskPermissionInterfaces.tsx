import {Composition} from 'remotion';
import AskPermissionInterfaces, {DURATION, FPS, defaultProps, schema} from '../generated/components/zach-superpower/AskPermissionInterfaces';

// Private render entry for AskPermissionInterfaces (zach-superpower; Core memory podcast style): the sergeant's question climbing the chain of command while the squad is pinned.
// Opaque 1080x1920, 23.976 fps, 128 frames.
export const RemotionRoot = () => (
  <Composition
    id="AskPermissionInterfaces"
    component={AskPermissionInterfaces}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
