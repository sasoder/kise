import {Composition} from 'remotion';
import ProjectMavenCard, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ProjectMavenCard';

// Private render entry for the Bharat "Project Maven's data problem" news card
// (cut N, ProjectMavenCard, 16:9), so it renders while other builders own
// src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="ProjectMavenCard"
      component={ProjectMavenCard}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
