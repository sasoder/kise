import {Composition} from 'remotion';
import NameTagCoreMemory, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/NameTagCoreMemory';

// Private render entry for the core memory name tag, so it renders while
// another builder owns src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="NameTagCoreMemory"
      component={NameTagCoreMemory}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
