import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';

export const FPS = 24;
// 00:00:00.000 -> 00:00:04.900 of the source cut.
export const DURATION = 118;

const CANVAS_W = 1080;
const CANVAS_H = 1920;

const TINT_ID = 'mck-tint-ink';

// Every hand the food passes through on the long way round, in order.
const CHAIN_ICONS = ['mck-factory.png', 'mck-box.png', 'mck-truck.png'];
// The candidate goods at the open; they collapse into the one empty slot.
const GOODS_ICONS = ['mck-veg.png', 'mck-meat.png'];

// Measured alpha bounding boxes, as a fraction of each icon's box half-extent.
// These glyphs fill their boxes very differently — the factory and the parcel
// run edge to edge, the truck only fills the middle third — so every gap and
// attachment below is derived from the ink, never from the box.
const INK = {
  farmer: {hx: 0.381, hy: 0.5},
  buyer: {hx: 0.406, hy: 0.469},
  store: {hx: 0.426, hy: 0.438},
  chain: [
    {hx: 0.5, hy: 0.5},
    {hx: 0.479, hy: 0.5},
    {hx: 0.5, hy: 0.312},
  ],
  goods: [
    {hx: 0.5, hy: 0.5},
    {hx: 0.5, hy: 0.322},
  ],
};

// Largest scale each element ever reaches, entrance overshoot and the pop as
// the wavefront crosses included. Clearances are computed against these, so a
// station can never grow into the line it is sitting on.
const STATION_MAX = 1.06;
const NODE_MAX = 1.12;
const FARM_MAX = 1.03;
const SLOT_MAX = 1.05;

type Pt = {x: number; y: number};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => v * v * (3 - 2 * v);

const rgbOf = (hex: string) => {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
};

// A polyline with filleted corners, flattened once so the drawn path and the
// travelling dot read off the same geometry and cannot drift apart.
const routeFrom = (pts: Pt[], radius: number) => {
  const samples: Pt[] = [pts[0]];
  // Straight runs are subdivided too, so a station placed anywhere along the
  // route resolves to a real arc-length instead of snapping to an endpoint.
  const lineTo = (p: Pt) => {
    const a = samples[samples.length - 1];
    const dist = Math.hypot(p.x - a.x, p.y - a.y);
    const steps = Math.max(1, Math.ceil(dist / 8));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      samples.push({x: a.x + (p.x - a.x) * t, y: a.y + (p.y - a.y) * t});
    }
  };
  const quadTo = (c: Pt, p: Pt) => {
    const a = samples[samples.length - 1];
    for (let i = 1; i <= 12; i++) {
      const t = i / 12;
      const u = 1 - t;
      samples.push({
        x: u * u * a.x + 2 * u * t * c.x + t * t * p.x,
        y: u * u * a.y + 2 * u * t * c.y + t * t * p.y,
      });
    }
  };

  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i - 1];
    const v = pts[i];
    const q = pts[i + 1];
    const d1 = Math.hypot(v.x - p.x, v.y - p.y);
    const d2 = Math.hypot(q.x - v.x, q.y - v.y);
    const r = Math.min(radius, d1 / 2, d2 / 2);
    lineTo({x: v.x + ((p.x - v.x) / d1) * r, y: v.y + ((p.y - v.y) / d1) * r});
    quadTo(v, {x: v.x + ((q.x - v.x) / d2) * r, y: v.y + ((q.y - v.y) / d2) * r});
  }
  lineTo(pts[pts.length - 1]);

  const cum: number[] = [0];
  for (let i = 1; i < samples.length; i++) {
    cum.push(
      cum[i - 1] +
        Math.hypot(samples[i].x - samples[i - 1].x, samples[i].y - samples[i - 1].y),
    );
  }
  const len = cum[cum.length - 1];

  const at = (s: number): Pt => {
    const target = Math.min(Math.max(s, 0), len);
    let i = 1;
    while (i < cum.length - 1 && cum[i] < target) {
      i++;
    }
    const span = Math.max(cum[i] - cum[i - 1], 1e-6);
    const t = (target - cum[i - 1]) / span;
    return {
      x: samples[i - 1].x + (samples[i].x - samples[i - 1].x) * t,
      y: samples[i - 1].y + (samples[i].y - samples[i - 1].y) * t,
    };
  };

  // Stations are placed in world space; their arc-length falls out of the path
  // itself, so moving a stop retimes the wavefront instead of desyncing it.
  const sOf = (p: Pt) => {
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < samples.length; i++) {
      const dd = (samples[i].x - p.x) ** 2 + (samples[i].y - p.y) ** 2;
      if (dd < bestD) {
        bestD = dd;
        best = i;
      }
    }
    return cum[best];
  };

  const sub = (s0: number, s1: number) => {
    const a = at(s0);
    const b = at(s1);
    const parts = [`M ${a.x.toFixed(2)} ${a.y.toFixed(2)}`];
    for (let i = 0; i < samples.length; i++) {
      if (cum[i] > s0 && cum[i] < s1) {
        parts.push(`L ${samples[i].x.toFixed(2)} ${samples[i].y.toFixed(2)}`);
      }
    }
    parts.push(`L ${b.x.toFixed(2)} ${b.y.toFixed(2)}`);
    return parts.join(' ');
  };

  return {len, at, sOf, sub};
};

