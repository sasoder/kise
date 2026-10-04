import {Composition} from 'remotion';
import ConquistadorsMusterV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ConquistadorsMusterV2';

// Private render entry for ConquistadorsMusterV2, so this cut renders while other builders own
// src/Root.tsx. Si Sheppard on Cajamarca: "...he has some 160, 190 conquistadors." V2: the 168 march in as engraved figures (no ground rules). Opaque engraved page, 1080x1920, 24fps, 91 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ConquistadorsMusterV2"
        component={ConquistadorsMusterV2}
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
