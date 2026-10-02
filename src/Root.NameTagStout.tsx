import {Composition} from 'remotion';
import NameTagStout, {DURATION, FPS, defaultProps, schema} from '../generated/components/NameTagStout';

// Private render entry for the stout name tag (transparent overlay), so it
// renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => (
  <Composition id="NameTagStout" component={NameTagStout} schema={schema} defaultProps={defaultProps} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
);
