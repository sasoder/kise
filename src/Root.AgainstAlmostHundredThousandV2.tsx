import {Composition} from 'remotion';
import AgainstAlmostHundredThousandV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/AgainstAlmostHundredThousandV2';

// Private render entry for AgainstAlmostHundredThousandV2, so this cut renders while other builders own
// src/Root.tsx. Si Sheppard on Cajamarca: "100 something against almost 100,000 ... first encounter." V2: every man an engraved figure, no ground rules. Opaque engraved page, 1080x1920, 24fps, 232 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="AgainstAlmostHundredThousandV2"
        component={AgainstAlmostHundredThousandV2}
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
