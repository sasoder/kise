// ---------------------------------------------------------------------------
// proofOnItsOwnChalk — the blackboard's handwriting for ProofOnItsOwn (rsi-since-writing, cut 34). Pure TS.
// A small hand-drawn stroke font for board mathematics (digits, a few letters, Greek, operators, integral, sum,
// norms, arrows; superscripts / subscripts / fractions), a line layout with handwriting jitter, and the WRITING
// SCHEDULE: every stroke on the board gets a time slot, so the chalk tip is a pure function of the frame and the
// board shows exactly the strokes the tip has already drawn (strokes drawn by the moving tip, never a typed reveal).
// Units: board units = the cast's world units (178 per metre), X along the board, Y height (up is -Y; the floor is 0).
// ---------------------------------------------------------------------------
export type P2 = [number, number];
type Glyph = { w: number; s: P2[][] };

// ---- tiny deterministic RNG (seek-safe) ------------------------------------------------------------------------------
export const hash01 = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const rnd = (seed: number, i: number) => hash01(seed * 9.137 + i * 1.731);
const sg = (seed: number, i: number) => rnd(seed, i) * 2 - 1;

// ---- the font: a glyph box with the baseline at y 0, cap top at y -1, x-height -0.6, descender +0.3 -----------------
const ell = (cx: number, cy: number, rx: number, ry: number, a0 = -Math.PI / 2, n = 10, turn = 1): P2[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = a0 - (i / n) * 2 * Math.PI * turn;
    return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)] as P2;
  });
