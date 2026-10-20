import {Composition} from 'remotion';
import BillionsNothingFielded, {DURATION, FPS, defaultProps, schema} from '../generated/components/zach-shore-trailer/BillionsNothingFielded';

// Private render entry for BillionsNothingFielded (zach-shore-trailer; Core memory podcast style): a cash tower climbs, the camera pans to three empty hollow-jet parking spots.
// Opaque 2048x1080, 23.976 fps, 95 frames.
export const RemotionRoot = () => (
  <Composition
    id="BillionsNothingFielded"
    component={BillionsNothingFielded}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={2048}
    height={1080}
  />
);
