import {Composition} from 'remotion';
import ComputePerResearcher, {DURATION, FPS, defaultProps, schema} from '../generated/components/meta-talent-density/ComputePerResearcher';

// Private render entry for ComputePerResearcher (Cheeky Pint S4E03 "Talent density beat team size", cut 4,
// stout): opaque 1080x1920 at 23.976 fps, 260-frame slot + 12-frame tail.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ComputePerResearcher"
        component={ComputePerResearcher}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
