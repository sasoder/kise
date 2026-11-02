import {Composition} from 'remotion';
import CarnegieLibraries, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-anthropic/CarnegieLibraries';

// Private render entry for CarnegieLibraries (wip-anthropic; Works in Progress style): a pull-back off Carnegie to a US map thick with real library stamps.
// Opaque 1080x1920, 24 fps, 75 frames.
export const RemotionRoot = () => (
  <Composition
    id="CarnegieLibraries"
    component={CarnegieLibraries}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
