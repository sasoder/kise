import {Composition} from 'remotion';
import StoutFrames, {defaultProps, schema} from '../generated/components/StoutFrames';

// Private render entry for the stout style frames (stills only: prop `frame`),
// so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => (
  <Composition id="StoutFrames" component={StoutFrames} schema={schema} defaultProps={defaultProps} durationInFrames={1} fps={24} width={1080} height={1920} />
);
