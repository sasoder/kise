import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';

// Server rack icon loop.
//
// The artwork does all the masking: the three status LEDs and the three drive
// slots are TRANSPARENT HOLES cut out of solid black slabs, so black SVG drawn
// BEHIND the PNG can only be seen through those holes and nowhere else. No
// flair ever leaves the silhouette, because the silhouette is the mask.
//
// Motion, and why:
//  1. Status LEDs blink. A disc behind each LED hole goes from opacity 0 (hole
//     clear = "lit") to LED_DIM * liveliness ("dim"). Each unit has its own
//     rhythm and every rhythm is an integer number of cycles per loop, so the
//     loop is seamless: top unit = a steady lub-dub heartbeat (2 per loop),
//     middle unit = quick hashed activity (4 short dips per loop), bottom unit
//     = one slow soft breath per loop, phase-offset. They are never in unison.
//  2. Activity in the slots. A bar behind each slot hole reads as a drive
//     meter: its right edge travels inside the slot between eased, hashed
//     targets, an integer number of steps per loop, a different step count per
//     unit. The level is clamped inside [MIN, MAX] so the slot never blacks
//     out and always still reads as a slot. (`slotMode: 'scan'` swaps in a
//     short segment scanning left to right — kept as a prop, but the meter is
//     the default: at thumbnail size the scanning segment is a few pixels and
//     reads as flicker, while a level reads as a bar.)
//  3. Whole-icon motion, very restrained. A rack does not sway, so there is no
//     rotation: only a volume-preserving breathing squash (<= 1% * liveliness,
//     x up / y down) anchored at the feet, one cycle per loop. The optional
//     high-frequency hum-translate is off by default — at 1px it read as
//     jitter rather than as a machine humming.
//
// Everything is driven off one normalised `cycle`, so changing fps or duration
// resamples the motion instead of retiming it.

export const schema = z.object({
  icon: z.string(),
  iconSize: z.number().min(240).max(1040),
  /** Meter level inside each slot, or a segment scanning through it. */
  slotMode: z.enum(['meter', 'scan']),
  /** Level changes per loop, one per rack unit (integers keep the loop shut). */
  meterSteps: z.array(z.number().int().min(1).max(12)).length(3),
  /** Short LED dips per loop for the middle (activity) unit. */
  activityBlinks: z.number().int().min(1).max(8),
  /** Sub-pixel hum translate, in px at 512 icon units. 0 = off. */
  hum: z.number().min(0).max(3),
  /** Multiplies every amplitude — 0 freezes the icon, 2 doubles the motion. */
  liveliness: z.number().min(0).max(2),
});

export type ServerIconLoopProps = z.infer<typeof schema>;

export const defaultProps: ServerIconLoopProps = schema.parse({
  icon: 'server.png',
  iconSize: 760,
  slotMode: 'meter',
  meterSteps: [3, 6, 2],
  activityBlinks: 4,
  hum: 0,
  liveliness: 1,
});

// Geometry measured from the source PNG's alpha channel, in its own 512x512
// space: the eight enclosed transparent regions are three round LEDs, three
// slots and the two inter-slab gaps.
const VIEW = 512;
const LED_CX = 112;
const LED_R = 16;
const LED_CY = [96, 240, 384];
const SLOT_X0 = 304;
const SLOT_X1 = 432;
const SLOT_Y0 = 80;
const SLOT_Y1 = 112;
const SLOT_TOP = [80, 224, 368]; // y of each slot's top edge
const SLOT_W = SLOT_X1 - SLOT_X0;
const SLOT_H = SLOT_Y1 - SLOT_Y0;

// The feet: the squash is anchored here so the rack breathes off the ground.
const FOOT_X = 256;
const FOOT_Y = 480;

const LED_DIM = 0.55;
const SLOT_FILL = 0.45;
const METER_MIN = 0.16;
const METER_MAX = 0.78;
const SCAN_W = 0.26; // segment width, as a fraction of the slot
// Hash keys picked so each unit's level sequence spreads across the slot and
// no two consecutive levels sit on top of each other.
const METER_KEYS = [68, 109, 100];

const TAU = Math.PI * 2;

/** Stable hash: same value every loop, so nothing flickers frame to frame. */
const hash = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

/** Smooth 0 -> 1 -> 0 bump with zero slope at both ends. */
const bump = (x: number) => (x <= 0 || x >= 1 ? 0 : 0.5 - 0.5 * Math.cos(TAU * x));

const smoothstep = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

type Dip = {at: number; w: number; a: number};

