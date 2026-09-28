import {Composition} from 'remotion';
import LittleRegionalWar, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/LittleRegionalWar';

// Private render entry for LittleRegionalWar, so this cut renders while other
// builders own src/Root.tsx. Sarah Paine, in-point 3.60 s: "…run a little
// regional war … poach some territory from somebody else in Europe." A
// TRANSPARENT 1914 land-only overlay, 1080x1920, 24 fps, 192 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="LittleRegionalWar"
        component={LittleRegionalWar}
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
