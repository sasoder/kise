import {Composition} from 'remotion';
import MetrRedwoodScope, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/MetrRedwoodScope';

// the scope box — "the investigation from METR and Redwood was limited in scope
// to how the second civilization of AIs breached Hugging Face, but its scope did
// not extend to this third civilization of AIs, which breached OpenAI itself."
export const RemotionRoot = () => {
  return (
    <>
      {/* 0:23.339 -> 0:37.100 (+16 frame tail) */}
      <Composition
        id="MetrRedwoodScope"
        component={MetrRedwoodScope}
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
