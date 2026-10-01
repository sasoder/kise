import {Composition} from 'remotion';
import CortesCut1, {
  DUR_A,
  DUR_B,
  FPS,
  defaultPropsGoingBeyond,
  defaultPropsSpanishDivided,
  schema,
} from '../generated/components/SpanishDivided';

// Private render entry for cut 1 of the Cortes clip (Dwarkesh with Si
// Sheppard), so it renders while other builders own src/Root.tsx. ONE world on
// ONE global clock, rendered as two compositions that play back to back:
// SpanishDivided (global g0-84, in-point 6.70 s) and GoingBeyondHisMission
// (global g85-321, in-point 10.24 s). Opaque Dwarkesh map style, 1080x1920, 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SpanishDivided"
        component={CortesCut1}
        schema={schema}
        defaultProps={defaultPropsSpanishDivided}
        durationInFrames={DUR_A}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="GoingBeyondHisMission"
        component={CortesCut1}
        schema={schema}
        defaultProps={defaultPropsGoingBeyond}
        durationInFrames={DUR_B}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
