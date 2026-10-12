// ---------------------------------------------------------------------------
// AllAdultMales (file 29_AllAdultMales; Dwarkesh Patel with Si Sheppard,
// "Capture, not kill"). Dwarkesh map style, the non-map umber page; the cast is
// captureFigures (Commoner -> Warrior, the chimalli and the macuahuitl), used
// exactly as documented and imported read-only. Opaque 1080x1920, 23.976 fps.
//
// CHECK LINE: "Every single man in the ranks picked up a shield and a club: in
// Aztec society the whole male population was the army."
//
// THE LINE: "All adult males were trained to be warriors. It was basically like
// the Sparta of the New World, right?"
// WORD -> FRAME: All 1 · adult 6 · males 14 · were 21 · trained 33 · to 46 ·
//   be 49 · warriors 51 · It 61 · was 68 · basically 72 · like 93 · the 98 ·
//   Sparta 101 · of 110 · the 114 · New 116 · World 119 · right? 130.
// DURATION: the sequence runs 29.988 s - 35.702 s = 5.714 s x 23.976 = 137 frames.
//
// THE MOTION (one move): ranks of cream commoners stand in depth, a shield and
// a club lying at each man's feet. One wave runs front to back: each man stoops,
// takes them up and straightens as an ORANGE warrior (armour, topknot, shield on
// the arm, club in the fist). A single damped pull-back, begun while the wave is
// still running, shows the ranks going on wider and deeper, every man already
// armed; around "Sparta" a second, slower wave raises every club, and the host
// holds them up, swaying, the camera still creeping.
// Orange = the Aztec side (the clip rule): a man is orange once he is a warrior.
// No text.
//
// HOW (performance): thousands of men, each a full engraved rig, cannot be live
// SVG. Every man runs the SAME local timeline on his own integer start frame, so
// there are only 41 distinct states (27 of the pick-up, 14 of the raise). Each
// state is drawn ONCE by captureFigures' own components, rasterised to a sprite
// (at power-of-two sizes, made on demand) and blitted on a canvas far to near
// (pageFigures' technique). Small sprites get a dark casing of their own so a
// mass of them still reads as separate men.
// ---------------------------------------------------------------------------
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { AbsoluteFill, cancelRender, continueRender, delayRender, useCurrentFrame } from "remotion";
import { z } from "zod";
import { DARK, LAND, hash } from "./incaShared";
import { CREAM, CaptureFigure, Macuahuitl, ORANGE, POSES, Shield, captureAnchors, type FigPose, type Ink } from "./captureFigures";
import { FPS, TexcocoPage, WorldSvg, makeCamera, poseTrack, track, type P2 } from "./texcocoShared";
import { lerpFig } from "./texcocoFigures";

export { FPS };
export const DURATION = 137;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const FRAME_W = 1080;
const FRAME_H = 1920;

// ---------------------------------------------------------------------------
// ONE MAN'S TIMELINE (figure-local units; he faces screen right, three-quarter)
//   states 0 .. PICK_N            the pick-up, one per frame
//   states PICK_N .. PICK_N + RAISE_N   the raise (state PICK_N is both)
// ---------------------------------------------------------------------------
export const PICK_N = 26;
export const RAISE_N = 14;
export const N_STATES = PICK_N + RAISE_N + 1;
/** the frame of the pick-up on which his hands are on the shield and the club */
const GRAB = 10;

