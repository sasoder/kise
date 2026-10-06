import {Composition} from 'remotion';
import MavenKitStill, {DURATION, FPS, defaultProps, schema} from '../generated/components/MavenKitStill';

// Private entry: the still of every mavenKit component (Bharat Maven V3).
export const RemotionRoot = () => {
  return (
    <Composition id="MavenKitStill" component={MavenKitStill} schema={schema} defaultProps={defaultProps} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
  );
};
