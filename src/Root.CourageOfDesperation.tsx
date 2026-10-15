import {Composition} from 'remotion';
import CourageOfDesperation, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/CourageOfDesperation';

// Private render entry for CourageOfDesperation (Sarah Paine, "Death ground:
// why regime change is brutal"): an orange army trapped on a narrow bank -
// deep water behind, a sheer cliff above, the cream enemy closing the only
// open side - levels its ge and charges forward. Opaque umber page,
// 1080x1920, 24 fps, 104 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="CourageOfDesperation"
        component={CourageOfDesperation}
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
