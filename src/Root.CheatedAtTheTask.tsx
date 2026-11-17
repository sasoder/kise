import {Composition} from 'remotion';
import CheatedAtTheTask, {DURATION, FPS, defaultProps, schema} from '../generated/components/paul-hugging-face/CheatedAtTheTask';

// Private render entry for CheatedAtTheTask (paul-hugging-face; Dwarkesh 3D style): a crowd of orange robots streams to the TASK strongbox and tugs its padlock, which stays locked, while two others round the side drop an unscrewed panel and pull out the glowing orange flag.
// Opaque 1080x1920, 23.976 fps, 164 frames.
export const RemotionRoot = () => (
  <Composition
    id="CheatedAtTheTask"
    component={CheatedAtTheTask}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
