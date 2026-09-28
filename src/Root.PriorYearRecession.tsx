import {Composition} from 'remotion';
import PriorYearRecession, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/PriorYearRecession';

// Private render entry for PriorYearRecession, so this cut renders while
// other builders own src/Root.tsx. Sibling of InterestRatesGoDownV2: one
// centred column (title, readout RECESSION, Russia's iron output falling into
// the 1903 trough, the WAR line at 1904). Opaque, 1080x1920, 24fps, 3.71 s.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="PriorYearRecession"
        component={PriorYearRecession}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
