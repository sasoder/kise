import {Composition} from 'remotion';
import UkraineNotGivingUp, {DURATION, FPS, defaultProps, schema} from '../generated/components/sarah-death-ground/UkraineNotGivingUp';

// Private render entry for UkraineNotGivingUp (Sarah Paine, "Death ground: why
// regime change is brutal"; Dwarkesh map style): Russia's thrusts of 24 Feb 2022
// come at Ukraine (orange) from three sides, the two on Kyiv stall short of the
// city and withdraw, and the orange holds. Opaque map, 1080x1920, 24 fps, 212
// frames (sequence 30.000-38.833 s).
export const RemotionRoot = () => {
  return (
    <Composition
      id="UkraineNotGivingUp"
      component={UkraineNotGivingUp}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
