import {Composition} from 'remotion';
import DeskProbe, {DURATION, FPS, defaultProps, schema} from '../generated/components/robert-lbj-money/deskProbe';

// Private probe entry for lbjDeskWorld (robert-lbj-money): stills of the shared desk world, not a delivered cut.
export const RemotionRoot = () => (
  <Composition id="LbjDeskProbe" component={DeskProbe} schema={schema} defaultProps={defaultProps} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
);
