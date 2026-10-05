import {Composition} from 'remotion';
import KeepTheCaribbean, {DURATION, FPS, defaultProps, schema} from '../generated/components/KeepTheCaribbean';

// Private render entry for KeepTheCaribbean (cut E of the SarahWar sugar-islands clip), so it
// renders while other builders own src/Root.tsx. Opaque Dwarkesh map style,
// 1080x1920, 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="KeepTheCaribbean"
        component={KeepTheCaribbean}
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
