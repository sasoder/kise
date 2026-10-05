import {Composition} from 'remotion';
import ShadowBanking, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ShadowBanking';

// Private render entry for the Logan Wright credit-boom clip, V2 cut 5
// ("... facilitated the growth of the shadow banking system"), so it renders
// while other builders own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="ShadowBanking"
      component={ShadowBanking}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
