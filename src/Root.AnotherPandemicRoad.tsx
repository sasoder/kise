import {Composition} from 'remotion';
import AnotherPandemicRoad, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-pandemics/AnotherPandemicRoad';

// Private render entry for AnotherPandemicRoad (kyle-pandemics; Dwarkesh map style): a dolly down a road of standing stones carved
// 1918, 1957, 1968, 2009, 2020 to the next, blank stone, where an infected greylag lands (bird flu).
// Opaque 1080x1920, 29.97 fps, 159 frames.
export const RemotionRoot = () => (
  <Composition
    id="AnotherPandemicRoad"
    component={AnotherPandemicRoad}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
