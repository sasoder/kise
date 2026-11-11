import {Composition} from 'remotion';
import SquadThenDips, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-taylor-swift/SquadThenDips';

// Private render entry for SquadThenDips (wip-taylor-swift; Works in Progress style): five friends rise round Taylor, she dips out, leaving a gap.
// Opaque 1080x1920, 24 fps, 107 frames.
export const RemotionRoot = () => (
  <Composition
    id="SquadThenDips"
    component={SquadThenDips}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
