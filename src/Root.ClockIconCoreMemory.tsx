import {Composition} from 'remotion';
import ClockIconCoreMemory, {
  defaultProps as clockProps,
  schema as clockSchema,
} from '../generated/components/ClockIconCoreMemory';
import {
  CLOCK_IN_FRAMES,
  LOOP_FRAMES,
} from '../generated/components/coreMemoryIcon';

// Private render entry for the clock icon, so it renders while other builders
// own src/Root.tsx.
//
// Two transparent overlay assets, 1080x1080 at 24fps. The editor plays `-In`
// once and then repeats `-Loop`: the In clip's last frame is loop frame 95 and
// the Loop clip starts at loop frame 0, so the cut is an ordinary step.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ClockIconCoreMemory-In"
        component={ClockIconCoreMemory}
        schema={clockSchema}
        defaultProps={{...clockProps, mode: 'in' as const}}
        durationInFrames={CLOCK_IN_FRAMES}
        fps={24}
        width={1080}
        height={1080}
      />
      <Composition
        id="ClockIconCoreMemory-Loop"
        component={ClockIconCoreMemory}
        schema={clockSchema}
        defaultProps={{...clockProps, mode: 'loop' as const}}
        durationInFrames={LOOP_FRAMES}
        fps={24}
        width={1080}
        height={1080}
      />
    </>
  );
};
