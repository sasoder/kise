import {Composition} from 'remotion';
import NewNormalFleet, {DURATION, FPS, defaultProps, schema} from '../generated/components/mikkel-trailer/NewNormalFleet';

// Private render entry for NewNormalFleet (mikkel-trailer; Core memory podcast style): a sky full of Sceye airships going about their day over Mt Fuji and the Shinkansen line, one slow establishing drift.
// Opaque 2048x1080, 23.976 fps, 101 frames.
export const RemotionRoot = () => (
  <Composition
    id="NewNormalFleet"
    component={NewNormalFleet}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={2048}
    height={1080}
  />
);
