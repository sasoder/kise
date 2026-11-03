import {Composition} from 'remotion';
import WhatTypeOfEnergy, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-nolan-wind/WhatTypeOfEnergy';

// Private render entry for WhatTypeOfEnergy (scott-nolan-wind; Cheeky Pint style (stout)): the five plants in a row, a data center below, its plug drifting along the row without seating.
// Opaque 1080x1920, 23.976 fps, 57 frames.
export const RemotionRoot = () => (
  <Composition
    id="WhatTypeOfEnergy"
    component={WhatTypeOfEnergy}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
