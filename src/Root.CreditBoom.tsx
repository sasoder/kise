import {Composition} from 'remotion';
import CreditBoom, {DURATION, FPS, defaultProps, schema} from '../generated/components/CreditBoom';

// Private render entry for the Logan Wright "biggest credit boom in history"
// master (ChinaTalk style): one 1347-frame composition, cut into eleven files
// by frame range afterwards. Lets it render while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="CreditBoom"
      component={CreditBoom}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
