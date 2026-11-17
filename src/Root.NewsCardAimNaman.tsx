import {Composition} from 'remotion';
import NewsCardAimNaman, {DURATION, FPS, defaultProps, schema} from '../generated/components/shruti-trailer/NewsCardAimNaman';

// Private render entry for NewsCardAimNaman (shruti-trailer; Core memory podcast style): the AIM article on Naman (age 20, drones) as a news card on the squared paper, layout A or B.
// Opaque 1920x1080, 23.976 fps, 1 frames.
export const RemotionRoot = () => (
  <Composition
    id="NewsCardAimNaman"
    component={NewsCardAimNaman}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
