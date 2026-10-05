import {Composition} from 'remotion';
import LargestCreditExpansion, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/LargestCreditExpansion';

// Private render entry for Logan Wright credit-boom V2 cut 1
// (1_LargestCreditExpansion), so it renders while other builders own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="LargestCreditExpansion"
      component={LargestCreditExpansion}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
