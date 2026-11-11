import {Composition} from 'remotion';
import DerpySavantInterns, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-derpy-interns/DerpySavantInterns';

// Private render entry for DerpySavantInterns (rsi-derpy-interns; Dwarkesh style): the intern holds up its solved card, goes derpy, winks, and a DAY 1 sign drops over its head.
// Opaque 1080x1920, 23.976 fps, 149 frames.
export const RemotionRoot = () => (
  <Composition
    id="DerpySavantInterns"
    component={DerpySavantInterns}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
