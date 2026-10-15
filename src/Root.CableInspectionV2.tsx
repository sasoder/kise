import {Composition} from 'remotion';
import CableInspectionV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/CableInspectionV2';

// Private render entry for CableInspectionV2 (Cheeky Pint S4E02, Will O'Brien / Ulysses): cut C after the
// round-1 cold review (rolled camera, level Mako, dark snag lit by the beam, lock on "lines", bigger payoff).
// CableInspection (V1) stays as delivered. Opaque, 1080x1920, 24000/1001 fps, 215 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="CableInspectionV2"
        component={CableInspectionV2}
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