// Everything not swallowed by a station, in draw order.
const openSpans = (len: number, gaps: {a: number; b: number}[]) => {
  const spans: {a: number; b: number}[] = [];
  let cursor = 0;
  for (const g of [...gaps].sort((x, y) => x.a - y.a)) {
    if (g.a > cursor) {
      spans.push({a: cursor, b: g.a});
    }
    cursor = Math.max(cursor, g.b);
  }
  if (cursor < len) {
    spans.push({a: cursor, b: len});
  }
  return spans;
};

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  axisX: z.number(),
  detourX: z.number(),
  farmY: z.number(),
  buyerY: z.number(),
  icon: z.number().min(80).max(280),
  buyerIcon: z.number().min(80).max(280),
  slot: z.number().min(80).max(260),
  stopSizes: z.array(z.number()).length(3),
  market: z.number().min(60).max(260),
  corner: z.number().min(0).max(140),
  // Visible air between any glyph's ink and the line that meets it.
  clearance: z.number().min(0).max(60),
  goodsSizes: z.array(z.number()).length(2),
  goodsGap: z.number().min(60).max(320),
  dot: z.number().min(6).max(40),
  routeWidth: z.number().min(4).max(30),
  chainWidth: z.number().min(3).max(24),
  dimOpacity: z.number().min(0).max(1),
  readOpacity: z.number().min(0).max(1),
  chainOpacity: z.number().min(0).max(1),
  marketOpacity: z.number().min(0).max(1),
  // Beat frames lifted from the SRT at 24fps:
  //   0 "what are things" · 21 "that people" · 42 "should buy"
  //   53 "directly from" · 68 "farmers as" · 84 "opposed to"
  //   95 "in the" · 100 "supermarket?"
  beats: z.object({
    things: z.number().int(),
    people: z.number().int(),
    buy: z.number().int(),
    direct: z.number().int(),
    directEnd: z.number().int(),
    farmers: z.number().int(),
    branch: z.number().int(),
    stop1: z.number().int(),
    stop2: z.number().int(),
    stop3: z.number().int(),
    market: z.number().int(),
    arrive: z.number().int(),
  }),
});

export type FarmerDirectVersusSupermarketProps = z.infer<typeof schema>;

export const defaultProps: FarmerDirectVersusSupermarketProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#FFC543',
  shadow: 'rgba(0, 0, 0, 0.28)',
  // Straight route on the axis, chain bulging right; the pair sits centred.
  axisX: 350,
  detourX: 750,
  farmY: 530,
  buyerY: 1390,
  icon: 150,
  // The buyer glyph carries more padding in its box; sized to match weight.
  buyerIcon: 176,
  slot: 180,
  // Optically matched on ink, not box: the truck fills only its middle third.
  stopSizes: [100, 104, 130],
  market: 165,
  corner: 50,
  clearance: 14,
  goodsSizes: [118, 132],
  goodsGap: 130,
  dot: 20,
  routeWidth: 17,
  chainWidth: 11,
  dimOpacity: 0.16,
  readOpacity: 0.85,
  chainOpacity: 0.42,
  marketOpacity: 0.6,
  beats: {
    things: 0,
    people: 21,
    buy: 42,
    direct: 53,
    directEnd: 62,
    farmers: 68,
    branch: 78,
    stop1: 85,
    stop2: 89,
    stop3: 93,
    market: 98,
    arrive: 114,
  },
});

const FarmerDirectVersusSupermarket: React.FC<FarmerDirectVersusSupermarketProps> = ({
  ink,
  accent,
  shadow,
  axisX,
  detourX,
  farmY,
  buyerY,
  icon,
  buyerIcon,
  slot,
  stopSizes,
  market,
  corner,
  clearance,
  goodsSizes,
  goodsGap,
  dot,
  routeWidth,
  chainWidth,
  dimOpacity,
  readOpacity,
  chainOpacity,
  marketOpacity,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Every attachment point is the glyph's ink half-extent at its largest drawn
  // scale, plus the meeting line's round cap, plus the clearance. Nothing here
  // is hand-tuned, so resizing an icon cannot reintroduce an overlap.
  const capD = routeWidth / 2;
  const capC = chainWidth / 2;
  const farmAttachY = icon * INK.farmer.hy * FARM_MAX + capD + clearance;
  const farmAttachX = icon * INK.farmer.hx * FARM_MAX + capC + clearance;
  const buyerAttachY = buyerIcon * INK.buyer.hy * NODE_MAX + capD + clearance;
  const buyerAttachX = buyerIcon * INK.buyer.hx * NODE_MAX + capC + clearance;

  const direct = routeFrom(
    [
      {x: axisX, y: farmY + farmAttachY},
      {x: axisX, y: buyerY - buyerAttachY},
    ],
    corner,
  );
  const detour = routeFrom(
    [
      {x: axisX + farmAttachX, y: farmY},
      {x: detourX, y: farmY},
      {x: detourX, y: buyerY},
      {x: axisX + buyerAttachX, y: buyerY},
    ],
    corner,
  );

  // The slot sits at the midpoint of the route it interrupts, and the break in
  // the line clears its stroked outer edge — not its nominal box, which is what
  // let the line's round cap show inside it.
  const slotY = (farmY + farmAttachY + (buyerY - buyerAttachY)) / 2;
  const slotHalfGap = (slot * SLOT_MAX) / 2 + routeWidth + clearance;
  const slotS = direct.sOf({x: axisX, y: slotY});

  // Stations are spread over the chain's straight run so the visible line
  // between them is equal everywhere, whatever each glyph's ink works out to.
  const chainSizes = [...stopSizes, market];
  const chainInk = [...INK.chain, INK.store];
  const halfGaps = chainSizes.map(
    (size, i) => size * chainInk[i].hy * STATION_MAX + capC + clearance,
  );
  const runTop = farmY + corner;
  const runBottom = buyerY - corner;
  const gapTotal = halfGaps.reduce((a, b) => a + b * 2, 0);
  const segment = (runBottom - runTop - gapTotal) / (halfGaps.length + 1);
  let cursorY = runTop;
  const stationYs = halfGaps.map((hg) => {
    cursorY += segment + hg;
    const y = cursorY;
    cursorY += hg;
    return y;
  });

  const stations = stationYs.map((y, i) => ({
    y,
    size: chainSizes[i],
    half: halfGaps[i],
    s: detour.sOf({x: detourX, y}),
  }));
  const storeStation = stations[stations.length - 1];

  const directSpans = openSpans(direct.len, [
    {a: slotS - slotHalfGap, b: slotS + slotHalfGap},
  ]);
  const detourSpans = openSpans(
    detour.len,
    stations.map((st) => ({a: st.s - st.half, b: st.s + st.half})),
  );

  // One wavefront per route. The straight route is a single snap; the chain is
  // paced station to station, so the stops define the timing rather than a
  // parallel clock, and the last leg to the buyer is the long crawl.
  const directFront =
    direct.len *
    interpolate(frame, [beats.direct, beats.directEnd], [0, 1], {
      easing: Easing.bezier(0.16, 0.9, 0.3, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  const detourFront = interpolate(
    frame,
    [beats.branch, beats.stop1, beats.stop2, beats.stop3, beats.market, beats.arrive],
    [0, stations[0].s, stations[1].s, stations[2].s, stations[3].s, detour.len],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  const reveal = (front: number, span: {a: number; b: number}) =>
    clamp01((front - span.a) / Math.max(span.b - span.a, 1e-6));
  const litAt = (s: number) => smooth(clamp01((detourFront - s + 34) / 68));

  const tint = interpolate(frame, [beats.farmers, beats.farmers + 9], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const routeColor = interpolateColors(tint, [0, 1], [ink, accent]);
  const routeOpacity = readOpacity + (0.97 - readOpacity) * tint;

  const nodeIn = (at: number) =>
    spring({
      frame: frame - at,
      fps,
      config: {damping: 20, mass: 1, stiffness: 110},
      durationInFrames: 22,
    });
  const farmIn = nodeIn(beats.buy);
  const buyerIn = nodeIn(beats.people);

  const arrivalBump = (at: number) => {
    const s = spring({
      frame: frame - at,
      fps,
      config: {damping: 11, mass: 0.6, stiffness: 190},
      durationInFrames: 20,
    });
    return 4 * s * (1 - s);
  };
  const buyerBump =
    Math.max(arrivalBump(beats.directEnd), arrivalBump(beats.arrive)) * 0.09;

  const farmOpacity = dimOpacity + (readOpacity - dimOpacity) * farmIn;
  const buyerOpacity = dimOpacity + (readOpacity - dimOpacity) * buyerIn;

  // The three unknown goods collapse into the one slot the answer will fill.
  const merge = interpolate(frame, [beats.buy, beats.buy + 9], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const slotIn = spring({
    frame: frame - (beats.buy + 3),
    fps,
    config: {damping: 18, mass: 1, stiffness: 120},
    durationInFrames: 24,
  });
  const breathe =
    frame > beats.farmers ? Math.sin((frame - beats.farmers) * 0.14) : 0;
  const slotSize = slot * (0.72 + 0.28 * slotIn) * (1 + 0.014 * breathe);

  const dotOn = (front: number, from: number, until: number) =>
    frame >= from && frame <= until && front > 0 ? clamp01((until - frame) / 5) : 0;
  const directDotOpacity = dotOn(directFront, beats.direct, beats.directEnd + 5);
  const directDot = direct.at(directFront);
  const detourDot = detour.at(detourFront);

  const storeLit = litAt(storeStation.s);
  const storeSize =
    market * (0.86 + 0.14 * storeLit) * (1 + 0.11 * (4 * storeLit * (1 - storeLit)));

  const [tr, tg, tb] = rgbOf(ink);
  const glyph = (
    cx: number,
    cy: number,
    size: number,
    opacity: number,
  ): React.CSSProperties => ({
    position: 'absolute',
    left: cx - size / 2,
    top: cy - size / 2,
    width: size,
    height: size,
    opacity,
    filter: `url(#${TINT_ID})`,
  });

  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id={TINT_ID} colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values={`0 0 0 0 ${tr} 0 0 0 0 ${tg} 0 0 0 0 ${tb} 0 0 0 1 0`}
            />
          </filter>
        </defs>
      </svg>

      <svg
        width={CANVAS_W}
        height={CANVAS_H}
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}
      >
        {detourSpans.map((span, i) => {
          const p = reveal(detourFront, span);
          if (p <= 0) {
            return null;
          }
          return (
            <path
              key={`chain${i}`}
              d={detour.sub(span.a, span.b)}
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - p}
              fill="none"
              stroke={ink}
              strokeWidth={chainWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={chainOpacity}
            />
          );
        })}

        {detourFront > 0 &&
        detourFront < detour.len &&
        !stations.some((st) => Math.abs(detourFront - st.s) < st.half) ? (
          <circle cx={detourDot.x} cy={detourDot.y} r={dot * 0.8} fill={ink} opacity={0.6} />
        ) : null}

        {directSpans.map((span, i) => {
          const p = reveal(directFront, span);
          if (p <= 0) {
            return null;
          }
          return (
            <path
              key={`direct${i}`}
              d={direct.sub(span.a, span.b)}
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - p}
              fill="none"
              stroke={routeColor}
              strokeWidth={routeWidth}
              strokeLinecap="round"
              opacity={routeOpacity}
            />
          );
        })}

        <rect
          x={axisX - slotSize / 2}
          y={slotY - slotSize / 2}
          width={slotSize}
          height={slotSize}
          rx={slotSize * 0.2}
          fill="none"
          stroke={routeColor}
          strokeWidth={routeWidth}
          opacity={routeOpacity * clamp01(slotIn * 2)}
        />

        {directDotOpacity > 0 ? (
          <circle
            cx={directDot.x}
            cy={directDot.y}
            r={dot * (0.35 + 0.65 * directDotOpacity)}
            fill={routeColor}
            opacity={directDotOpacity}
          />
        ) : null}
      </svg>

      <AbsoluteFill style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
        {GOODS_ICONS.map((file, i) => {
          const k = i * 2 - 1;
          const enter = spring({
            frame: frame - (beats.things + i * 6),
            fps,
            config: {damping: 19, mass: 1, stiffness: 110},
            durationInFrames: 24,
          });
          // Gone well before the slot lands, so no crumbs are left inside it.
          const opacity = dimOpacity * enter * clamp01(1 - merge * 1.9);
          if (opacity <= 0.001) {
            return null;
          }
          return (
            <Img
              key={file}
              src={staticFile(file)}
              style={glyph(
                axisX + k * goodsGap * (1 - merge),
                slotY - (1 - enter) * 26,
                goodsSizes[i] * (1 - 0.55 * merge) * (0.8 + 0.2 * enter),
                opacity,
              )}
            />
          );
        })}

        {CHAIN_ICONS.map((file, i) => {
          // Each station is lit by the wavefront crossing it, not by its own timer.
          const lit = litAt(stations[i].s);
          if (lit <= 0.001) {
            return null;
          }
          const size =
            stopSizes[i] * (0.86 + 0.14 * lit) * (1 + 0.11 * (4 * lit * (1 - lit)));
          return (
            <Img
              key={file}
              src={staticFile(file)}
              style={glyph(detourX, stationYs[i], size, chainOpacity * lit)}
            />
          );
        })}

        <Img
          src={staticFile('mck-farmer.png')}
          style={glyph(
            axisX,
            farmY,
            icon * (0.78 + 0.22 * farmIn),
            farmOpacity,
          )}
        />
        {storeLit > 0.001 ? (
          <Img
            src={staticFile('mck-store.png')}
            style={glyph(
              detourX,
              storeStation.y,
              storeSize,
              marketOpacity * storeLit,
            )}
          />
        ) : null}
        <Img
          src={staticFile('mck-buyer.png')}
          style={glyph(
            axisX,
            buyerY,
            buyerIcon * (0.78 + 0.22 * buyerIn) * (1 + buyerBump),
            buyerOpacity,
          )}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default FarmerDirectVersusSupermarket;
