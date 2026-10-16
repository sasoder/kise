import {Composition} from 'remotion';
import NameTagNewsprint, {FPS, defaultProps, schema} from '../generated/components/kits/name-tags/NameTagNewsprint';

// Private render entry for the ChinaTalk newsprint name tag (a caption slip cut
// from the newspaper; props name / job / durationInFrames, optional variant), so
// it renders while other sessions own src/Root.tsx. Transparent, 1080x1920,
// 24 fps. Defaults: Kevin Rudd, "Former Prime Minister of Australia", 89 frames
// (the slot at 28.375-32.083 s of Logan Wright's "Brezhnev chose decay"). The
// composition's length follows the `durationInFrames` prop.
export const RemotionRoot = () => {
  return (
    <Composition
      id="NameTagNewsprint"
      component={NameTagNewsprint}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={defaultProps.durationInFrames}
      calculateMetadata={({props}) => ({durationInFrames: props.durationInFrames})}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
