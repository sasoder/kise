import {Composition} from 'remotion';
import MarineKnowsWhatToDo, {DURATION, FPS, defaultProps, schema} from '../generated/components/zach-superpower/MarineKnowsWhatToDo';

// Private render entry for MarineKnowsWhatToDo (zach-superpower; Core memory podcast style): cut 51's pinned squad, under American doctrine: the sergeant lowers the handset, points, and the squad moves round the flank.
// Opaque 1080x1920, 23.976 fps, 116 frames.
export const RemotionRoot = () => (
  <Composition
    id="MarineKnowsWhatToDo"
    component={MarineKnowsWhatToDo}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
