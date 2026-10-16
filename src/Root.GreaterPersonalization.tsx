import {Composition} from 'remotion';
import GreaterPersonalization, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/alex-agentic-commerce/GreaterPersonalization';

// Private render entry for GreaterPersonalization (cut 5 of Alexandr Wang, "Alex on agentic commerce",
// Cheeky Pint S4E03), so this cut renders while other builders own their own entries. One family:
// museShared.tsx. Opaque, 1080x1920 (9:16), 23.976 fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="GreaterPersonalization"
        component={GreaterPersonalization}
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
