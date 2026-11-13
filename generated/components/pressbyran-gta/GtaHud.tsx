/*
 * GtaHud: an open-world game HUD over the Pressbyrån GTA cut (Pressbyrån/GTA/GTA.prproj, "GTA - 360 source").
 * Check: whole sequence 0 -> 43.644 s, transparent overlay on top of V1; the footage plays untouched underneath.
 *
 * Beats (sequence seconds, from the edit; Swedish dialogue):
 *   0.0   he steps out of the car                         -> objective "Go to Pressbyrån." (0.4 - 4.4)
 *   21.6  takes a bag from the candy stand ("Måste du ha ett?" "Ja.")  -> pickup 1, CANDY
 *   23.2  "Så, trea för två"                                -> objective "Grab a 3 for 2." (22.4 - 26.0)
 *   29.5  first fridge, a blue pack in his hand at 30.4     -> pickup 2
 *   35.2  second fridge, hand to the shelf at 34.8          -> pickup 3
 *   37.7  walks to the till                                 -> objective "Pay at the till."
 *   39.3  at the till, "Perfekt." 38.92                     -> cash ticks down, red "-$" line
 *   40.474 cut to him heading out                           -> (MISSION PASSED is its own composition, GtaMissionPassed)
 * DURATION: 0 -> 43.644 s x 30000/1001 = 1308 frames. GtaMissionPassed: 40.474 -> 43.644 s = 95 frames.
 * Motion: the HUD is always on: cash top right, a radar bottom left that walks a route to a yellow blip and turns
 * with every camera cut (heading from each clip's Insta360 Pan), health / armour bars under it. Pickups slide in a
 * help box top left with a +1 and a basket count; the payment pulses the cash red and ticks it down.
 * Figures: cash and price are placeholders (no price is spoken or visible in the footage).
 */
