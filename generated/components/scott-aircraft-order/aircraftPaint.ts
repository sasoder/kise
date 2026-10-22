// ---------------------------------------------------------------------------
// aircraftPaint — the liveries of scott-aircraft-order as canvas textures (browser only; built once per type and
// airline, cached). The fuselage texture is mapped u = s / L (nose -> tail), v = phi / 2pi (0 the crown, 0.25 the
// starboard equator, 0.5 the belly, 0.75 the port equator). The fin texture is planar over finGeo().box (metres).
// Stout materials: cream fuselage, a board belly (United: a muted warm slate), windows a dark warm line, the tail
// mark a one-colour inkDark stamp on a cream fin, United's fin amber with its globe stamped in ink.
// ---------------------------------------------------------------------------
import { MARKS, type MarkId } from "./airlineMarks";
import { SPECS, finGeo, sectionAt, type JetType } from "./aircraftModels";

export type Airline =
  | "united"
  | "qantas"
  | "britishAirways"
  | "lufthansa"
  | "airFrance"
  | "klm"
  | "delta"
  | "american"
  | "virginAtlantic"
  | "cathay"
  | "singapore"
  | "emirates"
  | "plain";
export const AIRLINES: readonly Airline[] = ["united", "qantas", "britishAirways", "lufthansa", "airFrance", "klm", "delta", "american", "virginAtlantic", "cathay", "singapore", "emirates", "plain"];

export const PAINT = {
  cream: "#F5EEE1",
  creamFoot: "#E7DCC8",
  board: "#AD8E6F",
  slate: "#8E8B83", // United's belly: board mixed with a cool grey, inside the palette
  ink: "#2E1E14",
  window: "#4A3C31",
  cockpit: "#2F2620",
  cockpitHi: "#7C6E60",
  panel: "#D8CDBA",
  amberTop: "#FFB000",
  amberFoot: "#E38E00",
  amberHot: "#FFE7A8",
  cover: "#FBF8F0",
} as const;

const lerpN = (a: number, b: number, t: number) => a + (b - a) * t;
const mk = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};

// --- marks ------------------------------------------------------------------------------------------------------
type Fitted = { paths: { p: Path2D; ink: boolean }[]; box: { x: number; y: number; w: number; h: number } };
const markCache = new Map<string, Fitted>();
/** the mark's paths (with their SVG transforms) and its bounding box in its own units (measured by the SVG DOM) */
const markGeom = (id: MarkId): Fitted => {
  const have = markCache.get(id);
  if (have) return have;
  const m = MARKS[id];
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("width", "10");
  svg.setAttribute("height", "10");
  svg.style.position = "absolute";
  svg.style.left = "-9999px";
  const g = document.createElementNS(NS, "g");
  for (const p of m.paths) {
    const el = document.createElementNS(NS, "path");
    el.setAttribute("d", p.d);
    el.setAttribute("transform", `matrix(${p.m.join(" ")})`);
    g.appendChild(el);
  }
  svg.appendChild(g);
  document.body.appendChild(svg);
  const bb = g.getBBox();
  document.body.removeChild(svg);
  const paths = m.paths.map((p) => {
    const out = new Path2D();
    const [a, b, c, d, e, f] = p.m;
    out.addPath(new Path2D(p.d), new DOMMatrix([a, b, c, d, e, f]));
    return { p: out, ink: p.ink };
  });
  const fitted = { paths, box: id === "united" ? { x: 0, y: 0, w: 24, h: 24 } : { x: bb.x, y: bb.y, w: bb.width, h: bb.height } };
  markCache.set(id, fitted);
  return fitted;
};
/** Optical size of each mark on the fin (geometric-mean side as a fraction of the fin's height): one family. */
const MARK_SIZE: Partial<Record<Airline, number>> = {
  qantas: 0.66,
  britishAirways: 0.6,
  lufthansa: 0.5,
  airFrance: 0.95,
  klm: 0.46,
  delta: 0.5,
  american: 0.56,
  virginAtlantic: 0.5,
  cathay: 0.5,
  singapore: 0.56,
  emirates: 0.56,
};
const MARK_OF: Partial<Record<Airline, MarkId>> = {
  qantas: "qantas",
  britishAirways: "britishAirways",
  lufthansa: "lufthansa",
  airFrance: "airFranceWordmark",
  klm: "klm",
  delta: "delta",
  american: "american",
  virginAtlantic: "virginAtlantic",
  cathay: "cathay",
  singapore: "singapore",
  emirates: "emirates",
};
/**
 * Draw a mark into ctx (current transform = metres) centred at (cx, cy) with geometric-mean side `size` and at most
 * maxW x maxH; `mirror` flips it about its own centre (the starboard side of a readable mark).
 */
