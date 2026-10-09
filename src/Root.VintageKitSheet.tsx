import {Composition} from 'remotion';
import VintageKitSheet, {DURATION, FPS, defaultProps, schema} from '../generated/components/VintageKitSheet';

// Private render entry for VintageKitSheet: the kit sheet of
// generated/components/chinatalkVintage.tsx (the "ChinaTalk, slightly vintage"
// kit of the Logan Wright "Brezhnev chose decay" clip). Not a deliverable; the
// director judges the look from its frame 12. Opaque, 1080x1920, 24 fps, 24 f.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="VintageKitSheet"
        component={VintageKitSheet}
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
