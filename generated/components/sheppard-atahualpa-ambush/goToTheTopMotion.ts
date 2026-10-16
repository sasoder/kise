import {Easing} from 'remotion';

// ---------------------------------------------------------------------------
// GoToTheTop: geometry and timeline (pure functions, deterministic: every
// irregularity comes from `hash`, never Math.random). The component
// (GoToTheTop.tsx) only draws what this module computes. See the component's
// header for the gestures, the words and the DURATION derivation.
//
// Coordinates are SHEET px: the paper's top-left is (0, 0), the paper is
// 820 x 1160. The baked texture (public/playbook/playbook-sheet.png) carries a
// 36 px pad for the contact shadow, so the SVG viewBox starts at (-36, -36).
// On screen the sheet is centred on (540, 960) and turned ROT_DEG; at rest a
// sheet point (x, y) sits near screen (x + 130, y + 380).
// ---------------------------------------------------------------------------

export const FPS = 24;
// round(5.04 * 24) = 121 frames of line + a 48-frame static hold = 169.
export const LINE_FRAMES = 121;
export const HOLD_FRAMES = 48;
export const DURATION = LINE_FRAMES + HOLD_FRAMES;

export const SHEET_W = 820;
export const SHEET_H = 1160;
export const PAD = 36;
export const TEX_W = SHEET_W + 2 * PAD; // 892
export const TEX_H = SHEET_H + 2 * PAD; // 1232
export const FRAME_W = 1080;
export const FRAME_H = 1920;
export const TEX_LEFT = FRAME_W / 2 - TEX_W / 2; // 94
export const TEX_TOP = FRAME_H / 2 - TEX_H / 2; // 344
export const ROT_DEG = -1.5;

// Word onsets (SRT, in-point 82.06 s, frame = round((t - 82.06) * 24)).
export const BEATS = {
	go: 0,
	top: 10,
	seize: 23,
	whoever: 30,
	very: 48,
	pinnacle: 53,
	social: 71,
	hierarchy: 77,
	you: 91,
	control: 93,
	entire: 106,
	structure: 112,
	structureEnds: 120,
} as const;

// ------------------------------------------------------------------ helpers --
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const hash = (n: number) => {
	const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
	return s - Math.floor(s);
};
const smooth = (t: number) => t * t * (3 - 2 * t);
/** Smooth 1D value noise in [-1, 1]. */
const noise1 = (x: number, seed: number) => {
	const i = Math.floor(x);
	const f = x - i;
	const a = hash(i * 1.37 + seed * 101.3);
	const b = hash((i + 1) * 1.37 + seed * 101.3);
	return (a + (b - a) * smooth(f)) * 2 - 1;
};
/** Map frame -> [0, 1] over [f0, f1] with an easing, clamped. */
export const ramp = (
	frame: number,
	f0: number,
	f1: number,
	ease: (t: number) => number = (t) => t,
) => ease(clamp01((frame - f0) / (f1 - f0)));

// Eases. HOUSE: the house entrance (slide up + fade, nothing pops). PEN: a
// hand stroke: accelerates, then a long controlled landing. LOOP: the lasso,
// even ease-in-out round the figure. SOAK: ink spreading into paper.
export const HOUSE = Easing.bezier(0.16, 1, 0.3, 1);
export const PEN = Easing.bezier(0.4, 0, 0.2, 1);
export const LOOP = Easing.bezier(0.45, 0, 0.55, 1);
export const SOAK = Easing.bezier(0.2, 0.6, 0.35, 1);

// ------------------------------------------------------------- the sheet in --
export const ENTER: [number, number] = [0, 11];
export const RISE = 24;
export const sheetIn = (frame: number) => ({
	opacity: ramp(frame, ENTER[0], ENTER[1], HOUSE),
	dy: RISE * (1 - ramp(frame, ENTER[0], ENTER[1], HOUSE)),
});

// ----------------------------------------------------------------- the tree --
// One engraved figure (unit = 1 px at scale 1): a head in the llautu over a
// tunic; crown at y -15.9, base at +16, about 20 wide. The body pivots about
// its base centre; the head sits on the neck joint at (0, -2.8).
export const FIG_CROWN = -15.9;
export const FIG_BASE = 16;
export const NECK_JOINT = -2.8;
export const SAPA_SCALE = 1.4;

