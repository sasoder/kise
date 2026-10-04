import {Composition} from 'remotion';
import SubordinatedPeoples, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/SubordinatedPeoples';

// Private render entry for SubordinatedPeoples (cut C of
// Sheppard_Tlaxcalans_thought_they_used_Cortes), so this cut renders while other
// builders own src/Root.tsx. Si Sheppard: "not just the remaining independent
// entities like the Tlaxcalans were hostile to the Aztecs; so were so many of
// their subordinated peoples." Opaque vintage map, 1080x1920, 24fps, 210 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SubordinatedPeoples"
        component={SubordinatedPeoples}
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
