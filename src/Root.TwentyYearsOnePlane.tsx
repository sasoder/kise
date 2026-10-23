import {Composition} from 'remotion';
import TwentyYearsOnePlane, {DURATION, FPS, defaultProps, schema} from '../generated/components/zach-kelly-johnson/TwentyYearsOnePlane';
import {ArchiveProbe, PROBE_DURATION} from '../generated/components/zach-kelly-johnson/archiveShared';

// Private render entry for TwentyYearsOnePlane (zach-kelly-johnson; Core memory podcast style, archive collage): one new
// aircraft stands alone in an assembly hall while a wall calendar sheds twenty years of pages; at "production" it rolls out.
// Opaque 1080x1920, 23.976 fps, 89 frames. Also registers ArchiveProbe, the probe of the clip's shared module.
export const RemotionRoot = () => (
  <>
    <Composition
      id="TwentyYearsOnePlane"
      component={TwentyYearsOnePlane}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Composition id="ArchiveProbe" component={ArchiveProbe} durationInFrames={PROBE_DURATION} fps={FPS} width={1080} height={1920} />
  </>
);
