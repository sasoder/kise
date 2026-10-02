import {Composition} from 'remotion';
import MostSponsorshipV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/MostSponsorshipV2';

// Private render entry for the Toto Wolff "Mercedes F1 financials" clip, cut 5
// V2 (MostSponsorshipV2: Mercedes' bar in amber; 0:40.280, 214 f), so it
// renders while other sessions own src/Root.tsx. V1 stays at
// src/entry.MostSponsorship.ts, unchanged in output.
export const RemotionRoot = () => {
  return (
    <Composition
      id="MostSponsorshipV2"
      component={MostSponsorshipV2}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
