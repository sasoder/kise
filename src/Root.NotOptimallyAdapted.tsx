import {Composition} from 'remotion';
import NotOptimallyAdapted, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-stupidest-species/NotOptimallyAdapted';

// Private render entry for NotOptimallyAdapted (rsi-stupidest-species, revision 3; Dwarkesh 3D style, cut B's staircase world): the clumsy step-up. Seen side-on, he puts his hands flat on the lamp step, plants one foot then the other on the riser (scuffs), hauls up to straight arms and gets a knee onto the top (f27); rev 3 polishes the fall: he tips back pivoting about the planted knee (hips and torso as one, the head lagging) while his arms windmill (the near arm flung wide round his face), throws his weight forward head first, the hands slap down onto the top (f47, a small squash and settle), then he swings round low and still leaned and plops down on the edge between two lamps, the legs swinging once, out of breath (f61); one slow push from a raised eye to a medium of him sitting.
// Opaque 1080x1920, 23.976 fps, 73 frames.
export const RemotionRoot = () => (
  <Composition
    id="NotOptimallyAdapted"
    component={NotOptimallyAdapted}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
