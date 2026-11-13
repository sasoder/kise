import {Composition} from 'remotion';
import LotOfBets, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-trend-friend/LotOfBets';

// Private render entry for LotOfBets (nik-trend-friend; Cheeky Pint style (stout)): pairs of chips lap the Revolut loop and the amber stack of results rises out of the tile.
// Opaque 1080x1920, 23.976 fps, 106 frames.
export const RemotionRoot = () => (
  <Composition
    id="LotOfBets"
    component={LotOfBets}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
