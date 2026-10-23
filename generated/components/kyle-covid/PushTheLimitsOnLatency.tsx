// ---------------------------------------------------------------------------
// PushTheLimitsOnLatency (kyle-covid, cut 39). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 29.97 fps (30000/1001), 160 frames. World, camera, crowd, wave and the medics' choreography:
// pushLimitsWorld.ts (pure). The cast: covidFolk (crowd sprites + live figures; read-only).
//
// CHECK LINE: "Only a few people look sick, and they get fenced off — but the infection has already spread silently
// through the whole crowd around them."
//
// THE LINE: "[...and there may be pathogens] that push the limits on latency that can be very, very hard to control."
// WORD -> FRAME (f0 = 39.1725 s): that 7 · PUSH 15 · the 21 · LIMITS 25 · on 35 · LATENCY 50 · that 75 · can 93 · be 99 ·
// VERY 103 · VERY 115 · HARD 117 · to 126 · CONTROL 135 · (So 151; the speaker returns at 160).
// DURATION: the slot 39.173 -> 44.511 s = 5.338 s x 29.97 = 160 frames (f0..f159).
//
// THE MOTION (review 1): a crane view over a modern city plaza crowd (~115 covidFolk crowd sprites + live figures).
// f0 is CLOSE on the three visibly SICK on a stone bench (live figures, ~230 px seated: a woman slumped, a man coughing
// into his fist, a man with a hand to his forehead; pale grey-green, hunched), the first ring round them LIVE and
// perfectly well (upright, chatting, glowing): four big in front of the bench who walk off left and right from f10-f34
// (planted-feet walks that go on to the last frame), five chatting behind it. From ~f9 the glow passes person to person
// outward (each chest kindles on a 12-frame ramp, a few tiny orange breath specks drifting from the one who passed it on
// just before); the sick stay three. One camera move (a slow drift f0..f18, then one bell: rise + pull-back, peak ~f80,
// settled ~f138, then a visible creep on to the end) widens the view until the glow fills the plaza. Six health workers
// (kind "medic", white coveralls) walk in briskly from beyond the frame's edges along six lanes (revealed by the
// widening frame ~f48-71), each carrying one barrier panel by its top rail (cream board, muted red-brown stripes); at
// their spots the walk winds down on planted feet, the far hand lets go and the near hand swings the panel round into the
// ring's line while it is lowered, its feet touch the paving on its contact frame, the hand lets go, the medic turns to
// face the ring and then shifts his weight and looks about. Contacts: left f108, right f113, front-left f118, front-right
// f123, back-left f128, back-right f133 = the ring CLOSES on CONTROL (f135). The ring: a hexagon of circumradius 2.1 m,
// ~400 px across at f135, its front at y ~1005-1015 (above the caption bands on every frame). f135..f159: a living hold
// (walkers and the live first ring walk and chat, the sick cough, the medics shift, the far front kindles a few, creep).
// CAUSE BEFORE EFFECT: each kindle follows its infector's breath specks (SPECK_LEAD 18 frames before tInf); each panel's
// contact frame is the frame its lift reaches 0 (the near hand still on the rail; release from contact + 4).
// Orange = THE VIRUS only (the clip's ORANGE RULE): the chest glows (the cast's v3 lung light; on the crowd sprites the
// glow layer at glowA 0.87 plus a soft screen halo of its light round the chest, the same halo on the live figures, so an
// infected person reads as a warm light in the chest at phone size and the un-lit ones stay clearly un-lit) and the
// breath specks. Everything else in muted local colours; the barrier stripes are a muted brick red-brown (#8E5443).
//
// DEPTH: a real crane eye on a shift lens (verticals stay vertical, so the billboard cast stands upright), mapped onto a
// londonDepth perspective per frame (pushLimitsWorld camOf): focal F 2000 px, the ring's centre = the world origin.
// f0: 9.0 m back, 6.5 m up (36 deg down at the ring), a man at the ring 390 px; f159: 21.5 m back, 25.0 m up (49 deg),
// a man at the ring ~163 px. Fog by world depth (fogBy "depth"); the crowd fogs per figure (A.figFog, the glow half).
// Building fronts at Z 9.2 m (the top edge), two extra stone benches out in the crowd.
//
// SOURCES: none (no real figures, places or images).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirBox, AirFloor, AirShadow, AirStage, MAT, WorldSvg, airWorldOf, lineOf, mixHex, type AirWorld, type Cam } from "../kits/dwarkesh-3d/dwarkesh3d";
import {
  CovidFigure,
  FolkCanvas,
  POSES,
  breathe,
  buildCovidFolk,
  covidAnchors,
  COVID_VARIANTS,
  covidCrowdSpriteReq,
  covidGripTo,
  crowdPose,
  lerpPose,
  useCovidSprites,
  type CovidPose,
  type CovidSpriteReq,
  type P2,
  type Sprite,
} from "./covidFolk";
import {
  BENCH,
  DURATION as SLOT,
  EXTRA_BENCHES,
  FACADE_Z,
  FLOOR,
  KINDLE,
  PANEL,
  SICK,
  U,
  WALK_PHASES,
  WORKERS,
  buildCrowd,
  camOf,
  eyeAt,
  hash,
  lwAmount,
  lwPhase,
  panelPt,
  spreadWave,
  toScreen,
  walkerX,
  workerAt,
  type Eye,
  type PanelState,
  type Person,
} from "./pushLimitsWorld";

