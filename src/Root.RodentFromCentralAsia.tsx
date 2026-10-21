import {Composition} from 'remotion';
import RodentFromCentralAsia, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-pandemics/RodentFromCentralAsia';

// Private render entry for RodentFromCentralAsia (kyle-pandemics; Dwarkesh map style): a marmot on its burrow in the Tian Shan, the camera cranes up to Eurasia as an orange front runs west and half of Europe's people fall (render with --gl=angle).
// Opaque 1080x1920, 29.97 fps, 207 frames.
export const RemotionRoot = () => (
  <Composition
    id="RodentFromCentralAsia"
    component={RodentFromCentralAsia}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
