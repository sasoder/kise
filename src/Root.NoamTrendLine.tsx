import {Composition} from 'remotion';
import NoamTrendLine, {
  CUTS,
  FPS,
  FULL_DURATION,
  START,
  defaultProps,
  schema,
} from '../generated/components/NoamTrendLine';

// Private render entry for the Noam "10x Math" clip, so it renders while other
// builders own src/Root.tsx. ONE master graphic -- a log-scale trend line on
// the dimmed grid, Orange Dwarkesh, opaque 1080x1920 at 24fps -- with one
// global timeline in clip frames. Every cut is a WINDOW on that timeline:
// the component renders world state at `startFrame + useCurrentFrame()`, so a
// cut's frame 0 is pixel-identical to the same global frame of the full.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="NoamTrendFull"
        component={NoamTrendLine}
        schema={schema}
        defaultProps={{...defaultProps, startFrame: START}}
        durationInFrames={FULL_DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      {Object.entries(CUTS).map(([id, [f0, f1]]) => (
        <Composition
          key={id}
          id={id}
          component={NoamTrendLine}
          schema={schema}
          defaultProps={{...defaultProps, startFrame: f0}}
          durationInFrames={f1 - f0}
          fps={FPS}
          width={1080}
          height={1920}
        />
      ))}
    </>
  );
};
