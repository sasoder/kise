import {Composition} from 'remotion';
import BanksLendToDebtors, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-rome-industrial/BanksLendToDebtors';

// Private render entry for BanksLendToDebtors (kyle-rome-industrial; Dwarkesh 3D style): <one line on the picture>.
// Opaque 1080x1920, 29.97 fps, 297 frames.
export const RemotionRoot = () => (
  <Composition
    id="BanksLendToDebtors"
    component={BanksLendToDebtors}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
