import {Composition} from 'remotion';
import ServerIconCoreMemory, {
  defaultProps as serverProps,
  schema as serverSchema,
} from '../generated/components/ServerIconCoreMemory';
import PowerIconCoreMemory, {
  defaultProps as powerProps,
  schema as powerSchema,
} from '../generated/components/PowerIconCoreMemory';
import {
  POWER_IN_FRAMES,
  LOOP_FRAMES,
  SERVER_IN_FRAMES,
} from '../generated/components/coreMemoryIcon';

// Private render entry for the core memory versions of the two approved icon
// loops, so they render while another builder owns src/Root.tsx.
//
// Four transparent overlay assets, all 1080x1080 at 24fps. The editor plays
// `_In` once and then repeats `_Loop`, so the In clips are cut so that their
// last frame is loop frame 95 and the Loop clips start at loop frame 0.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ServerIconCoreMemory-In"
        component={ServerIconCoreMemory}
        schema={serverSchema}
        defaultProps={{...serverProps, mode: 'in' as const}}
        durationInFrames={SERVER_IN_FRAMES}
        fps={24}
        width={1080}
        height={1080}
      />
      <Composition
        id="ServerIconCoreMemory-Loop"
        component={ServerIconCoreMemory}
        schema={serverSchema}
        defaultProps={{...serverProps, mode: 'loop' as const}}
        durationInFrames={LOOP_FRAMES}
        fps={24}
        width={1080}
        height={1080}
      />
      <Composition
        id="PowerIconCoreMemory-In"
        component={PowerIconCoreMemory}
        schema={powerSchema}
        defaultProps={{...powerProps, mode: 'in' as const}}
        durationInFrames={POWER_IN_FRAMES}
        fps={24}
        width={1080}
        height={1080}
      />
      <Composition
        id="PowerIconCoreMemory-Loop"
        component={PowerIconCoreMemory}
        schema={powerSchema}
        defaultProps={{...powerProps, mode: 'loop' as const}}
        durationInFrames={LOOP_FRAMES}
        fps={24}
        width={1080}
        height={1080}
      />
    </>
  );
};
