import {Composition} from 'remotion';
import TeamThatBuiltLVM3, {DURATION, FPS, defaultProps, schema} from '../generated/components/skyroot-trailer/TeamThatBuiltLVM3';

// Private render entry for TeamThatBuiltLVM3 (skyroot-trailer; Core memory podcast style): close on the ISRO mark on LVM3's core, down the body to the team at its foot (founders crowned), pull back to the whole rocket towering over them.
// Opaque 2048x1080, 23.976 fps, 141 frames.
export const RemotionRoot = () => (
  <Composition
    id="TeamThatBuiltLVM3"
    component={TeamThatBuiltLVM3}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={2048}
    height={1080}
  />
);
