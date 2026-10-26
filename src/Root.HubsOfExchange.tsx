import {Composition} from 'remotion';
import HubsOfExchange, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-rome-industrial/HubsOfExchange';

// Private render entry for HubsOfExchange (kyle-rome-industrial; Dwarkesh 3D style): from cut 45's end, a calm pull-back to the whole map of Mediterranean hubs, each highlighted, routes glowing. RENDER WITH --gl=angle.
// Opaque 1080x1920, 29.97 fps, 72 frames.
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
