import {Composition} from 'remotion';
import SpeciesTowerProbe, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-stupidest-species/speciesTowerProbe';

// Private render entry for SpeciesTowerProbe (rsi-stupidest-species; Dwarkesh 3D style): probe stills of the shared world W1 THE SPECIES TOWER at the four cuts' key frames.
// Opaque 1080x1920, 23.976 fps, 60 frames.
export const RemotionRoot = () => (
  <Composition
    id="SpeciesTowerProbe"
    component={SpeciesTowerProbe}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