import {AbsoluteFill, Easing, interpolate, random, spring, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {z} from 'zod';

export const FPS = 30000 / 1001;
export const DURATION = 1308;
export const MP_IN = 40.474;
export const MP_DURATION = 95;

const CHUNK = 'GtaChunk';
const HUD = 'GtaHudSans';
loadFont({family: CHUNK, url: staticFile('pressbyran-gta/burbankbigcondensed_bold.otf'), weight: '700'});
loadFont({family: HUD, url: staticFile('pressbyran-gta/BarlowCondensed-SemiBold.ttf'), weight: '600'});
loadFont({family: HUD, url: staticFile('pressbyran-gta/BarlowCondensed-Bold.ttf'), weight: '700'});

const CASH_GREEN = '#7ad35f';
const LOSS_RED = '#e5413a';
const OBJ_YELLOW = '#f2c740';
const INK = '#08090a';

export const schema = z.object({
  startCash: z.number(),
  price: z.number(),
  payAt: z.number(),
  pickups: z.array(z.object({t: z.number(), label: z.string(), icon: z.enum(['candy', 'pack'])})),
  objectives: z.array(z.object({t0: z.number(), t1: z.number(), pre: z.string(), key: z.string(), post: z.string()})),
});

export const defaultProps = schema.parse({
  startCash: 1337,
  price: 69,
  payAt: 39.3,
  pickups: [
    {t: 21.6, label: 'CANDY', icon: 'candy'},
    {t: 29.5, label: 'SNACK', icon: 'pack'},
    {t: 35.2, label: 'SNACK', icon: 'pack'},
  ],
  objectives: [
    {t0: 0.4, t1: 4.4, pre: 'Go to ', key: 'Pressbyrån', post: '.'},
    {t0: 22.4, t1: 26.0, pre: 'Grab a ', key: '3 for 2', post: '.'},
    {t0: 37.7, t1: 39.7, pre: 'Pay at the ', key: 'till', post: '.'},
  ],
});

type Props = z.infer<typeof schema>;

// V1 cuts (sequence seconds) and each clip's Insta360 Reframe Pan, read from GTA.prproj.
const CUTS = [0, 2.436, 3.77, 6.139, 7.708, 9.209, 13.046, 14.114, 15.282, 17.751, 22.122, 23.257, 29.396, 31.231,
  36.403, 37.671, 38.472, 40.474];
const PANS = [-11, 72, 79, 185, 185, 138, 106, 188, 128, 65, 200, 200, 200, 200, 200, 39, 108, -111];

const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const fmtCash = (n: number) => '$' + Math.round(n).toLocaleString('en-US');

// ---- the player's walk in radar-world units (1 unit = 1 px at radar zoom)
const PATH: [number, number, number][] = [
  // t, x, y   (north = -y)
  [0, 0, 0],
  [2.4, 0, -40],
  [9.2, 0, -330],
  [13.0, 60, -470],
  [15.3, 150, -520],
  [17.7, 205, -560],
  [22.1, 222, -572],
  [29.4, 238, -590],
  [37.7, 228, -585],
  [40.5, 214, -570],
  [43.7, 175, -548],
];
const DEST: [number, number] = [214, -568];
const pos = (t: number): [number, number] => {
  const ts = PATH.map((p) => p[0]);
  return [interpolate(t, ts, PATH.map((p) => p[1]), clamp), interpolate(t, ts, PATH.map((p) => p[2]), clamp)];
};

// heading (deg, 0 = north, clockwise): direction of travel plus a damped share of each clip's camera pan
const travel = (t: number) => {
  const [x0, y0] = pos(t - 0.6);
  const [x1, y1] = pos(t + 0.6);
  if (Math.hypot(x1 - x0, y1 - y0) < 6) return null;
  return (Math.atan2(x1 - x0, -(y1 - y0)) * 180) / Math.PI;
};
const clipIndex = (t: number) => {
  let i = 0;
  for (let k = 0; k < CUTS.length; k++) if (t >= CUTS[k]) i = k;
  return i;
};
const panOffset = (i: number) => {
  const d = ((((PANS[i] - PANS[0]) % 360) + 540) % 360) - 180;
  return Math.max(-28, Math.min(28, d * 0.25));
};
const headingAt = (t: number) => {
  const base = travel(t) ?? 40 + 30 * Math.sin(t * 0.35);
  const i = clipIndex(t);
  const k = interpolate(t - CUTS[i], [0, 0.3], [0, 1], {...clamp, easing: ease});
  const prev = i > 0 ? panOffset(i - 1) : panOffset(0);
  return base + prev + (panOffset(i) - prev) * k;
};

// a deterministic block city around the route
const ZOOM = 0.5;

const BLOCKS = (() => {
  const out: {x: number; y: number; w: number; h: number; tone: number}[] = [];
  for (let gx = -12; gx <= 14; gx++)
    for (let gy = -16; gy <= 8; gy++) {
      const x = gx * 110;
      const y = gy * 110;
      // keep the main street (x 0) and the station hall area open
      const cx = x + 55;
      const cy = y + 55;
      if (Math.abs(cx) < 70 && cy > -520 && cy < 60) continue;
      if (cx > 100 && cx < 300 && cy > -640 && cy < -480) continue;
      const r = random(`b${gx}_${gy}`);
      out.push({x: x + 12, y: y + 12, w: 86 - r * 18, h: 86 - random(`h${gx}_${gy}`) * 22, tone: random(`t${gx}_${gy}`)});
    }
  return out;
})();

const Radar: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const W = 360;
  const H = 236;
  const [px, py] = pos(t);
  const hd = headingAt(t);
  const arrived = t >= 17.7;
  const routeAhead = PATH.filter((p) => p[0] > t && p[0] <= 17.7).map((p) => [p[1], p[2]]);
  const route = [[px, py], ...routeAhead, DEST];
  const pulse = 0.5 + 0.5 * Math.sin((frame / FPS) * Math.PI * 2 * 1.2);
  return (
    <div style={{position: 'absolute', left: 54, top: 1392, width: W, height: H + 26}}>
      <div
        style={{
          position: 'absolute', inset: 0, height: H, borderRadius: 10, overflow: 'hidden',
          boxShadow: '0 0 0 3px rgba(0,0,0,0.55), 0 6px 18px rgba(0,0,0,0.35)', background: '#3b4a52',
        }}
      >
        <svg width={W} height={H} viewBox={`${-W / 2} ${-H * 0.62} ${W} ${H}`} style={{position: 'absolute'}}>
          <g transform={`rotate(${-hd}) scale(${ZOOM}) translate(${-px} ${-py})`}>
            <rect x={-2400} y={-2600} width={5200} height={4400} fill="#56666f" />
            {BLOCKS.map((b, i) => (
              <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={3}
                fill={b.tone > 0.82 ? '#5f7a5a' : b.tone > 0.55 ? '#3e4c55' : '#44535c'} />
            ))}
            {/* water to the west */}
            <rect x={-2400} y={-2600} width={1700} height={4400} fill="#35617e" />
            <path d="M-700,-2600 C-560,-1500 -760,-600 -620,1800 L-700,1800 Z" fill="#35617e" />
            {/* station hall */}
            <rect x={110} y={-640} width={190} height={150} rx={6} fill="#4c5a63" stroke="#6c7c86" strokeWidth={3} />
            {/* route */}
            {!arrived && (
              <polyline points={route.map((p) => p.join(',')).join(' ')} fill="none" stroke="#b07cff" strokeWidth={9 / ZOOM}
                strokeLinecap="round" strokeLinejoin="round" opacity={0.95} />
            )}
            {/* destination blip */}
            <g transform={`translate(${DEST[0]} ${DEST[1]}) rotate(${hd}) scale(${1 / ZOOM})`}>
              <circle r={arrived ? 15 + 6 * pulse : 14} fill={OBJ_YELLOW} opacity={arrived ? 0.25 : 0} />
              <circle r={10} fill={OBJ_YELLOW} stroke={INK} strokeWidth={3} />
            </g>
          </g>
          {/* north marker on the edge */}
          {(() => {
            const a = ((-hd - 90) * Math.PI) / 180;
            const R = 300;
            let nx = Math.cos(a) * R;
            let ny = Math.sin(a) * R;
            const sx = (W / 2 - 16) / Math.abs(nx || 1e-6);
            const sy = (ny < 0 ? H * 0.62 - 16 : H * 0.38 - 16) / Math.abs(ny || 1e-6);
            const s = Math.min(sx, sy);
            nx *= s;
            ny *= s;
            return (
              <g transform={`translate(${nx} ${ny})`}>
                <circle r={13} fill="rgba(0,0,0,0.6)" />
                <text y={6} textAnchor="middle" fontFamily={HUD} fontWeight={700} fontSize={19} fill="#fff">N</text>
              </g>
            );
          })()}
          {/* the player */}
          <path d="M0,-15 L11,12 L0,6 L-11,12 Z" fill="#fff" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
        </svg>
      </div>
      {/* health | armour | ability */}
      <div style={{position: 'absolute', top: H + 8, left: 0, width: W, height: 14, display: 'flex', gap: 5}}>
        {[
          {w: 0.5, fill: 1, c: '#58b04a', bg: '#22401d'},
          {w: 0.32, fill: 0.62, c: '#4aa3dd', bg: '#173447'},
          {w: 0.18, fill: 0.85, c: '#e9c43f', bg: '#4a3d12'},
        ].map((b, i) => (
          <div key={i} style={{flex: b.w, background: b.bg, boxShadow: '0 0 0 2px rgba(0,0,0,0.55)'}}>
            <div style={{width: `${b.fill * 100}%`, height: '100%', background: b.c}} />
          </div>
        ))}
      </div>
    </div>
  );
};

