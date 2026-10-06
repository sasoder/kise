import {Composition} from 'remotion';
import Complete180, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/Complete180';
import CortessPuppet, {
  DURATION as CP_DURATION,
  defaultProps as cpProps,
  schema as cpSchema,
} from '../generated/components/CortessPuppet';
import PsychologicalBreak, {
  DURATION as PB_DURATION,
  defaultProps as pbProps,
  schema as pbSchema,
} from '../generated/components/PsychologicalBreak';

// Private render entry for Complete180 (round 2 of the Sheppard "Why captured
// emperors cooperated" strings set): hanging from Cortés's one string,
// Moctezuma turns half a turn. Opaque umber page, 1080x1920, 24 fps, 61
// frames. The two neighbours are registered beside it only as join references
// (PsychologicalBreak's last frame = this cut's f0; this cut's last frame =
// CortessPuppet's f0).
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="Complete180"
        component={Complete180}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="JoinRefPsychologicalBreak"
        component={PsychologicalBreak}
        schema={pbSchema}
        defaultProps={pbProps}
        durationInFrames={PB_DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="JoinRefCortessPuppet"
        component={CortessPuppet}
        schema={cpSchema}
        defaultProps={cpProps}
        durationInFrames={CP_DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
