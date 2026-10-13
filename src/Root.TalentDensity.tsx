import {Composition} from 'remotion';
import TalentDensity, {DURATION, FPS, defaultProps, schema} from '../generated/components/TalentDensity';
import {TalentStyleFrame} from '../generated/components/talentShared';

// Private render entry for TalentDensity (Cheeky Pint S4E03 "Talent density beat team size", stout):
// opaque 1080x1920 at 23.976 fps. Also registers the clip's style frame (talentShared.tsx).
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="TalentDensity"
        component={TalentDensity}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition id="TalentStyleFrame" component={TalentStyleFrame} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    </>
  );
};
