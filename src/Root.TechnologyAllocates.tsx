import {Composition} from 'remotion';
import TechnologyAllocates, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/TechnologyAllocates';

// Private render entry for TechnologyAllocates (cut C of Logan Wright,
// "Brezhnev chose decay", ChinaTalk slightly vintage), so this cut renders
// while other builders own src/Root.tsx. "So we're going to be able to use
// technology to allocate resources effectively." Opaque, 1080x1920, 24 fps,
// 84 f slot + 12 f living tail = 96 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="TechnologyAllocates"
        component={TechnologyAllocates}
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
