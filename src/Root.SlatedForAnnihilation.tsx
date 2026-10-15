import {Composition} from 'remotion';
import SlatedForAnnihilation, {
  DURATION,
  SlatedSheet,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/SlatedForAnnihilation';

// Private render entry for SlatedForAnnihilation (Sarah Paine, "Death ground:
// why regime change is brutal"): the orange king on his palace terrace, cream
// columns march in and ring the terrace, every ge levelled at it, the king
// rises. Opaque umber page, 1080x1920, 24 fps, 165 frames. SlatedSheet is the
// review sheet of the court and the soldier's states.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SlatedForAnnihilation"
        component={SlatedForAnnihilation}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition id="SlatedSheet" component={SlatedSheet} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    </>
  );
};
