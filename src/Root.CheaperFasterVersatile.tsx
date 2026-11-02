import {Composition} from 'remotion';
import CheaperFasterVersatile, {DURATION, FPS, defaultProps, schema} from '../generated/components/pushp-trailer/CheaperFasterVersatile';

// Private render entry for CheaperFasterVersatile (pushp-trailer; Core memory podcast style): Airbound's aircraft flies past three words and draws two pie charts with its own flight.
// Opaque 1920x1080, 23.976 fps, 218 frames.
export const RemotionRoot = () => (
  <Composition
    id="CheaperFasterVersatile"
    component={CheaperFasterVersatile}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
