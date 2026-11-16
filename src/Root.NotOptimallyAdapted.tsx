import {Composition} from 'remotion';
import NotOptimallyAdapted, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-stupidest-species/NotOptimallyAdapted';

// Private render entry for NotOptimallyAdapted (rsi-stupidest-species, revision 1; Dwarkesh 3D style, cut B's staircase world): the clumsy fire-keeper. He smothers his campfire with a far-too-big branch, the nearest lamp bowls dim, he fans and blows, singes his hand, and the fire barely comes back; one push-in and crane down to a medium close of him and his fire.
// Opaque 1080x1920, 23.976 fps, 73 frames.
export const RemotionRoot = () => (
  <Composition
    id="NotOptimallyAdapted"
    component={NotOptimallyAdapted}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
