import {Composition} from 'remotion';
import LondonToNewYorkPortrait, {DURATION, FPS, defaultProps, schema} from '../generated/components/zach-shore-trailer-portrait/LondonToNewYorkPortrait';

// Private render entry for LondonToNewYorkPortrait (zach-shore-trailer-portrait; Core memory podcast style): A portrait North Atlantic journey with the fast jet arriving before the airliner..
// Opaque 1080x1920, 23.976 fps, 90 frames.
export const RemotionRoot = () => (
  <Composition
    id="LondonToNewYorkPortrait"
    component={LondonToNewYorkPortrait}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