// Tier sizes: 1 (the Sapa Inca) and 4 (the lords of the four suyus) are real;
// 8 / 12 / 16 / 20 below are schematic (a chain of office, not a census).
export const TIER_N = [1, 4, 8, 12, 16, 20];
export const TIER_Y = [236, 392, 520, 648, 776, 904];
export const TREE_CX = 440;
// Straight flanks: tier k's half-span = slope * (y_k - apex y); the base row
// is 20 figures at a 30.5 px pitch.
const BASE_HALF = (30.5 * (20 - 1)) / 2;
const FLANK = BASE_HALF / (TIER_Y[5] - TIER_Y[0]);

type P = [number, number];

export type Fig = {
	id: number;
	tier: number;
	x: number;
	y: number;
	s: number; // drawing scale
	parent: number; // -1 for the apex
	// Hand-cut, not stamped: hashed per instance.
	hs: number; // head scale, +-5%
	sw: number; // shoulder (tunic) width, +-5%
	sh: number; // tunic height, +-3%
	lean: number; // degrees, about the base centre
	tilt: number; // head tilt, degrees
	dx: number;
	dy: number;
	crown: P; // sheet px, where the line from the superior arrives
	base: P; // sheet px, where the lines to the inferiors leave
	chest: P; // sheet px, centre of the tunic
};

const DEG = Math.PI / 180;
/** Neck joint after the tunic's height scale (the head rides on it). */
export const neckJointY = (sh: number) => FIG_BASE + (NECK_JOINT - FIG_BASE) * sh;
const rot = ([x, y]: P, deg: number, cx = 0, cy = 0): P => {
	const c = Math.cos(deg * DEG);
	const s = Math.sin(deg * DEG);
	return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c];
};
/** Figure units -> sheet px: lean about the base centre, scale, place. */
const toSheet = (f: Fig, p: P): P => {
	const q = rot(p, f.lean, 0, FIG_BASE);
	return [f.x + f.dx + q[0] * f.s, f.y + f.dy + q[1] * f.s];
};
/** Head units -> figure units: onto the neck joint, scaled and tilted. */
const headToFig = (f: Fig, p: P): P => {
	const q = rot([p[0] * f.hs, (p[1] - NECK_JOINT) * f.hs], f.tilt);
	return [q[0], neckJointY(f.sh) + q[1]];
};
const jit = (id: number, k: number) => hash(id * 7.31 + k * 13.17) * 2 - 1;

const buildFigs = (): Fig[] => {
	const out: Fig[] = [];
	const tierIds: number[][] = [];
	for (let k = 0; k < TIER_N.length; k++) {
		const n = TIER_N[k];
		const half = FLANK * (TIER_Y[k] - TIER_Y[0]);
		const ids: number[] = [];
		for (let j = 0; j < n; j++) {
			const u = n === 1 ? 0.5 : j / (n - 1);
			let parent = -1;
			if (k > 0) {
				// Nearest parent by relative position along the tier: a balanced,
				// mirror-symmetric tree (every parent gets 1-4 children).
				const prev = tierIds[k - 1];
				const m = prev.length;
				let best = 0;
				let bestD = Infinity;
				for (let i = 0; i < m; i++) {
					const v = m === 1 ? 0.5 : i / (m - 1);
					const dd = Math.abs(u - v) + (u < 0.5 ? 1e-9 * i : -1e-9 * i);
					if (dd < bestD) {
						bestD = dd;
						best = i;
					}
				}
				parent = prev[best];
			}
			const id = out.length;
			const apex = k === 0;
			const f: Fig = {
				id,
				tier: k,
				x: TREE_CX - half + 2 * half * u,
				y: TIER_Y[k],
				s: apex ? SAPA_SCALE : 1,
				parent,
				hs: apex ? 1 : 1 + 0.05 * jit(id, 1),
				sw: apex ? 1 : 1 + 0.05 * jit(id, 2),
				sh: apex ? 1 : 1 + 0.03 * jit(id, 3),
				lean: apex ? 0.6 : 1.8 * jit(id, 4),
				tilt: apex ? -1.5 : 2.5 * jit(id, 5),
				dx: apex ? 0 : 0.5 * jit(id, 6),
				dy: apex ? 0 : 0.4 * jit(id, 7),
				crown: [0, 0],
				base: [0, 0],
				chest: [0, 0],
			};
			f.crown = toSheet(f, headToFig(f, [0, FIG_CROWN]));
			f.base = toSheet(f, [0, FIG_BASE]);
			f.chest = toSheet(f, [0, 3]);
			out.push(f);
			ids.push(id);
		}
		tierIds.push(ids);
	}
	return out;
};

