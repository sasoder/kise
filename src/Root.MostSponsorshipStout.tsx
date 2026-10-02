import {Composition} from 'remotion';
import MostSponsorshipStout, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/MostSponsorshipStout';

// Private render entry for the Toto Wolff "Mercedes F1 financials" clip, cut 5
// in the stout system (MostSponsorshipStout; 0:40.280, 214 f), so it renders
// while other sessions own src/Root.tsx. V1 / V2 keep their own entries.
export const RemotionRoot = () => {
  return (
    <Composition
      id="MostSponsorshipStout"
      component={MostSponsorshipStout}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
