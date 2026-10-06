import {Composition} from 'remotion';
import EnoughRepresentativeData, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/EnoughRepresentativeData';

// Private render entry for Bharat "Synthetic data needs real data" cut C
// (39_EnoughRepresentativeData), so it renders while other builders own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="EnoughRepresentativeData"
      component={EnoughRepresentativeData}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
