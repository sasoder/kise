import {Composition} from 'remotion';
import NameTagChinaTalk, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/NameTagChinaTalk';

// Private render entry for Logan Wright's ChinaTalk name tag (five options via the
// `variant` prop), so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="NameTagChinaTalk"
      component={NameTagChinaTalk}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
