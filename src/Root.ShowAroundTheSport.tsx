import {Composition} from 'remotion';
import ShowAroundTheSport, {DURATION, FPS, defaultProps, schema} from '../generated/components/toto-female-fans/ShowAroundTheSport';

// Private render entry for ShowAroundTheSport (toto-female-fans; Cheeky Pint style (stout)): the race of three cream card F1s in close, then on "around" a crane-down pull-out: the cut-10 paddock street of dramas behind the track, TV crews with amber tallies in front, framing the race.
// Opaque 1080x1920, 25 fps, 60 frames.
export const RemotionRoot = () => (
  <Composition
    id="ShowAroundTheSport"
    component={ShowAroundTheSport}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