const stroke = (px: number, c = INK) => {
  const s: string[] = [];
  for (let a = 0; a < 16; a++) {
    const r = (a / 16) * Math.PI * 2;
    s.push(`${(Math.cos(r) * px).toFixed(1)}px ${(Math.sin(r) * px).toFixed(1)}px 0 ${c}`);
  }
  return s.join(',');
};

const Cash: React.FC<{t: number; frame: number; startCash: number; price: number; payAt: number}> = ({
  t, frame, startCash, price, payAt,
}) => {
  const tick = interpolate(t, [payAt + 0.35, payAt + 1.15], [0, 1], {...clamp, easing: ease});
  const cash = startCash - price * tick;
  const payF = Math.round(payAt * FPS);
  const lossIn = spring({frame: frame - payF, fps: FPS, config: {damping: 14, stiffness: 180}});
  const lossOut = interpolate(t, [payAt + 2.4, payAt + 2.9], [1, 0], clamp);
  const flash = interpolate(t, [payAt, payAt + 0.08, payAt + 0.9], [0, 1, 0], clamp);
  const color = flash > 0 ? mix(CASH_GREEN, LOSS_RED, flash) : CASH_GREEN;
  return (
    <div style={{position: 'absolute', right: 58, top: 196, textAlign: 'right'}}>
      <div style={{fontFamily: CHUNK, fontWeight: 700, fontSize: 96, lineHeight: 1, color, letterSpacing: 1,
        textShadow: stroke(5)}}>
        {fmtCash(cash)}
      </div>
      {frame >= payF && (
        <div style={{fontFamily: CHUNK, fontWeight: 700, fontSize: 70, lineHeight: 1, marginTop: 8, color: LOSS_RED,
          textShadow: stroke(4), opacity: lossOut * Math.min(1, lossIn * 1.4),
          transform: `translateY(${(1 - lossIn) * -26}px)`}}>
          -{fmtCash(price)}
        </div>
      )}
    </div>
  );
};

