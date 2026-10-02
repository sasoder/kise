import {Composition} from 'remotion';
import BillionInRevenue, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/BillionInRevenue';

// Private render entry for the Toto Wolff "Mercedes F1 financials" clip (BillionInRevenue, Act A),
// so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="BillionInRevenue"
      component={BillionInRevenue}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