/** Highest dip active at this point of the loop; wraps across the seam. */
const dipTrain = (cycle: number, dips: readonly Dip[]) => {
  let v = 0;
  for (const dip of dips) {
    let x = (cycle - dip.at) % 1;
    if (x < 0) {
      x += 1;
    }
    v = Math.max(v, dip.a * bump(x / dip.w));
  }
  return v;
};

// Top unit: a slow lub-dub heartbeat, twice per loop.
const HEARTBEAT: Dip[] = [0, 1].flatMap((b) => [
  {at: b * 0.5 + 0.02, w: 0.075, a: 1},
  {at: b * 0.5 + 0.105, w: 0.062, a: 0.6},
]);

const ServerIconLoop: React.FC<ServerIconLoopProps> = ({
  icon,
  iconSize,
  slotMode,
  meterSteps,
  activityBlinks,
  hum,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const cycle = (frame % durationInFrames) / durationInFrames;

  // Middle unit: quick, irregular-looking activity, but hashed so it is the
  // same irregularity on every loop.
  const activity: Dip[] = [];
  for (let i = 0; i < activityBlinks; i++) {
    activity.push({
      at: (i + 0.18 + 0.5 * hash(i, 3)) / activityBlinks,
      w: 0.045 + 0.028 * hash(i, 7),
      a: 0.72 + 0.28 * hash(i, 11),
    });
  }

  const leds = LED_CY.map((cy, u) => {
    let b: number;
    if (u === 0) {
      b = dipTrain(cycle, HEARTBEAT);
    } else if (u === 1) {
      b = dipTrain(cycle, activity);
    } else {
      // One slow soft breath per loop, offset so the three never coincide.
      b = 0.9 * Math.pow(0.5 - 0.5 * Math.cos(TAU * (cycle + 0.28)), 2.4);
    }
    return {cy, opacity: LED_DIM * liveliness * b};
  });

  const slots = SLOT_TOP.map((y0, u) => {
    const steps = meterSteps[u];
    if (slotMode === 'scan') {
      // One segment per unit, sweeping left to right `steps` times per loop.
      const t = (cycle * steps + u * 0.31) % 1;
      const x = SLOT_X0 + (t * (1 + SCAN_W) - SCAN_W) * SLOT_W;
      const x0 = Math.max(SLOT_X0, x);
      const x1 = Math.min(SLOT_X1, x + SCAN_W * SLOT_W);
      return {
        y0,
        x0,
        w: Math.max(0, x1 - x0),
        opacity: SLOT_FILL * liveliness,
      };
    }

    // Meter: eased travel between hashed levels, `steps` levels per loop.
    const p = cycle * steps + u * 0.37;
    const i = Math.floor(p);
    const f = smoothstep(interpolate(p - i, [0.15, 0.85], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }));
    const levelAt = (k: number) =>
      METER_MIN +
      (METER_MAX - METER_MIN) *
        hash(((k % steps) + steps) % steps, METER_KEYS[u]);
    const level = levelAt(i) + (levelAt(i + 1) - levelAt(i)) * f;
    return {
      y0,
      x0: SLOT_X0,
      w: level * SLOT_W,
      opacity: SLOT_FILL * liveliness,
    };
  });

  // Volume-preserving breathing squash off the feet, one cycle per loop.
  const breath = Math.sin(TAU * cycle) * liveliness;
  const sx = 1 + breath * 0.006;
  const sy = 1 - breath * 0.009;
  const humY = (hum * liveliness * Math.sin(TAU * 6 * cycle) * iconSize) / VIEW;

  const layerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
  };

  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div
        style={{
          position: 'relative',
          width: iconSize,
          height: iconSize,
          transformOrigin: `${(FOOT_X / VIEW) * 100}% ${(FOOT_Y / VIEW) * 100}%`,
          transform: `translateY(${humY}px) scale(${sx}, ${sy})`,
        }}
      >
        {/* Behind the artwork: only the LED and slot holes let it through. */}
        <svg style={layerStyle} viewBox={`0 0 ${VIEW} ${VIEW}`}>
          {leds.map((led) => (
            <circle
              key={`led-${led.cy}`}
              cx={LED_CX}
              cy={led.cy}
              r={LED_R + 4}
              fill="#000000"
              opacity={led.opacity}
            />
          ))}
          {slots.map((slot) =>
            slot.w > 0 ? (
              <rect
                key={`slot-${slot.y0}`}
                x={slot.x0}
                y={slot.y0 - 2}
                width={slot.w}
                height={SLOT_H + 4}
                fill="#000000"
                opacity={slot.opacity}
              />
            ) : null,
          )}
        </svg>

        {/* The supplied artwork, never redrawn. */}
        <Img src={staticFile(icon)} style={layerStyle} />
      </div>
    </AbsoluteFill>
  );
};

export default ServerIconLoop;
