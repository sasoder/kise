import {Composition} from 'remotion';
import NumberOfCountries, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-nolan-uranium/NumberOfCountries';

// Private render entry for NumberOfCountries (scott-nolan-uranium; Cheeky Pint style (stout)): a glass centrifuge pulls back into a hall on the US, then a map where 15 countries warm to amber and raise machines.
// Opaque 1080x1920, 23.976 fps, 65 frames.
export const RemotionRoot = () => (
  <Composition
    id="NumberOfCountries"
    component={NumberOfCountries}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
