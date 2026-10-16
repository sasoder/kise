import {Composition} from 'remotion';
import RecruitingFilter, {DURATION, FPS, defaultProps, schema} from '../generated/components/meta-talent-density/RecruitingFilter';

// Private render entry for RecruitingFilter (Cheeky Pint S4E03 "Talent density beat team size", cut 2):
// opaque 1080x1920 at 23.976 fps, 300-frame slot + 12-frame tail.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="RecruitingFilter"
        component={RecruitingFilter}
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
