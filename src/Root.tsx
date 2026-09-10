import {Composition} from 'remotion';
import TalkThroughArtifactory, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/TalkThroughArtifactory';

// Dwarkesh `impossible-tasks` 0:24.820-0:29.800, orange Dwarkesh style, cut 3:
// three agents in three sandboxes ring up and start messaging through the
// package-manager rail and hub that every sandbox taps into.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="TalkThroughArtifactory"
        component={TalkThroughArtifactory}
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