const G: Record<string, Glyph> = {
  "0": { w: 0.46, s: [ell(0.23, -0.5, 0.21, 0.5)] },
  "1": { w: 0.3, s: [[[0.06, -0.78], [0.2, -1], [0.2, 0]]] },
  "2": { w: 0.46, s: [[[0.04, -0.8], [0.16, -0.98], [0.33, -0.97], [0.42, -0.78], [0.36, -0.52], [0.04, 0], [0.46, 0]]] },
  "3": { w: 0.44, s: [[[0.05, -0.88], [0.24, -1], [0.4, -0.86], [0.34, -0.62], [0.17, -0.55], [0.38, -0.45], [0.42, -0.18], [0.27, 0], [0.04, -0.08]]] },
  "4": { w: 0.46, s: [[[0.33, 0.02], [0.33, -1], [0.02, -0.32], [0.46, -0.32]]] },
  k: { w: 0.42, s: [[[0.06, -1], [0.06, 0]], [[0.38, -0.6], [0.08, -0.3], [0.4, 0]]] },
  a: { w: 0.46, s: [[[0.38, -0.46], [0.2, -0.6], [0.04, -0.4], [0.06, -0.08], [0.22, 0], [0.38, -0.24]], [[0.38, -0.6], [0.38, -0.08], [0.46, 0]]] },
  c: { w: 0.42, s: [[[0.38, -0.52], [0.22, -0.6], [0.05, -0.42], [0.06, -0.1], [0.22, 0], [0.4, -0.08]]] },
  d: { w: 0.46, s: [[[0.36, -0.48], [0.2, -0.6], [0.04, -0.38], [0.07, -0.06], [0.22, 0], [0.36, -0.2]], [[0.38, -1], [0.38, -0.05], [0.46, 0]]] },
  e: { w: 0.42, s: [[[0.06, -0.3], [0.38, -0.32], [0.34, -0.55], [0.18, -0.6], [0.04, -0.38], [0.08, -0.08], [0.24, 0], [0.4, -0.1]]] },
  f: { w: 0.4, s: [[[0.42, -0.92], [0.3, -1], [0.18, -0.88], [0.16, -0.2], [0.12, 0.22], [0.0, 0.3]], [[0.02, -0.58], [0.36, -0.6]]] },
  n: { w: 0.44, s: [[[0.06, -0.6], [0.06, 0]], [[0.06, -0.38], [0.2, -0.6], [0.36, -0.5], [0.38, 0]]] },
  p: { w: 0.44, s: [[[0.06, -0.6], [0.06, 0.32]], [[0.06, -0.45], [0.22, -0.62], [0.38, -0.42], [0.35, -0.1], [0.2, -0.02], [0.06, -0.12]]] },
  r: { w: 0.36, s: [[[0.06, -0.6], [0.06, 0]], [[0.06, -0.35], [0.18, -0.58], [0.34, -0.6]]] },
  s: { w: 0.4, s: [[[0.36, -0.52], [0.22, -0.6], [0.06, -0.5], [0.12, -0.34], [0.3, -0.26], [0.36, -0.1], [0.2, 0], [0.03, -0.08]]] },
  t: { w: 0.38, s: [[[0.16, -0.9], [0.16, -0.1], [0.24, 0], [0.36, -0.06]], [[0.02, -0.6], [0.34, -0.62]]] },
  u: { w: 0.46, s: [[[0.05, -0.6], [0.06, -0.15], [0.18, 0], [0.33, -0.12], [0.36, -0.6], [0.37, -0.05], [0.45, 0]]] },
  v: { w: 0.42, s: [[[0.02, -0.6], [0.2, 0], [0.4, -0.62]]] },
  x: { w: 0.42, s: [[[0.04, -0.6], [0.38, 0]], [[0.38, -0.6], [0.04, 0]]] },
  y: { w: 0.42, s: [[[0.04, -0.6], [0.2, -0.1]], [[0.4, -0.6], [0.16, 0.1], [0.06, 0.3]]] },
  i: { w: 0.18, s: [[[0.08, -0.58], [0.08, 0]], [[0.08, -0.84], [0.09, -0.8]]] },
  m: { w: 0.6, s: [[[0.05, -0.6], [0.05, 0]], [[0.05, -0.42], [0.16, -0.6], [0.28, -0.5], [0.29, 0]], [[0.29, -0.45], [0.4, -0.6], [0.52, -0.5], [0.53, 0]]] },
  h: { w: 0.44, s: [[[0.06, -1], [0.06, 0]], [[0.06, -0.38], [0.2, -0.6], [0.36, -0.5], [0.38, 0]]] },
  g: { w: 0.44, s: [[[0.36, -0.48], [0.2, -0.6], [0.05, -0.42], [0.08, -0.15], [0.24, -0.12], [0.36, -0.3]], [[0.37, -0.6], [0.36, 0.15], [0.2, 0.3], [0.04, 0.22]]] },
  z: { w: 0.42, s: [[[0.04, -0.6], [0.38, -0.6], [0.04, 0], [0.4, 0]]] },
  L: { w: 0.46, s: [[[0.06, -1], [0.06, 0], [0.42, 0]]] },
  C: { w: 0.54, s: [[[0.48, -0.86], [0.3, -1], [0.08, -0.85], [0.03, -0.45], [0.12, -0.1], [0.3, 0], [0.5, -0.12]]] },
  T: { w: 0.52, s: [[[0.0, -1], [0.5, -1]], [[0.25, -1], [0.25, 0]]] },
  H: { w: 0.52, s: [[[0.05, -1], [0.05, 0]], [[0.45, -1], [0.45, 0]], [[0.05, -0.5], [0.45, -0.5]]] },
  P: { w: 0.48, s: [[[0.06, 0], [0.06, -1], [0.3, -1], [0.44, -0.85], [0.4, -0.6], [0.22, -0.5], [0.06, -0.5]]] },
  E: { w: 0.48, s: [[[0.42, -1], [0.06, -1], [0.06, 0], [0.44, 0]], [[0.06, -0.52], [0.34, -0.52]]] },
  M: { w: 0.62, s: [[[0.04, 0], [0.08, -1], [0.3, -0.35], [0.52, -1], [0.56, 0]]] },
  "α": { w: 0.52, s: [[[0.44, -0.6], [0.36, -0.25], [0.2, 0], [0.05, -0.12], [0.06, -0.45], [0.2, -0.6], [0.34, -0.4], [0.42, -0.05], [0.5, 0]]] },
  "β": { w: 0.46, s: [[[0.06, 0.3], [0.08, -0.75], [0.22, -1], [0.38, -0.88], [0.32, -0.62], [0.16, -0.56], [0.4, -0.42], [0.38, -0.1], [0.22, 0], [0.08, -0.08]]] },
  "ε": { w: 0.4, s: [[[0.36, -0.55], [0.2, -0.6], [0.06, -0.48], [0.16, -0.32], [0.04, -0.18], [0.14, 0], [0.36, -0.06]]] },
  "δ": { w: 0.44, s: [[[0.36, -0.96], [0.2, -1], [0.12, -0.86], [0.3, -0.58], [0.4, -0.3], [0.28, 0], [0.08, -0.1], [0.06, -0.38], [0.26, -0.55]]] },
  "λ": { w: 0.46, s: [[[0.06, -1], [0.16, -0.95], [0.44, 0]], [[0.24, -0.5], [0.02, 0]]] },
  "ν": { w: 0.42, s: [[[0.04, -0.6], [0.2, 0], [0.36, -0.32], [0.38, -0.6]]] },
  "π": { w: 0.5, s: [[[0.0, -0.55], [0.48, -0.6]], [[0.14, -0.58], [0.12, 0]], [[0.34, -0.58], [0.36, -0.05], [0.44, 0]]] },
  "σ": { w: 0.52, s: [[[0.5, -0.6], [0.22, -0.6], [0.05, -0.4], [0.1, -0.06], [0.26, 0], [0.38, -0.25], [0.3, -0.55]]] },
  "φ": { w: 0.46, s: [[[0.22, -1], [0.22, 0.32]], [[0.22, -0.6], [0.04, -0.45], [0.08, -0.08], [0.22, 0], [0.4, -0.1], [0.42, -0.45], [0.22, -0.6]]] },
  "ω": { w: 0.6, s: [[[0.06, -0.55], [0.04, -0.15], [0.16, 0], [0.26, -0.2], [0.3, -0.35], [0.34, -0.2], [0.44, 0], [0.56, -0.15], [0.54, -0.55]]] },
  "θ": { w: 0.44, s: [ell(0.22, -0.5, 0.19, 0.5), [[0.05, -0.5], [0.39, -0.5]]] },
  "Δ": { w: 0.56, s: [[[0.27, -1], [0.02, 0], [0.52, 0], [0.27, -1]]] },
  "∇": { w: 0.56, s: [[[0.02, -1], [0.52, -1], [0.27, 0], [0.02, -1]]] },
  "∂": { w: 0.46, s: [[[0.1, -0.88], [0.25, -1], [0.4, -0.82], [0.38, -0.3], [0.24, 0], [0.06, -0.1], [0.08, -0.4], [0.25, -0.5], [0.38, -0.4]]] },
  "Σ": { w: 0.54, s: [[[0.48, -1], [0.04, -1], [0.3, -0.5], [0.04, 0], [0.5, 0]]] },
  "Ω": { w: 0.54, s: [[[0.04, 0], [0.18, 0], [0.08, -0.3], [0.08, -0.7], [0.26, -1], [0.44, -0.7], [0.44, -0.3], [0.34, 0], [0.5, 0]]] },
  "∫": { w: 0.4, s: [[[0.38, -1.08], [0.28, -1.18], [0.2, -1.04], [0.17, 0.08], [0.09, 0.24], [0.0, 0.14]]] },
  "∞": { w: 0.62, s: [[[0.3, -0.3], [0.15, -0.48], [0.03, -0.3], [0.15, -0.12], [0.3, -0.3], [0.45, -0.48], [0.58, -0.3], [0.45, -0.12], [0.3, -0.3]]] },
  "+": { w: 0.46, s: [[[0.04, -0.35], [0.42, -0.35]], [[0.23, -0.56], [0.23, -0.14]]] },
  "−": { w: 0.46, s: [[[0.04, -0.35], [0.42, -0.35]]] },
  "=": { w: 0.46, s: [[[0.04, -0.46], [0.42, -0.46]], [[0.04, -0.24], [0.42, -0.24]]] },
  "<": { w: 0.44, s: [[[0.4, -0.62], [0.04, -0.36], [0.4, -0.1]]] },
  ">": { w: 0.44, s: [[[0.04, -0.62], [0.4, -0.36], [0.04, -0.1]]] },
  "≤": { w: 0.46, s: [[[0.4, -0.72], [0.04, -0.48], [0.4, -0.25]], [[0.04, -0.08], [0.42, -0.08]]] },
  "≥": { w: 0.46, s: [[[0.04, -0.72], [0.4, -0.48], [0.04, -0.25]], [[0.04, -0.08], [0.42, -0.08]]] },
  "(": { w: 0.26, s: [[[0.22, -1.06], [0.06, -0.5], [0.22, 0.16]]] },
  ")": { w: 0.26, s: [[[0.04, -1.06], [0.2, -0.5], [0.04, 0.16]]] },
  "[": { w: 0.26, s: [[[0.22, -1.06], [0.06, -1.06], [0.06, 0.16], [0.22, 0.16]]] },
  "]": { w: 0.26, s: [[[0.04, -1.06], [0.2, -1.06], [0.2, 0.16], [0.04, 0.16]]] },
  "|": { w: 0.18, s: [[[0.08, -1.04], [0.08, 0.14]]] },
  "‖": { w: 0.26, s: [[[0.06, -1.04], [0.06, 0.14]], [[0.17, -1.04], [0.17, 0.14]]] },
  ",": { w: 0.18, s: [[[0.08, -0.04], [0.03, 0.16]]] },
  ".": { w: 0.16, s: [[[0.06, -0.03], [0.08, 0]]] },
  "·": { w: 0.18, s: [[[0.07, -0.37], [0.09, -0.34]]] },
  "/": { w: 0.36, s: [[[0.34, -1], [0.02, 0.1]]] },
  "×": { w: 0.42, s: [[[0.06, -0.56], [0.36, -0.16]], [[0.36, -0.56], [0.06, -0.16]]] },
  "→": { w: 0.62, s: [[[0.02, -0.35], [0.58, -0.35]], [[0.44, -0.48], [0.58, -0.35], [0.44, -0.22]]] },
  "⇒": { w: 0.66, s: [[[0.02, -0.45], [0.52, -0.45]], [[0.02, -0.25], [0.52, -0.25]], [[0.44, -0.6], [0.62, -0.35], [0.44, -0.1]]] },
  "∈": { w: 0.46, s: [[[0.42, -0.58], [0.2, -0.6], [0.05, -0.36], [0.2, -0.1], [0.42, -0.1]], [[0.06, -0.35], [0.38, -0.35]]] },
  "∀": { w: 0.52, s: [[[0.02, -1], [0.25, 0], [0.48, -1]], [[0.1, -0.52], [0.4, -0.52]]] },
  "∴": { w: 0.44, s: [[[0.2, -0.6], [0.22, -0.57]], [[0.06, -0.06], [0.08, -0.03]], [[0.34, -0.06], [0.36, -0.03]]] },
  "~": { w: 0.46, s: [[[0.03, -0.3], [0.14, -0.42], [0.3, -0.28], [0.43, -0.4]]] },
  " ": { w: 0.24, s: [] },
};
/** the glyphs this font can draw */
export const CHALK_GLYPHS = Object.keys(G);

