import {Composition} from 'remotion';
import FindingGreatProducts, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/alex-agentic-commerce/FindingGreatProducts';

// Private render entry for FindingGreatProducts (cut 2 of Alexandr Wang, "Alex on agentic commerce", Cheeky Pint
// S4E03), so this cut renders while other builders work beside it. World: museShared.tsx.
// Opaque, 1080x1920 (9:16), 23.976 fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="FindingGreatProducts"
        component={FindingGreatProducts}
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
