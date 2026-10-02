import {Composition} from 'remotion';
import CtaWatchHere, {DURATION, FPS, defaultProps, schema} from '../generated/components/CtaWatchHere';

// Private render entry for the stout "Watch here" end card (transparent overlay),
// so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => (
  <Composition id="CtaWatchHere" component={CtaWatchHere} schema={schema} defaultProps={defaultProps} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
);
