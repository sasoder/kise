import {Composition} from 'remotion';
import SiloedToWhole, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/SiloedToWhole';

// Private render entry for SiloedToWhole (Alexandr Wang, "Alex on agentic commerce", Cheeky Pint S4E03, cut 7),
// so this cut renders while other builders own their own entries. World: museShared.tsx.
// Opaque, 1080x1920 (9:16), 23.976 fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SiloedToWhole"
        component={SiloedToWhole}
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
