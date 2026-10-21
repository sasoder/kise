import {Composition} from 'remotion';
import SlavesTurnTheCrane, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-rome-slavery/SlavesTurnTheCrane';

// Private render entry for SlavesTurnTheCrane (kyle-rome-slavery; Dwarkesh map style): the Roman treadwheel crane, two fettered slaves walking inside the wheel lower a marble drum onto a column; one crane-up.
// Opaque 1080x1920, 29.97 fps, 129 frames.
export const RemotionRoot = () => (
  <Composition
    id="SlavesTurnTheCrane"
    component={SlavesTurnTheCrane}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