// ---- smoothing: a Catmull-Rom pass makes the hand's curves (straight 2-point strokes stay straight) ------------------
const smooth = (pts: P2[], per = 4): P2[] => {
  if (pts.length < 3) return pts;
  const out: P2[] = [pts[0]];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 1; k <= per; k++) {
      const t = k / per;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  return out;
};

// ---- a line of board mathematics ------------------------------------------------------------------------------------
type Tok = { ch: string; sc: number; dy: number } | { frac: [Tok[], Tok[]] };
/** parse: plain glyphs; ^X / _X (or ^{..} / _{..}) super- and subscripts; \f{num}{den} a fraction */
const parse = (src: string): Tok[] => {
  const out: Tok[] = [];
  let i = 0;
  const group = (): string => {
    if (src[i] === "{") {
      let d = 1;
      let j = i + 1;
      while (j < src.length && d > 0) {
        if (src[j] === "{") d++;
        else if (src[j] === "}") d--;
        j++;
      }
      const g = src.slice(i + 1, j - 1);
      i = j;
      return g;
    }
    const g = src[i];
    i++;
    return g;
  };
  while (i < src.length) {
    const c = src[i];
    if (c === "^" || c === "_") {
      i++;
      const g = group();
      for (const ch of g) out.push({ ch, sc: 0.58, dy: c === "^" ? -0.62 : 0.2 });
    } else if (c === "\\" && src[i + 1] === "f") {
      i += 2;
      const a = group();
      const b = group();
      out.push({ frac: [parse(a), parse(b)] });
    } else {
      out.push({ ch: c, sc: 1, dy: 0 });
      i++;
    }
  }
  return out;
};