export const FIGS: Fig[] = buildFigs();
export const APEX = FIGS[0];

// A lineage line: an S-curve (vertical tangents) from the parent's base to
// the child's crown.
export type Line = {
	child: number;
	parent: number;
	d: string;
	len: number;
	t0: number; // ink leaves the parent's base
	t1: number; // ink reaches the child's crown
};

const cubic = (p0: P, p1: P, p2: P, p3: P, t: number): P => {
	const u = 1 - t;
	const a = u * u * u;
	const b = 3 * u * u * t;
	const c = 3 * u * t * t;
	const e = t * t * t;
	return [
		a * p0[0] + b * p1[0] + c * p2[0] + e * p3[0],
		a * p0[1] + b * p1[1] + c * p2[1] + e * p3[1],
	];
};
const f2 = (v: number) => v.toFixed(2);

const lineGeom = (parent: Fig, child: Fig) => {
	const p0: P = parent.base;
	const p3: P = child.crown;
	const k = 0.5 * (p3[1] - p0[1]);
	const p1: P = [p0[0], p0[1] + k];
	const p2: P = [p3[0], p3[1] - k];
	let len = 0;
	let prev = p0;
	for (let i = 1; i <= 48; i++) {
		const q = cubic(p0, p1, p2, p3, i / 48);
		len += Math.hypot(q[0] - prev[0], q[1] - prev[1]);
		prev = q;
	}
	const d = `M${f2(p0[0])} ${f2(p0[1])}C${f2(p1[0])} ${f2(p1[1])} ${f2(p2[0])} ${f2(p2[1])} ${f2(p3[0])} ${f2(p3[1])}`;
	return {d, len};
};

// ------------------------------------------------------------------- the pen --
// One pen, house deep orange: the X (printed with the sheet), the route up the
// left flank, the arrowhead, the lasso. Nib width PEN_W, +-8% wander.
export const PEN_W = 7.4;

export type PenSample = {x: number; y: number; s: number; nx: number; ny: number; w: number};

const resample = (pts: P[], step: number): {pts: P[]; s: number[]} => {
	const cum: number[] = [0];
	for (let i = 1; i < pts.length; i++) {
		cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
	}
	const total = cum[cum.length - 1];
	const n = Math.max(2, Math.ceil(total / step) + 1);
	const out: P[] = [];
	const ss: number[] = [];
	let j = 0;
	for (let i = 0; i < n; i++) {
		const s = (total * i) / (n - 1);
		while (j < cum.length - 2 && cum[j + 1] < s) {
			j++;
		}
		const seg = cum[j + 1] - cum[j] || 1;
		const t = (s - cum[j]) / seg;
		out.push([
			pts[j][0] + (pts[j + 1][0] - pts[j][0]) * t,
			pts[j][1] + (pts[j + 1][1] - pts[j][1]) * t,
		]);
		ss.push(s);
	}
	return {pts: out, s: ss};
};

const withNormals = (
	pts: P[],
	ss: number[],
	width: (s: number, total: number) => number,
): PenSample[] => {
	const total = ss[ss.length - 1];
	return pts.map((p, i) => {
		const a = pts[Math.max(0, i - 1)];
		const b = pts[Math.min(pts.length - 1, i + 1)];
		const tx = b[0] - a[0];
		const ty = b[1] - a[1];
		const tl = Math.hypot(tx, ty) || 1;
		return {
			x: p[0],
			y: p[1],
			s: ss[i],
			nx: -ty / tl,
			ny: tx / tl,
			w: width(ss[i], total),
		};
	});
};

/** Nib wander: slow + fast value noise, about +-8%. */
const wander = (s: number, seed: number) =>
	1 + 0.06 * noise1(s / 52, seed) + 0.03 * noise1(s / 14, seed + 7);

// The X: lower left of the sheet, outside the tree.
export const XMARK: P = [92, 1004];

