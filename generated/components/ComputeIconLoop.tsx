import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';

export const schema = z.object({
  icon: z.string(),
  iconSize: z.number().min(240).max(1040),
  pulseCount: z.number().int().min(0).max(3),
  liveliness: z.number().min(0).max(2),
});

export type ComputeIconLoopProps = z.infer<typeof schema>;

export const defaultProps: ComputeIconLoopProps = schema.parse({
  icon: 'compute.png',
  iconSize: 760,
  pulseCount: 1,
  liveliness: 1,
});

// Geometry traced from the source icon, in its own 512x512 space.
const VIEW = 512;
const CLOUD_BASE = 274; // flat underside of the cloud
const Y0 = 272; // traces start 2px inside the cloud so the seam is hidden
const HW = 10; // half width of the reveal channel (the traces are 17 wide)

// Each trace drops out of the cloud at `x`, then elbows out to its node.
const TRACES = [
  {x: 180, nx: 82.5, ny: 334.5, nr: 31, dir: -1},
  {x: 218, nx: 120, ny: 417.5, nr: 31, dir: -1},
  {x: 255.5, nx: 255.5, ny: 480, nr: 32, dir: 0},
  {x: 293, nx: 390.5, ny: 417.5, nr: 31, dir: 1},
  {x: 331, nx: 429.5, ny: 334.5, nr: 31, dir: 1},
] as const;

const LEGS = TRACES.map((t) => {
  const pv = t.ny - Y0; // vertical run down to the node's row
  const ph = Math.abs(t.nx - t.x); // horizontal run out to the node
  // The channel stops at the rim of the node; the node itself blooms after.
  const cv = t.dir === 0 ? pv - t.nr : pv;
  const ch = t.dir === 0 ? 0 : ph - t.nr;
  return {
    ...t,
    pv,
    pLen: pv + ph,
    cv,
    ch,
    cLen: cv + ch,
    vRun: t.dir === 0 ? cv : cv + HW, // square corner: flush with the elbow
  };
});

// Timing, in frames at the composition's own fps via `cycle`.
const GROW_AT = 0.042; // stems break out from under the cloud
const SPEED = 8.6; // px per frame of icon space, so length sets duration
const POP = 7; // frames for a node to bloom once its trace arrives
const RETRACT_AT = 0.73;
const RETRACT_TO = 0.98;

