import {Composition} from 'remotion';
import ByWednesday, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/alex-agentic-commerce/ByWednesday';

// Private render entry for ByWednesday (Alexandr Wang, "Alex on agentic commerce", Cheeky Pint S4E03, cut 4),
// so this cut renders while other builders own their own entries. World: museShared.tsx.
// Opaque, 1080x1920 (9:16), 23.976 fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ByWednesday"
        component={ByWednesday}
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
