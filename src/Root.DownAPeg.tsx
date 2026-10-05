import {Composition} from 'remotion';
import DownAPeg, {DURATION, FPS, defaultProps, schema} from '../generated/components/DownAPeg';

// Private render entry for DownAPeg (cut C of the SarahWar sugar-islands clip), so it
// renders while other builders own src/Root.tsx. Opaque Dwarkesh map style,
// 1080x1920, 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="DownAPeg"
        component={DownAPeg}
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