function mix(a: string, b: string, k: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * k)).join(',')})`;
}

const CandyIcon = () => (
  <svg width={64} height={64} viewBox="-32 -32 64 64">
    <g transform="rotate(-25)">
      <path d="M-16,0 L-30,-12 L-27,0 L-30,12 Z" fill="#ff5fa2" stroke="#fff" strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M16,0 L30,-12 L27,0 L30,12 Z" fill="#ff5fa2" stroke="#fff" strokeWidth={2.5} strokeLinejoin="round" />
      <ellipse rx={18} ry={13} fill="#ff5fa2" stroke="#fff" strokeWidth={3} />
      <path d="M-9,-11 Q0,0 -9,11 M2,-13 Q11,0 2,13" stroke="#fff" strokeWidth={3} fill="none" opacity={0.9} />
    </g>
  </svg>
);
const PackIcon = () => (
  <svg width={64} height={64} viewBox="-32 -32 64 64">
    <rect x={-18} y={-24} width={36} height={48} rx={5} fill="#3d8de0" stroke="#fff" strokeWidth={3} />
    <rect x={-18} y={-24} width={36} height={12} rx={4} fill="#fff" opacity={0.85} />
    <circle cx={0} cy={6} r={9} fill="#fff" opacity={0.9} />
  </svg>
);
const BasketIcon = () => (
  <svg width={30} height={26} viewBox="0 0 30 26">
    <path d="M2,9 H28 L25,24 H5 Z" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinejoin="round" />
    <path d="M9,9 L13,2 M21,9 L17,2" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" />
  </svg>
);

const PickupBox: React.FC<{frame: number; pickups: Props['pickups']}> = ({frame, pickups}) => {
  // the most recent pickup that is still on screen
  let idx = -1;
  for (let i = 0; i < pickups.length; i++) if (frame >= Math.round(pickups[i].t * FPS)) idx = i;
  if (idx < 0) return null;
  const p = pickups[idx];
  const f0 = Math.round(p.t * FPS);
  const life = frame - f0;
  const HOLD = Math.round(3.0 * FPS);
  if (life > HOLD + 10) return null;
  const inS = spring({frame: life, fps: FPS, config: {damping: 16, stiffness: 220}});
  const out = interpolate(life, [HOLD, HOLD + 10], [1, 0], clamp);
  const flash = interpolate(life, [0, 2, 9], [0, 0.85, 0], clamp);
  const plusPop = spring({frame: life - 2, fps: FPS, config: {damping: 9, stiffness: 260}});
  return (
    <div style={{position: 'absolute', left: 54, top: 300, opacity: out,
      transform: `translateX(${(1 - inS) * -60}px)`}}>
      <div style={{position: 'relative', display: 'flex', alignItems: 'center', gap: 16, padding: '14px 26px 14px 16px',
        background: 'rgba(0,0,0,0.72)', borderRadius: 4, minWidth: 380}}>
        <div style={{width: 64, height: 64, transform: `scale(${0.6 + 0.4 * plusPop})`}}>
          {p.icon === 'candy' ? <CandyIcon /> : <PackIcon />}
        </div>
        <div>
          <div style={{fontFamily: HUD, fontWeight: 600, fontSize: 30, color: 'rgba(255,255,255,0.75)', lineHeight: 1}}>
            Picked up
          </div>
          <div style={{fontFamily: HUD, fontWeight: 700, fontSize: 50, color: '#fff', lineHeight: 1.05, letterSpacing: 0.5}}>
            {p.label}
          </div>
        </div>
        <div style={{marginLeft: 'auto', fontFamily: CHUNK, fontWeight: 700, fontSize: 64, color: CASH_GREEN,
          textShadow: stroke(3.5), transform: `scale(${plusPop})`, paddingLeft: 18}}>
          +1
        </div>
        <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: flash, borderRadius: 4}} />
      </div>
      <div style={{display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 8, padding: '8px 16px',
        background: 'rgba(0,0,0,0.6)', borderRadius: 4}}>
        <BasketIcon />
        <span style={{fontFamily: HUD, fontWeight: 700, fontSize: 32, color: '#fff'}}>{idx + 1}/{pickups.length}</span>
      </div>
    </div>
  );
};

const Objective: React.FC<{t: number; objectives: Props['objectives']}> = ({t, objectives}) => {
  const o = objectives.find((x) => t >= x.t0 && t < x.t1 + 0.4);
  if (!o) return null;
  const op = interpolate(t, [o.t0, o.t0 + 0.2, o.t1, o.t1 + 0.35], [0, 1, 1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1262, textAlign: 'center', opacity: op,
      fontFamily: HUD, fontWeight: 600, fontSize: 58, color: '#fff', textShadow: stroke(3) + ',0 4px 10px rgba(0,0,0,0.6)'}}>
      {o.pre}<span style={{color: OBJ_YELLOW}}>{o.key}</span>{o.post}
    </div>
  );
};

const GtaHud: React.FC<Props> = (props) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill>
      <Radar t={t} frame={frame} />
      <Cash t={t} frame={frame} startCash={props.startCash} price={props.price} payAt={props.payAt} />
      <PickupBox frame={frame} pickups={props.pickups} />
      <Objective t={t} objectives={props.objectives} />
    </AbsoluteFill>
  );
};

export default GtaHud;
