import {Composition} from 'remotion';
import FactionsUnite, {DURATION, FPS, defaultProps, schema} from '../generated/components/FactionsUnite';

// Private render entry for FactionsUnite (Sarah Paine, Pearl Harbor clip, cut D):
// seven bickering cream faction crowds in free China draw apart, then stream
// to the stalled 1938 front and stand as one cream band facing the orange.
// Opaque 1080x1920, 24 fps, 179 frames (167 + 12 tail).
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="FactionsUnite"
        component={FactionsUnite}
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
