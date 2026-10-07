import {Composition} from 'remotion';
import ResearchersTraded, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ResearchersTraded';

// Private render entry for ResearchersTraded, so this cut renders while other
// builders own src/Root.tsx. TBPN 03 narrated: "TBPN covers tech like a soap
// opera, AI researchers are traded". Core memory podcast graphic standard,
// opaque, 1080x1920, 24fps, 107 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ResearchersTraded"
        component={ResearchersTraded}
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