export type ChalkStroke = { pts: P2[]; len: number };
const lenOf = (p: P2[]) => {
  let s = 0;
  for (let i = 1; i < p.length; i++) s += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
  return s;
};
/** lay a line out at (x0, baseline y0), glyph height h (board units); returns strokes in board units and the width */
export const layoutLine = (src: string, x0: number, y0: number, h: number, seed: number): { strokes: ChalkStroke[]; w: number } => {
  const strokes: ChalkStroke[] = [];
  let gi = 0;
  const slant = -0.1 + 0.05 * sg(seed, 99);
  const place = (toks: Tok[], x: number, base: number, s: number): number => {
    for (const t of toks) {
      if ("frac" in t) {
        const sub = 0.62;
        // measure both halves, then the bar and the two halves centred on it
        const wa = place(t.frac[0], 0, 1e9, s * sub) - 0;
        const wb = place(t.frac[1], 0, 1e9, s * sub) - 0;
        const wf = Math.max(wa, wb) + 0.12 * h * s;
        place(t.frac[0], x + (wf - wa) / 2, base - 0.52 * h * s, s * sub);
        place(t.frac[1], x + (wf - wb) / 2, base + 0.36 * h * s, s * sub);
        if (base < 1e8) {
          const yb = base - 0.34 * h * s;
          strokes.push({ pts: [[x, yb + h * 0.02 * sg(seed, gi + 31)], [x + wf, yb]], len: wf });
        }
        x += wf + 0.1 * h * s;
        gi++;
        continue;
      }
      const g = G[t.ch] ?? G[" "];
      const sc = h * s * t.sc * (1 + 0.06 * sg(seed, gi * 3 + 1));
      const jx = 0.03 * h * sg(seed, gi * 3 + 2);
      const jy = (0.035 * sg(seed, gi * 3 + 3) + t.dy) * h * s;
      const rot = 0.05 * sg(seed, gi * 7 + 5);
      if (base < 1e8) {
        for (const st of g.s) {
          const pts = smooth(st).map(([u, w]): P2 => {
            const uu = u + slant * w; // the hand's slant
            const ux = uu * Math.cos(rot) - w * Math.sin(rot);
            const wy = uu * Math.sin(rot) + w * Math.cos(rot);
            return [x + jx + ux * sc, base + jy + wy * sc];
          });
          strokes.push({ pts, len: lenOf(pts) });
        }
      }
      x += (g.w + 0.13) * sc * (1 + 0.08 * sg(seed, gi * 5 + 4));
      gi++;
    }
    return x;
  };
  const xEnd = place(parse(src), x0, y0, 1);
  return { strokes, w: xEnd - x0 };
};

