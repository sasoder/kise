import {Composition} from 'remotion';
import LeadNotRealistic, {DURATION, FPS, defaultProps, schema} from '../generated/components/paul-twelve-hours/LeadNotRealistic';

// Private render entry for LeadNotRealistic (paul-twelve-hours, S7; Paul world look C): cards flow off the unprotected US stack to China until the two stacks stand equal at the line and the lead bracket dashes out.
// Opaque 1080x1920, 23.976 fps, 158 frames.
export const RemotionRoot = () => (
  <Composition
    id="LeadNotRealistic"
    component={LeadNotRealistic}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
