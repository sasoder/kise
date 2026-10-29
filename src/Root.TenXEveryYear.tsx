import {Composition} from 'remotion';
import TenXEveryYear, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-gigawatt-cost/TenXEveryYear';

// Private render entry for TenXEveryYear (sam-gigawatt-cost; Cheeky Pint style (stout)): one cream work unit beside the $20B column becomes ten, then a hundred, coming up out of the campus under one pull-back.
// Opaque 1080x1920, 23.976 fps, 99 frames.
export const RemotionRoot = () => (
  <Composition
    id="TenXEveryYear"
    component={TenXEveryYear}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
