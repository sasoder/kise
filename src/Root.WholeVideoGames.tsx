import {Composition} from 'remotion';
import WholeVideoGames, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-another-jump/WholeVideoGames';

// Private render entry for WholeVideoGames (rsi-another-jump; Dwarkesh style): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 149 frames.
export const RemotionRoot = () => (
  <Composition
    id="WholeVideoGames"
    component={WholeVideoGames}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
