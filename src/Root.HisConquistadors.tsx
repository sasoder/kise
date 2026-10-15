import {Composition} from 'remotion';
import HisConquistadors, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/HisConquistadors';

// Private render entry for HisConquistadors, so this cut renders while other
// builders own src/Root.tsx. Si Sheppard on Pizarro at Cajamarca: "he has some
// 160, 190 conquistadors" (the muster wave lands on 168; the last frame flows
// into HundredAgainstHundredThousand). Opaque engraved plan, 1080x1920, 24fps,
// 91 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HisConquistadors"
        component={HisConquistadors}
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
