import {Composition} from 'remotion';
import DepressionOpeningSPRev2, {DURATION, FPS, defaultProps, schema} from '../generated/components/sarah-pearl-harbor/DepressionOpeningSPRev2';

// Private render entry for DepressionOpeningSPRev2 (sarah-pearl-harbor; Dwarkesh map style): <one line on the picture>.
// Opaque 1080x1920, 24 fps, 132 frames.
export const RemotionRoot = () => (
  <Composition
    id="DepressionOpeningSPRev2"
    component={DepressionOpeningSPRev2}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
