import {Composition} from 'remotion';
import BankWorldProbe, {DURATION, FPS} from '../generated/components/nik-neobanks-us/bankWorldProbe';

// Private probe entry for bankWorld stills (nik-neobanks-us): not a delivered cut.
export const RemotionRoot = () => <Composition id="BankWorldProbe" component={BankWorldProbe} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />;
