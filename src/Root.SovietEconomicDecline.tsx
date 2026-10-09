import {Composition} from 'remotion';
import SovietEconomicDecline, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/SovietEconomicDecline';

// Private render entry for SovietEconomicDecline (cut A of Logan Wright,
// "Brezhnev chose decay", ChinaTalk slightly vintage), so this cut renders
// while other builders own src/Root.tsx. "…three years ago to answer this
// question of how did the Soviets internalize their economic decline?" One pan
// from a full-bleed photograph of a 1981 shop queue to the real growth chart.
// Opaque, 1080x1920, 24 fps, 104 f slot + 12 f living tail = 116 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SovietEconomicDecline"
        component={SovietEconomicDecline}
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
