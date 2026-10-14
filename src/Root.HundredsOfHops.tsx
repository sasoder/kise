import {Composition} from 'remotion';
import HundredsOfHops, {DURATION, FPS, defaultProps, schema} from '../generated/components/HundredsOfHops';
import {HopStyleFrame} from '../generated/components/guinnessShared';

// Private render entry for HundredsOfHops (Cheeky Pint S4E02 "will - guinness invented the t-test", stout):
// opaque 1080x1920 at 23.976 fps. Also registers the clip's hop style frame (guinnessShared.tsx).
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HundredsOfHops"
        component={HundredsOfHops}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition id="HopStyleFrame" component={HopStyleFrame} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    </>
  );
};
