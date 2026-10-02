import {Composition} from 'remotion';
import BillionInRevenueStout, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/BillionInRevenueStout';

// Private render entry for the Toto Wolff "Mercedes F1 financials" clip (BillionInRevenueStout, stout system),
// so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="BillionInRevenueStout"
      component={BillionInRevenueStout}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
