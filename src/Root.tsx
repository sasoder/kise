import {Composition} from 'remotion';
import TryToHackOut, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/TryToHackOut';

// Dwarkesh `impossible-tasks` 0:08.939-0:17.899, orange Dwarkesh style, cut 2:
// opens on cut 1's last frame, the five reaches pump at the wall, a pull-back
// reveals three isolated sandboxes, and every crowd strikes its walls from inside.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="TryToHackOut"
        component={TryToHackOut}
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
