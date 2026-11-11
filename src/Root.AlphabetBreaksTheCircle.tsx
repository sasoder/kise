import {Composition} from 'remotion';
import AlphabetBreaksTheCircle, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-biblical/AlphabetBreaksTheCircle';

// Private render entry for AlphabetBreaksTheCircle (wip-biblical; Works in Progress style): the tribe circle breaks and its people are set down in a row under Phoenician letters.
// Opaque 1080x1920, 24 fps, 138 frames.
export const RemotionRoot = () => (
  <Composition
    id="AlphabetBreaksTheCircle"
    component={AlphabetBreaksTheCircle}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
