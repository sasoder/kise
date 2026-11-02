import {Composition} from 'remotion';
import CheaperFasterVersatilePortrait, {DURATION, FPS, defaultProps, schema} from '../generated/components/pushp-trailer/CheaperFasterVersatilePortrait';

// Private render entry for CheaperFasterVersatilePortrait (pushp-trailer, cut 8, 9:16; Core memory podcast style): the portrait twin of CheaperFasterVersatile.
// Opaque 1080x1920, 23.976 fps, 218 frames.
export const RemotionRoot = () => (
  <Composition
    id="CheaperFasterVersatilePortrait"
    component={CheaperFasterVersatilePortrait}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
