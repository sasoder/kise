import {Composition} from 'remotion';
import BeachIconCoreMemory, {
  defaultProps as beachProps,
  schema as beachSchema,
} from '../generated/components/BeachIconCoreMemory';
import {
  BEACH_IN_FRAMES,
  LOOP_FRAMES,
} from '../generated/components/coreMemoryIcon';

// Private render entry for the beach icon, so it renders while other builders
// own src/Root.tsx.
//
// Two transparent overlay assets, 1080x1080 at 24fps. The editor plays `-In`
// once and then repeats `-Loop`: the In clip's last frame is loop frame 95 and
// the Loop clip starts at loop frame 0, so the cut is an ordinary step.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="BeachIconCoreMemory-In"
        component={BeachIconCoreMemory}
        schema={beachSchema}
        defaultProps={{...beachProps, mode: 'in' as const}}
        durationInFrames={BEACH_IN_FRAMES}
        fps={24}
        width={1080}
        height={1080}
      />
      <Composition
        id="BeachIconCoreMemory-Loop"
        component={BeachIconCoreMemory}
        schema={beachSchema}
        defaultProps={{...beachProps, mode: 'loop' as const}}
        durationInFrames={LOOP_FRAMES}
        fps={24}
        width={1080}
        height={1080}
      />
    </>
  );
};
