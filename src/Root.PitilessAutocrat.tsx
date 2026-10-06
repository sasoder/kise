import {Composition} from 'remotion';
import PitilessAutocrat, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/PitilessAutocrat';

// Private render entry for PitilessAutocrat (cut A of the "strings" set), so
// this cut renders while other builders own src/Root.tsx. Si Sheppard on
// Moctezuma: "he was a pitiless autocrat. He centralized all power on the
// aristocracy." Opaque umber page, 1080x1920, 24 fps, 96 frames; ends on E1.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="PitilessAutocrat"
        component={PitilessAutocrat}
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
