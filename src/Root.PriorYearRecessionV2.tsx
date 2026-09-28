import {Composition} from 'remotion';
import PriorYearRecessionV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/PriorYearRecessionV2';

// Private render entry for PriorYearRecessionV2, so this cut renders while
// other builders own src/Root.tsx. The user revision of PriorYearRecession:
// no title or readout, only the chart: the line falling into the 1903 trough,
// the WAR line at 1904. Opaque, 1080x1920, 24fps, 3.71 s.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="PriorYearRecessionV2"
        component={PriorYearRecessionV2}
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
