import {Composition} from 'remotion';
import SporttouchenQuiz, {DURATION, FPS, defaultProps, schema} from '../generated/components/SporttouchenQuiz';

// Private render entry for SporttouchenQuiz (Sporttouchen): the "Quizkortet" question plate + talking logo.
export const RemotionRoot = () => (
  <Composition
    id="SporttouchenQuiz"
    component={SporttouchenQuiz}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
