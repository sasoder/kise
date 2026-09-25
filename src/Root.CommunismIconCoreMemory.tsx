import {Composition} from 'remotion';
import CommunismIconCoreMemory, {
  defaultProps as communismProps,
  schema as communismSchema,
} from '../generated/components/CommunismIconCoreMemory';
import {
  COMMUNISM_IN_FRAMES,
  LOOP_FRAMES,
} from '../generated/components/coreMemoryIcon';

// Private render entry for the hammer and sickle icon, so it renders while
// other builders own src/Root.tsx.
//
// Two transparent overlay assets, 1080x1080 at 24fps. The editor plays `-In`
// once and then repeats `-Loop`: the In clip's last frame is loop frame 95 and
// the Loop clip starts at loop frame 0, so the cut is an ordinary step.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="CommunismIconCoreMemory-In"
        component={CommunismIconCoreMemory}
        schema={communismSchema}
        defaultProps={{...communismProps, mode: 'in' as const}}
        durationInFrames={COMMUNISM_IN_FRAMES}
        fps={24}
        width={1080}
        height={1080}
      />
      <Composition
        id="CommunismIconCoreMemory-Loop"
        component={CommunismIconCoreMemory}
        schema={communismSchema}
        defaultProps={{...communismProps, mode: 'loop' as const}}
        durationInFrames={LOOP_FRAMES}
        fps={24}
        width={1080}
        height={1080}
      />
    </>
  );
};
