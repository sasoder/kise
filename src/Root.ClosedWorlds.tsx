import {Composition} from 'remotion';
import ClosedWorlds, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ClosedWorlds';

// Private render entry for ClosedWorlds (Si Sheppard, "Texcoco", cut D:
// "(Their) closed worlds didn't allow them to think about people from such
// vast distances"). One long pull-back from the orange ring of central Mexico
// to the whole Atlantic and the ships from Seville. Opaque Dwarkesh map style,
// 1080x1920, 23.976 fps, 85 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ClosedWorlds"
        component={ClosedWorlds}
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
