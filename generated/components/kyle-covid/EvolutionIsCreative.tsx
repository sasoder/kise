// ---------------------------------------------------------------------------
// EvolutionIsCreative (kyle-covid, cut 48). Dwarkesh 3D style (styles/dwarkesh-3d.md), mood micro.
// Opaque 1080x1920, 29.97 fps, 174 frames.
//
// CHECK LINE: "Microbes keep dividing into weird random variants; most die out by chance, and the one that happens to
// fit a weak spot in our cells gets in and takes over."
//
// THE LINE: "[Evolution] is very weird, very contingent, very creative at exploiting whatever weakness we give it."
// ("Evolution" is said on the speaker, just before the cut.)
// WORD -> FRAME (f0 = 48.1815 s): is 4 · very 12 · WEIRD 22 · very 36 · CONTINGENT 41 · very 59 · CREATIVE 66 · at 80 ·
//   EXPLOITING 93 · whatever 113 · WEAKNESS 125 · we 137 · GIVE 150 · it 156 · (It's 163; the speaker returns at 174).
// DURATION: the slot 48.182 -> 53.987 s = 5.806 s x 29.97 = 174 frames (f0..f173).
//
// THE MOTION (review 1): one living family tree of microbes (covidMicrobes.tsx; evolutionScene.ts lays the tree out
// and lives it). f0 one plump cream rod with pili (~320 px, centred y ~870), already pinching; it splits ~f2 along its
// own path, the daughters part (born f11); the upper one sprouts thorns, the lower one bends into a comma with a long
// flagellum, and both divide on WEIRD (f14-f26); seven bodies by CONTINGENT; each generation a little faster
// (divisions 17, 12, 10, 11, 10 frames). Every division leaves a FORK fixed in world space; the leaves take
// non-crossing lanes (a tidy tree widening with the generations); every organism swims one smooth curve from its birth
// toward its lane, nose first, a soft damped push keeping a clear gap between bodies and the family's left-right order;
// its strand is ONE cubic from its parent's fork to where it is (to its own fork once it has divided), leaving the fork
// to its own side, never following a bump or a drift; old internodes fade with age (the root and first forks are gone
// by ~f80), long branches fade toward their old forks, low ones into the dense low air. CONTINGENT: a random tip
// starts to drain at f30 (DEAD by ~f44) and sinks outward and back out of the tree, its strand fading; more drain at
// f47, 60, 70, 78, 88, 104, 112, 119, 134, 146 and 150. CREATIVE (f60-f80): the living tips burst into new forms (corkscrews, bulbs, thorns, tails). The camera pulls
// back (k 133 -> 54 at f95) and rises with the growth; the rise brings a curved lining of human cells in from the top edge
// from ~f50 (review 2: a packed tissue of soft rounded-polygon cells pressed against each other, fine membrane lines
// between them, each with a darker nucleus, four rows fading up into the air; the lowest row faces the microbes with
// small cup receptors on short stalks). EXPLOITING / WHATEVER (from f98): the frontier tips reach the cells,
// bump the wall and recoil, then slip slowly sideways or hang in rows below it; a few drain. WEAKNESS: the spiky,
// club-tipped variant (one lineage drifted toward it) arrives under the middle cell's socket, turning so its top club points up the socket: CONTACT f125 (its club head
// in the cup); FIRST REACTION f126 (the cup closes round it, f126-f131) and the orange starts at the contact point
// (visible f127, the whole virion orange by ~f135) while it morphs into the crowned virion (36 club spikes, f126-f141)
// and is drawn up into the socket; f131-f155 the membrane grows two lips down its sides (the part inside the cell is
// seen veiled through the membrane); from f139 crisp orange virions are made inside it, each budding out of one
// already there (the first out of the docked one), six by f156, seen through the translucent membrane (a gentle warm
// tint at most); on GIVE IT three copies grow out of them and push out through the membrane beside it (f145, f152,
// f158; each under a membrane cap that pinches off), drifting a little. The drained are lifted a little (DEAD-based,
// dull, apart from the air). The rest of the tree stays cream below: drifting, dividing, draining. A gentle
// push-in (k 54 -> 63, f95-f140) lands the virion ~123-131 px at y ~838, then a creep (k 67 at f173): a settled, living
// last frame. Orange = THE pathogen only (the docked virion and its copies, from WEAKNESS on); everything else cream /
// DEAD / air.
//
// DEPTH: one pinhole camera (evolutionScene.ts), F 1400, looking along +Z, keyed in 2D (k / wx / wy / sy, pchip) and
// solved to a real dolly; the tree near Z 0 (-1.6..2.4), the front row of cells Z ~0.6, rows behind at Z 5 and 11; fog
// by world depth Z (fogZ), so the pull-back never buries the tree.
// Caption bands: from f95 the docking, the orange virion and its copies stay above y 964 on every frame (computed
// from the scene); only the tree's lower branches and the sinking dead pass through the bands.
//
// SOURCES: none on screen. (SARS-CoV-2's spike binds the ACE2 receptor on the host cell, then the virion is taken in
// and the cell is used to make copies; drawn as a stylised key-in-socket fit, no text, no numbers.)
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirStage, makeAirView, type AirScene, type AirView, type RGB } from "../kits/dwarkesh-3d/dwarkesh3d";
import { MicrobeCanvas, drawMicrobe, inkOf, mixGenome, shapeOf, span, type Genome } from "./covidMicrobes";
import {
  COPIES,
  DOCK,
  DURATION,
  FPS,
  INFECTED,
  INSIDE,
  ORGS,
  SOCKET,
  TISSUE,
  TSOCKETS,
  VIRION,
  camAt,
  copyAt,
  divisionAt,
  dockCentreFor,
  dockPos,
  dockState,
  fogZ,
  genomeAt,
  infBulge,
  infR,
  infSwell,
  project,
  rotOf,
  sstep,
  strandOf,
  tSocketCup,
  type Cam,
  type Org,
  type TCell,
  type TSocket,
} from "./evolutionScene";

