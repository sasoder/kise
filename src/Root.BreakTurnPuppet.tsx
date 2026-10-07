import {Composition, Still} from 'remotion';
import BreakTurnPuppet, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/BreakTurnPuppet';
import BreakTurnSheet from '../generated/components/BreakTurnSheet';

// Private render entry for BreakTurnPuppet (replaces cuts 17 / 20 / 23 of the
// Sheppard "Why captured emperors cooperated" strings set): the break, a real
// half-turn showing his back, and the puppet turned to face his people.
// Opaque umber page, 1080x1920, 24 fps, 218 frames. BreakTurnSheet is the
// turning figure's review sheet; BreakTurnPuppetOwnHold draws the last hold
// with the cut's own pieces (to prove it converges on the shared state E3).
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="BreakTurnPuppet"
        component={BreakTurnPuppet}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="BreakTurnPuppetOwnHold"
        component={BreakTurnPuppet}
        schema={schema}
        defaultProps={{...defaultProps, ownHold: true}}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Still id="BreakTurnSheet" component={BreakTurnSheet} width={3000} height={1500} />
    </>
  );
};