/** a freehand polyline (diagrams, the box): a little wobble along it */
export const freehand = (pts: P2[], seed: number, wob = 0.8, per = 6): ChalkStroke => {
  const sm = smooth(pts, per).map(([x, y], i): P2 => [x + wob * Math.sin(i * 0.9 + seed) * 0.6, y + wob * Math.sin(i * 1.3 + seed * 2.1)]);
  return { pts: sm, len: lenOf(sm) };
};

// ---- the board's content (decorative mathematics: a PDE regularity proof, Navier-Stokes flavoured) -------------------
export const LINE_POOL = [
  "∂_tu+u·∇u",
  "=νΔu−∇p",
  "∇·u=0",
  "‖u‖≤Cε",
  "∫|∇u|^2",
  "λ_1>0",
  "u∈H^1",
  "⇒ε→0",
  "Σa_n^2<∞",
  "∂_tE≤0",
  "E(t)≤E_0",
  "δ<ε/2",
  "f∈L^2",
  "∀t>0",
  "|ω|≤M",
  "\\f{dE}{dt}≤0",
  "Lemma 3.",
  "Pf.",
  "≤C‖f‖",
  "=∫u·v",
  "ω=∇×u",
  "‖ω‖_∞<∞",
  "≤ε^2/4",
  "u_n→u",
  "φ∈C^∞",
  "e^{−λt}",
  "k≥1",
  "p>\\f{3}{2}",
  "≤2^{−k}",
  "Σ_k≤Cδ",
  "t∈[0,T]",
  "∴E_k≤E",
  "≤\\f{C}{ν}‖u‖",
  "Lemma 4.",
  "Thm.",
  "‖∇u‖^2",
  "+ν‖Δu‖",
  "≤Cλ^{−1}",
];

