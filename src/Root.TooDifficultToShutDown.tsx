import {Composition} from 'remotion';
import TooDifficultToShutDown, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/TooDifficultToShutDown';

// Private render entry for Logan Wright credit-boom V2, cut 4
// (33_TooDifficultToShutDown), so it renders while other builders own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="TooDifficultToShutDown"
      component={TooDifficultToShutDown}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
