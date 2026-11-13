/*
 * GtaHud (v2): a San Andreas-era game HUD over the Pressbyrån GTA cut (Pressbyrån/GTA/GTA.prproj, "GTA - 360 source").
 * Check: whole sequence 0 -> 43.644 s, transparent overlay on V2; the footage plays untouched underneath.
 * Brief (client): focus is 3 för 2 on Pressbyrån's protein products; game graphics, the mission is called
 * "Fyll på med protein"; at the till a shop menu (like the reference) with 3 för 2 on the products; "Mission Passed"
 * when it is done (that title is its own composition, GtaMissionPassed). Reference: "Real Life GTA in London" (SA HUD).
 *
 * Beats (sequence seconds; Swedish dialogue):
 *   0.3 - 3.0   mission title "Fyll på med protein"
 *   2.8 - 6.8   area name "Stockholm" + objective "Gå till Pressbyrån." (3.1 - 7.4)
 *   17.751      cut into the store                        -> area name "Pressbyrån" (17.8 - 21.4)
 *   21.6        takes a bag from the stand                -> pickup 1, Real Good salty cashews
 *   23.2        "Så, trea för två"                        -> objective "Ta 3 för 2 på protein." (22.4 - 26.0)
 *   29.5        first fridge                              -> pickup 2, Propud milkshake Marängsviss
 *   35.2        second fridge, hand to the shelf at 34.8  -> pickup 3, Chick'n Dip sesamkyckling
 *   37.671      cut to the shelves by the till            -> shop menu "Protein" (until the cut at 40.474)
 *   39.6        "Perfekt." 38.92, at the till             -> 3 FÖR 2 confirmed, cash ticks down
 * DURATION: 0 -> 43.644 s x 30000/1001 = 1308 frames.
 * Motion: always-on HUD: weapon slot (a flexed arm, then the last product picked up), a game clock that runs a
 * minute per second from the camera's 13:19 timestamp, armour and health bars and an 8-digit cash counter top right; a
 * round radar bottom left that walks the route to the store and turns with the camera cuts.
 * Figures: cash and price are placeholders (no price is spoken or visible). Product art: the client's packshots.
 */
import {AbsoluteFill, Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {loadFont as loadGothic} from '@remotion/google-fonts/GrenzeGotisch';
import {loadFont as loadBarlow} from '@remotion/google-fonts/Barlow';
import {z} from 'zod';

export const FPS = 30000 / 1001;
export const DURATION = 1308;

const CHUNK = 'GtaChunk';
const SUB = 'GtaHudSans';
loadFont({family: CHUNK, url: staticFile('pressbyran-gta/burbankbigcondensed_bold.otf'), weight: '700'});
loadFont({family: SUB, url: staticFile('pressbyran-gta/BarlowCondensed-SemiBold.ttf'), weight: '600'});
loadFont({family: SUB, url: staticFile('pressbyran-gta/BarlowCondensed-Bold.ttf'), weight: '700'});
const {fontFamily: GOTHIC} = loadGothic('normal', {weights: ['600'], subsets: ['latin', 'latin-ext']});
const {fontFamily: WIDE} = loadBarlow('normal', {weights: ['600', '700'], subsets: ['latin', 'latin-ext']});

const CASH_GREEN = '#3f9a3c';
const LOSS_RED = '#d8322b';
const OBJ_YELLOW = '#f1c232';
const GOLD = '#e0a83a';
const INK = '#050505';

const ProductSchema = z.object({name: z.string(), short: z.string(), img: z.string(), t: z.number()});
export const schema = z.object({
  startCash: z.number(),
  price: z.number(),
  clockStart: z.number(),
  products: z.array(ProductSchema),
  menuIn: z.number(),
  menuOut: z.number(),
  buyAt: z.number(),
  missionTitle: z.string(),
  objectives: z.array(z.object({t0: z.number(), t1: z.number(), pre: z.string(), key: z.string(), post: z.string()})),
  areas: z.array(z.object({t0: z.number(), t1: z.number(), name: z.string()})),
});

export const defaultProps = schema.parse({
  startCash: 1337,
  price: 59,
  clockStart: 13 * 60 + 19,
  products: [
    {name: 'REAL GOOD CASHEWS', short: 'Real Good Cashews', img: 'pressbyran-gta/p1_cashews.png', t: 21.6},
    {name: 'PROPUD MARÄNGSVISS', short: 'Propud Marängsviss', img: 'pressbyran-gta/p2_propud.png', t: 29.5},
    {name: "CHICK'N DIP SESAM", short: "Chick'n Dip Sesam", img: 'pressbyran-gta/p3_chikndip.png', t: 35.2},
  ],
  menuIn: 37.671,
  menuOut: 40.474,
  buyAt: 39.6,
  missionTitle: 'Fyll på med protein',
  objectives: [
    {t0: 3.1, t1: 7.4, pre: 'Gå till ', key: 'Pressbyrån', post: '.'},
    {t0: 22.4, t1: 26.0, pre: 'Ta ', key: '3 för 2', post: ' på protein.'},
  ],
  areas: [
    {t0: 2.8, t1: 6.8, name: 'Stockholm'},
    {t0: 17.8, t1: 21.4, name: 'Pressbyrån'},
    {t0: 37.671, t1: 40.474, name: 'Pressbyrån'},
  ],
});

type Props = z.infer<typeof schema>;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.25, 0.1, 0.25, 1);