// The lasso round the Sapa Inca: a hand-drawn ellipse (leaning, wobbling),
// clockwise from its left point, one turn plus an overshoot that comes back
// ~3 px inside its start, so it never retraces.
export const LASSO = {
	cx: APEX.x + 1,
	cy: APEX.y + 1,
	rx: 45,
	ry: 53,
	tilt: (-16 * Math.PI) / 180,
	over: 1.0, // ~57 degrees past the start, so the tail ends clear of the arrowhead
	spiral: 0.115, // per turn: the closing pass runs ~5-7 px inside the first
};
const TWO_PI = Math.PI * 2;
const lassoPoint = (th: number): P => {
	const k = (th - Math.PI) / TWO_PI;
	// A hand's oval: leaning, a little egg-shaped and uneven, never a circle.
	const rho =
		(1 +
			0.055 * Math.sin(2 * th + 0.7) +
			0.035 * Math.sin(3 * th + 2.1) +
			0.015 * Math.sin(5 * th + 1.0)) *
		(1 - LASSO.spiral * k);
	const ex = LASSO.rx * Math.cos(th) * rho;
	const ey = LASSO.ry * Math.sin(th) * rho;
	const c = Math.cos(LASSO.tilt);
	const s = Math.sin(LASSO.tilt);
	return [LASSO.cx + ex * c - ey * s, LASSO.cy + ex * s + ey * c];
};
export const LASSO_START = lassoPoint(Math.PI);

// The route: one Hermite curve from the X up and round the left flank to the
// lasso's start, arriving level (pointing at the Sapa Inca).
const ROUTE_KEYS: {p: P; t: P}[] = [
	{p: [XMARK[0] + 1, XMARK[1] - 16], t: [-20, -170]},
	{p: [68, 790], t: [10, -230]},
	{p: [150, 470], t: [150, -210]},
	{p: LASSO_START, t: [250, 0]},
];
const hermite = (a: {p: P; t: P}, b: {p: P; t: P}, u: number): P => {
	const u2 = u * u;
	const u3 = u2 * u;
	const h00 = 2 * u3 - 3 * u2 + 1;
	const h10 = u3 - 2 * u2 + u;
	const h01 = -2 * u3 + 3 * u2;
	const h11 = u3 - u2;
	return [
		h00 * a.p[0] + h10 * a.t[0] + h01 * b.p[0] + h11 * b.t[0],
		h00 * a.p[1] + h10 * a.t[1] + h01 * b.p[1] + h11 * b.t[1],
	];
};

const buildRoute = (): PenSample[] => {
	const raw: P[] = [];
	for (let k = 0; k < ROUTE_KEYS.length - 1; k++) {
		for (let i = 0; i < 240; i++) {
			raw.push(hermite(ROUTE_KEYS[k], ROUTE_KEYS[k + 1], i / 240));
		}
	}
	raw.push(ROUTE_KEYS[ROUTE_KEYS.length - 1].p);
	const {pts, s} = resample(raw, 1.5);
	// Touch-down: a small pressure swell at the X; a firmer landing at the top.
	return withNormals(pts, s, (sv, total) => {
		const touch = 1 + 0.14 * Math.exp(-sv / 6);
		const land = 1 + 0.06 * clamp01((sv - (total - 60)) / 60);
		return PEN_W * wander(sv, 3) * touch * land;
	});
};

export const LASSO_TAIL = 26; // px of dry-brush tail at the lasso's end
const buildLasso = (): PenSample[] => {
	const raw: P[] = [];
	const th1 = Math.PI + TWO_PI + LASSO.over;
	for (let i = 0; i <= 1400; i++) {
		raw.push(lassoPoint(Math.PI + ((th1 - Math.PI) * i) / 1400));
	}
	const {pts, s} = resample(raw, 1.5);
	return withNormals(pts, s, (sv, total) => {
		const press = 0.84 + 0.16 * clamp01(sv / 12);
		// The body tapers out over the first 14 px of the tail; streaks carry on.
		const tail = 1 - smooth(clamp01((sv - (total - LASSO_TAIL)) / 14));
		return PEN_W * 0.96 * wander(sv, 11) * press * tail;
	});
};

export const ROUTE: PenSample[] = buildRoute();
export const LASSO_PATH: PenSample[] = buildLasso();
export const ROUTE_LEN = ROUTE[ROUTE.length - 1].s;
export const LASSO_LEN = LASSO_PATH[LASSO_PATH.length - 1].s;

// Arc length at which the lasso passes its own start again (the closure).
const closureLen = (() => {
	let best = 0;
	let bestD = Infinity;
	for (const q of LASSO_PATH) {
		if (q.s < LASSO_LEN * 0.6) {
			continue;
		}
		const dd = Math.hypot(q.x - LASSO_START[0], q.y - LASSO_START[1]);
		if (dd < bestD) {
			bestD = dd;
			best = q.s;
		}
	}
	return best;
})();

