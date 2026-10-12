import {Composition} from 'remotion';
import TechnologicalAdvantages, {
  DURATION,
  FPS,
  TechAdvSheet,
  defaultProps,
  schema,
  sheetSchema,
} from '../generated/components/TechnologicalAdvantages';

// Private render entry for TechnologicalAdvantages (Si Sheppard, "Conquistador
// advantages", cut A): orange ink travels down a conquistador's steel, he draws
// his sword, and one pull-back finds the cream Aztec warrior facing him.
// Opaque umber page, 1080x1920, 23.976 fps, 107 frames.
// TechAdvSheet is the review sheet: both figures at full size at frame `at`.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="TechnologicalAdvantages"
        component={TechnologicalAdvantages}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="TechAdvSheet"
        component={TechAdvSheet}
        schema={sheetSchema}
        defaultProps={{at: 106}}
        durationInFrames={1}
        fps={24}
        width={1080}
        height={1920}
      />
    </>
  );
};
