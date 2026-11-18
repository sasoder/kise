import {Composition} from 'remotion';
import WorthProbe, {defaultProps, schema} from '../generated/components/toto-worth-twelve/WorthProbe';

// Probe stills of toto-worth-twelve/worthShared (builder A): rest29, profit. 1080x1920, 25 fps, 1 frame.
export const RemotionRoot = () => (
  <Composition id="WorthProbe" component={WorthProbe} schema={schema} defaultProps={defaultProps} durationInFrames={1} fps={25} width={1080} height={1920} />
);
