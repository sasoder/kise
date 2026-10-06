import {Composition} from 'remotion';
import EnoughRelevantData, {DURATION, FPS, defaultProps, schema} from '../generated/components/EnoughRelevantData';

// Private render entry for Bharat Maven V3 (EnoughRelevantData), so it renders while other builders own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition id="EnoughRelevantData" component={EnoughRelevantData} schema={schema} defaultProps={defaultProps} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
  );
};