// Pen timeline (frames).
export const ROUTE_T: [number, number] = [3, 15.5]; // "go to the top" (top f10)
export const BARB_T: [number, number][] = [
	[15.5, 17],
	[16.5, 18],
]; // the arrowhead, just after "top"
export const LASSO_T: [number, number] = [24, 53]; // "seize ... very pinnacle" (f23-f53)

export const routeHead = (frame: number) => ROUTE_LEN * ramp(frame, ROUTE_T[0], ROUTE_T[1], PEN);
export const lassoHead = (frame: number) => LASSO_LEN * ramp(frame, LASSO_T[0], LASSO_T[1], LOOP);

/** Frame at which the lasso closes (passes its start): the seizure. */
export const CLOSURE_F = (() => {
	let lo = LASSO_T[0];
	let hi = LASSO_T[1];
	for (let i = 0; i < 40; i++) {
		const mid = (lo + hi) / 2;
		if (lassoHead(mid) < closureLen) {
			lo = mid;
		} else {
			hi = mid;
		}
	}
	return (lo + hi) / 2;
})();

// The arrowhead: two short tapered barbs from the route's tip, +-32 degrees
// off the reversed arrival direction.
export const BARB_LEN = 17;
const routeEnd = ROUTE[ROUTE.length - 1];
const routePrev = ROUTE[ROUTE.length - 9];
const arriveAng = Math.atan2(routeEnd.y - routePrev.y, routeEnd.x - routePrev.x);
const buildBarb = (side: number): PenSample[] => {
	const a = arriveAng + Math.PI + (side * 32 * Math.PI) / 180;
	const raw: P[] = [];
	for (let i = 0; i <= 24; i++) {
		const t = i / 24;
		// A hair of curl so it reads hand-drawn, not ruled.
		const bend = side * 1.4 * Math.sin(Math.PI * t);
		raw.push([
			routeEnd.x + Math.cos(a) * BARB_LEN * t - Math.sin(a) * bend,
			routeEnd.y + Math.sin(a) * BARB_LEN * t + Math.cos(a) * bend,
		]);
	}
	const {pts, s} = resample(raw, 1);
	return withNormals(pts, s, (sv, total) => PEN_W * (0.82 - 0.5 * (sv / total)));
};
export const BARBS: PenSample[][] = [buildBarb(1), buildBarb(-1)];
export const barbHead = (frame: number, i: number) =>
	BARB_LEN * ramp(frame, BARB_T[i][0], BARB_T[i][1], PEN);

// The X: two tapered strokes, a little uneven (present from f0).
const buildXStroke = (ang: number, len: number, seed: number): PenSample[] => {
	const raw: P[] = [];
	const ca = Math.cos(ang);
	const sa = Math.sin(ang);
	for (let i = 0; i <= 30; i++) {
		const t = i / 30 - 0.5;
		const bow = 0.9 * Math.sin(Math.PI * (t + 0.5)) * (seed > 1 ? -1 : 1);
		raw.push([XMARK[0] + ca * len * t - sa * bow, XMARK[1] + sa * len * t + ca * bow]);
	}
	const {pts, s} = resample(raw, 1);
	return withNormals(pts, s, (sv, total) => {
		const u = sv / total;
		return PEN_W * 0.78 * (0.72 + 0.4 * Math.sin(Math.PI * Math.min(1, u * 1.15))) * wander(sv, seed);
	});
};
export const XSTROKES: PenSample[][] = [
	buildXStroke((44 * Math.PI) / 180, 27, 1),
	buildXStroke((-47 * Math.PI) / 180, 25, 2),
];

// Dry-brush streaks at the lasso's end: four bristle lines across the nib,
// each running out at its own (hashed) length.
export type Streak = {offset: number; len: number; w: number};
export const STREAKS: Streak[] = [-0.36, -0.12, 0.12, 0.36].map((o, k) => ({
	offset: o,
	len: LASSO_TAIL * (0.5 + 0.5 * hash(k * 7.1 + 3)),
	w: 0.2 + 0.06 * hash(k * 3.3 + 1),
}));
const NIB = PEN_W * 0.96;
/** Streak centrelines, carrying the lasso's own arc length so one head drives all. */
export const STREAK_PATHS: PenSample[][] = STREAKS.map((st) => {
	const s0 = LASSO_LEN - LASSO_TAIL + 2;
	const s1 = s0 + st.len;
	return LASSO_PATH.filter((q) => q.s >= s0 && q.s <= s1).map((q) => {
		const u = (q.s - s0) / (s1 - s0);
		return {
			x: q.x + q.nx * st.offset * NIB,
			y: q.y + q.ny * st.offset * NIB,
			s: q.s,
			nx: q.nx,
			ny: q.ny,
			w: NIB * st.w * (1 - 0.65 * u),
		};
	});
});

