import {Composition} from 'remotion';
import GapWiderEveryDay, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-free-wifi/GapWiderEveryDay';

// Private render entry for GapWiderEveryDay (scott-free-wifi; Cheeky Pint style, cruise sky): United climbs away from the pack, the contrail wedge widens.
// Opaque 1080x1920, 23.976 fps, 95 frames.
export const RemotionRoot = () => (
  <Composition
    id="GapWiderEveryDay"
    component={GapWiderEveryDay}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
