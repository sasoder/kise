import {Composition} from 'remotion';
import TonOfData, {DURATION, FPS, defaultProps, schema} from '../generated/components/TonOfData';

// Private render entry for Bharat Maven V3 (TonOfData), so it renders while other builders own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition id="TonOfData" component={TonOfData} schema={schema} defaultProps={defaultProps} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
  );
};
