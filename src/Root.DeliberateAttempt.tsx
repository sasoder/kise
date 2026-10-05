import {Composition} from 'remotion';
import DeliberateAttempt, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/DeliberateAttempt';

// Private render entry for Logan Wright "the biggest credit boom in history"
// V2 cut 3 (DeliberateAttempt), so it renders while other builders own
// src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="DeliberateAttempt"
      component={DeliberateAttempt}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
