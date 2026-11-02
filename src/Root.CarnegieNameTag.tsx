import {Composition} from 'remotion';
import CarnegieNameTag, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-anthropic/CarnegieNameTag';

// Private render entry for CarnegieNameTag (wip-anthropic; Name tag): <one line on the picture>.
// Transparent overlay 1080x1920, 24 fps, 75 frames.
export const RemotionRoot = () => (
  <Composition
    id="CarnegieNameTag"
    component={CarnegieNameTag}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