export { DURATION, FPS };
export const schema = z.object({});
export const defaultProps = schema.parse({});

const SCENE: AirScene = { look: "A", mood: "micro", F: 1400, fogNear: 12, fogVis: 70, fogMax: 0.97, hLow: 0, hHigh: 24, moteUnit: 8 };
const LX = -0.55;
const LY = -0.835;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hexRgb = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mixR = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const css = (c: RGB, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${c01(a).toFixed(3)})`;

/** the human cells: pale oatmeal-pink, lit from the upper left, a cream rim */
const CELL = { lit: hexRgb("#EED7CC"), mid: hexRgb("#CBA69B"), dark: hexRgb("#86655D"), cream: hexRgb("#F3EBDD"), shadow: hexRgb("#22180F") };
const STRAND = hexRgb("#EAE0CB");
const ORANGE = hexRgb("#FFB000");

type Ctx = CanvasRenderingContext2D;

// ---- the tissue ----------------------------------------------------------------------------------------------------
const TZ = 0.6;
/** a tissue cell's outline on screen; the infected one takes the docked virion in (its lips) and swells a little */
const tissuePath = (cl: TCell, c: Cam, wrap = 0, f = 0) => {
  const p = new Path2D();
  if (cl.infected) {
    const N = 260;
    const sw = infSwell(f);
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * Math.PI * 2;
      const r = infR(t) + infBulge(t, wrap);
      const X = DOCK.cup.bx + (cl.cx + r * Math.cos(t) - DOCK.cup.bx) * sw;
      const Y = DOCK.cup.by + (cl.cy + r * Math.sin(t) - DOCK.cup.by) * sw;
      const q = project(c, X, Y, TZ);
      if (i === 0) p.moveTo(q.x, q.y);
      else p.lineTo(q.x, q.y);
    }
  } else {
    cl.pts.forEach((pt, i) => {
      const q = project(c, pt[0], pt[1], TZ);
      if (i === 0) p.moveTo(q.x, q.y);
      else p.lineTo(q.x, q.y);
    });
  }
  p.closePath();
  return p;
};
const ROW_FOG = [0.04, 0.24, 0.42, 0.58];
const MEMB = hexRgb("#7C5F58");
const NUC = hexRgb("#7A5852");
/** the membrane between the cells: their packed polygons laid in a darker tone first (the inset cells leave fine lines) */
const drawTissueBack = (ctx: Ctx, c: Cam, v: AirView) => {
  TISSUE.forEach((cl) => {
    const ctr = project(c, cl.cx, cl.cy, TZ);
    if (ctr.y + 4 * ctr.s < -20 || ctr.y - 4 * ctr.s > 1940) return;
    const p = new Path2D();
    cl.poly.forEach((pt, i) => {
      const q = project(c, pt[0], pt[1], TZ);
      if (i === 0) p.moveTo(q.x, q.y);
      else p.lineTo(q.x, q.y);
    });
    p.closePath();
    const air = v.airAtScreen(ctr.y);
    ctx.fillStyle = css(mixR(MEMB, air, ROW_FOG[cl.row]));
    ctx.fill(p);
  });
};
const drawTissueCell = (ctx: Ctx, cl: TCell, c: Cam, v: AirView, wrap: number, f: number) => {
  const ctr = project(c, cl.cx, cl.cy, TZ);
  if (ctr.y + 4 * ctr.s < -20 || ctr.y - 4 * ctr.s > 1940) return;
  const path = tissuePath(cl, c, wrap, f);
  const fog = ROW_FOG[cl.row];
  const air = v.airAtScreen(ctr.y);
  const t = (k: RGB) => mixR(k, air, fog);
  let mr = 0;
  cl.pts.forEach((pt) => (mr += Math.hypot(pt[0] - cl.cx, pt[1] - cl.cy)));
  const R = (mr / cl.pts.length) * ctr.s;
  ctx.save();
  ctx.clip(path);
  // a soft cushion pressed against its neighbours: lit toward the upper left, darker toward its edges
  const g = ctx.createRadialGradient(ctr.x + LX * R * 0.35, ctr.y + LY * R * 0.35, 0, ctr.x + LX * R * 0.1, ctr.y + LY * R * 0.1, R * 1.25);
  g.addColorStop(0, css(t(mixR(CELL.lit, CELL.cream, 0.45))));
  g.addColorStop(0.35, css(t(CELL.lit)));
  g.addColorStop(0.75, css(t(mixR(CELL.lit, CELL.mid, 0.8))));
  g.addColorStop(1, css(t(mixR(CELL.mid, CELL.dark, 0.55))));
  ctx.fillStyle = g;
  ctx.fillRect(ctr.x - R * 1.4, ctr.y - R * 1.4, R * 2.8, R * 2.8);
  // the nucleus, clearly darker, seen through the cell, a nucleolus in it
  const n = cl.nuc;
  const nq = project(c, n.x, n.y, TZ);
  ctx.save();
  ctx.translate(nq.x, nq.y);
  ctx.rotate(n.a);
  ctx.scale(1, n.ry / n.rx);
  const nr = n.rx * nq.s;
  const ng = ctx.createRadialGradient(-nr * 0.25, -nr * 0.3, 0, 0, 0, nr);
  ng.addColorStop(0, css(t(mixR(NUC, CELL.lit, 0.35)), 0.75));
  ng.addColorStop(0.7, css(t(NUC), 0.72));
  ng.addColorStop(0.92, css(t(mixR(NUC, CELL.shadow, 0.25)), 0.8));
  ng.addColorStop(1, css(t(NUC), 0));
  ctx.fillStyle = ng;
  ctx.beginPath();
  ctx.arc(0, 0, nr, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = css(t(mixR(NUC, CELL.shadow, 0.35)), 0.6);
  ctx.beginPath();
  ctx.arc(nr * 0.22, nr * 0.05, nr * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // a few small vesicles
  for (let i = 0; i < 7; i++) {
    const a = cl.seed * 2.3 + i * 0.9;
    const rr = 0.55 + 0.25 * Math.sin(i * 1.9 + cl.seed);
    ctx.fillStyle = css(t(i % 3 === 0 ? CELL.dark : CELL.cream), 0.16);
    ctx.beginPath();
    ctx.arc(ctr.x + Math.cos(a) * R * rr, ctr.y + Math.sin(a) * R * rr * 0.9, R * (0.035 + 0.02 * (i % 2)), 0, Math.PI * 2);
    ctx.fill();
  }
  // a cream rim inside the upper-left edge
  const rg = ctx.createLinearGradient(ctr.x - R, ctr.y - R, ctr.x + R * 0.3, ctr.y + R * 0.3);
  rg.addColorStop(0, css(CELL.cream, 0.7 * (1 - fog)));
  rg.addColorStop(0.5, css(CELL.cream, 0.2 * (1 - fog)));
  rg.addColorStop(1, css(CELL.cream, 0));
  ctx.strokeStyle = rg;
  ctx.lineWidth = Math.max(2, 0.18 * ctr.s);
  ctx.stroke(path);
  ctx.restore();
  // the fine membrane edge
  ctx.strokeStyle = css(t(mixR(CELL.dark, CELL.shadow, 0.3)), 0.7);
  ctx.lineWidth = Math.max(0.9, Math.min(2, 0.03 * ctr.s));
  ctx.stroke(path);
};
const drawSocket = (ctx: Ctx, s: TSocket, c: Cam, v: AirView, grip: number) => {
  const cup = tSocketCup(s);
  const q0 = project(c, s.x - s.nx * 0.12, s.y - s.ny * 0.12, TZ);
  const qc = project(c, cup.x, cup.y, TZ);
  const sc = qc.s;
  const air = v.airAtScreen(qc.y);
  const t = (k: RGB) => mixR(k, air, fogZ(TZ));
  const out = t(mixR(CELL.dark, CELL.shadow, 0.35));
  const ang = Math.atan2(s.ny, s.nx);
  const stalkEnd = { x: qc.x - s.nx * SOCKET.cupR * 0.8 * sc, y: qc.y - s.ny * SOCKET.cupR * 0.8 * sc };
  ctx.lineCap = "round";
  ctx.strokeStyle = css(out, 0.85);
  ctx.lineWidth = 0.085 * sc + 2;
  ctx.beginPath();
  ctx.moveTo(q0.x, q0.y);
  ctx.lineTo(stalkEnd.x, stalkEnd.y);
  ctx.stroke();
  ctx.strokeStyle = css(t(CELL.mid));
  ctx.lineWidth = 0.085 * sc;
  ctx.stroke();
  // the cup: a deep U opening away from the cell (it closes round a club head that fits)
  const hs = 1.3 + 0.55 * grip;
  const R = SOCKET.cupR * sc * (1 - 0.12 * grip);
  ctx.beginPath();
  ctx.arc(qc.x, qc.y, R, ang + Math.PI - hs, ang + Math.PI + hs);
  ctx.strokeStyle = css(out, 0.85);
  ctx.lineWidth = 0.075 * sc + 2;
  ctx.stroke();
  ctx.strokeStyle = css(t(mixR(CELL.lit, CELL.mid, 0.3)));
  ctx.lineWidth = 0.075 * sc;
  ctx.stroke();
};

// ---- the tree -----------------------------------------------------------------------------------------------------
const idxOf = (o: Org, f: number) => Math.max(0, Math.min(o.X.length - 1, Math.round(f) - o.f0));
const posOf = (o: Org, f: number) => {
  const i = idxOf(o, f);
  return { X: o.X[i], Y: o.Y[i], Z: o.ZZ[i] };
};
const parentOf = (o: Org) => (o.parent >= 0 ? ORGS[o.parent] : undefined);
/** a branch of the family tree: one smooth cubic from its fork to the organism (or its own next fork); old ones fade */
const drawStrand = (ctx: Ctx, o: Org, f: number, c: Cam) => {
  const st = strandOf(o, f);
  if (!st) return;
  const fadeDead = o.fdie !== undefined ? 1 - sstep(o.fdie, o.fdie + 18, f) : 1;
  const ageFade = 1 - st.age * (o.gen <= 3 ? 1 : o.gen === 4 ? 0.7 : 0.45);
  const a = 0.46 * (1 - fogZ(o.Z)) * fadeDead * ageFade * st.fadeIn;
  if (a < 0.01) return;
  const q = st.B.map((p) => project(c, p[0], p[1], o.Z));
  const w = Math.max(1.2, Math.min(3.4, 0.075 * q[0].s));
  // a long branch fades toward its old fork (the low, old tree recedes; only the young ends read strongly)
  const Lw = Math.hypot(st.B[3][0] - st.B[0][0], st.B[3][1] - st.B[0][1]);
  const low = lerp(1, 0.22, c01((Lw - 2.5) / 4.5));
  const N = 22;
  const pts: { x: number; y: number }[] = [];
  for (let k = 0; k <= N; k++) {
    const u = k / N;
    const m = 1 - u;
    pts.push({
      x: m * m * m * q[0].x + 3 * m * m * u * q[1].x + 3 * m * u * u * q[2].x + u * u * u * q[3].x,
      y: m * m * m * q[0].y + 3 * m * m * u * q[1].y + 3 * m * u * u * q[2].y + u * u * u * q[3].y,
    });
  }
  ctx.lineCap = "butt";
  ctx.lineJoin = "round";
  for (let k = 0; k < N; k++) {
    const u = (k + 0.5) / N;
    // the low branches also sink into the dense low air
    const ya = (pts[k].y + pts[k + 1].y) / 2;
    const ak = a * lerp(low, 1, sstep(0.05, 0.75, u)) * lerp(1, 0.45, c01((ya - 900) / 1020));
    if (ak < 0.004) continue;
    ctx.beginPath();
    ctx.moveTo(pts[k].x, pts[k].y);
    ctx.lineTo(pts[k + 1].x, pts[k + 1].y);
    ctx.strokeStyle = css(STRAND, ak * 0.2);
    ctx.lineWidth = w * 3.2;
    ctx.stroke();
    ctx.strokeStyle = css(STRAND, ak);
    ctx.lineWidth = w;
    ctx.stroke();
  }
};
type Item = { Z: number; draw: () => void };
const orgItems = (ctx: Ctx, f: number, c: Cam, v: AirView, items: Item[]) => {
  const ds = dockState(f);
  for (const o of ORGS) {
    if (f < o.fb) continue;
    const dividing = o.fd !== undefined && o.dd !== undefined && f >= o.fd;
    if (dividing && o.fd !== undefined && o.dd !== undefined && f >= o.fd + o.dd) continue;
    const p = posOf(o, f);
    const q = project(c, p.X, p.Y, p.Z);
    if (q.x < -300 || q.x > 1380 || q.y < -300 || q.y > 2220) continue;
    const drain = o.fdie !== undefined ? sstep(o.fdie, o.fdie + 14, f) : 0;
    const P = parentOf(o);
    const tone = P ? lerp(genomeAt(P, o.fb).tone, genomeAt(o, f).tone, sstep(o.fb, o.fb + 12, f)) : genomeAt(o, f).tone;
    const look = { tone: lerp(tone, 0.6, drain), drain: drain * 0.8, fog: Math.min(0.6, fogZ(p.Z) + 0.08 * sstep(o.fdie ?? 1e9, (o.fdie ?? 1e9) + 60, f)), air: v.airAtScreen(q.y) };
    if (dividing) {
      items.push({
        Z: p.Z,
        draw: () => {
          const d = divisionAt(o, f);
          drawMicrobe(
            ctx,
            [
              { s: d.a, x: q.x + d.oa[0] * q.s, y: q.y + d.oa[1] * q.s },
              { s: d.b, x: q.x + d.ob[0] * q.s, y: q.y + d.ob[1] * q.s },
            ],
            q.s,
            inkOf(look),
            { whole: d.whole },
          );
        },
      });
      continue;
    }
    if (o.dock) {
      items.push({ Z: p.Z - 5, draw: () => drawDock(ctx, o, f, c, v, ds) });
      continue;
    }
    const g = genomeAt(o, f);
    const r = rotOf(o, f, parentOf);
    items.push({
      Z: p.Z,
      draw: () => {
        drawMicrobe(ctx, [{ s: shapeOf(g, r, r.wave), x: q.x, y: q.y }], q.s, inkOf(look));
      },
    });
  }
};

// ---- the docking --------------------------------------------------------------------------------------------------
const dockGenome = (o: Org, f: number): Genome => {
  const ds = dockState(f);
  const g0 = genomeAt(o, Math.min(f, DOCK.contact));
  return ds.morph > 0 ? mixGenome(g0, VIRION, ds.morph) : g0;
};
/** the docked virion's world centre: its club head stays in the cup from contact on; it is drawn up as the cell takes it */
const dockCentre = (o: Org, f: number) => {
  const ds = dockState(f);
  const g = dockGenome(o, f);
  const sim = dockPos(o, f);
  const want = dockCentreFor(g);
  const base = dockCentreFor(VIRION);
  const u = sstep(96, DOCK.contact, f);
  const n = { x: DOCK.cup.nx, y: DOCK.cup.ny };
  const pull = f >= DOCK.contact ? 0.18 * ds.settle + 0.34 * ds.wrap : 0;
  return { X: sim.X + (want.x - base.x) * u - n.x * pull, Y: sim.Y + (want.y - base.y) * u - n.y * pull, Z: sim.Z };
};
const TAU = Math.PI * 2;
/** the docking variant turns so its top club spike points up the socket (yaw, pitch, roll to the nearest whole turn) */
const dockRot = (o: Org, f: number) => {
  const r = rotOf(o, Math.min(f, DOCK.contact), parentOf);
  const rc = rotOf(o, DOCK.contact, parentOf);
  const w = sstep(100, DOCK.contact - 2, f);
  const ty = Math.round(rc.yaw / TAU) * TAU;
  const tr = Math.round(rc.roll / TAU) * TAU;
  return { yaw: lerp(r.yaw, ty, w), pitch: lerp(r.pitch, 0, w), roll: lerp(r.roll, tr, w), wave: r.wave };
};
const drawDock = (ctx: Ctx, o: Org, f: number, c: Cam, v: AirView, ds: ReturnType<typeof dockState>) => {
  if (ds.wrap < 0.005) {
    drawDockBody(ctx, o, f, c, v, ds, 1);
    return;
  }
  // taken in: the part inside the cell's membrane is seen through it (veiled), the rest whole
  const cp = tissuePath(INFECTED, c, ds.wrap, f);
  ctx.save();
  ctx.clip(cp);
  drawDockBody(ctx, o, f, c, v, ds, lerp(1, 0.5, ds.wrap));
  ctx.restore();
  ctx.save();
  const outside = new Path2D();
  outside.rect(-500, -500, 2080, 2920);
  outside.addPath(cp);
  ctx.clip(outside, "evenodd");
  drawDockBody(ctx, o, f, c, v, ds, 1);
  ctx.restore();
};
const drawDockBody = (ctx: Ctx, o: Org, f: number, c: Cam, v: AirView, ds: ReturnType<typeof dockState>, alpha: number) => {
  const p = dockCentre(o, f);
  const q = project(c, p.X, p.Y, p.Z);
  const g = dockGenome(o, f);
  const r = dockRot(o, f);
  const s = shapeOf(g, r, r.wave);
  const look = { tone: g.tone, fog: fogZ(p.Z), air: v.airAtScreen(q.y) };
  const cup = project(c, DOCK.cup.x, DOCK.cup.y, TZ);
  const R = span(g) * q.s;
  drawMicrobe(ctx, [{ s, x: q.x, y: q.y }], q.s, inkOf(look), ds.orangeR > 0 ? { alpha, orangeSpread: { x: cup.x, y: cup.y, r: 4 + ds.orangeR * R * 1.35, ink: inkOf({ ...look, orange: 1 }) } } : { alpha });
};
/** the orange glow spreading inside the cell from the docking point, and the copies made there pushing out */
const DOCK_O = ORGS.find((o) => o.dock);
/** an inside virion's place: it comes out of the one it was made from (the first, out of the docked virion) */
const posOfIn = (k: number, ff: number, depth = 0): { x: number; y: number; z: number } => {
  const iv = INSIDE[k];
  const dc = DOCK_O ? dockCentre(DOCK_O, ff) : { X: DOCK.centre.x, Y: DOCK.centre.y, Z: TZ };
  const src = iv.src < 0 || depth > 6 ? { x: dc.X, y: dc.Y, z: dc.Z } : posOfIn(iv.src, ff, depth + 1);
  const m = sstep(iv.f0, iv.f0 + 10, ff);
  const wob = sstep(iv.f0 + 10, iv.f0 + 30, ff);
  return { x: lerp(src.x, iv.x, m) + 0.12 * Math.sin(ff * 0.05 + iv.seed) * wob, y: lerp(src.y, iv.y, m) + 0.1 * Math.sin(ff * 0.043 + iv.seed * 1.7) * wob, z: lerp(src.z, TZ, m) };
};
/** a copy on screen: made inside from the first virion in (it grows as it moves to its way out), then out */
const copyScreen = (cp: (typeof COPIES)[number], f: number, c: Cam) => {
  const st = copyAt(cp, f);
  const fA = cp.f0 - 6;
  // its source: the latest inside virion already made by then
  let k = 0;
  INSIDE.forEach((iv, i) => {
    if (iv.f0 + 4 <= fA) k = i;
  });
  const m = sstep(fA, cp.f0 + 2, f);
  const s0 = posOfIn(k, f);
  const q = project(c, lerp(s0.x, st.x, m), lerp(s0.y, st.y, m), lerp(s0.z, TZ, m));
  return { x: q.x, y: q.y, px: q.s * lerp(0.45, 1, sstep(fA, cp.f0 + 4, f)), rot: { yaw: cp.seed * 0.7, pitch: 0.2 * Math.sin(f * 0.04 + cp.seed), roll: cp.seed + f * 0.015 } };
};
const drawInfection = (ctx: Ctx, f: number, c: Cam, v: AirView, cellP: Path2D, pass: "inside" | "outside") => {
  const q = project(c, INFECTED.cx, INFECTED.cy, TZ);
  if (pass === "outside") {
    drawCopiesOut(ctx, f, c, v, cellP);
    return;
  }
  // a gentle warm tint as the cell fills
  const tint = sstep(DOCK.contact + 8, DOCK.contact + 40, f);
  if (tint > 0.01) {
    ctx.save();
    ctx.clip(cellP);
    ctx.fillStyle = css(ORANGE, 0.06 * tint);
    ctx.fill(cellP);
    ctx.restore();
  }
  // crisp virions made inside, seen through the translucent membrane: each comes out of one already there
  const air = v.airAtScreen(q.y);
  const ink = inkOf({ orange: 1, fog: fogZ(TZ), air });
  // the first one comes out of the docked virion (from behind it, up through the membrane): not clipped
  const first = (k: number) => k === 0 && f < INSIDE[0].f0 + 12;
  ctx.save();
  ctx.clip(cellP);
  INSIDE.forEach((iv, k) => {
    if (f < iv.f0 || first(k)) return;
    const g = sstep(iv.f0, iv.f0 + 9, f);
    const p = posOfIn(k, f);
    const qq = project(c, p.x, p.y, p.z);
    const rot = { yaw: iv.seed * 0.9, pitch: 0.25 * Math.sin(f * 0.05 + iv.seed), roll: iv.seed + f * 0.02 };
    drawMicrobe(ctx, [{ s: shapeOf(VIRION, rot, 0), x: qq.x, y: qq.y }], qq.s * (0.28 + 0.34 * g), ink, { alpha: 0.92 });
  });
  ctx.restore();
  INSIDE.forEach((iv, k) => {
    if (f < iv.f0 || !first(k)) return;
    const g = sstep(iv.f0, iv.f0 + 9, f);
    const p = posOfIn(k, f);
    const qq = project(c, p.x, p.y, p.z);
    const rot = { yaw: iv.seed * 0.9, pitch: 0.25 * Math.sin(f * 0.05 + iv.seed), roll: iv.seed + f * 0.02 };
    drawMicrobe(ctx, [{ s: shapeOf(VIRION, rot, 0), x: qq.x, y: qq.y }], qq.s * (0.28 + 0.34 * g), ink, { alpha: 0.92 });
  });
  ctx.save();
  ctx.clip(cellP);
  // the copies on their way out, still inside: as crisp as the others (each made from the first one in, growing)
  COPIES.forEach((cp) => {
    if (f < cp.f0 - 6) return;
    const cs = copyScreen(cp, f, c);
    drawMicrobe(ctx, [{ s: shapeOf(VIRION, cs.rot, 0), x: cs.x, y: cs.y }], cs.px, ink, { alpha: 0.92 });
  });
  // the membrane in front of them (a faint veil)
  if (f >= INSIDE[0].f0) {
    ctx.fillStyle = css(mixR(CELL.lit, air, 0.1), 0.12 * sstep(INSIDE[0].f0, INSIDE[0].f0 + 10, f));
    ctx.fill(cellP);
  }
  ctx.restore();
};
const drawCopiesOut = (ctx: Ctx, f: number, c: Cam, v: AirView, cellP: Path2D) => {
  const air = v.airAtScreen(project(c, INFECTED.cx, INFECTED.cy, TZ).y);
  COPIES.forEach((cp) => {
    const st = copyAt(cp, f);
    if (f < cp.f0 - 6) return;
    const qc = project(c, st.x, st.y, TZ);
    const cs = copyScreen(cp, f, c);
    const sh = shapeOf(VIRION, cs.rot, 0);
    const ink = inkOf({ orange: 1, fog: fogZ(TZ), air });
    // outside: whole
    ctx.save();
    const outside = new Path2D();
    outside.rect(-500, -500, 2080, 2920);
    outside.addPath(cellP);
    ctx.clip(outside, "evenodd");
    drawMicrobe(ctx, [{ s: sh, x: cs.x, y: cs.y }], cs.px, ink);
    ctx.restore();
    // the membrane stretched over the part pushing out, pinching off as it leaves
    const cap = sstep(0.18, 0.4, st.e) * (1 - sstep(0.72, 0.95, st.e));
    if (cap > 0.01) {
      const Rm = (VIRION.girth + VIRION.spikeLen + 0.08) * qc.s;
      const n = Math.atan2(st.ny, st.nx);
      ctx.beginPath();
      ctx.arc(qc.x, qc.y, Rm, n - 1.45, n + 1.45);
      ctx.lineCap = "round";
      ctx.strokeStyle = css(mixR(CELL.dark, CELL.shadow, 0.3), 0.55 * cap);
      ctx.lineWidth = 0.09 * qc.s + 2;
      ctx.stroke();
      ctx.strokeStyle = css(mixR(CELL.lit, air, 0.15), 0.75 * cap);
      ctx.lineWidth = 0.09 * qc.s;
      ctx.stroke();
      ctx.fillStyle = css(mixR(CELL.mid, air, 0.2), 0.22 * cap);
      ctx.fill();
    }
  });
};

// ---- the frame ----------------------------------------------------------------------------------------------------
const C0 = camAt(0);
const drawFrame = (ctx: Ctx, f: number, c: Cam, v: AirView) => {
  // the tissue: the membrane between the cells, the cells (rows fading up into the air), the infected one last
  const ds = dockState(f);
  drawTissueBack(ctx, c, v);
  [...TISSUE].sort((a, b) => b.row - a.row || (a.infected ? 1 : 0) - (b.infected ? 1 : 0)).forEach((cl) => drawTissueCell(ctx, cl, c, v, cl.infected ? ds.wrap : 0, f));
  TSOCKETS.forEach((s) => {
    if (!s.dock) drawSocket(ctx, s, c, v, 0);
  });
  // the docking socket, behind the club head that comes to sit in it (hidden as the membrane takes the virion in)
  const dockCellP = tissuePath(INFECTED, c, ds.wrap, f);
  ctx.save();
  const outside = new Path2D();
  outside.rect(-500, -500, 2080, 2920);
  outside.addPath(dockCellP);
  ctx.clip(outside, "evenodd");
  const dsock = TSOCKETS.find((s) => s.dock);
  if (dsock) drawSocket(ctx, dsock, c, v, sstep(DOCK.contact, DOCK.contact + 6, f));
  ctx.restore();
  // the virions made inside the infected cell (behind the docked one, which they come out of)
  if (f >= DOCK.contact) drawInfection(ctx, f, c, v, dockCellP, "inside");
  // the strands, then the organisms far to near
  ORGS.forEach((o) => drawStrand(ctx, o, f, c));
  const items: Item[] = [];
  orgItems(ctx, f, c, v, items);
  items.sort((a, b) => b.Z - a.Z);
  items.forEach((it) => it.draw());
  if (f >= DOCK.contact) drawInfection(ctx, f, c, v, dockCellP, "outside");
};

const EvolutionIsCreative: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const c = camAt(frame);
  const v = makeAirView({ scene: SCENE, frame, horizon: 960, cam: { x: c.x, y: -c.y, z: c.z }, rest: { x: C0.x, y: -C0.y, z: C0.z } });
  return (
    <AirStage v={v} bloom={0.22}>
      <MicrobeCanvas draw={(ctx) => drawFrame(ctx, frame, c, v)} />
    </AirStage>
  );
};

export default EvolutionIsCreative;
