import {Composition} from 'remotion';
import CityStates, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/CityStates';

// Private render entry for CityStates, so this cut renders while other
// builders own src/Root.tsx. Si Sheppard: "...even the Maya in Mesoamerica,
// whose city-states jealously asserted and defended their autonomy against each
// other". Dwarkesh map style, 1080x1920, 24fps, 126 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="CityStates"
        component={CityStates}
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