const outline = (px: number, c = INK, n = 16) => {
  const s: string[] = [];
  for (let a = 0; a < n; a++) {
    const r = (a / n) * Math.PI * 2;
    s.push(`${(Math.cos(r) * px).toFixed(1)}px ${(Math.sin(r) * px).toFixed(1)}px 0 ${c}`);
  }
  return s.join(',');
};

function mix(a: string, b: string, k: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * k)).join(',')})`;
}

// ---------------------------------------------------------------- radar
// V1 cuts (sequence seconds) and each clip's Insta360 Reframe Pan, read from GTA.prproj.
const CUTS = [0, 2.436, 3.77, 6.139, 7.708, 9.209, 13.046, 14.114, 15.282, 17.751, 22.122, 23.257, 29.396, 31.231,
  36.403, 37.671, 38.472, 40.474];
const PANS = [-11, 72, 79, 185, 185, 138, 106, 188, 128, 65, 200, 200, 200, 200, 200, 39, 108, -111];
const PATH: [number, number, number][] = [
  [0, 0, 0], [2.4, 0, -40], [9.2, 0, -330], [13.0, 60, -470], [15.3, 150, -520], [17.7, 205, -560],
  [22.1, 222, -572], [29.4, 238, -590], [37.7, 228, -585], [40.5, 214, -570], [43.7, 175, -548],
];
const DEST: [number, number] = [214, -568];
const pos = (t: number): [number, number] => {
  const ts = PATH.map((p) => p[0]);
  return [interpolate(t, ts, PATH.map((p) => p[1]), clamp), interpolate(t, ts, PATH.map((p) => p[2]), clamp)];
};
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
const ZOOM = 0.42;
const BLOCKS = (() => {
  const out: {x: number; y: number; w: number; h: number; tone: number}[] = [];
  for (let gx = -12; gx <= 14; gx++)
    for (let gy = -16; gy <= 8; gy++) {
      const x = gx * 110;
      const y = gy * 110;
      const cx = x + 55;
      const cy = y + 55;
      if (Math.abs(cx) < 70 && cy > -520 && cy < 60) continue;
      if (cx > 100 && cx < 300 && cy > -640 && cy < -480) continue;
      out.push({x: x + 14, y: y + 14, w: 82 - random(`w${gx}_${gy}`) * 16, h: 82 - random(`h${gx}_${gy}`) * 20,
        tone: random(`t${gx}_${gy}`)});
    }
  return out;
})();

const Radar: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const R = 122;
  const [px, py] = pos(t);
  const hd = headingAt(t);
  const arrived = t >= 17.7;
  const ahead = PATH.filter((p) => p[0] > t && p[0] <= 17.7).map((p) => [p[1], p[2]]);
  const route = [[px, py], ...ahead, DEST];
  const pulse = 0.5 + 0.5 * Math.sin((frame / FPS) * Math.PI * 2 * 1.2);
  const na = ((-hd - 90) * Math.PI) / 180;
  return (
    <svg width={2 * R + 40} height={2 * R + 40} viewBox={`${-R - 20} ${-R - 20} ${2 * R + 40} ${2 * R + 40}`}
      style={{position: 'absolute', left: 178 - R - 20, top: 1430 - R - 20}}>
      <defs>
        <clipPath id="radarClip"><circle r={R} /></clipPath>
      </defs>
      <circle r={R + 7} fill={INK} />
      <g clipPath="url(#radarClip)">
        <g transform={`rotate(${-hd}) scale(${ZOOM}) translate(${-px} ${-py})`}>
          <rect x={-2400} y={-2600} width={5200} height={4400} fill="#c9c6bd" />
          {BLOCKS.map((b, i) => (
            <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h}
              fill={b.tone > 0.78 ? '#5c9a4a' : b.tone > 0.5 ? '#8d9a86' : '#9fa69b'} />
          ))}
          <rect x={110} y={-640} width={190} height={150} fill="#7f8c7a" stroke="#4a5446" strokeWidth={6} />
          {!arrived && (
            <polyline points={route.map((p) => p.join(',')).join(' ')} fill="none" stroke="#c1355e"
              strokeWidth={14 / ZOOM} strokeLinecap="round" strokeLinejoin="round" />
          )}
          <g transform={`translate(${DEST[0]} ${DEST[1]}) rotate(${hd}) scale(${1 / ZOOM})`}>
            {arrived && <circle r={13 + 7 * pulse} fill="#f2d33a" opacity={0.3} />}
            <rect x={-11} y={-11} width={22} height={22} fill="#f2d33a" stroke={INK} strokeWidth={3.5} />
          </g>
        </g>
        <circle r={R} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={10} />
      </g>
      <g transform={`translate(${Math.cos(na) * (R + 2)} ${Math.sin(na) * (R + 2)})`}>
        <circle r={17} fill={INK} />
        <text y={7} textAnchor="middle" fontFamily={SUB} fontWeight={700} fontSize={22} fill="#fff">N</text>
      </g>
      <path d="M0,-16 L12,13 L0,6 L-12,13 Z" fill="#fff" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    </svg>
  );
};

// ---------------------------------------------------------------- top right
const ArmIcon = () => (
  <svg width={104} height={104} viewBox="0 0 100 100">
    <path
      d="M10,90 L10,70 C10,60 17,55 26,55 C30,41 47,37 56,47 L60,51 L61,33 C58,24 63,13 74,13 C86,13 92,22 90,33
         L85,48 C83,58 82,67 82,75 C82,85 73,91 63,91 Z"
      fill="#f3f3f0" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <path d="M30,62 C37,52 48,52 54,60" fill="none" stroke="#9a9a96" strokeWidth={4} strokeLinecap="round" />
    <path d="M66,22 C71,20 77,21 81,25 M64,30 C70,28 77,29 82,33" fill="none" stroke="#9a9a96" strokeWidth={3.5}
      strokeLinecap="round" />
  </svg>
);

const TopRight: React.FC<{t: number; frame: number; props: Props}> = ({t, frame, props}) => {
  // slot: the arm, then the last product picked up (pops in)
  let held = -1;
  props.products.forEach((p, i) => {
    if (t >= p.t) held = i;
  });
  const swapF = held >= 0 ? Math.round(props.products[held].t * FPS) : 0;
  const swap = held >= 0 ? spring({frame: frame - swapF, fps: FPS, config: {damping: 12, stiffness: 200}}) : 1;
  // clock: one game minute per second
  const mins = props.clockStart + Math.floor(t);
  const clock = `${String(Math.floor(mins / 60) % 24).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
  // cash
  const tick = interpolate(t, [props.buyAt + 0.15, props.buyAt + 0.85], [0, 1], {...clamp, easing: ease});
  const cash = props.startCash - props.price * tick;
  const flash = interpolate(t, [props.buyAt, props.buyAt + 0.06, props.buyAt + 1.1], [0, 1, 0], clamp);
  const cashColor = flash > 0 ? mix(CASH_GREEN, LOSS_RED, flash) : CASH_GREEN;
  const bar = (top: number, fill: string, frac: number) => (
    <div style={{position: 'absolute', left: 168, top, width: 196, height: 18, background: INK, padding: 3,
      boxSizing: 'border-box'}}>
      <div style={{width: '100%', height: '100%', background: 'rgba(255,255,255,0.12)'}}>
        <div style={{width: `${frac * 100}%`, height: '100%', background: fill}} />
      </div>
    </div>
  );
  return (
    <div style={{position: 'absolute', left: 632, top: 206, width: 380, height: 260}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 140, height: 140, borderRadius: 16,
        background: 'linear-gradient(#5d5f5c, #2c2d2b)', boxShadow: `0 0 0 5px ${INK}, inset 0 0 0 3px #8a8c88`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
        {held < 0 ? (
          <ArmIcon />
        ) : (
          <Img src={staticFile(props.products[held].img)}
            style={{height: 118, width: 118, objectFit: 'contain', transform: `scale(${0.4 + 0.6 * swap})`,
              filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.6))'}} />
        )}
      </div>
      <div style={{position: 'absolute', left: 162, top: -8, fontFamily: CHUNK, fontWeight: 700, fontSize: 82,
        lineHeight: 1, color: '#f4f4f0', letterSpacing: 3, textShadow: outline(5)}}>
        {clock}
      </div>
      {bar(80, '#f1f1ee', 0.66)}
      {bar(112, '#c12a24', 0.92)}
      <div style={{position: 'absolute', left: -6, top: 160, fontFamily: CHUNK, fontWeight: 700, fontSize: 86,
        lineHeight: 1, color: cashColor, letterSpacing: 3, textShadow: outline(5)}}>
        ${String(Math.round(cash)).padStart(8, '0')}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- texts
const MissionTitle: React.FC<{t: number; text: string}> = ({t, text}) => {
  const op = interpolate(t, [0.3, 0.55, 2.7, 3.0], [0, 1, 1, 0], clamp);
  if (op <= 0) return null;
  const s = interpolate(t, [0.3, 0.7], [1.12, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <div style={{position: 'absolute', left: 30, right: 30, top: 1010, textAlign: 'center', opacity: op,
      transform: `scale(${s})`, fontFamily: CHUNK, fontWeight: 700, fontSize: 112, lineHeight: 1, color: GOLD,
      letterSpacing: 2, textShadow: outline(7)}}>
      {text}
    </div>
  );
};

const Objective: React.FC<{t: number; objectives: Props['objectives']}> = ({t, objectives}) => {
  const o = objectives.find((x) => t >= x.t0 && t < x.t1 + 0.3);
  if (!o) return null;
  const op = interpolate(t, [o.t0, o.t0 + 0.15, o.t1, o.t1 + 0.3], [0, 1, 1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: 50, right: 50, top: 1110, textAlign: 'center', opacity: op,
      fontFamily: SUB, fontWeight: 600, fontSize: 64, color: '#fff', textShadow: outline(3.5)}}>
      {o.pre}<span style={{color: OBJ_YELLOW}}>{o.key}</span>{o.post}
    </div>
  );
};

const AreaName: React.FC<{t: number; areas: Props['areas']}> = ({t, areas}) => {
  const a = areas.find((x) => t >= x.t0 && t < x.t1);
  if (!a) return null;
  const op = interpolate(t, [a.t0, a.t0 + 0.35, a.t1 - 0.4, a.t1], [0, 1, 1, 0], clamp);
  return (
    <div style={{position: 'absolute', right: 60, top: 1352, textAlign: 'right', opacity: op, fontFamily: GOTHIC,
      fontWeight: 600, fontSize: 128, lineHeight: 1, color: '#fff', textShadow: outline(5) + ',4px 6px 0 #000'}}>
      {a.name}
    </div>
  );
};

// ---------------------------------------------------------------- pickups
const PickupBox: React.FC<{frame: number; products: Props['products']; menuIn: number}> = ({frame, products, menuIn}) => {
  let idx = -1;
  for (let i = 0; i < products.length; i++) if (frame >= Math.round(products[i].t * FPS)) idx = i;
  if (idx < 0) return null;
  const p = products[idx];
  const life = frame - Math.round(p.t * FPS);
  // hold 3.2 s, but clear the corner before the shop menu opens
  const HOLD = Math.min(Math.round(3.2 * FPS), Math.round(menuIn * FPS) - Math.round(p.t * FPS) - 8);
  if (life > HOLD + 8) return null;
  const inS = spring({frame: life, fps: FPS, config: {damping: 15, stiffness: 230}});
  const out = interpolate(life, [HOLD, HOLD + 8], [1, 0], clamp);
  const flash = interpolate(life, [0, 2, 8], [0, 0.7, 0], clamp);
  const pop = spring({frame: life - 2, fps: FPS, config: {damping: 9, stiffness: 260}});
  return (
    <div style={{position: 'absolute', left: 44, top: 210, width: 520, opacity: out,
      transform: `translateX(${(1 - inS) * -50}px)`}}>
      <div style={{position: 'relative', display: 'flex', alignItems: 'center', gap: 18, padding: '16px 22px 16px 14px',
        background: 'rgba(0,0,0,0.78)'}}>
        <div style={{width: 112, height: 128, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Img src={staticFile(p.img)} style={{maxHeight: 128, maxWidth: 112, objectFit: 'contain',
            transform: `scale(${0.55 + 0.45 * pop})`, filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.6))'}} />
        </div>
        <div style={{flex: 1}}>
          <div style={{fontFamily: SUB, fontWeight: 600, fontSize: 32, color: 'rgba(255,255,255,0.8)', lineHeight: 1.1}}>
            Du plockade upp
          </div>
          <div style={{fontFamily: SUB, fontWeight: 700, fontSize: 44, color: '#fff', lineHeight: 1.05}}>{p.short}</div>
          <div style={{fontFamily: SUB, fontWeight: 700, fontSize: 36, color: OBJ_YELLOW, lineHeight: 1.2, marginTop: 4}}>
            Protein {idx + 1}/{products.length}
          </div>
        </div>
        <div style={{fontFamily: CHUNK, fontWeight: 700, fontSize: 70, color: CASH_GREEN, textShadow: outline(4),
          transform: `scale(${pop})`}}>
          +1
        </div>
        <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: flash}} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- shop menu at the till
const ShopMenu: React.FC<{t: number; frame: number; props: Props}> = ({t, frame, props}) => {
  const {menuIn, menuOut, buyAt, products} = props;
  if (t < menuIn || t >= menuOut) return null;
  const local = t - menuIn;
  // highlight walks the three rows, then all three confirm
  const steps = [0, 0.55, 1.15];
  let hi = 0;
  steps.forEach((s, i) => {
    if (local >= s) hi = i;
  });
  const bought = t >= buyAt;
  const buyF = Math.round(buyAt * FPS);
  const stamp = bought ? spring({frame: frame - buyF, fps: FPS, config: {damping: 10, stiffness: 220}}) : 0;
  const COL = 500;
  const rowTop = 790;
  const ROW = 128;
  return (
    <AbsoluteFill>
      {/* the black column with big blurred product shots above and below */}
      <div style={{position: 'absolute', left: 0, top: 0, width: COL, height: 1920, background: '#000', overflow: 'hidden'}}>
        {[[0, 30], [1, 260], [1, 1460], [2, 1690]].map(([pi, y], k) => (
          <Img key={k} src={staticFile(products[pi].img)}
            style={{position: 'absolute', left: 90, top: y - 40, width: 320, height: 300, objectFit: 'contain',
              filter: 'blur(16px) saturate(1.2)', opacity: 0.85}} />
        ))}
      </div>
      {/* menu panel: dark gradient that runs out over the picture */}
      <div style={{position: 'absolute', left: 0, top: 560, width: 760, height: 800,
        background: 'linear-gradient(90deg, rgba(18,18,18,0.97) 0%, rgba(30,30,30,0.93) 62%, rgba(30,30,30,0.0) 100%)'}} />
      <div style={{position: 'absolute', left: 32, top: 590, fontFamily: GOTHIC, fontWeight: 600, fontSize: 150,
        lineHeight: 1, color: '#fff', textShadow: '4px 5px 0 #000'}}>
        Protein
      </div>
      {products.map((p, i) => {
        const on = bought || i === hi;
        return (
          <div key={i} style={{position: 'absolute', left: 0, top: rowTop + i * ROW, width: 690, height: ROW - 8,
            background: on ? (bought ? 'rgba(63,154,60,0.28)' : 'rgba(255,255,255,0.16)') : 'transparent',
            display: 'flex', alignItems: 'center'}}>
            <div style={{width: 120, height: ROW - 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginLeft: 18}}>
              <Img src={staticFile(p.img)} style={{maxHeight: ROW - 18, maxWidth: 104, objectFit: 'contain'}} />
            </div>
            <div style={{marginLeft: 16}}>
              <div style={{fontFamily: WIDE, fontWeight: 700, fontSize: 38, letterSpacing: 3, color: '#f2f2f2',
                lineHeight: 1.05, whiteSpace: 'nowrap'}}>
                {p.name}
              </div>
              <div style={{fontFamily: WIDE, fontWeight: 700, fontSize: 36, letterSpacing: 2, color: '#5cc457',
                lineHeight: 1.15}}>
                3 FÖR 2
              </div>
            </div>
          </div>
        );
      })}
      {bought && (
        <div style={{position: 'absolute', left: 40, top: rowTop + 3 * ROW + 26, transform: `scale(${stamp})`,
          transformOrigin: 'left center', fontFamily: CHUNK, fontWeight: 700, fontSize: 92, lineHeight: 1,
          color: OBJ_YELLOW, letterSpacing: 2, textShadow: outline(6)}}>
          3 FÖR 2!
        </div>
      )}
    </AbsoluteFill>
  );
};

const GtaHud: React.FC<Props> = (props) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill>
      <ShopMenu t={t} frame={frame} props={props} />
      <Radar t={t} frame={frame} />
      <TopRight t={t} frame={frame} props={props} />
      <PickupBox frame={frame} products={props.products} menuIn={props.menuIn} />
      <MissionTitle t={t} text={props.missionTitle} />
      <Objective t={t} objectives={props.objectives} />
      <AreaName t={t} areas={props.areas} />
    </AbsoluteFill>
  );
};

export default GtaHud;
