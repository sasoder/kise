import {Composition} from 'remotion';
import MuseProbe, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/MuseProbe';

// Private render entry for MuseProbe: still frames of museShared's cast (Alexandr Wang, "Alex on agentic
// commerce", Cheeky Pint S4E03). Not a cut. One page per frame, 1080x1920.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="MuseProbe"
        component={MuseProbe}
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
