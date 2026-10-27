import {Composition} from 'remotion';
import BillionsNothingFieldedPortrait, {DURATION, FPS, defaultProps, schema} from '../generated/components/zach-shore-trailer-portrait/BillionsNothingFieldedPortrait';

// Private render entry for BillionsNothingFieldedPortrait (zach-shore-trailer-portrait; Core memory podcast style): growing money tower beside three vertically arranged empty aircraft bays.
// Opaque 1080x1920, 23.976 fps, 95 frames.
export const RemotionRoot = () => (
  <Composition
    id="BillionsNothingFieldedPortrait"
    component={BillionsNothingFieldedPortrait}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