// ---------------------------------------------------------------- the flow --
// The ink runs DOWN the tree from the seized apex from f66, just before
// "social" (f71): one long first run reaches the four lords ~f80, then it
// cascades tier by tier, faster as it goes, each line starting PASS frames
// after its parent's crown is reached plus a hashed per-branch delay, and the
// last figure finishes its 6-frame soak on "structure" (f112-f114). Times are
// solved at module load: the hop-1 speed puts the lords' mean arrival on
// FLOW_LORDS; one shared speed factor for hops 2-5 (bisection) puts the latest
// crown on FLOW_LAST.
export const FLOW_START = 66; // just before "social" (f71)
export const FLOW_LORDS = 80;
export const SOAK_FRAMES = 6;
export const SAPA_SOAK_FRAMES = 8;
export const FLOW_LAST = 108; // + SOAK_FRAMES = 114, the hold begins
const PASS = 2;
const HOP_SPEED = [0, 23, 26, 29, 31]; // px/frame, hops 2-5 (hop 1 solved)
const JITTER = 1; // frames, +-, per line (hashed)

const buildLines = (): Line[] => {
	const lines: Line[] = [];
	for (const f of FIGS) {
		if (f.parent >= 0) {
			const g = lineGeom(FIGS[f.parent], f);
			lines.push({child: f.id, parent: f.parent, d: g.d, len: g.len, t0: 0, t1: 0});
		}
	}
	const lordLines = lines.filter((l) => l.parent === 0);
	const meanLord = lordLines.reduce((a, l) => a + l.len, 0) / lordLines.length;
	const lineJit = (l: Line) => (hash(l.child * 5.17 + 0.3) * 2 - 1) * JITTER;
	const v1 = meanLord / (FLOW_LORDS - FLOW_START);

	const solve = (m: number) => {
		const arrive: number[] = FIGS.map(() => 0);
		let latest = 0;
		for (const l of lines) {
			// FIGS (and so lines) are in tier order: a parent is always solved first.
			const tier = FIGS[l.child].tier;
			if (tier === 1) {
				l.t0 = FLOW_START + 0.45 * Math.abs(lineJit(l));
				l.t1 = l.t0 + l.len / v1;
			} else {
				l.t0 = arrive[l.parent] + PASS + lineJit(l);
				l.t1 = l.t0 + l.len / (HOP_SPEED[tier - 1] * m);
			}
			arrive[l.child] = l.t1;
			latest = Math.max(latest, l.t1);
		}
		return latest;
	};
	let lo = 0.3;
	let hi = 4;
	for (let i = 0; i < 50; i++) {
		const mid = (lo + hi) / 2;
		if (solve(mid) > FLOW_LAST) {
			lo = mid;
		} else {
			hi = mid;
		}
	}
	solve(hi);
	return lines;
};

export const LINES: Line[] = buildLines();

/** Frame the ink reaches each figure (the apex: the lasso's closure). */
export const ARRIVE: number[] = (() => {
	const a = FIGS.map(() => 0);
	a[0] = CLOSURE_F;
	for (const l of LINES) {
		a[l.child] = l.t1;
	}
	return a;
})();

export const soakOf = (frame: number, id: number) =>
	ramp(frame, ARRIVE[id], ARRIVE[id] + (id === 0 ? SAPA_SOAK_FRAMES : SOAK_FRAMES), SOAK);

/** How far the ink front has run along a line, as a fraction (time t). */
export const lineFront = (l: Line, t: number) => {
	const u = clamp01((t - l.t0) / (l.t1 - l.t0));
	// Mostly linear (running ink), a touch of ease so it never starts hard.
	return 0.7 * u + 0.3 * smooth(u);
};

// The front is a short, brighter run of fresh ink that settles to the deep
// tone over BRIGHT_FRAMES behind it.
export const BRIGHT_FRAMES = 3;
