import {Composition} from 'remotion';
import HubsOfExchange, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-rome-industrial/HubsOfExchange';

// Private render entry for HubsOfExchange (kyle-rome-industrial; Dwarkesh 3D style): from cut 45's end, the Med's cities rise as knots of lanes; push in to Alexandria's Pharos lighting. RENDER WITH --gl=angle.
// Opaque 1080x1920, 29.97 fps, 120 frames.
export const RemotionRoot = () => (
  <Composition
    id="HubsOfExchange"
    component={HubsOfExchange}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