export const FPS = 30000 / 1001;
export const DURATION = SLOT;
export const schema = z.object({ glowA: z.number().default(0.87), halo: z.number().default(0.5), haloR: z.number().default(85), specks: z.number().default(1) });
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const easeIO = (t: number) => {
  const u = c01(t);
  return u * u * (3 - 2 * u);
};
const sst = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};

// ===================================================================================================================
// THE CROWD: sprites (the cast's, baked once per tab), a glow layer per sprite pair, blitted far to near
// ===================================================================================================================
const PEOPLE: Person[] = spreadWave(buildCrowd());
/** a walker's sprite: the cast's walk at one of WALK_PHASES phases (drawn on twos: one cycle = 30 frames) */
const walkReq = (p: Person, phase: number, infected: boolean): CovidSpriteReq => {
  const variant = p.seed % COVID_VARIANTS[p.kind];
  const dir = p.walk?.dir ?? 1;
  const q = POSES.walk(dir, phase / WALK_PHASES + 0.02, 1);
  const b = buildCovidFolk(p.kind, variant, q, { infected: infected ? 1 : 0, frame: 20 + (p.seed % 7) * 9 });
  return { key: `pl39w|${p.kind}|${variant}|${dir}|${phase}|${infected ? 1 : 0}|${p.hPx}`, shapes: b.shapes, hPx: p.hPx, scale: p.hPx / 312, wUnits: 135, hUnits: Math.max(312 * 1.12, b.heightUnits + 20) };
};
type PersonSprites = { well: CovidSpriteReq[]; inf: CovidSpriteReq[] };
const PERSON_REQS: PersonSprites[] = PEOPLE.map((p) => {
  if (p.live) return { well: [], inf: [] };
  if (p.walk) {
    const ph = Array.from({ length: WALK_PHASES }, (_, k) => k);
    return { well: ph.map((k) => walkReq(p, k, false)), inf: ph.map((k) => walkReq(p, k, true)) };
  }
  return { well: [covidCrowdSpriteReq(p.kind, p.view, "well", p.seed, p.hPx)], inf: [covidCrowdSpriteReq(p.kind, p.view, "infected-hi", p.seed, p.hPx)] };
});
/** each person's chest (rig units from the feet, a man's units) for the light the glow throws round it */
const CHEST: [number, number][] = PEOPLE.map((p) => {
  const nv = COVID_VARIANTS[p.kind];
  const variant = ((p.seed % nv) + nv) % nv;
  const q = p.walk ? POSES.walk(p.walk.dir, 0, 1) : crowdPose(p.kind, p.view, "infected-hi", Math.floor(p.seed / nv));
  const c = buildCovidFolk(p.kind, variant, q, {}).anchors.chest;
  return [c[0], c[1]];
});
const ALL_REQS: CovidSpriteReq[] = (() => {
  const m = new Map<string, CovidSpriteReq>();
  for (const r of PERSON_REQS) for (const q of [...r.well, ...r.inf]) if (!m.has(q.key)) m.set(q.key, q);
  return [...m.values()];
})();

/** the GLOW LAYER of a (well, infected) sprite pair: only the pixels the infection changes (the chest), so a kindle is
 *  the well sprite plus this layer faded in (the body never changes; the glow alone ramps) */
const GLOW = new Map<string, HTMLCanvasElement>();
const glowOf = (wellKey: string, well: Sprite, inf: Sprite): HTMLCanvasElement => {
  const hit = GLOW.get(wellKey);
  if (hit) return hit;
  const W = inf.c.width;
  const H = inf.c.height;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  const a = (well.c.getContext("2d") as CanvasRenderingContext2D).getImageData(0, 0, W, H).data;
  const bimg = (inf.c.getContext("2d") as CanvasRenderingContext2D).getImageData(0, 0, W, H);
  const b = bimg.data;
  for (let i = 0; i < b.length; i += 4) {
    const d = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2]), Math.abs(a[i + 3] - b[i + 3])) / 255;
    const m = sst(0.015, 0.09, d);
    b[i + 3] = Math.round(b[i + 3] * m);
  }
  ctx.putImageData(bimg, 0, 0);
  GLOW.set(wellKey, c);
  return c;
};

