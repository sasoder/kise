import {Composition} from 'remotion';
import ThirteenColonies, {DURATION, FPS, defaultProps, schema} from '../generated/components/ThirteenColonies';

// Private render entry for ThirteenColonies (cut A of the SarahWar sugar-islands clip), so it
// renders while other builders own src/Root.tsx. Opaque Dwarkesh map style,
// 1080x1920, 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ThirteenColonies"
        component={ThirteenColonies}
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
