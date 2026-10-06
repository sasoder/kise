import {Composition} from 'remotion';
import ProjectMavenCardTall, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ProjectMavenCardTall';

// Private render entry for the Bharat "Project Maven's data problem" news card
// (cut N, ProjectMavenCardTall, 9:16), so it renders while other builders own
// src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="ProjectMavenCardTall"
      component={ProjectMavenCardTall}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