// one scratch canvas for fogging a sprite before it lands
let SCRATCH: HTMLCanvasElement | null = null;
const scratch = (w: number, h: number) => {
  if (!SCRATCH) SCRATCH = document.createElement("canvas");
  if (SCRATCH.width < w || SCRATCH.height < h) {
    SCRATCH.width = Math.max(SCRATCH.width, w);
    SCRATCH.height = Math.max(SCRATCH.height, h);
  }
  return SCRATCH;
};
/** blit a sprite canvas (anchor ax, ay at the feet) at screen (x, y), drawn h px tall for a man, fogged toward `fog` */
const blitFogged = (ctx: CanvasRenderingContext2D, img: HTMLCanvasElement, sp: Sprite, x: number, y: number, h: number, fog: string, amt: number, alpha: number, rot: number, sy: number) => {
  if (alpha <= 0.003) return;
  const f = h / sp.px;
  const w = img.width;
  const hh = img.height;
  let src: HTMLCanvasElement = img;
  if (amt > 0.004) {
    const s = scratch(w, hh);
    const sx = s.getContext("2d") as CanvasRenderingContext2D;
    sx.setTransform(1, 0, 0, 1, 0, 0);
    sx.globalCompositeOperation = "source-over";
    sx.globalAlpha = 1;
    sx.clearRect(0, 0, w, hh);
    sx.drawImage(img, 0, 0);
    sx.globalCompositeOperation = "source-atop";
    sx.globalAlpha = amt;
    sx.fillStyle = fog;
    sx.fillRect(0, 0, w, hh);
    sx.globalCompositeOperation = "source-over";
    sx.globalAlpha = 1;
    src = s;
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  if (rot) ctx.rotate((rot * Math.PI) / 180);
  ctx.scale(1, sy);
  ctx.drawImage(src, 0, 0, w, hh, -sp.ax * f, -sp.ay * f, w * f, hh * f);
  ctx.restore();
};
let SHADOW: HTMLCanvasElement | null = null;
const shadowSprite = () => {
  if (SHADOW) return SHADOW;
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(34,24,15,0.78)");
  g.addColorStop(0.55, "rgba(34,24,15,0.45)");
  g.addColorStop(1, "rgba(34,24,15,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  SHADOW = c;
  return c;
};
/** how far a chest has kindled at frame f (a short eased ramp: no pops) */
export const kindleAt = (p: Person, f: number) => (p.tInf < -100 ? 1 : sst(0, 1, (f - p.tInf) / KINDLE));

export type GlowLook = { glowA: number; halo: number; haloR: number; specks: number };
const drawPerson = (ctx: CanvasRenderingContext2D, p: Person, f: number, e: Eye, A: AirWorld, get: (k: string) => Sprite | undefined, look: GlowLook) => {
  if (p.live) return;
  const X = walkerX(p, f);
  const q = toScreen(e, X, 0, p.Z);
  if (!q) return;
  const h = 312 * q.s;
  if (q.x + 0.4 * h < -20 || q.x - 0.4 * h > 1100 || q.y < -20 || q.y - h > 1940) return;
  // the contact shadow on the floor, offset to the lower right (light from the upper left)
  const ps = toScreen(e, X + 14, 0, p.Z - 8);
  const pf = toScreen(e, X, 0, p.Z - 34);
  const pb = toScreen(e, X, 0, p.Z + 34);
  if (ps && pf && pb) {
    const rx = 60 * ps.s;
    const ry = Math.max(1, (pf.y - pb.y) / 2);
    ctx.globalAlpha = 0.75 * (1 - A.figFog(p.Z));
    ctx.drawImage(shadowSprite(), ps.x - rx, ps.y - ry, 2 * rx, 2 * ry);
    ctx.globalAlpha = 1;
  }
  const reqs = PERSON_REQS[p.i];
  const k = p.walk ? (Math.floor(f / 2) + p.walk.ph) % WALK_PHASES : 0;
  const wr = reqs.well[k];
  const ir = reqs.inf[k];
  const ws = get(wr.key);
  const is = get(ir.key);
  if (!ws) return;
  const fogAmt = A.figFog(p.Z);
  const fogCol = A.airHex(p.Z, 150);
  // alive: a stander rocks a hair about his feet and breathes, each on his own time
  const rot = p.walk ? 0 : 0.55 * Math.sin(f / 14.5 + p.sway) + 0.25 * Math.sin(f / 7.9 + 2.1 * p.sway);
  const sy = p.walk ? 1 : 1 + 0.006 * Math.sin(f / 11 + 1.7 * p.sway);
  blitFogged(ctx, ws.c, ws, q.x, q.y, h, fogCol, fogAmt, 1, rot, sy);
  const kin = kindleAt(p, f);
  if (kin > 0.002 && is) {
    blitFogged(ctx, glowOf(wr.key, ws, is), is, q.x, q.y, h, fogCol, 0.5 * fogAmt, kin * look.glowA, rot, sy);
    // the light the lungs throw: a soft warm halo round the chest (screen), so a crowd reads lit from inside
    if (look.halo > 0) {
      const u = h / 312;
      const cx = q.x + CHEST[p.i][0] * u;
      const cy = q.y + CHEST[p.i][1] * u * sy;
      const r = look.haloR * u;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      const a = look.halo * kin * (1 - 0.5 * fogAmt);
      g.addColorStop(0, `rgba(255,190,60,${a.toFixed(3)})`);
      g.addColorStop(0.45, `rgba(255,170,20,${(a * 0.45).toFixed(3)})`);
      g.addColorStop(1, "rgba(255,160,0,0)");
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = g;
      ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
      ctx.restore();
    }
  }
  // the breath that passed it on: a few tiny orange specks drift from the infector's mouth to this chest just before
  // it kindles (the faintest trace at crowd size)
  if (look.specks > 0 && p.from >= 0 && f > p.tInf - SPECK_LEAD - 2 && f < p.tInf + 6) drawSpecks(ctx, p, f, e, look.specks);
};
const SPECK_LEAD = 18;
const chestScreen = (p: Person, f: number, e: Eye, up = 0): { x: number; y: number; h: number } | null => {
  const q = toScreen(e, walkerX(p, f), 0, p.Z);
  if (!q) return null;
  const u = (312 * q.s) / 312;
  return { x: q.x + CHEST[p.i][0] * u, y: q.y + (CHEST[p.i][1] - up) * u, h: 312 * q.s };
};
const drawSpecks = (ctx: CanvasRenderingContext2D, p: Person, f: number, e: Eye, amt: number) => {
  const src = PEOPLE[p.from];
  const a = chestScreen(src, f, e, 48);
  const b = chestScreen(p, f, e, 6);
  if (!a || !b) return;
  const t0 = p.tInf - SPECK_LEAD;
  for (let k = 0; k < 5; k++) {
    const u = (f - t0 - 2.2 * k) / 15;
    if (u <= 0 || u >= 1) continue;
    const w = 1 - Math.pow(1 - u, 1.6);
    const lift = Math.sin(Math.PI * w) * 0.12 * Math.hypot(b.x - a.x, b.y - a.y);
    const jx = (hash(p.i * 7 + k, 71) - 0.5) * 0.06 * b.h;
    const jy = (hash(p.i * 7 + k, 73) - 0.5) * 0.05 * b.h;
    const x = a.x + (b.x - a.x) * w + jx * Math.sin(Math.PI * w);
    const y = a.y + (b.y - a.y) * w - lift + jy * Math.sin(Math.PI * w);
    const al = amt * Math.sin(Math.PI * u) * (0.6 + 0.4 * hash(p.i + k, 79));
    const r = 0.8 + (2.0 * (a.h + b.h)) / 2 / 300;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.8);
    g.addColorStop(0, `rgba(255,214,122,${(0.95 * al).toFixed(3)})`);
    g.addColorStop(0.35, `rgba(255,176,0,${(0.55 * al).toFixed(3)})`);
    g.addColorStop(1, "rgba(255,176,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r * 2.8, y - r * 2.8, r * 5.6, r * 5.6);
  }
};

/** the light the lungs throw round a live figure's chest (as the crowd's: a soft warm screen-blended halo) */
const ChestHalo: React.FC<{ c: P2; r: number; a: number; uid: string }> = ({ c, r, a, uid }) => (
  <g style={{ mixBlendMode: "screen" }}>
    <defs>
      <radialGradient id={`${uid}g`}>
        <stop offset="0" stopColor="#FFBE3C" stopOpacity={a} />
        <stop offset="0.45" stopColor="#FFAA14" stopOpacity={a * 0.45} />
        <stop offset="1" stopColor="#FFA000" stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={c[0]} cy={c[1]} r={r} fill={`url(#${uid}g)`} />
  </g>
);

// ===================================================================================================================
// THE SET: the plaza floor, building fronts at the back, the bench, planters
// ===================================================================================================================
const PLASTER = { lit: "#D9CDB4", mid: "#B9AC92", dark: "#6E6453" };
const STUCCO = { lit: "#B88F74", mid: "#8E6A55", dark: "#4A3529" };
const FACADES = [
  { X0: -34 * U, X1: -15 * U, H: 13 * U, mat: PLASTER },
  { X0: -15 * U, X1: -4 * U, H: 16 * U, mat: STUCCO },
  { X0: -4 * U, X1: 9 * U, H: 12 * U, mat: PLASTER },
  { X0: 9 * U, X1: 34 * U, H: 15 * U, mat: STUCCO },
];
const Facades: React.FC<{ A: AirWorld }> = ({ A }) => (
  <g>
    {FACADES.map((b, i) => {
      const shopfront = (x0: number, x1: number) => {
        const p = (X: number, Y: number) => A.P.p(X, Y, FACADE_Z - 1);
        const q = [p(x0, -0.2 * U), p(x1, -0.2 * U), p(x1, -3.0 * U), p(x0, -3.0 * U)];
        return <path key={`${i}-${x0}`} d={`M${q.map((v) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`).join("L")}Z`} fill={A.tone(mixHex(b.mat.dark, "#2E2A26", 0.4), FACADE_Z, 1.5 * U)} />;
      };
      const bays: React.ReactNode[] = [];
      for (let x = b.X0 + 1.2 * U; x + 2.6 * U < b.X1; x += 4.2 * U) bays.push(shopfront(x, x + 2.6 * U));
      return (
        <g key={i}>
          <AirBox A={A} X0={b.X0} X1={b.X1} Y0={-b.H} Y1={0} Z0={FACADE_Z} Z1={FACADE_Z + 10 * U} mat={b.mat} uid={`fa${i}`} />
          {bays}
        </g>
      );
    })}
  </g>
);
const Bench: React.FC<{ A: AirWorld; b?: { X0: number; X1: number; Z0: number; Z1: number }; uid?: string }> = ({ A, b = BENCH, uid = "bn" }) => (
  <g>
    <AirShadow A={A} X={(b.X0 + b.X1) / 2} Z={(b.Z0 + b.Z1) / 2} w={(b.X1 - b.X0) * 0.55} d={60} uid={`${uid}S`} amt={0.8} />
    <AirBox A={A} X0={b.X0} X1={b.X1} Y0={-BENCH.h} Y1={0} Z0={b.Z0} Z1={b.Z1} mat={MAT.stone} uid={uid} />
  </g>
);
// ===================================================================================================================
// THE SICK THREE (live figures): two slumped on the bench, one standing hunched and coughing beside it
// ===================================================================================================================
export const sickPose = (i: number, f: number): CovidPose => {
  // a woman slumped, head bowed; a man coughing into his fist; a man with a hand to his forehead, rocking a little
  if (i === 0) return { ...POSES.slump(1, f, BENCH.h), yaw: 0.35 };
  if (i === 1) return POSES.coughLoop({ ...POSES.sit(-1, BENCH.h), yaw: -0.3, headYaw: -0.22, hunch: 0.9, worry: 1, lids: 0.45 }, f + 9, 26);
  const q = POSES.sit(1, BENCH.h);
  return breathe({ ...q, yaw: 0.32, headYaw: 0.18, hunch: 1, worry: 1, lids: 0.55, pitch: q.pitch + 9 + 2 * Math.sin(f / 19), lean: q.lean + 2, handTo: { L: { to: "forehead", amt: 1 } } }, f, 1.4, 2);
};

// ===================================================================================================================
// THE BARRIER PANELS: a cream board with muted red-brown diagonal stripes on two posts with flat feet (nothing orange)
// ===================================================================================================================
const PANEL_INK = { board: "#E9E0CB", boardMid: "#CFC4AC", stripe: "#8E5443", stripeMid: "#77463A", post: "#B7AD98", postDark: "#7F7767" };
const LIGHT = (() => {
  const v = [-1, -0.45];
  const l = Math.hypot(v[0], v[1]);
  return [v[0] / l, v[1] / l];
})();
const pathOf = (pts: P2[]) => `M${pts.map((v) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`).join("L")}Z`;
const PanelItem: React.FC<{ A: AirWorld; p: PanelState; uid: string }> = ({ A, p, uid }) => {
  const P = A.P;
  const pt = (s: number, Y: number): P2 => {
    const q = panelPt(p, s, Y);
    return P.p(q[0], q[1], q[2]);
  };
  const Zc = p.Z;
  const H = PANEL.h;
  const b0 = 0.4 * U;
  const b1 = 0.86 * U;
  // the board faces: lit by how square its face is to the light
  const n = [-Math.sin(p.phi), Math.cos(p.phi)];
  const lit = 0.35 + 0.65 * Math.abs(n[0] * LIGHT[0] + n[1] * LIGHT[1]);
  const tone = (a: string, b: string, h: number) => A.tone(mixHex(b, a, lit), Zc, h);
  const board = tone(PANEL_INK.board, PANEL_INK.boardMid, 0.6 * U);
  const stripe = tone(PANEL_INK.stripe, PANEL_INK.stripeMid, 0.6 * U);
  const post = A.tone(PANEL_INK.post, Zc, 0.4 * U);
  const postD = A.tone(PANEL_INK.postDark, Zc, 0.2 * U);
  const rim = A.tone("#F3EBDD", Zc, H);
  const line = A.tone(lineOf({ lit: PANEL_INK.board, mid: PANEL_INK.boardMid, dark: "#8C8270" }), Zc, 0.6 * U);
  const k = A.P.r(Zc);
  const lw = (w: number) => (w * k).toFixed(2);
  // stripes: parallelograms in panel-local (s, Y), clipped to the board
  const stripes: React.ReactNode[] = [];
  const NS = 7;
  for (let i = -1; i <= NS; i++) {
    const s0 = -0.5 + i / NS;
    const sl = 0.06;
    const w = 0.5 / NS;
    stripes.push(<path key={i} d={pathOf([pt(s0, -b0), pt(s0 + w, -b0), pt(s0 + w + sl, -b1), pt(s0 + sl, -b1)])} fill={stripe} />);
  }
  const boardD = pathOf([pt(-0.5, -b0), pt(0.5, -b0), pt(0.5, -b1), pt(-0.5, -b1)]);
  // the posts and feet
  const posts = [-0.47, 0.47].map((s, i) => {
    const base = panelPt(p, s, 0);
    const fa = P.p(base[0] - n[0] * 0.28 * U, base[1], base[2] - n[1] * 0.28 * U);
    const fb = P.p(base[0] + n[0] * 0.28 * U, base[1], base[2] + n[1] * 0.28 * U);
    const top = pt(s, -H);
    const bot = pt(s, 0);
    return (
      <g key={i}>
        <line x1={fa[0]} y1={fa[1]} x2={fb[0]} y2={fb[1]} stroke={postD} strokeWidth={lw(9)} strokeLinecap="round" />
        <line x1={bot[0]} y1={bot[1]} x2={top[0]} y2={top[1]} stroke={post} strokeWidth={lw(7)} strokeLinecap="round" />
      </g>
    );
  });
  const railA = pt(-0.5, -H);
  const railB = pt(0.5, -H);
  // the soft contact shadow under the panel (offset to the lower right), fading as it is lifted
  const shAmt = 0.6 * (1 - c01(p.lift / (0.18 * U)));
  const sp = (s: number, o: number): P2 => {
    const q = panelPt({ ...p, lift: 0 }, s, 0);
    return P.p(q[0] + n[0] * o + 0.12 * U, 0, q[2] + n[1] * o - 0.1 * U);
  };
  const shD = pathOf([sp(-0.55, -0.22 * U), sp(0.55, -0.22 * U), sp(0.55, 0.22 * U), sp(-0.55, 0.22 * U)]);
  return (
    <g>
      <defs>
        <filter id={`${uid}sb`} x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation={(9 * k).toFixed(2)} />
        </filter>
        <clipPath id={`${uid}bc`}>
          <path d={boardD} />
        </clipPath>
      </defs>
      {shAmt > 0.01 ? <path d={shD} fill={A.v.pal.shadow} opacity={shAmt * (1 - A.fog(Zc))} filter={`url(#${uid}sb)`} /> : null}
      {posts}
      <path d={boardD} fill={board} stroke={line} strokeWidth={lw(1.6)} strokeLinejoin="round" />
      <g clipPath={`url(#${uid}bc)`}>{stripes}</g>
      <line x1={railA[0]} y1={railA[1]} x2={railB[0]} y2={railB[1]} stroke={post} strokeWidth={lw(7)} strokeLinecap="round" />
      <line x1={railA[0]} y1={railA[1] - 1.6 * k} x2={railB[0]} y2={railB[1] - 1.6 * k} stroke={rim} strokeWidth={lw(2.4)} strokeLinecap="round" opacity={0.85} />
    </g>
  );
};

// ===================================================================================================================
// THE MEDICS (live figures): kind "medic", carrying their panel by its top rail with both hands
// ===================================================================================================================
/** the cast's grip solve, then a few damped corrections of each wrist toward its rail point (the cast's six
 *  fixed-point steps do not always settle when a hand crosses in front of the body, which shows as a flick) */
const solveGrip = (variant: number, pose: CovidPose, grips: { L?: P2; R?: P2 }, at: P2, scale: number): CovidPose => {
  let q = covidGripTo("medic", variant, pose, grips, at, scale);
  for (let it = 0; it < 10; it++) {
    const an = covidAnchors("medic", q, at, scale, { variant });
    const eL: P2 = grips.L ? [(grips.L[0] - an.handL[0]) / scale, (grips.L[1] - an.handL[1]) / scale] : [0, 0];
    const eR: P2 = grips.R ? [(grips.R[0] - an.handR[0]) / scale, (grips.R[1] - an.handR[1]) / scale] : [0, 0];
    if (Math.hypot(...eL) + Math.hypot(...eR) < 0.3) break;
    q = { ...q, armL: { ...q.armL, w: [q.armL.w[0] + 0.7 * eL[0], q.armL.w[1] + 0.7 * eL[1]] }, armR: { ...q.armR, w: [q.armR.w[0] + 0.7 * eR[0], q.armR.w[1] + 0.7 * eR[1]] } };
  }
  return q;
};
/** a medic's solved pose this frame (the hands on the rail while he holds it), his feet and scale */
export const workerPose = (A: AirWorld, k: number, frame: number) => {
  const w = WORKERS[k];
  const st = workerAt(k, frame);
  const { at, scale } = A.P.at(st.X, st.Z);
  // the hands on the rail either side of the panel's hold point gs (the near hand takes the point ahead)
  const rail = (s: number): P2 => {
    const q = panelPt(st.panel, s, -PANEL.h - 0.02 * U);
    return A.P.p(q[0], q[1], q[2]);
  };
  // the hands close in on the hold point while the panel swings round (as the rail turns edge-on their two points
  // would otherwise swing past each other on screen)
  const sw = 1 - 0.72 * easeIO((frame - (w.tContact - w.set)) / w.set);
  const grips = { L: rail(w.gs + 0.11 * sw), R: rail(w.gs - 0.11 * sw) };
  let pose: CovidPose = st.walking ? st.pose : breathe(st.pose, frame, 1, k);
  if (!st.walking && st.grip < 0.999) {
    // let go: the medic shifts his weight and looks about (a living hold)
    const wv = 1 - st.grip;
    pose = { ...pose, lean: pose.lean + 2.6 * wv * Math.sin(frame / 21 + 1.3 * k), crouch: pose.crouch + 1.4 * wv * Math.sin(frame / 21 + 1.3 * k + 1.2), headYaw: pose.headYaw + 0.32 * wv * Math.sin(frame / 34 + 2.1 * k), roll: pose.roll + 1.2 * wv * Math.sin(frame / 27 + k) };
  }
  // the far hand lets go as the panel starts to swing (the near hand swings it round): a far arm reaching across the
  // body at shoulder height turns the mitten over (the cast's known flip)
  const near = w.dir === 1 ? "L" : "R";
  const farHold = 1 - easeIO((frame - (w.tContact - w.set - 8)) / 15);
  const both = (q: CovidPose) => (farHold > 0.999 ? solveGrip(w.variant, q, grips, at, scale) : farHold < 0.001 ? solveGrip(w.variant, q, { [near]: grips[near] }, at, scale) : lerpPose(solveGrip(w.variant, q, { [near]: grips[near] }, at, scale), solveGrip(w.variant, q, grips, at, scale), farHold));
  if (st.grip > 0.999) pose = both(pose);
  else if (st.grip > 0.001) pose = lerpPose(pose, both(pose), st.grip);
  return { st, pose, at, scale, variant: w.variant };
};
const workerNode = (A: AirWorld, k: number, frame: number, unitPx: number): { Z: number; node: React.ReactNode }[] => {
  const { st, pose, at, scale, variant } = workerPose(A, k, frame);
  const w = { variant };
  return [
    { Z: st.panel.Z, node: <PanelItem A={A} p={st.panel} uid={`pn${k}`} /> },
    {
      Z: st.Z,
      node: (
        <g>
          <AirShadow A={A} X={st.X} Z={st.Z} w={62} d={30} uid={`mdS${k}`} amt={0.8} />
          <CovidFigure kind="medic" variant={w.variant} pose={pose} at={at} scale={scale} uid={`md${k}`} frame={frame} fog={A.folkFog(st.Z)} unitPx={unitPx} />
        </g>
      ),
    },
  ];
};

// ===================================================================================================================
// THE FIRST RING (live figures): well-looking, upright, chatting; the ones in front walk off left and right
// ===================================================================================================================
export const livePose = (p: Person, f: number): CovidPose => {
  const toward = p.toward ?? 1;
  const chat = breathe(POSES.chat(POSES.stand(toward), f, toward, 0.8, p.i * 0.7), f, 1, p.i);
  if (p.live !== "walk" || !p.lw) return chat;
  const w = p.lw;
  const am = lwAmount(w, f);
  if (am <= 0.001) return chat;
  const walk = POSES.walk(w.dir, lwPhase(w, f), am);
  return lerpPose(chat, walk, Math.min(1, am / w.amount));
};
const liveNode = (A: AirWorld, p: Person, f: number, unitPx: number, halo: number, haloR: number) => {
  const X = walkerX(p, f);
  const { at, scale } = A.P.at(X, p.Z);
  const pose = livePose(p, f);
  const kin = kindleAt(p, f);
  const variant = p.variant ?? 0;
  return (
    <g>
      <AirShadow A={A} X={X} Z={p.Z} w={62} d={30} uid={`lvS${p.i}`} amt={0.8} />
      <CovidFigure kind={p.kind} variant={variant} pose={pose} at={at} scale={scale} uid={`lv${p.i}`} frame={f} infected={kin} fog={A.folkFog(p.Z)} unitPx={unitPx} />
      {kin > 0.01 ? <ChestHalo c={covidAnchors(p.kind, pose, at, scale, { variant }).chest} r={haloR * scale} a={0.9 * halo * kin} uid={`lvH${p.i}`} /> : null}
    </g>
  );
};

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
type Item = { Z: number; kind: "crowd"; p: Person } | { Z: number; kind: "svg"; key: string; node: React.ReactNode };

const PushTheLimitsOnLatency: React.FC<z.infer<typeof schema>> = ({ glowA, halo, haloR, specks }) => {
  const frame = useCurrentFrame();
  const get = useCovidSprites(ALL_REQS);
  const e = eyeAt(frame);
  const { cam, depth } = camOf(e);
  const rest: Cam = camOf(eyeAt(0)).cam;
  const A = airWorldOf({ cam, rest, depth, frame, fogBy: "depth" });
  const items: Item[] = [];
  for (const p of PEOPLE) items.push(p.live ? { Z: p.Z, kind: "svg", key: `lv${p.i}`, node: liveNode(A, p, frame, cam.k, halo, haloR) } : { Z: p.Z, kind: "crowd", p });
  items.push({ Z: BENCH.Z1, kind: "svg", key: "bench", node: <Bench A={A} /> });
  EXTRA_BENCHES.forEach((b, i) => items.push({ Z: b.Z1, kind: "svg", key: `xb${i}`, node: <Bench A={A} b={b} uid={`xb${i}`} /> }));
  SICK.forEach((s, i) => {
    const { at, scale } = A.P.at(s.X, s.Z);
    items.push({
      Z: s.Z - (s.seat ? 0 : 1),
      kind: "svg",
      key: `sick${i}`,
      node: (
        <g>
          {s.seat ? null : <AirShadow A={A} X={s.X} Z={s.Z} w={62} d={30} uid={`skS${i}`} amt={0.8} />}
          <CovidFigure kind={s.kind} variant={s.variant} pose={sickPose(i, frame)} at={at} scale={scale} uid={`sk${i}`} frame={frame} sick={1} infected={0.8} fog={A.folkFog(s.Z)} unitPx={cam.k} />
          <ChestHalo c={covidAnchors(s.kind, sickPose(i, frame), at, scale, { variant: s.variant }).chest} r={haloR * scale} a={0.8 * halo} uid={`skH${i}`} />
        </g>
      ),
    });
  });
  WORKERS.forEach((w) => workerNode(A, w.k, frame, cam.k).forEach((it, j) => items.push({ Z: it.Z, kind: "svg", key: `wk${w.k}-${j}`, node: it.node })));
  items.sort((a, b) => b.Z - a.Z);
  // group: consecutive crowd people share one canvas; svg items get their own world svg
  const layers: React.ReactNode[] = [];
  let run: Person[] = [];
  const flush = () => {
    if (!run.length) return;
    const ps = run;
    layers.push(
      <FolkCanvas
        key={`c${layers.length}`}
        draw={(ctx) => {
          for (const p of ps) drawPerson(ctx, p, frame, e, A, get, { glowA, halo, haloR, specks });
        }}
      />,
    );
    run = [];
  };
  let svgRun: React.ReactNode[] = [];
  const flushSvg = () => {
    if (!svgRun.length) return;
    layers.push(
      <WorldSvg key={`s${layers.length}`} cam={cam}>
        {svgRun}
      </WorldSvg>,
    );
    svgRun = [];
  };
  for (const it of items) {
    if (it.kind === "crowd") {
      flushSvg();
      run.push(it.p);
    } else {
      flush();
      svgRun.push(<React.Fragment key={it.key}>{it.node}</React.Fragment>);
    }
  }
  flush();
  flushSvg();
  return (
    <AirStage v={A.v} bloom={0.22}>
      <WorldSvg cam={cam}>
        <AirFloor A={A} x0={FLOOR.x0} x1={FLOOR.x1} z0={FLOOR.z0} z1={FLOOR.z1} mat={MAT.ground} course={1.6 * U} />
        <Facades A={A} />
      </WorldSvg>
      {layers}
    </AirStage>
  );
};

export default PushTheLimitsOnLatency;
