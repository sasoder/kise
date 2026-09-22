import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {z} from 'zod';

// Instagram profile screenshot (1179x2556 native) whose follower count counts up
// from "1 000" to "18 000". Everything else in the screenshot is untouched: the
// old "18K" is covered by a flat patch in the screenshot's own background colour
// and the new number is drawn in the iOS system font at the same size, with its
// left ink edge pinned to the original's.
export const FPS = 24;
export const DURATION = 96;

export const schema = z.object({
  from: z.number(),
  to: z.number(),
  showScreenshot: z.boolean(),
  showPatch: z.boolean(),
  debugText: z.string().optional(),
});

export const defaultProps = schema.parse({
  from: 1000,
  to: 18000,
  showScreenshot: true,
  showPatch: true,
});

// Measured off public/steven-profile.png.
const BG = '#0C1014';
const INK_LEFT = 597; // left edge of the original "18K" ink
const INK_TOP = 489; // top of the original "18K" ink (cap line)
const INK_BOTTOM = 518; // baseline row of the original "18K" ink
const INK_MID_Y = (INK_TOP + INK_BOTTOM) / 2;

// Patch over the old "18K": clears of "followers" (ink starts at y 537) and of
// "272" (ends x 447) / "372" (starts x 884).
const PATCH = {x: 590, y: 478, w: 230, h: 52};

// Calibrated against a still of debugText "18K": the ink lands on
// x 597..674, y 489..519 against the original x 597..674, y 489..518.
const FONT_SIZE = 43;
const FONT_WEIGHT = 600;
const FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, 'Helvetica Neue', sans-serif";
// Box origin, offset from the ink so the glyphs' own side bearings land the ink
// exactly where the screenshot had it.
const BOX_LEFT = INK_LEFT - 5;
const BOX_TOP = INK_TOP - 7;

// Swedish-style thousands separator: a plain space.
const formatCount = (value: number) => {
  const digits = String(Math.abs(Math.round(value)));
  let out = '';
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) {
      out += ' ';
    }
    out += digits[i];
  }
  return value < 0 ? `-${out}` : out;
};

const FollowerCount: React.FC<z.infer<typeof schema>> = ({
  from,
  to,
  showScreenshot,
  showPatch,
  debugText,
}) => {
  const frame = useCurrentFrame();

  // f0-12 hold on `from`, f12-72 count, f72+ resolved on `to`.
  const counted = interpolate(frame, [12, 72], [from, to], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // One small pop on landing, eased out in both directions.
  const scale = interpolate(frame, [72, 76, 80], [1, 1.06, 1], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const label = debugText ?? formatCount(counted);

  return (
    // No background when the screenshot is off: that mode is the transparent
    // overlay, and only the patch rect and the number may draw.
    <AbsoluteFill style={{backgroundColor: showScreenshot ? BG : undefined}}>
      {showScreenshot ? (
        <Img
          src={staticFile('steven-profile.png')}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 1179,
            height: 2556,
          }}
        />
      ) : null}

      {showPatch ? (
        <div
          style={{
            position: 'absolute',
            left: PATCH.x,
            top: PATCH.y,
            width: PATCH.w,
            height: PATCH.h,
            backgroundColor: BG,
          }}
        />
      ) : null}

      <div
        style={{
          position: 'absolute',
          left: BOX_LEFT,
          top: BOX_TOP,
          color: '#FFFFFF',
          fontFamily: FONT_FAMILY,
          fontWeight: FONT_WEIGHT,
          fontSize: FONT_SIZE,
          lineHeight: 1,
          letterSpacing: 0,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'pre',
          // Left-centre of the ink, so the pop leaves x 597 pinned.
          transformOrigin: `${INK_LEFT - BOX_LEFT}px ${INK_MID_Y - BOX_TOP}px`,
          transform: `scale(${scale})`,
        }}
      >
        {label}
      </div>
    </AbsoluteFill>
  );
};

export default FollowerCount;
