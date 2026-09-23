import {Composition} from 'remotion';
import ChallengeStoryboardV3, {
  PANEL_COUNT,
  defaultProps,
  schema,
} from '../generated/components/ChallengeStoryboardV3';

// Private entry: storyboard stills for Noam_Challenge_The_Model V3 (one frame per panel).
export const RemotionRoot = () => (
  <Composition
    id="ChallengeStoryboardV3"
    component={ChallengeStoryboardV3}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={PANEL_COUNT}
    fps={24}
    width={1080}
    height={1920}
  />
);
