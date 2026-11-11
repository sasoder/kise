import {Composition} from 'remotion';
import CleanVerifiableProxies, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-derpy-interns/CleanVerifiableProxies';

// Private render entry for CleanVerifiableProxies (rsi-derpy-interns; Dwarkesh style): the OpenAI mark fires attempts at an ONLINE LEARNING card; each returns as a checked score bar and a best-so-far staircase climbs.
// Opaque 1080x1920, 23.976 fps, 96 frames.
export const RemotionRoot = () => (
  <Composition
    id="CleanVerifiableProxies"
    component={CleanVerifiableProxies}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
