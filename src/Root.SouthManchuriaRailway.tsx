import {Composition} from 'remotion';
import SouthManchuriaRailway, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/SouthManchuriaRailway';

// Private render entry for SouthManchuriaRailway, so this cut renders while
// other builders own src/Root.tsx. Russo-Japanese War: the South Manchuria
// Railway and Port Arthur pass to Japan (1905). Opaque vintage map, 1080x1920,
// 24fps, 5.5 s.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SouthManchuriaRailway"
        component={SouthManchuriaRailway}
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
