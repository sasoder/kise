import {Composition} from 'remotion';
import EnergyProbe, {DURATION, FPS} from '../generated/components/scott-nolan-wind/energyProbe';

// Private probe entry for energyWorld stills (scott-nolan-wind): not a delivered cut.
export const RemotionRoot = () => <Composition id="EnergyProbe" component={EnergyProbe} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />;
