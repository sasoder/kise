import {Composition} from 'remotion';
import NobodyCanSettle, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/NobodyCanSettle';

// Private render entry for NobodyCanSettle, so this cut renders while other
// builders own src/Root.tsx. Sarah Paine, "why nobody could end WWI" (in-point
// 64.44 s): the Adriatic of the 1914 EverybodyWants map, Italy's and Serbia's
// claims to Dalmatia and a settlement line that never comes to rest; opaque
// 1080x1920, 24 fps, 245 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="NobodyCanSettle"
        component={NobodyCanSettle}
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
