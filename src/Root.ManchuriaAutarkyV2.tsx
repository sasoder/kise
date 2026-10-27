import {Composition} from 'remotion';
import ManchuriaAutarkyV2, {DURATION, FPS, defaultProps, schema} from '../generated/components/sarah-pearl-harbor/ManchuriaAutarkyV2';

// Private render entry for ManchuriaAutarkyV2 (cold-review V2 of ManchuriaAutarky, Sarah Paine
// Pearl Harbor clip, Dwarkesh map style). Opaque, 1080x1920, 24 fps, 206 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ManchuriaAutarkyV2"
        component={ManchuriaAutarkyV2}
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
