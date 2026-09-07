import {Composition} from 'remotion';
import ThisParticularCluster, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ThisParticularCluster';

// The interviewer's restatement: "[they] gained administrator access to this
// particular research cluster." A compressed reprise of AdminAccessToTheCluster
// — ring, single out, box. Ajeya 0:40.460 -> 0:43.299 (+16 frame tail).
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ThisParticularCluster"
        component={ThisParticularCluster}
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
