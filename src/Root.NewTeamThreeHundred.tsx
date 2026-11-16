import {Composition} from 'remotion';
import NewTeamThreeHundred, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-detecting-bullshit/NewTeamThreeHundred';

// Private render entry for NewTeamThreeHundred (nik-detecting-bullshit; Cheeky Pint style (stout)): on cut B's board the old team sinks away and a cream team rises, then a third bar shoots up to 4x this year's, "+300%".
// Opaque 1080x1920, 23.976 fps, 130 frames.
export const RemotionRoot = () => (
  <Composition
    id="NewTeamThreeHundred"
    component={NewTeamThreeHundred}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
