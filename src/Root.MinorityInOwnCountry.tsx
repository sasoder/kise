import {Composition} from 'remotion';
import MinorityInOwnCountry, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/MinorityInOwnCountry';

// Private render entry for MinorityInOwnCountry (Sheppard "Texcoco", cut E,
// delivered as 43_MinorityInOwnCountry.mov): cream dots arrive by sea and fill
// Australia and New Zealand around the orange dots of the original peoples.
// Dwarkesh map style, opaque 1080x1920, 23.976 fps, 106 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="MinorityInOwnCountry"
        component={MinorityInOwnCountry}
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