const drawMark = (ctx: CanvasRenderingContext2D, id: MarkId, cx: number, cy: number, size: number, maxW: number, maxH: number, ink: string, tile: string, mirror: boolean) => {
  const g = markGeom(id);
  const { w, h } = g.box;
  let sc = size / Math.sqrt(w * h);
  sc = Math.min(sc, maxW / w, maxH / h);
  ctx.save();
  ctx.translate(cx, cy);
  if (mirror) ctx.scale(-1, 1);
  ctx.scale(sc, sc);
  ctx.translate(-(g.box.x + w / 2), -(g.box.y + h / 2));
  for (const p of g.paths) {
    ctx.fillStyle = p.ink ? ink : tile;
    ctx.fill(p.p, "nonzero");
  }
  ctx.restore();
};

// --- the fin -------------------------------------------------------------------------------------------------------
export const FIN_TEX = 1024;
const finCache = new Map<string, HTMLCanvasElement>();
/** The fin's paint for one side. `starboard` mirrors a readable mark so its letters read on that side too. */
export const paintFin = (type: JetType, airline: Airline, starboard: boolean): HTMLCanvasElement => {
  const key = `${type}:${airline}:${starboard ? "s" : "p"}`;
  const have = finCache.get(key);
  if (have) return have;
  const sp = SPECS[type];
  const fg = finGeo(sp);
  const bx = fg.box;
  const cv = mk(FIN_TEX, FIN_TEX);
  const ctx = cv.getContext("2d") as CanvasRenderingContext2D;
  // metres: x = s - box.s0 to the right, y = box.y1 - height downward
  ctx.setTransform(FIN_TEX / (bx.s1 - bx.s0), 0, 0, FIN_TEX / (bx.y1 - bx.y0), 0, 0);
  const X = (s: number) => s - bx.s0;
  const Y = (y: number) => bx.y1 - y;
  const tipLE = fg.leAt(fg.yTip);
  const plan = new Path2D();
  plan.moveTo(X(fg.s0 - 2), Y(fg.yRoot - 1.5));
  plan.lineTo(X(fg.s0), Y(fg.yRoot));
  plan.lineTo(X(tipLE), Y(fg.yTip));
  plan.lineTo(X(tipLE + sp.fin.ct), Y(fg.yTip));
  plan.lineTo(X(fg.s0 + sp.fin.cr), Y(fg.yRoot));
  plan.lineTo(X(fg.s0 + sp.fin.cr + 2), Y(fg.yRoot - 1.5));
  plan.closePath();
  const united = airline === "united";
  if (united) {
    const gr = ctx.createLinearGradient(0, Y(fg.yTip), 0, Y(fg.yRoot));
    gr.addColorStop(0, PAINT.amberTop);
    gr.addColorStop(1, PAINT.amberFoot);
    ctx.fillStyle = gr;
  } else {
    const gr = ctx.createLinearGradient(0, Y(fg.yTip), 0, Y(fg.yRoot));
    gr.addColorStop(0, PAINT.cream);
    gr.addColorStop(1, PAINT.creamFoot);
    ctx.fillStyle = gr;
  }
  ctx.fillRect(0, 0, bx.s1 - bx.s0, bx.y1 - bx.y0);
  ctx.save();
  ctx.clip(plan);
  const midY = fg.yRoot + fg.hgt * 0.47;
  const cx = X(fg.leAt(midY) + fg.chordAt(midY) * 0.5);
  const cy = Y(midY);
  if (united) {
    // the globe in its tail crop: the navy field becomes amber, the globe's tiles are stamped in ink. The crop sits
    // as on United's tail: big, its lower-right corner on the fin's root trailing edge.
    const side = fg.hgt * 1.18;
    const g = markGeom("united");
    ctx.save();
    const x1 = X(fg.s0 + sp.fin.cr) + 0.2;
    const y1 = Y(fg.yRoot) + 0.2;
    ctx.translate(x1 - side, y1 - side);
    if (starboard) {
      ctx.translate(side, 0);
      ctx.scale(-1, 1);
    }
    ctx.scale(side / 24, side / 24);
    ctx.fillStyle = PAINT.ink;
    ctx.fillRect(0.02, 0.25, 23.6, 23.73);
    const gr = ctx.createLinearGradient(0, 0, 0, 24);
    gr.addColorStop(0, PAINT.amberTop);
    gr.addColorStop(1, PAINT.amberFoot);
    ctx.fillStyle = gr;
    for (const p of g.paths) ctx.fill(p.p, "nonzero");
    ctx.restore();
  } else {
    const id = MARK_OF[airline];
    if (id) {
      const size = (MARK_SIZE[airline] ?? 0.5) * fg.hgt;
      const maxW = fg.chordAt(midY) * 0.82;
      drawMark(ctx, id, cx, cy, size, maxW, fg.hgt * 0.7, PAINT.ink, PAINT.cream, starboard && MARKS[id].readable);
    }
  }
  ctx.restore();
  if (united) {
    // the hot top edge along the tip and the leading edge (the lit edges)
    ctx.strokeStyle = PAINT.amberHot;
    ctx.lineWidth = 0.16;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(X(fg.s0 + 0.05), Y(fg.yRoot + 0.6));
    ctx.lineTo(X(tipLE + 0.05), Y(fg.yTip - 0.05));
    ctx.lineTo(X(tipLE + sp.fin.ct - 0.05), Y(fg.yTip - 0.05));
    ctx.stroke();
  }
  finCache.set(key, cv);
  return cv;
};

