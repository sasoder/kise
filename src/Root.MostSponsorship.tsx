import {Composition} from 'remotion';
import MostSponsorship, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/MostSponsorship';

// Private render entry for the Toto Wolff "Mercedes F1 financials" clip, cut 5
// (MostSponsorship, 0:40.280, 214 f), so it renders while other sessions own
// src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="MostSponsorship"
      component={MostSponsorship}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
