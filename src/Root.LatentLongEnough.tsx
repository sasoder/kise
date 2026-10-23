import {Composition} from 'remotion';
import LatentLongEnough, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-covid/LatentLongEnough';

// Private render entry for LatentLongEnough (kyle-covid; Dwarkesh 3D style): a dolly down the metro carriage onto the
// cheerful Carrier whose lungs glow orange while he looks perfectly well; he chats to the woman beside him and his
// breath carries the orange specks to her. Opaque 1080x1920, 29.97 fps, 161 frames.
export const RemotionRoot = () => (
  <Composition
    id="LatentLongEnough"
    component={LatentLongEnough}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