const STOOD = POSES.stand(1);
/** stooped right down: the near hand on the shield's rim, the far fist round the club's grip */
const REACH: FigPose = {
  ...POSES.reach(1),
  lean: 60,
  crouch: 84,
  pitch: 4,
  armL: { w: [90, -30], elbow: [-0.4, 1], fist: 0, hand: 0 },
  armR: { w: [58, -30], elbow: [-0.4, 1], fist: 0.15, hand: 0 },
};
const GRIPPED: FigPose = { ...REACH, lean: 61, crouch: 85, armL: { ...REACH.armL, fist: 0.85 }, armR: { ...REACH.armR, fist: 1 } };
/** the far arm's `hand` angle that stands the club at `deg` (0 = blade up, + = leaning ahead) */
const handFor = (q: FigPose, deg: number): FigPose => {
  const a = captureAnchors("warrior", q, [0, 0], 1).clubAngle;
  return { ...q, armR: { ...q.armR, hand: q.armR.hand + (deg - a) } };
};
/** armed and standing: shield across his front, the club upright at his side, leaning a little ahead */
const CLUB_REST = 24;
const ARMED: FigPose = handFor({ ...POSES.carry(1), brow: 0.4, armR: { w: [28, -160], elbow: [-0.6, 1], fist: 1, hand: 0 } }, CLUB_REST);
/** the club held straight up at the full reach of his arm (the module's raised pose, the arm higher; the feet stay planted) */
const CLUB_UP = 7;
const RAISED: FigPose = handFor({ ...POSES.clubRaised(1), lean: -2, armR: { w: [16, -356], elbow: [-1, -0.2], fist: 1, hand: 0 }, footL: ARMED.footL, footR: ARMED.footR }, CLUB_UP);

