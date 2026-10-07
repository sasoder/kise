import {Composition} from 'remotion';
import HardToKeepUp, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/HardToKeepUp';

// Private render entry for HardToKeepUp, so this cut renders while other
// builders own src/Root.tsx. TBPN 03 narrated: "with the breakneck pace of
// innovation around Silicon Valley, it's really hard to keep up to date". A
// news feed outrunning its one reader. Opaque paper, 1080x1920, 24 fps, 104
// frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HardToKeepUp"
        component={HardToKeepUp}
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
