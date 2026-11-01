import {Composition} from 'remotion';
import {KidsProbe} from '../generated/components/sam-kids-mind-blown/kidsProbe';

// Private probe of the sam-kids-mind-blown shared world.
export const RemotionRoot = () => <Composition id="KidsProbe" component={KidsProbe} durationInFrames={1} fps={24000 / 1001} width={1080} height={1920} />;
