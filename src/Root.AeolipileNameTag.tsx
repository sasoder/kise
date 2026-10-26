import {Composition} from 'remotion';
import AeolipileNameTag, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-rome-industrial/AeolipileNameTag';

// Private render entry for AeolipileNameTag (kyle-rome-industrial; Name tag): "Hero's aeolipile / Early steam turbine, Alexandria, 1st century AD" over cut 125's aeolipile.
// Transparent overlay 1080x1920, 29.97 fps, 76 frames.
export const RemotionRoot = () => (
  <Composition
    id="AeolipileNameTag"
    component={AeolipileNameTag}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