export type Item = { strokes: ChalkStroke[] };
export type Column = { x: number; t0: number; T: number; items: Item[]; kind: "lines" | "diagram" };

/** the four rows' baselines (world Y): sized and placed for the robot's reach (rsi-ten-earths/tenEarthsBot, 240
 *  tall, standing on the 110-unit dais: robot-relative baselines -150 / -126 / -102 / -78, below its head) */
export const ROW_Y = [-260, -236, -212, -188];
export const GLYPH_H = 14;
/** the diagrams' size against the old (Genius-sized) board writing */
const DS = 0.6;

/** fill a column (x = its left edge) with four rows of lines, or a diagram over rows 1-2 and two lines */
export const makeColumn = (x: number, seed: number, kind: "lines" | "diagram", width = 62, rows = [0, 1, 2, 3]): Item[] => {
  const items: Item[] = [];
  const pick = (k: number) => LINE_POOL[Math.floor(rnd(seed, k) * LINE_POOL.length) % LINE_POOL.length];
  let startRow = 0;
  if (kind === "diagram") {
    const top = ROW_Y[0] - GLYPH_H * 0.85;
    const bot = ROW_Y[1] + 3;
    const which = Math.floor(rnd(seed, 50) * 3);
    if (which === 0) {
      // a graph: axes, a decaying curve, a dashed level
      const ax = freehand([[x + 4 * DS, top], [x + 4 * DS, bot], [x + width - 4 * DS, bot]], seed, 0.4, 2);
      const cv = freehand(
        Array.from({ length: 7 }, (_, i): P2 => {
          const u = i / 6;
          return [x + 8 * DS + u * (width - 16 * DS), bot - (bot - top) * (0.15 + 0.78 * Math.exp(-3.2 * u))];
        }),
        seed + 1,
        0.3,
        3,
      );
      items.push({ strokes: [ax, cv] });
      items.push(layoutLine("t", x + width - 6 * DS, bot + 9 * DS, GLYPH_H * 0.8, seed + 2));
    } else if (which === 1) {
      // a domain Ω with its boundary normal
      const cx = x + width * 0.45;
      const cy = (top + bot) / 2;
      const loop = freehand(
        Array.from({ length: 9 }, (_, i): P2 => {
          const a = (i / 8) * 2 * Math.PI;
          const rr = 1 + 0.16 * Math.sin(3 * a + seed);
          return [cx + Math.cos(a) * 25 * DS * rr, cy + Math.sin(a) * 19 * DS * rr];
        }),
        seed,
        0.3,
        3,
      );
      items.push({ strokes: [loop] });
      items.push(layoutLine("Ω", cx - 6 * DS, cy + 6 * DS, GLYPH_H * 0.85, seed + 3));
      const nx = cx + 27 * DS;
      const d = (v: number) => v * DS;
      items.push({ strokes: [freehand([[nx, cy - d(6)], [nx + d(18), cy - d(13)]], seed + 4, 0.2, 1), freehand([[nx + d(12), cy - d(17)], [nx + d(18), cy - d(13)], [nx + d(11), cy - d(8)]], seed + 5, 0.1, 1)] });
    } else {
      // a vortex: a circle and three tangent arrows
      const cx = x + width * 0.42;
      const cy = (top + bot) / 2;
      items.push({ strokes: [freehand(Array.from({ length: 9 }, (_, i): P2 => [cx + 22 * DS * Math.cos((i / 8) * 2 * Math.PI), cy + 20 * DS * Math.sin((i / 8) * 2 * Math.PI)]), seed, 0.3, 3)] });
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * 2 * Math.PI + 0.4;
        const px = cx + 22 * DS * Math.cos(a);
        const py = cy + 20 * DS * Math.sin(a);
        const tx = -Math.sin(a);
        const ty = Math.cos(a);
        items.push({ strokes: [freehand([[px - (tx * 7 + Math.cos(a) * 4) * DS, py - (ty * 7 + Math.sin(a) * 4) * DS], [px + tx * 3 * DS, py + ty * 3 * DS]], seed + k, 0.1, 1)] });
      }
      items.push(layoutLine("ω", x + width - 12 * DS, cy + 4 * DS, GLYPH_H * 0.8, seed + 7));
    }
    startRow = 2;
  }
  for (const r of rows) {
    if (r < startRow) continue;
    let src = pick(r + 1);
    let out = layoutLine(src, x + 1.5 * sg(seed, r + 20), ROW_Y[r] + 1.5 * sg(seed, r + 40), GLYPH_H, seed * 13 + r);
    // keep inside the column width: try another line, else shrink it
    for (let tries = 0; tries < 6 && out.w > width; tries++) {
      src = pick(r + 1 + 17 * (tries + 1));
      out = layoutLine(src, x + 1.5 * sg(seed, r + 20), ROW_Y[r] + 1.5 * sg(seed, r + 40), GLYPH_H, seed * 13 + r);
    }
    if (out.w > width) out = layoutLine(src, x + 1.5 * sg(seed, r + 20), ROW_Y[r] + 1.5 * sg(seed, r + 40), (GLYPH_H * width) / out.w, seed * 13 + r);
    items.push({ strokes: out.strokes });
  }
  return items;
};