// --- the fuselage --------------------------------------------------------------------------------------------------
export const SKIN_W = 2048;
export const SKIN_H = 1024;
const skinCache = new Map<string, HTMLCanvasElement>();
const coverCache = new Map<string, HTMLCanvasElement>();
/** phi (radians from the crown, starboard positive) of a height y above the equator at s */
const phiAt = (type: JetType, s: number, y: number) => {
  const q = sectionAt(SPECS[type], s);
  const r = y >= q.yc ? q.t : q.b;
  const c = Math.max(-1, Math.min(1, (y - q.yc) / Math.max(1e-6, r)));
  return Math.acos(c);
};
export const paintSkin = (type: JetType, airline: Airline): HTMLCanvasElement => {
  const key = `${type}:${airline}`;
  const have = skinCache.get(key);
  if (have) return have;
  const sp = SPECS[type];
  const cv = mk(SKIN_W, SKIN_H);
  const ctx = cv.getContext("2d") as CanvasRenderingContext2D;
  const U = (s: number) => (s / sp.L) * SKIN_W;
  const V = (phi: number) => (phi / (Math.PI * 2)) * SKIN_H;
  ctx.fillStyle = PAINT.cream;
  ctx.fillRect(0, 0, SKIN_W, SKIN_H);
  // the belly: below ~a third of the lower half on both sides, a crisp line
  const bellyPhi = Math.acos(-0.32);
  ctx.fillStyle = airline === "united" ? PAINT.slate : PAINT.board;
  ctx.fillRect(0, V(bellyPhi), SKIN_W, V(2 * Math.PI - bellyPhi) - V(bellyPhi));
  // a faint lighter line at the belly's edge
  ctx.fillStyle = PAINT.panel;
  ctx.fillRect(0, V(bellyPhi) - 2, SKIN_W, 2);
  ctx.fillRect(0, V(2 * Math.PI - bellyPhi), SKIN_W, 2);
  // windows (both sides) and doors, at the window line of each station
  const sides = [1, -1];
  const drawRow = (s0: number, s1: number, pitch: number, wW: number, wH: number, yFrac: number, doors: number[]) => {
    const n = Math.floor((s1 - s0) / pitch);
    for (let i = 0; i <= n; i++) {
      const s = s0 + i * pitch;
      if (doors.some((d) => Math.abs(d - s) < 0.75)) continue;
      const q = sectionAt(sp, s);
      const yw = q.yc + yFrac * (yFrac >= 0 ? q.t : q.b);
      const pA = phiAt(type, s, yw + wH / 2);
      const pB = phiAt(type, s, yw - wH / 2);
      for (const sd of sides) {
        const a = sd > 0 ? pA : 2 * Math.PI - pB;
        const b = sd > 0 ? pB : 2 * Math.PI - pA;
        const x = U(s - wW / 2);
        const w = U(s + wW / 2) - x;
        const y = V(a);
        const h = V(b) - y;
        const r = Math.min(w, h) * 0.45;
        ctx.fillStyle = PAINT.window;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        ctx.fill();
      }
    }
    for (const d of doors) {
      const q = sectionAt(sp, d);
      const yTop = q.yc + (yFrac >= 0 ? yFrac * q.t : yFrac * q.b) + 0.75;
      const yBot = yTop - 1.95;
      const a = phiAt(type, d, yTop);
      const b = phiAt(type, d, yBot);
      for (const sd of sides) {
        const pa = sd > 0 ? a : 2 * Math.PI - b;
        const pb = sd > 0 ? b : 2 * Math.PI - a;
        ctx.strokeStyle = PAINT.panel;
        ctx.lineWidth = 2.2;
        const x = U(d - 0.53);
        const w = U(d + 0.53) - x;
        ctx.beginPath();
        const y = V(pa);
        const h = V(pb) - y;
        const r = Math.min(w, h) * 0.18;
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        ctx.stroke();
        // the door's own small window
        const ywin = (yTop + yBot) / 2 + 0.35;
        const p1 = phiAt(type, d, ywin + 0.15);
        const p2 = phiAt(type, d, ywin - 0.15);
        const w1 = sd > 0 ? p1 : 2 * Math.PI - p2;
        const w2 = sd > 0 ? p2 : 2 * Math.PI - p1;
        ctx.fillStyle = PAINT.window;
        ctx.fillRect(U(d - 0.11), V(w1), U(d + 0.11) - U(d - 0.11), V(w2) - V(w1));
      }
    }
  };
  const w = sp.windows;
  drawRow(w.s0, w.s1, w.pitch, w.w, w.h, w.y, w.doors);
  if (w.upper) drawRow(w.upper.s0, w.upper.s1, w.pitch, w.w, w.h, w.upper.y, w.upper.doors);
  // the cockpit windows: per side, `panes` panes between a sill line and a head line below the local crown; the
  // front pane (the windshield) runs up over the nose to the centre post, so a head-on view shows it too
  const ck = sp.cockpit;
  const yc0 = sp.belly + sp.H / 2;
  const n = ck.panes;
  const gap = 0.11;
  const span = ck.s1 - ck.s0;
  const ySill = yc0 + ck.y0 * (sp.H / 2);
  const yHead = yc0 + ck.y1 * (sp.H / 2);
  const frontEnd = ck.s0 + span * (n === 2 ? 0.48 : 0.36);
  const paneRanges: [number, number][] = [[ck.s0, frontEnd - gap / 2]];
  for (let i = 1; i < n; i++) {
    const a0 = frontEnd + ((ck.s1 - frontEnd) * (i - 1)) / (n - 1) + gap / 2;
    const a1 = frontEnd + ((ck.s1 - frontEnd) * i) / (n - 1) - gap / 2 - (i === n - 1 ? 0.12 : 0);
    paneRanges.push([a0, a1]);
  }
  const crownS = (s: number) => {
    const q = sectionAt(sp, s);
    return q.yc + q.t;
  };
  paneRanges.forEach(([sa, sb], i) => {
    const K = 8;
    const top: [number, number][] = [];
    const bot: [number, number][] = [];
    for (let k = 0; k <= K; k++) {
      const s = lerpN(sa, sb, k / K);
      // the sill rises a little toward the nose; the head follows the crown down
      const sill = ySill + (frontEnd - s) * 0.05;
      const head = Math.min(yHead - (s - ck.s0) * 0.04, crownS(s) - 0.22);
      const pTop = i === 0 && ck.wrap !== false ? 0.05 : phiAt(type, s, Math.max(sill + 0.15, head));
      top.push([s, pTop]);
      bot.push([s, phiAt(type, s, sill)]);
    }
    for (const sd of sides) {
      ctx.beginPath();
      const pts = [...top, ...bot.reverse()];
      bot.reverse();
      pts.forEach(([s, ph], k) => {
        const p = sd > 0 ? ph : 2 * Math.PI - ph;
        if (k === 0) ctx.moveTo(U(s), V(p));
        else ctx.lineTo(U(s), V(p));
      });
      ctx.closePath();
      ctx.fillStyle = PAINT.cockpit;
      ctx.fill();
      ctx.strokeStyle = PAINT.cockpit;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  });
  // the windshield's reflection: a lighter band near its top
  ctx.fillStyle = PAINT.cockpitHi;
  ctx.globalAlpha = 0.35;
  for (const sd of sides) {
    const s0 = ck.s0 + 0.08;
    const s1 = frontEnd - gap;
    const ph = phiAt(type, (s0 + s1) / 2, ySill + 0.45);
    const p0 = sd > 0 ? 0.08 : 2 * Math.PI - ph;
    const p1 = sd > 0 ? ph : 2 * Math.PI - 0.08;
    ctx.fillRect(U(s0), V(Math.min(p0, p1)), U(s1) - U(s0), (V(Math.max(p0, p1)) - V(Math.min(p0, p1))) * 0.35);
  }
  ctx.globalAlpha = 1;
  // United: the fin's amber runs down onto the crown under the fin (it reads as United's tail from above)
  if (airline === "united") {
    const fg = finGeo(sp);
    const g = ctx.createLinearGradient(U(fg.s0 - 2), 0, U(sp.L), 0);
    g.addColorStop(0, "rgba(255,176,0,0)");
    g.addColorStop(0.12, PAINT.amberTop);
    g.addColorStop(1, PAINT.amberFoot);
    ctx.fillStyle = g;
    const w = 0.42;
    ctx.fillRect(U(fg.s0 - 2), 0, U(sp.L) - U(fg.s0 - 2), V(w));
    ctx.fillRect(U(fg.s0 - 2), V(2 * Math.PI - w), U(sp.L) - U(fg.s0 - 2), SKIN_H - V(2 * Math.PI - w));
  }
  // a few panel lines: the nose radome seam and the wing-box joint
  ctx.strokeStyle = PAINT.panel;
  ctx.lineWidth = 1.6;
  for (const s of [sp.cockpit.s0 - 0.9, sp.L * sp.wing.x0 + 1.5, sp.L * 0.86]) {
    ctx.beginPath();
    ctx.moveTo(U(s), 0);
    ctx.lineTo(U(s), SKIN_H);
    ctx.stroke();
  }
  skinCache.set(key, cv);
  return cv;
};

/** The cockpit storage covers' mask on the same uv: R = cover, G = the wipe coordinate (0 top .. 1 bottom). */
export const paintCovers = (type: JetType): HTMLCanvasElement => {
  const have = coverCache.get(type);
  if (have) return have;
  const sp = SPECS[type];
  const W = 1024;
  const H = 512;
  const cv = mk(W, H);
  const ctx = cv.getContext("2d") as CanvasRenderingContext2D;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, W, H);
  const U = (s: number) => (s / sp.L) * W;
  const V = (phi: number) => (phi / (Math.PI * 2)) * H;
  const ck = sp.cockpit;
  const yc0 = sp.belly + sp.H / 2;
  const yLo = yc0 + ck.y0 * (sp.H / 2) - 0.25;
  const sa = ck.s0 - 0.35;
  const sb = ck.s1 + 0.25;
  // a band over the crown from the lower edge on one side to the other: G runs 0 (crown) -> 1 (the lower edges)
  const steps = 24;
  for (let k = 0; k < steps; k++) {
    const t0 = k / steps;
    const t1 = (k + 1) / steps;
    for (const sd of [1, -1]) {
      const pLo = phiAt(type, (sa + sb) / 2, yLo);
      const a = t0 * pLo;
      const b = t1 * pLo;
      const g = Math.round(((t0 + t1) / 2) * 255);
      ctx.fillStyle = `rgb(255,${g},0)`;
      const y0 = sd > 0 ? V(a) : V(2 * Math.PI - b);
      const y1 = sd > 0 ? V(b) : V(2 * Math.PI - a);
      ctx.fillRect(U(sa), Math.floor(y0), U(sb) - U(sa), Math.ceil(y1 - y0) + 1);
    }
  }
  coverCache.set(type, cv);
  return cv;
};
