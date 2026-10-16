import {Composition} from 'remotion';
import ThatStepTakenCare, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/alex-agentic-commerce/ThatStepTakenCare';

// Private render entry for ThatStepTakenCare (cut 3 of Alexandr Wang, "Alex on agentic commerce", Cheeky Pint
// S4E03), so this cut renders while other builders work beside it. Opaque, 1080x1920, 23.976 fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ThatStepTakenCare"
        component={ThatStepTakenCare}
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
