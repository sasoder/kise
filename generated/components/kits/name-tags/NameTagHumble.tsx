import React from 'react';
import {loadFont} from '@remotion/fonts';
import {
  AbsoluteFill,
  cancelRender,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {z} from 'zod';

/**
 * NameTagHumble — transparent 1080x1920 lower-third name tag for The Humble
 * Co. (Swedish oral care).
 *
 * Layout is the house name tag (NameTag.tsx / NameTagCoreMemory.tsx): an
 * inline-block bar that hugs the text, name over job, an in-flow sizing copy
 * of each line under the visible one. Restyled in the Humble brand: Neulis
 * Cursive Bold on both lines, white type on a solid #7970b4 bar. Those are
 * the only two colours: no shadow, outline, gradient or second tint, and none
 * of the core memory chain colours.
 *
 * Layout constants:
 *   position   left 84 / bottom 300 (the bar's bottom-left corner)
 *   bar        #7970b4 at 100%, radius 10, padding 34 / 52 / 38 / 52 (t r b l)
 *   name       Neulis Cursive 700, 88px, line-height 1.08, letter-spacing 0
 *   gap        10px
 *   job        Neulis Cursive 700, 42px, line-height 1.08, letter-spacing 0
 *   type       #FFFFFF, no shadow
 *
 * Letter-spacing is 0, not the house -1: that was tuned for Barlow.
 *
 * Entrance: one ease everywhere, Easing.bezier(0.16, 1, 0.3, 1), clamped.
 *
 * Frame table (30fps, 150 frames; the house 24fps beats converted):
 *   bar         0 -> 20   slide up 64px + opacity 0 -> 1
 *   name        3 -> 18   slide up 24px + opacity 0 -> 1 (starts while the
 *                         bar is still moving)
 *   job        12 -> 27   slide up 24px + opacity 0 -> 1
 *   27 -> 149  static hold, no outro, no idle motion
 */

const fontFamily = 'Neulis Cursive';

const fontHandle = delayRender('Loading Neulis Cursive Bold');

loadFont({
  family: fontFamily,
  url: staticFile('NeulisCursive-Bold.otf'),
  weight: '700',
})
  .then(() => continueRender(fontHandle))
  .catch((err) => cancelRender(err));

export const FPS = 30;
export const DURATION = 150;

export const schema = z.object({
  name: z.string(),
  job: z.string(),
});

export type NameTagHumbleProps = z.infer<typeof schema>;

export const defaultProps: NameTagHumbleProps = schema.parse({
  name: 'Roba',
  job: 'Tandläkare',
});

// ---- Layout (identical to the house name tag) ----
const LEFT = 84;
const BOTTOM = 300;
const PADDING = '34px 52px 38px 52px';
const LINE_GAP = 10;
const RADIUS = 10;

// ---- Humble brand ----
const BAR_COLOR = '#7970b4';
const TEXT_COLOR = '#FFFFFF';

// ---- Entrance ----
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const BAR_TRAVEL = 20;
const BAR_RISE = 64;
const TEXT_TRAVEL = 15;
const TEXT_RISE = 24;
const NAME_START = 3;
const JOB_START = 12;

const progress = (frame: number, start: number, travel: number) =>
  interpolate(frame, [start, start + travel], [0, 1], {
    easing: EASE,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const Line: React.FC<{
  start: number;
  fontSize: number;
  text: string;
}> = ({start, fontSize, text}) => {
  const frame = useCurrentFrame();
  const t = progress(frame, start, TEXT_TRAVEL);

  const typeStyle: React.CSSProperties = {
    fontFamily,
    fontSize,
    fontWeight: 700,
    lineHeight: 1.08,
    letterSpacing: 0,
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{position: 'relative'}}>
      {/* In-flow copy that sizes the box (and therefore the bar). It paints
          nothing; the visible line is absolutely positioned on top of it. */}
      <div style={{...typeStyle, visibility: 'hidden'}}>{text}</div>
      <div
        style={{
          ...typeStyle,
          position: 'absolute',
          left: 0,
          top: 0,
          color: TEXT_COLOR,
          opacity: t,
          translate: `0px ${(1 - t) * TEXT_RISE}px`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

const NameTagHumble: React.FC<NameTagHumbleProps> = ({name, job}) => {
  const frame = useCurrentFrame();

  const barEnter = progress(frame, 0, BAR_TRAVEL);
  const barSlide = (1 - barEnter) * BAR_RISE;

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: LEFT, bottom: BOTTOM}}>
        <div style={{position: 'relative', display: 'inline-block'}}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: BAR_COLOR,
              borderRadius: RADIUS,
              opacity: barEnter,
              transform: `translateY(${barSlide}px)`,
            }}
          />
          <div style={{position: 'relative', padding: PADDING}}>
            <Line start={NAME_START} fontSize={88} text={name} />
            <div style={{height: LINE_GAP}} />
            <Line start={JOB_START} fontSize={42} text={job} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default NameTagHumble;
