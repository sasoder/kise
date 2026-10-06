import {Composition} from 'remotion';
import HierarchicalNature, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/HierarchicalNature';

// Private render entry for HierarchicalNature (G1 of the Sheppard "Centralized
// empires fell fast" set), so this cut renders while other builders own
// src/Root.tsx. "The vulnerability of the Aztec, the Inca, was that
// hierarchical nature of their society." Opaque engraved page, 1080x1920,
// 24fps, 120 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HierarchicalNature"
        component={HierarchicalNature}
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
