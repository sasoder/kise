import {Composition} from 'remotion';
import SmallerTeams, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/SmallerTeams';

// Private render entry for SmallerTeams (cut D of Toto Wolff's "why Drive to Survive worked", Cheeky Pint
// S4E01), so this cut renders while other builders own src/Root.tsx. "It allowed Drive to Survive to look
// at smaller teams … underdog": the show's light passes the two dimmed front-runners and travels down the
// line of small teams to the last one. Opaque, 1920x1080, 24fps, 134 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SmallerTeams"
        component={SmallerTeams}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
