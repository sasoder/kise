import {Composition} from 'remotion';
import DeathGround, {DURATION, FPS, defaultProps, schema} from '../generated/components/DeathGround';

// Private render entry for DeathGround (cut B of the SarahWar sugar-islands clip), so it
// renders while other builders own src/Root.tsx. Opaque Dwarkesh map style,
// 1080x1920, 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="DeathGround"
        component={DeathGround}
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
