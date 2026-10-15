import {Composition} from 'remotion';
import CutTheLinesV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/CutTheLinesV2';

// Private render entry for CutTheLinesV2 (Cheeky Pint S4E02, Will O'Brien / Ulysses): the continuation
// of CableInspection. "we're building an implement that will cut the fishing lines off of the floating
// offshore wind lines": the Mako's cutter frees the snagged net and it drifts off the cable.
// Opaque, 1080x1920, 24000/1001 fps, 107 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="CutTheLinesV2"
        component={CutTheLinesV2}
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
