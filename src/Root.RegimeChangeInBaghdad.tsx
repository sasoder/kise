import {Composition} from 'remotion';
import RegimeChangeInBaghdad, {DURATION, FPS, defaultProps, schema} from '../generated/components/RegimeChangeInBaghdad';

// Private render entry for RegimeChangeInBaghdad (cut B of the Sheppard Iraq clip), so it
// renders while other builders own src/Root.tsx. Opaque Dwarkesh map style,
// 1080x1920, 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="RegimeChangeInBaghdad"
        component={RegimeChangeInBaghdad}
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