const pickTrack = poseTrack([
  [0, STOOD],
  [4, lerpFig(STOOD, REACH, 0.42)],
  [GRAB - 1, REACH],
  [GRAB + 1, GRIPPED],
  [16, lerpFig(GRIPPED, ARMED, 0.55)],
  [22, ARMED],
  [PICK_N, { ...ARMED, pitch: -1 }],
]);
const raiseTrack = poseTrack([
  [0, { ...ARMED, pitch: -1 }],
  [5, lerpFig(ARMED, RAISED, 0.38)],
  [11, lerpFig(ARMED, RAISED, 0.94)],
  [RAISE_N, RAISED],
]);
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixHex = (a: string, b: string, t: number) => {
  const pa = hex(a);
  const pb = hex(b);
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * Math.max(0, Math.min(1, t))).toString(16).padStart(2, "0")).join("")}`;
};
const mixInk = (a: Ink, b: Ink, t: number): Ink => ({ main: mixHex(a.main, b.main, t), deep: mixHex(a.deep, b.deep, t), hair: mixHex(a.hair, b.hair, t) });
/** the shield and the club on the ground: a dull cream (the cream sunk a little toward the page) */
const DULL: Ink = mixInk({ main: LAND, deep: LAND, hair: LAND }, CREAM, 0.8);
/** the shield comes up onto the forearm and the club up to his side */
const lift = track([[GRAB, 0], [GRAB + 10, 1]]);
/** cream to orange */
const turn = track([[GRAB - 1, 0], [GRAB + 9, 1]]);
/** the armour drawn on over the cloak, the topknot */
const wear = track([[GRAB + 2, 0], [GRAB + 10, 1]]);
/** the club's swing up overhead */
const swing = track([[0, 0], [RAISE_N - 1, 1]]);
/** where the shield lies, from the hand that takes it (units) */
const SHIELD_OFF: P2 = [6, 22];

type ManState = { pose: FigPose; armed: number; ink: Ink; gear: Ink; shieldAt: P2; lying: number; clubAt: P2; clubAngle: number };
/** state st of a man standing at the origin at 1 px per unit */
const manState = (st: number): ManState => {
  const picking = st <= PICK_N;
  const G = captureAnchors("warrior", pickTrack(GRAB), [0, 0], 1);
  const ground: P2 = [G.nearHand[0] + SHIELD_OFF[0], G.nearHand[1] + SHIELD_OFF[1]];
  const t = picking ? turn(st) : 1;
  const ink = mixInk(CREAM, ORANGE, t);
  const gear = mixInk(DULL, ORANGE, t);
  if (picking && st < GRAB) return { pose: pickTrack(st), armed: 0, ink, gear, shieldAt: ground, lying: 1, clubAt: G.clubGrip, clubAngle: 90 };
  // in his hands: the club's angle is led (lying -> upright at his side -> overhead) and the fist turned to it
  const e = picking ? lift(st) : 1;
  const clubAngle = picking ? 90 + (CLUB_REST - 90) * e : CLUB_REST + (CLUB_UP - CLUB_REST) * swing(st - PICK_N);
  const pose = handFor(picking ? pickTrack(st) : raiseTrack(st - PICK_N), clubAngle);
  const A = captureAnchors("warrior", pose, [0, 0], 1);
  const off: P2 = [SHIELD_OFF[0] + (A.shieldAt[0] - A.nearHand[0] - SHIELD_OFF[0]) * e, SHIELD_OFF[1] + (A.shieldAt[1] - A.nearHand[1] - SHIELD_OFF[1]) * e];
  return { pose, armed: picking ? wear(st) : 1, ink, gear, shieldAt: [A.nearHand[0] + off[0], A.nearHand[1] + off[1]], lying: 1 - e, clubAt: A.clubGrip, clubAngle };
};
const STATES: ManState[] = Array.from({ length: N_STATES }, (_, st) => manState(st));

/** one man in state st, his feet at `at`, `scale` px per unit: the club (behind him, as the module
 *  draws it), the figure, the shield (in front of his arm, as the module draws it) */
const ManArt: React.FC<{ st: number; at: P2; scale: number; uid: string }> = ({ st, at, scale, uid }) => {
  const s = STATES[st];
  const w = (p: P2): P2 => [at[0] + p[0] * scale, at[1] + p[1] * scale];
  return (
    <>
      <Macuahuitl at={w(s.clubAt)} angle={s.clubAngle} scale={scale} ink={s.gear} uid={`${uid}-c`} />
      <CaptureFigure kind="warrior" pose={s.pose} at={at} scale={scale} uid={`${uid}-f`} ink={s.ink} armed={s.armed} shield={false} club={false} />
      <Shield at={w(s.shieldAt)} scale={scale} lying={s.lying} ink={s.gear} uid={`${uid}-s`} />
    </>
  );
};

// ---------------------------------------------------------------------------
// SPRITES: state x size, rasterised from the module's own SVG on demand
// ---------------------------------------------------------------------------
/** the sprite's box round the man, units (feet at 0, 0) */
const BOX = { x0: -130, x1: 215, y0: -500, y1: 52 };
/** px per unit of each size; a man is blitted from the smallest sprite at least his size */
const TIERS = [1.6, 0.8, 0.4, 0.2, 0.1, 0.05];
type Sprite = { c: HTMLCanvasElement; sc: number };
const SPRITES = new Map<number, Sprite>();
const LOADING = new Map<number, Promise<void>>();
const keyOf = (st: number, tier: number) => st * 8 + tier;
const tierFor = (d: number) => {
  let t = 0;
  while (t < TIERS.length - 1 && TIERS[t + 1] >= d * 0.97) t++;
  return t;
};
const spriteSize = (key: number) => {
  const sc = TIERS[key & 7];
  return { st: key >> 3, sc, w: Math.ceil((BOX.x1 - BOX.x0) * sc) + 2, h: Math.ceil((BOX.y1 - BOX.y0) * sc) + 2 };
};
/** the state's own SVG (mounted hidden, then serialised and rasterised) */
const SpriteSource: React.FC<{ spriteKey: number }> = ({ spriteKey }) => {
  const { st, sc, w, h } = spriteSize(spriteKey);
  return (
    <svg data-sprite={spriteKey} width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <ManArt st={st} at={[-BOX.x0 * sc + 1, -BOX.y0 * sc + 1]} scale={sc} uid={`m${spriteKey}`} />
    </svg>
  );
};
const loadSprite = (key: number, node: Element): Promise<void> => {
  const had = LOADING.get(key);
  if (had) return had;
  const { st, sc, w, h } = spriteSize(key);
  const svg = new XMLSerializer().serializeToString(node);
  const p = new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d") as CanvasRenderingContext2D;
      // a small figure's own outline is thinner than a pixel: give it a dark casing, so a mass of them stays separate men
      const casing = Math.max(0, 0.95 - 1.5 * sc);
      if (casing > 0.05) {
        const sil = document.createElement("canvas");
        sil.width = w;
        sil.height = h;
        const sx = sil.getContext("2d") as CanvasRenderingContext2D;
        sx.drawImage(img, 0, 0, w, h);
        sx.globalCompositeOperation = "source-in";
        sx.fillStyle = DARK;
        sx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 0.55;
        for (let i = 0; i < 8; i++) ctx.drawImage(sil, casing * Math.cos((i * Math.PI) / 4), casing * Math.sin((i * Math.PI) / 4));
        ctx.globalAlpha = 1;
      }
      ctx.drawImage(img, 0, 0, w, h);
      SPRITES.set(key, { c, sc });
      resolve();
    };
    img.onerror = () => reject(new Error(`AllAdultMales: sprite ${st} at ${sc} did not rasterise`));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
  LOADING.set(key, p);
  return p;
};

// ---------------------------------------------------------------------------
// THE HOST (world px = screen px at frame 0). A ground plane seen from above:
// rank r stands at depth scale s = 1 / (1 + REC r); his feet at y = YH + DEPTH s
// (YH = the vanishing line, far above the page), the files DX s apart, every
// other rank stepped half a file (so each man shows between two in front).
// ---------------------------------------------------------------------------
/** px per unit of the front rank at k = 1 (a man ~310 units: ~465 px, ~500 with the topknot) */
const S0 = 1.5;
const XC = 540;
const Y0 = 1700;
const DEPTH = 5855;
const YH = Y0 - DEPTH;
const REC = 0.054;
const DX = 320;
/** the front rank's first file sits this far off the axis (files): three men and their arms fill the width at f0 */
const FILE_OFF = -0.22;
const K_END = 0.42;
const S_MIN = 0.095;
/** ranks nearer together than this (world px) are thinned: they would be hidden behind each other anyway */
const MIN_DY = 5.5;
const HALF_W = 540 / K_END + 260;

// ---- the two waves, by depth u = 1 - s (0 = the front rank, 1 = the vanishing line)
/** the frame a rank begins to stoop */
const waveAt = track([[0, 1], [0.0512, 7.5], [0.213, 30], [0.4, 42], [0.6, 50], [0.8, 56], [0.94, 60]]);
/** the frame a rank begins to raise its clubs */
const raiseAt = track([[0, 88], [0.2, 94], [0.5, 101], [0.94, 109]]);

type Host = { n: number; x: Float32Array; y: Float32Array; s: Float32Array; d: Float32Array; t0: Int16Array; tr: Int16Array; ph: Float32Array };
const HOST: Host = (() => {
  const xs: number[] = [];
  const ys: number[] = [];
  const ss: number[] = [];
  const ds: number[] = [];
  const t0: number[] = [];
  const tr: number[] = [];
  const ph: number[] = [];
  const ranks: number[] = [];
  let lastY = Infinity;
  for (let r = 0; ; r++) {
    const s = 1 / (1 + REC * r);
    if (s < S_MIN) break;
    const y = YH + DEPTH * s;
    if (lastY - y < MIN_DY) continue;
    ranks.push(s);
    lastY = y;
  }
  // far first (painter's order)
  for (let j = ranks.length - 1; j >= 0; j--) {
    const s = ranks[j];
    const u = 1 - s;
    const N = Math.ceil(HALF_W / (DX * s)) + 1;
    for (let c = -N; c <= N; c++) {
      const i = xs.length;
      const file = c + FILE_OFF + (j % 2) * 0.5 + (j === 0 ? 0 : 0.1 * (hash(i, 911) - 0.5));
      const x = XC + file * DX * s;
      // the wave runs a little diagonally (left to right), each man a hair off his neighbours
      const diag = 2.6 * Math.max(-1, Math.min(1, (x - XC) / (1.45 * DX)));
      xs.push(x);
      ys.push(YH + DEPTH * s + (j === 0 ? 0 : 5 * s * (hash(i, 912) - 0.5)));
      ss.push(s);
      ds.push(S0 * s * (j === 0 ? 1 : 0.97 + 0.06 * hash(i, 913)));
      t0.push(Math.round(waveAt(u) + 2.6 + diag + 1.4 * hash(i, 914)));
      tr.push(Math.round(raiseAt(u) + 0.7 * diag + 2.5 * hash(i, 915)));
      ph.push(6.283 * hash(i, 916));
    }
  }
  return { n: xs.length, x: Float32Array.from(xs), y: Float32Array.from(ys), s: Float32Array.from(ss), d: Float32Array.from(ds), t0: Int16Array.from(t0), tr: Int16Array.from(tr), ph: Float32Array.from(ph) };
})();
/** the state a man is in on frame f */
const stateAt = (i: number, f: number) => (f < HOST.tr[i] ? Math.max(0, Math.min(PICK_N, f - HOST.t0[i])) : PICK_N + Math.min(RAISE_N, f - HOST.tr[i]));

// ---------------------------------------------------------------------------
// THE CAMERA: one damped pull-back (the front rank's feet slide down the frame
// as it widens), barely moving under the first wave, still creeping at the end
// ---------------------------------------------------------------------------
const camAt = makeCamera([
  { f: 0, k: 1, wx: XC, wy: Y0, sx: 540, sy: 1700 },
  { f: 40, k: 0.98, wx: XC, wy: Y0, sx: 540, sy: 1703 },
  { f: 70, k: 0.76, wx: XC, wy: Y0, sx: 540, sy: 1752 },
  { f: 100, k: 0.55, wx: XC, wy: Y0, sx: 540, sy: 1815 },
  { f: 122, k: 0.434, wx: XC, wy: Y0, sx: 540, sy: 1846 },
  { f: 136, k: K_END, wx: XC, wy: Y0, sx: 540, sy: 1850 },
]);

// ---------------------------------------------------------------------------
// A FRAME: who is in view, in which state, from which sprite
// ---------------------------------------------------------------------------
type Plan = { n: number; idx: Int32Array; sx: Float32Array; sy: Float32Array; d: Float32Array; key: Int32Array; keys: number[] };
const planAt = (f: number): Plan => {
  const cam = camAt(f);
  const idx = new Int32Array(HOST.n);
  const sx = new Float32Array(HOST.n);
  const sy = new Float32Array(HOST.n);
  const dd = new Float32Array(HOST.n);
  const key = new Int32Array(HOST.n);
  const seen = new Set<number>();
  let n = 0;
  for (let i = 0; i < HOST.n; i++) {
    const d = HOST.d[i] * cam.k;
    const x = 540 + (HOST.x[i] - cam.cx) * cam.k;
    const y = 960 + (HOST.y[i] - cam.cy) * cam.k;
    if (x + BOX.x1 * d < 0 || x + BOX.x0 * d > FRAME_W || y + BOX.y0 * d > FRAME_H || y + BOX.y1 * d < 0) continue;
    const k = keyOf(stateAt(i, f), tierFor(d));
    idx[n] = i;
    sx[n] = x;
    sy[n] = y;
    dd[n] = d;
    key[n] = k;
    seen.add(k);
    n++;
  }
  return { n, idx, sx, sy, d: dd, key, keys: [...seen] };
};
/** the far ranks sink a little toward the page: after the ranks beyond each depth are drawn, a veil of the page's colour over them */
const HAZE = [0.1, 0.15, 0.22, 0.32, 0.46, 0.66];
const drawPlan = (ctx: CanvasRenderingContext2D, p: Plan, f: number) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, FRAME_W, FRAME_H);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  let band = 0;
  for (let j = 0; j < p.n; j++) {
    const i = p.idx[j];
    while (band < HAZE.length && HOST.s[i] >= HAZE[band]) {
      ctx.globalCompositeOperation = "source-atop";
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = LAND;
      ctx.fillRect(0, 0, FRAME_W, FRAME_H);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      band++;
    }
    const sp = SPRITES.get(p.key[j]);
    if (!sp) continue;
    const d = p.d[j];
    const q = d / sp.sc;
    const w = sp.c.width * q;
    const h = sp.c.height * q;
    const ox = (BOX.x0 * sp.sc - 1) * q;
    const oy = (BOX.y0 * sp.sc - 1) * q;
    if (d > 0.12) {
      // alive: he rocks a hair about his feet, each on his own time
      const a = ((0.42 * Math.sin(f / 13.5 + HOST.ph[i]) + 0.2 * Math.sin(f / 7.3 + 2.1 * HOST.ph[i])) * Math.PI) / 180;
      const c = Math.cos(a);
      const s = Math.sin(a);
      ctx.setTransform(c, s, -s, c, p.sx[j], p.sy[j]);
      ctx.drawImage(sp.c, ox, oy, w, h);
    } else {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(sp.c, p.sx[j] + ox, p.sy[j] + oy, w, h);
    }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};

const AllAdultMales: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const plan = useMemo(() => planAt(frame), [frame]);
  const ref = useRef<HTMLCanvasElement>(null);
  const bench = useRef<HTMLDivElement>(null);
  const waiting = useRef<number | null>(null);
  /** the sprites being made: their SVGs are mounted (hidden) for one pass */
  const [jobs, setJobs] = useState<number[]>([]);
  useLayoutEffect(() => {
    const missing = plan.keys.filter((k) => !SPRITES.has(k));
    if (!missing.length) {
      const ctx = ref.current?.getContext("2d");
      if (ctx) drawPlan(ctx, plan, frame);
      if (waiting.current !== null) {
        continueRender(waiting.current);
        waiting.current = null;
      }
      return;
    }
    if (waiting.current === null) waiting.current = delayRender("AllAdultMales: rasterising the figure sprites", { timeoutInMilliseconds: 240000 });
    const nodes = new Map<number, Element>();
    bench.current?.querySelectorAll("svg[data-sprite]").forEach((el) => nodes.set(Number(el.getAttribute("data-sprite")), el));
    if (missing.some((k) => !nodes.has(k) && !LOADING.has(k))) {
      setJobs(missing);
      return;
    }
    Promise.all(missing.map((k) => loadSprite(k, nodes.get(k) as Element)))
      .then(() => setJobs([]))
      .catch((err) => cancelRender(err));
  }, [plan, frame, jobs]);
  const cam = camAt(frame);
  return (
    <AbsoluteFill>
      <TexcocoPage cam={cam}>
        <canvas ref={ref} width={FRAME_W} height={FRAME_H} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H }} />
      </TexcocoPage>
      <div ref={bench} style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, overflow: "hidden", visibility: "hidden" }}>
        {jobs.map((k) => (
          <SpriteSource key={k} spriteKey={k} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

export default AllAdultMales;

/** review sheet: the 41 states of one man, live SVG (state number = frames into the pick-up, then into the raise) */
export const AllAdultMalesSheet: React.FC = () => {
  const cam = { k: 1, cx: 540, cy: 960 };
  const sc = 0.48;
  return (
    <AbsoluteFill>
      <TexcocoPage cam={cam}>
        <WorldSvg cam={cam}>
          {STATES.map((_, st) => (
            <ManArt key={st} st={st} at={[70 + (st % 6) * 178, 262 + Math.floor(st / 6) * 272]} scale={sc} uid={`sh${st}`} />
          ))}
        </WorldSvg>
      </TexcocoPage>
    </AbsoluteFill>
  );
};
/** the host's size (for the report) */
export const HOST_COUNT = HOST.n;
