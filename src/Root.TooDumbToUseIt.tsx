import {Composition} from 'remotion';
import TooDumbToUseIt, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-since-writing/TooDumbToUseIt';

// Private render entry for TooDumbToUseIt (rsi-since-writing; Dwarkesh 3D style): the Genius types, his sheets crumple into a grey heap.
// Opaque 1080x1920, 23.976 fps, 83 frames.
export const RemotionRoot = () => (
  <Composition
    id="TooDumbToUseIt"
    component={TooDumbToUseIt}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
