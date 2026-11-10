import {Composition} from 'remotion';
import ConnectingAdjacentFields, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-fall-of-gods/ConnectingAdjacentFields';

// Private render entry for ConnectingAdjacentFields (rsi-fall-of-gods; Dwarkesh style): the AI at the hub keeps threading neighbouring fields together and every link buds orange fruit.
// Opaque 1080x1920, 23.976 fps, 168 frames.
export const RemotionRoot = () => (
  <Composition
    id="ConnectingAdjacentFields"
    component={ConnectingAdjacentFields}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
