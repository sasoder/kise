import {Composition} from 'remotion';
import GlobalWar, {DURATION, FPS, defaultProps, schema} from '../generated/components/GlobalWar';

// Private render entry for GlobalWar (cut D of the SarahWar sugar-islands clip), so it
// renders while other builders own src/Root.tsx. Opaque Dwarkesh map style,
// 1080x1920, 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="GlobalWar"
        component={GlobalWar}
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
