import {Composition} from 'remotion';
import EightCompaniesTwentyRobots, {
  DURATION,
  FPS,
  FieldProbe,
  PROBE_DURATION,
  defaultProps,
  schema,
} from '../generated/components/zach-superpower/EightCompaniesTwentyRobots';

// Private render entry for EightCompaniesTwentyRobots (zach-superpower; Core memory podcast style): one brain with
// its implant chip, then a row of eight; one humanoid robot, then two rows of ten.
// Opaque 1080x1920, 23.976 fps, 115 frames. EightCompaniesTwentyRobotsProbe = the field glyphs alone (stills).
export const RemotionRoot = () => (
  <>
    <Composition
      id="EightCompaniesTwentyRobots"
      component={EightCompaniesTwentyRobots}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Composition
      id="EightCompaniesTwentyRobotsProbe"
      component={FieldProbe}
      durationInFrames={PROBE_DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  </>
);
