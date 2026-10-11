import {Composition} from 'remotion';
import PlagueKitDemo, {DURATION, FPS, defaultProps, schema} from '../generated/components/PlagueKitDemo';

// Private render entry for the plague kit's demo sheet (plagueShared.tsx).
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="PlagueKitDemo"
        component={PlagueKitDemo}
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
