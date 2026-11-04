import {Composition} from 'remotion';
import FuelProbe, {DURATION, FPS} from '../generated/components/scott-nolan-fuel/fuelProbe';

// Private probe entry for fuelShared stills (scott-nolan-fuel): not a delivered cut.
export const RemotionRoot = () => <Composition id="FuelProbe" component={FuelProbe} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />;
