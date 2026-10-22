import {Composition} from 'remotion';
import AllRetiredButUnited, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-aircraft-order/AllRetiredButUnited';

// Private render entry for AllRetiredButUnited (scott-aircraft-order, cut 7): the camera glides back along a packed
// storage line of the world's long-haul jets to United's amber-finned 787, then the row drains into the haze and
// goes under covers while United stays lit. Opaque 1080x1920, 23.976 fps, 146 frames. Render with --gl=angle.
export const RemotionRoot = () => (
  <Composition
    id="AllRetiredButUnited"
    component={AllRetiredButUnited}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
