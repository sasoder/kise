import {Composition} from 'remotion';
import SocietiesFromTheAshes, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/SocietiesFromTheAshes';

// three societies stacked out of one crowd — "three consecutive secret AI
// societies got started, then got wiped out, only to re-emerge from their
// predecessor's ashes."
export const RemotionRoot = () => {
  return (
    <>
      {/* 0:01.399 -> 0:08.839 (+16 frame tail) */}
      <Composition
        id="SocietiesFromTheAshes"
        component={SocietiesFromTheAshes}
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
