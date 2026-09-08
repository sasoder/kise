import {Composition} from 'remotion';
import OutNowCoreMemory, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/OutNowCoreMemory';

// "OUT NOW!" in core memory podcast style: the chain colours slide up one at a
// time and the white core lands last on top. Transparent 1080x1920 overlay.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="OutNowCoreMemory"
        component={OutNowCoreMemory}
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
