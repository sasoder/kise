import {Composition} from 'remotion';
import CollateralDamage, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/CollateralDamage';

// Private render entry for CollateralDamage (plague clip), so this cut renders
// while other builders own src/Root.tsx. Opaque, 1080x1920, 29.97 fps, 220 f.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="CollateralDamage"
        component={CollateralDamage}
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
