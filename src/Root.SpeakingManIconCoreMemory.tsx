import {Composition} from 'remotion';
import SpeakingManIconCoreMemory, {
  defaultProps as speakingProps,
  schema as speakingSchema,
} from '../generated/components/SpeakingManIconCoreMemory';
import {
  LOOP_FRAMES,
  SPEAKING_IN_FRAMES,
} from '../generated/components/coreMemoryIcon';

// Private render entry for the speaking man icon, so it renders while other
// builders own src/Root.tsx.
//
// Two transparent overlay assets, 1080x1080 at 24fps. The editor plays `-In`
// once and then repeats `-Loop`: the In clip's last frame is loop frame 95 and
// the Loop clip starts at loop frame 0, so the cut is an ordinary step.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SpeakingManIconCoreMemory-In"
        component={SpeakingManIconCoreMemory}
        schema={speakingSchema}
        defaultProps={{...speakingProps, mode: 'in' as const}}
        durationInFrames={SPEAKING_IN_FRAMES}
        fps={24}
        width={1080}
        height={1080}
      />
      <Composition
        id="SpeakingManIconCoreMemory-Loop"
        component={SpeakingManIconCoreMemory}
        schema={speakingSchema}
        defaultProps={{...speakingProps, mode: 'loop' as const}}
        durationInFrames={LOOP_FRAMES}
        fps={24}
        width={1080}
        height={1080}
      />
    </>
  );
};
