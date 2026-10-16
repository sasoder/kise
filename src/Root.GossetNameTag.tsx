import {Composition} from 'remotion';
import GossetNameTag, {DURATION, FPS, defaultProps, schema} from '../generated/components/kits/name-tags/GossetNameTag';

// Private render entry for Gosset's stout name tag (Cheeky Pint S4E02, Guinness t-test clip).
// TRANSPARENT ProRes 4444 overlay, 1080x1920, 24000/1001 fps, 64 frames; render --muted.
export const RemotionRoot = () => (
  <Composition id="GossetNameTag" component={GossetNameTag} schema={schema} defaultProps={defaultProps} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
);
