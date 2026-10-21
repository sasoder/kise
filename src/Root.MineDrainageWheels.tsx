import {Composition} from 'remotion';
import MineDrainageWheels, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-rome-slavery/MineDrainageWheels';

// Private render entry for MineDrainageWheels (kyle-rome-slavery; Dwarkesh map style): a cutaway stair of six orange Roman mine drainage wheels, a fettered slave treading each; one crane rise with a pull-back.
// Opaque 1080x1920, 29.97 fps, 129 frames.
export const RemotionRoot = () => (
  <Composition
    id="MineDrainageWheels"
    component={MineDrainageWheels}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
