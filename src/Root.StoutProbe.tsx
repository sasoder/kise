import {Composition} from 'remotion';
import StoutProbe, {defaultProps, schema} from '../generated/components/StoutProbe';

// Private entry: the stout crest-measuring sheet (look development only).
export const RemotionRoot = () => (
  <Composition id="StoutProbe" component={StoutProbe} schema={schema} defaultProps={defaultProps} durationInFrames={1} fps={24} width={1080} height={1920} />
);