// The last trace to land decides when the build is finished.
const LONGEST = Math.max(...LEGS.map((leg) => leg.cLen));

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Overshooting settle for the nodes, kept explicit so it never clips.
const backOut = (t: number) => {
  const c = 1.7;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

const ComputeIconLoop: React.FC<ComputeIconLoopProps> = ({
  icon,
  iconSize,
  pulseCount,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const cycle = (frame % durationInFrames) / durationInFrames;
  const growAt = GROW_AT * durationInFrames;
  const retractAt = RETRACT_AT * durationInFrames;
  const retractTo = RETRACT_TO * durationInFrames;

  // The retract is the build played backwards on a compressed clock, so the
  // nodes are absorbed before their traces withdraw and the loop closes clean.
  const builtAt = growAt + LONGEST / SPEED + POP;
  const rewind = interpolate(frame, [retractAt, retractTo], [builtAt, growAt], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const vFrame = Math.min(frame, rewind);

  const legs = LEGS.map((leg, i) => {
    // Constant break-out speed, decelerating into the node: length alone
    // decides which trace lands first.
    const span = leg.cLen / SPEED;
    const extend = interpolate(vFrame, [growAt, growAt + span], [0, 1], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const dist = extend * leg.cLen;

    const vRun = Math.min(dist, leg.vRun);
    const hRun = clamp01((dist - leg.cv) / Math.max(leg.ch, 1)) * leg.ch;

    // The node blooms once its trace arrives, and on the way back it is the
    // first thing reeled in.
    const popRaw = interpolate(
      vFrame,
      [growAt + span, growAt + span + POP],
      [0, 1],
      {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
    );
    const node = backOut(popRaw);

    // The growing tip pushes a little ahead of the revealed trace.
    const tip = pointAt(leg, dist);
    const tipOpacity =
      0.2 *
      liveliness *
      interpolate(extend, [0, 0.08, 0.88, 1], [0, 1, 1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });

    return {i, leg, vRun, hRun, node, tip, tipOpacity};
  });

  // Ambient load running down the traces while everything is extended.
  const holdGate =
    interpolate(
      frame,
      [0.36, 0.43, 0.66, RETRACT_AT].map((f) => f * durationInFrames),
      [0, 1, 1, 0],
      {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
    ) * liveliness;

  const pulses = [];
  const rings = [];
  const period = durationInFrames * 0.24;
  for (let i = 0; i < LEGS.length; i++) {
    const leg = LEGS[i];
    for (let k = 0; k < pulseCount; k++) {
      const t =
        ((frame - growAt) / period + k / Math.max(pulseCount, 1) + i * 0.06) % 1;
      const d = t * leg.pLen;
      const p = pointAt(leg, d);
      // Stretched along its direction of travel.
      const vertical = leg.dir === 0 || d <= leg.pv;
      pulses.push({
        key: `${i}-${k}`,
        cx: p[0],
        cy: p[1],
        rx: vertical ? 12.5 : 34,
        ry: vertical ? 34 : 12.5,
        opacity:
          holdGate *
          0.22 *
          interpolate(t, [0, 0.1, 0.86, 1], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
      });

      // Once a pulse lands, the node rings out from under itself.
      const ringT = t / 0.2;
      if (ringT > 0 && ringT < 1) {
        rings.push({
          key: `${i}-${k}`,
          cx: leg.nx,
          cy: leg.ny,
          r: leg.nr + ringT * 19,
          width: 4.5 - ringT * 3.2,
          opacity: holdGate * 0.2 * (1 - ringT) * (1 - ringT),
        });
      }
    }
  }

  // The cloud reacts once as the stems punch out, and again as they withdraw.
  const kickOut = recoil((frame - growAt) / (0.22 * durationInFrames));
  const kickIn = recoil((frame - retractAt) / (0.2 * durationInFrames));
  const kick = (kickOut - kickIn * 0.7) * liveliness;

  const S = iconSize / VIEW;
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
          rotate: `${Math.sin(cycle * Math.PI * 2) * 0.55 * liveliness}deg`,
          // Volume-preserving squash: the cloud settles as the nodes deploy.
          scale: `${1 + kick * 0.009} ${1 - kick * 0.014}`,
          translate: `0px ${Math.cos(cycle * Math.PI * 2) * 2.4 * liveliness}px`,
        }}
      >
        <svg width={0} height={0} style={{position: 'absolute'}}>
          <defs>
            {legs.map(({i, leg, vRun, hRun}) => (
              <clipPath key={`clip-${i}`} id={`compute-trace-${i}`}>
                <rect
                  x={(leg.x - HW) * S}
                  y={Y0 * S}
                  width={HW * 2 * S}
                  height={Math.max(vRun, 0) * S}
                />
                {leg.dir !== 0 && hRun > 0 ? (
                  <rect
                    x={(leg.dir < 0 ? leg.x - hRun : leg.x) * S}
                    y={(leg.ny - HW) * S}
                    width={hRun * S}
                    height={HW * 2 * S}
                  />
                ) : null}
              </clipPath>
            ))}
            {LEGS.map((leg, i) => (
              <clipPath key={`node-${i}`} id={`compute-node-${i}`}>
                <circle
                  cx={leg.nx * S}
                  cy={leg.ny * S}
                  r={(leg.nr + 2) * S}
                />
              </clipPath>
            ))}
          </defs>
        </svg>

        {/* Behind the artwork, so load and ripples read as they clear it. */}
        <svg
          style={{...layerStyle, overflow: 'visible'}}
          viewBox={`0 0 ${VIEW} ${VIEW}`}
        >
          {rings.map((ring) => (
            <circle
              key={`ring-${ring.key}`}
              cx={ring.cx}
              cy={ring.cy}
              r={ring.r}
              fill="none"
              stroke="#000000"
              strokeWidth={ring.width}
              opacity={ring.opacity}
            />
          ))}
          {pulses.map((pulse) => (
            <ellipse
              key={`pulse-${pulse.key}`}
              cx={pulse.cx}
              cy={pulse.cy}
              rx={pulse.rx}
              ry={pulse.ry}
              fill="#000000"
              opacity={pulse.opacity}
            />
          ))}
          {legs.map(({i, tip, tipOpacity}) => (
            <circle
              key={`tip-${i}`}
              cx={tip[0]}
              cy={tip[1]}
              r={12}
              fill="#000000"
              opacity={tipOpacity}
            />
          ))}
        </svg>

        {/* The supplied PNG, revealed in pieces: traces, then nodes, then
            the cloud on top so everything emerges from under it. */}
        {legs.map(({i}) => (
          <Img
            key={`trace-${i}`}
            src={staticFile(icon)}
            style={{...layerStyle, clipPath: `url(#compute-trace-${i})`}}
          />
        ))}
        {legs.map(({i, leg, node}) => (
          <Img
            key={`nodeimg-${i}`}
            src={staticFile(icon)}
            style={{
              ...layerStyle,
              clipPath: `url(#compute-node-${i})`,
              transformOrigin: `${leg.nx * S}px ${leg.ny * S}px`,
              transform: `scale(${Math.max(node, 0)})`,
            }}
          />
        ))}
        <Img
          src={staticFile(icon)}
          style={{
            ...layerStyle,
            clipPath: `inset(0 0 ${((VIEW - CLOUD_BASE) / VIEW) * 100}% 0)`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// Distance along a trace's centreline: down out of the cloud, then out.
function pointAt(
  leg: (typeof LEGS)[number],
  d: number,
): [number, number] {
  if (leg.dir === 0 || d <= leg.pv) {
    return [leg.x, Y0 + Math.min(d, leg.pv)];
  }
  return [leg.x + leg.dir * (d - leg.pv), leg.ny];
}

// One damped wobble, starting and ending at rest.
function recoil(t: number) {
  if (t <= 0 || t >= 1) {
    return 0;
  }
  return Math.sin(t * Math.PI * 2) * (1 - t);
}

export default ComputeIconLoop;
