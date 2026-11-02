import {Composition} from 'remotion';
import WipKitProbe, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-anthropic/WipKitProbe';

// Private render entry for WipKitProbe (wip-anthropic; Works in Progress style): the kit on real pictures.
export const RemotionRoot = () => (
  <Composition
    id="WipKitProbe"
    component={WipKitProbe}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