// ---- the writing schedule ---------------------------------------------------------------------------------------------
export type Job = { t0: number; T: number; strokes: ChalkStroke[]; color: "cream" | "orange"; ends: number[]; starts: number[] };
/** time slots for a job's strokes: drawn length at 1, pen-up hops at LIFT (cheaper) */
const LIFT = 0.7;
export const makeJob = (t0: number, T: number, items: Item[], color: "cream" | "orange" = "cream"): Job => {
  const strokes = items.flatMap((it) => it.strokes).filter((s) => s.pts.length > 1);
  let cost = 0;
  const costs: [number, number][] = [];
  for (let i = 0; i < strokes.length; i++) {
    if (i > 0) {
      const a = strokes[i - 1].pts[strokes[i - 1].pts.length - 1];
      const b = strokes[i].pts[0];
      cost += LIFT * Math.hypot(b[0] - a[0], b[1] - a[1]);
    }
    const c0 = cost;
    cost += Math.max(1.2, strokes[i].len);
    costs.push([c0, cost]);
  }
  const k = T / Math.max(1e-6, cost);
  return { t0, T, strokes, color, starts: costs.map((c) => t0 + c[0] * k), ends: costs.map((c) => t0 + c[1] * k) };
};
/** the point at fraction u of a polyline, and the polyline prefix up to it */
export const along = (pts: P2[], u: number): { p: P2; prefix: P2[] } => {
  const L = lenOf(pts);
  let want = Math.max(0, Math.min(1, u)) * L;
  const prefix: P2[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (want <= d) {
      const f = d > 0 ? want / d : 0;
      const p: P2 = [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f];
      prefix.push(p);
      return { p, prefix };
    }
    want -= d;
    prefix.push(pts[i]);
  }
  return { p: pts[pts.length - 1], prefix };
};
/** the tip inside a job at time t (null outside it): on a stroke (drawing) or between two (a pen-up hop) */
export const tipInJob = (j: Job, t: number): { p: P2; drawing: boolean } | null => {
  if (t < j.t0 || t > j.t0 + j.T || !j.strokes.length) return null;
  for (let i = 0; i < j.strokes.length; i++) {
    if (t < j.starts[i]) {
      const a = j.strokes[i - 1].pts[j.strokes[i - 1].pts.length - 1];
      const b = j.strokes[i].pts[0];
      const f = (t - j.ends[i - 1]) / Math.max(1e-6, j.starts[i] - j.ends[i - 1]);
      return { p: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], drawing: false };
    }
    if (t <= j.ends[i]) return { p: along(j.strokes[i].pts, (t - j.starts[i]) / Math.max(1e-6, j.ends[i] - j.starts[i])).p, drawing: true };
  }
  const s = j.strokes[j.strokes.length - 1].pts;
  return { p: s[s.length - 1], drawing: false };
};
export const pathD = (pts: P2[]) => (pts.length < 2 ? "" : `M${pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join("L")}`);
