import {Composition} from 'remotion';
import AlignmentDefinition, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/AlignmentDefinition';

// Private render entry for AlignmentDefinition, so this piece renders while
// other builders own src/Root.tsx. An Urban-Dictionary-shaped definition card
// for "AI ALIGNMENT" — the clip's ACCENT dot, the term, "NOUN", a rule and a
// three-line sentence-case definition — held for 7 s so a viewer who does not
// know the term gets one. Orange Dwarkesh on the grid background, opaque by
// default and switchable to a transparent overlay with `transparent: true`.
// 1080x1920 at 24fps, 168 frames, resolved by f56 and held (never fades out).
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="AlignmentDefinition"
        component={AlignmentDefinition}
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
