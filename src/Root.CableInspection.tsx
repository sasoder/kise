import {Composition} from 'remotion';
import CableInspection, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/CableInspection';

// Private render entry for CableInspection (Cheeky Pint S4E02, Will O'Brien / Ulysses, cut C):
// "a surface underwater vehicle that will map these cables on a daily basis … and also if they're
// getting lines caught on them". The Mako runs down cut B's cable, maps it, and locks on the snag.
// Opaque, 1080x1920, 24000/1001 fps, 215 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="CableInspection"
        component={CableInspection}
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
