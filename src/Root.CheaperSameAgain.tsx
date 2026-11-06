import {Composition} from 'remotion';
import CheaperSameAgain, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-entertainment/CheaperSameAgain';

// Private render entry for CheaperSameAgain (wip-entertainment; Works in Progress style): a fat stack of bills pulled away a wad at a time beside the Despicable Me poster, then the poster photocopied again and again into a heap.
// Opaque 1080x1920, 24 fps, 194 frames.
export const RemotionRoot = () => (
  <Composition
    id="CheaperSameAgain"
    component={CheaperSameAgain}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
