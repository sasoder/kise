import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {
	ARRIVE,
	BARBS,
	BRIGHT_FRAMES,
	DURATION,
	FIGS,
	FIG_BASE,
	FPS,
	type Fig,
	LASSO_PATH,
	LASSO_TAIL,
	LASSO_LEN,
	LINES,
	type Line,
	NECK_JOINT,
	PAD,
	type PenSample,
	ROT_DEG,
	ROUTE,
	STREAK_PATHS,
	TEX_H,
	TEX_LEFT,
	TEX_TOP,
	TEX_W,
	XSTROKES,
	barbHead,
	lassoHead,
	lineFront,
	neckJointY,
	routeHead,
	sheetIn,
	soakOf,
} from './goToTheTopMotion';

export {DURATION, FPS};

// ---------------------------------------------------------------------------
// GoToTheTop. Dwarkesh Patel with Si Sheppard, clip
// "Sheppard_Atahualpa_ambush", the end of the clip. TRANSPARENT overlay: one
// sheet of old paper, a PLAYBOOK (at the start Pizarro "met with Cortes and
// got the playbook"), with the play drawn on it. The user places it under the
// speaker; the graphic is centred and whole, no camera, no text.
//
// THE LINE (in-point 82.06 s, frame = round((t - 82.06) * 24)):
//   "Go to the top, seize whoever is at the very pinnacle of the social
//    hierarchy, you control the entire structure."
//   go f0 · the f8 · top f10 · seize f23 · whoever f30 · is at f39 · the f46 ·
//   very f48 · pinnacle f53 · of the f64 · social f71 · hierarchy f77 ·
//   you f91 · control f93 · the f102 · entire f106 · structure f112
//   (structure ends 87.10 s = f120).
// DURATION: 82.06 -> 87.10 s = 5.04 s; round(5.04 * 24) = 121 frames, + a
// 48-frame static hold the editor trims (overlay) = 169 frames (f0-f168).
//
// THE SHEET (V2, "really old"). Real 1596 paper: a blank leaf of the John
// Carter Brown Library copy of de Bry, Americae pars sexta (Frankfurt 1596),
// scanned by the Internet Archive (americaeparssext00benz_0), leaf n178 (the
// fibriest blank leaf; n177 was V1's cleaner base; n179's foot is the verso's
// text set off onto the page, so its "stain" would bring ghost text). Baked
// once by scripts/bake-playbook-paper.py into public/playbook/playbook-sheet.png
// at 1 texel per px of its on-screen size (820 x 1160 + a 36 px pad), toned
// after the de Bry plates and Guaman Poma's pages: the scan's lighting
// flattened and its fibres sharpened (high-pass ^1.9), a deep, warm, uneven
// tea-brown darkening toward the edges, a worn darker rim (aged, not singed)
// with a ragged edge, a dozen nicks and a chipped corner, foxing, a soft water
// stain with a tide line rising from the foot (right, clear of the X), handling
// grime at the lower corners, a faint centre fold and a dog-ear crease, and a
// soft contact shadow (alpha ~0.26, offset 2/6). Centred on (540, 960),
// turned -1.5 degrees, never moves after it lands.
//
// INK. Everything printed is iron-gall sepia #2A1C12; the whole ink layer is
// one SVG with mix-blend-mode multiply, so it soaks into the paper. Engraved
// manner, one stroke family: lineage lines 2.4 px (3.0 once flooded orange),
// figure outlines 1.2 with a 1.7 shaded-side contour, modelling hatching 0.7
// (0.85 once orange), hair and braid 0.5-0.6 (all 1.4x on the Sapa Inca).
// ORANGE = PIZARRO'S SIDE (his move), deep #D98A0C (multiply); the flow's
// front is a short run of the ripe #FFB000 settling to deep. Nothing else is
// orange.
//
// PRINTED ON THE SHEET (present when it arrives): the social hierarchy as an
// engraved genealogy-style tree, a pyramid of 61 figures, each joined to his
// superior by an S-curved ink line. ONE figure drawing in the engraved
// manner: a head wearing the llautu (a braided band round the brow, the hair
// cropped above it) over an unku-like tunic (sloping shoulders, arms parted
// from the torso by the sleeveless tunic's armholes, a neck slit, no collar),
// a firm outline, and fine parallel hatching that follows the form (the
// shaded cheek and neck, the shaded arm and half-chest, a cross-hatch in the
// deepest shadow, two strokes down the lit side). Every instance is hand-cut,
// not stamped: hashed +-5% head and shoulder size, +-3% height, a hair of
// lean (+-1.8 deg) and head tilt (+-2.5 deg); the lines meet each instance's
// real crown and base.
//   tier 1  the Sapa Inca, 1.4x: his llautu solid, with the mascaypacha
//           fringe (five knotted tassels over the brow; nothing stands up,
//           no crown)
//   tier 2  exactly four: the lords of the four suyus (true, FACTS §6)
//   tiers 3-6  8 / 12 / 16 / 20: SCHEMATIC, not a claim; only the 1 and the 4
//           are real.
// Apex y 616 screen, base row y 1284 (bottoms 1300), straight flanks, base row
// 20 at a 30.5 px pitch: ~600 px wide, so the route has paper to run up the
// left flank (the play spans ~680 px with it). At the lower left, outside the
// tree: a small orange X (~26 px), the starting mark of the play. No text
// anywhere.
//
// THE SOAK. When the ink reaches a figure it soaks in from where it enters
// (the crown; the Sapa Inca's chest) as a feathered stain: inside it the
// modelling hatching turns orange and an orange wash (0.55, multiply) runs
// under it, while the outline, band, hair and fringe stay sepia. The figure
// stays an engraving, hand-coloured, never a flat orange slab.
//
// GESTURES (each starts before its word and lands on it; one drawing):
//   f0-11    the sheet arrives: slides up 24 px while fading in, HOUSE ease
//            (bezier 0.16, 1, 0.3, 1), tree and X already printed on it.
//   f3-15.5  "go to the top" (go f0, top f10): from the X the orange pen
//            draws one curve up and round the left flank to the apex,
//            head-led (nib wander +-8%, a touch-down swell, a firm landing).
//   f15.5-18 the arrowhead: two quick tapered barbs at the tip, just after
//            "top".
//   f24-53   "seize whoever is at the very pinnacle" (seize f23, pinnacle
//            f53): the same pen, from the arrow's tip, draws one loose loop
//            round the Sapa Inca (leaning, wobbling, clockwise over the top),
//            passes its start at CLOSURE_F (f45.2, on "the very") and
//            overshoots ~57 degrees, 5-7 px inside its first pass, into a
//            dry-brush tail (the pen lifts) that ends on "pinnacle" (f53).
//            The tail sits on the lasso, where the pen finally lifts, so it
//            stays clear of the arrowhead.
//   f45-53   the seizure: as the loop closes, the Sapa Inca soaks orange from
//            the chest out (8 f; see THE SOAK), complete on "pinnacle".
//   f66-114  "(of the) social hierarchy ... you control the entire
//            structure": the orange ink runs DOWN the tree from the seized
//            apex, starting just before "social" (f71), so the line never
//            stands still for long: one slow first run reaches the four lords
//            (f79-81), then it runs on through every line, tier after tier,
//            faster as it goes, with hashed per-branch delays; each line turns
//            orange behind its front (a short brighter run settling to deep);
//            each figure soaks orange from the crown when the ink reaches it
//            (6 f). The last crown is reached f108, the last soak ends f114
//            ("structure" f112).
//   f114-168 static hold. No idle motion, no outro.
// ---------------------------------------------------------------------------

export const schema = z.object({
	ink: z.string(),
	accent: z.string(),
	accentBright: z.string(),
});

export type GoToTheTopProps = z.infer<typeof schema>;

export const defaultProps: GoToTheTopProps = schema.parse({
	ink: '#2A1C12',
	accent: '#D98A0C',
	accentBright: '#FFB000',
});

const LINE_W = 2.4; // printed lineage line
const LINE_W_INKED = 3.0; // the orange ink that floods it

// ----------------------------------------------------------- the figure --
// One engraved figure (unit = 1 px at scale 1), light from the upper left:
// a head wearing the llautu (a braided band round the brow) with the hair
// cropped above it, over an unku-like tunic (sloping shoulders, straight
// sides, a neck slit; no collar). FIRM OUTLINE: head, tunic, neck, band and
// hair are sepia and stay sepia. MODELLING: fine parallel hatching that
// follows the form (the shaded cheek and neck, the tunic's shaded side bowed
// along the body, a cross-hatch in its deepest shadow, two strokes down the
// lit side, the head's cast shadow under the slit). The modelling is drawn
// from stroke-inheriting symbols, so the same lines print sepia and, when the
// ink arrives, turn orange (with a light orange wash under them) while the
// outline stays sepia: the figure stays an engraving, never a flat slab.
const HEAD_PATH =
	'M0 -15.9C-3.3 -15.9 -5.3 -13.7 -5.3 -10.6C-5.3 -7.3 -3.6 -3.5 -1.3 -2.7C-0.8 -2.5 0.8 -2.5 1.3 -2.7C3.6 -3.5 5.3 -7.3 5.3 -10.6C5.3 -13.7 3.3 -15.9 0 -15.9Z';
const HEAD_SHADE_EDGE = 'M0.6 -15.85C3.6 -15.7 5.3 -13.5 5.3 -10.6C5.3 -7.3 3.6 -3.5 1.3 -2.7';
// The body: sloping shoulders over the arms, the unku's slit at the neck.
const TUNIC_PATH =
	'M-2.6 -1.1C-4.8 -0.95 -7.6 0 -8.9 1.9C-9.9 3.2 -10.15 5.2 -10.1 7.5L-10.2 16L10.2 16L10.1 7.5C10.15 5.2 9.9 3.2 8.9 1.9C7.6 0 4.8 -0.95 2.6 -1.1Q0 -0.55 -2.6 -1.1Z';
const NECK_PATH = 'M-1.8 -3.2L-2.15 -0.9L2.15 -0.9L1.8 -3.2Z';
// The tunic is sleeveless: its side edges (the armholes) part torso from arms.
const ARM_SEAMS = 'M6.7 4.6Q6.55 10 6.95 16M-6.7 4.6Q-6.55 10 -6.95 16';
// Silhouette subpaths all run counter-clockwise, so nonzero fills the union.
const BODY_SIL = `${NECK_PATH}${TUNIC_PATH}`;
const NECK_SIDES = 'M-1.8 -3L-2.15 -1.15M1.8 -3L2.15 -1.15';
const TUNIC_SHADE_EDGE = 'M2.6 -1.1C4.8 -0.95 7.6 0 8.9 1.9C9.9 3.2 10.15 5.2 10.1 7.5L10.2 16';

// The llautu, seen from the front: two edges dipping slightly at the middle.
const BAND_TOP = (x: number) => -12.95 + 0.3 * (1 - (x / 5.28) ** 2);
const BAND_BOT = (x: number) => -11.3 + 0.275 * (1 - (x / 5.3) ** 2);
const BAND_EDGES = 'M-5.28 -12.95Q0 -12.35 5.28 -12.95M-5.3 -11.3Q0 -10.75 5.3 -11.3';
const BAND_FILL = 'M-5.28 -12.95Q0 -12.35 5.28 -12.95L5.3 -11.3Q0 -10.75 -5.3 -11.3Z';
const BAND_BRAID = [-4.3, -2.6, -0.9, 0.8, 2.5, 4.2]
	.map((x) => `M${x} ${(BAND_TOP(x) + 0.22).toFixed(2)}L${x + 0.75} ${(BAND_BOT(x + 0.75) - 0.22).toFixed(2)}`)
	.join('');
const HAIR = 'M-4.4 -13.7Q0 -15.5 4.4 -13.7M-3.2 -14.9Q0 -16.3 3.2 -14.9M2.7 -15.1L3.5 -13.5M3.8 -14.4L4.5 -13.3';
// The mascaypacha (Sapa Inca only): five knotted tassels hanging from the
// band over the forehead, stopping above the eyes. Nothing stands up.
const TASSELS = [-2.3, -1.15, 0, 1.15, 2.3];

// Modelling (inherits its stroke: sepia, or orange once soaked).
const FACE_HATCH = 'M4.5 -10.2Q4.45 -7 2.6 -4.2M3.45 -10.3Q3.4 -7.6 2 -4.8';
const NECK_HATCH = 'M1.05 -2.9L1.3 -1.05';
const TUNIC_HATCH = (() => {
	const p: string[] = [];
	// The shaded arm: verticals round its cylinder.
	for (const x of [7.55, 8.75, 9.9]) {
		p.push(`M${x} 3Q${(x + 0.35).toFixed(2)} 9.5 ${(x + 0.05).toFixed(2)} 16.5`);
	}
	// The shaded half of the chest, closer toward the arm.
	for (const x of [2.7, 4.1, 5.25, 6.15]) {
		p.push(`M${x} -0.9Q${(x + 0.4).toFixed(2)} 7.5 ${(x - 0.1).toFixed(2)} 16.5`);
	}
	// The right shoulder's top, along its slope.
	p.push('M3.3 -0.15C5.1 0 7.1 0.75 8.3 2.25');
	// The lit side: one stroke on the chest, one down the arm's edge.
	p.push('M-5.4 6.5L-5.5 16', 'M-9.35 6.2L-9.5 15.2');
	// The head's cast shadow under the slit.
	p.push('M0.6 0.15L3 -0.1');
	return p.join('');
})();
// Deepest shadow: a cross-hatch on the shaded arm's lower half.
const TUNIC_XHATCH = 'M10.6 8.6L7.2 12.1M10.6 10.6L7.3 14M10.6 12.6L7.4 15.9M10.4 14.7L8.6 16.5';
const HATCH_W = 0.7; // modelling, sepia
const HATCH_W_INKED = 0.85; // the same lines once the orange has soaked in (wet ink spreads)
const OUTLINE_W = 1.2;
const SHADE_EDGE_W = 1.7;
const WASH = 0.55; // the orange wash under soaked modelling (multiply: paper and hatching show)

const FigureDefs: React.FC<{ink: string}> = ({ink}) => (
	<>
		<clipPath id="gt-tunic-clip">
			<path d={TUNIC_PATH} />
		</clipPath>
		<clipPath id="gt-head-clip">
			<path d={HEAD_PATH} />
		</clipPath>
		{/* silhouettes for the wash */}
		<path id="gt-body-sil" d={BODY_SIL} />
		<path id="gt-head-sil" d={HEAD_PATH} />
		{/* modelling: stroke colour and width come from the layer that uses it */}
		<g id="gt-body-hatch" fill="none" strokeLinecap="round">
			<g clipPath="url(#gt-tunic-clip)">
				<path d={TUNIC_HATCH} />
				<path d={TUNIC_XHATCH} />
			</g>
			<path d={NECK_HATCH} />
		</g>
		<g id="gt-head-hatch" fill="none" strokeLinecap="round">
			<g clipPath="url(#gt-head-clip)">
				<path d={FACE_HATCH} />
			</g>
		</g>
		{/* the firm outline (sepia, always) */}
		<g id="gt-body-line" fill="none" stroke={ink} strokeLinecap="round" strokeLinejoin="round">
			<path d={`${TUNIC_PATH}${NECK_SIDES}`} strokeWidth={OUTLINE_W} />
			<path d={ARM_SEAMS} strokeWidth={OUTLINE_W * 0.8} />
			<path d={TUNIC_SHADE_EDGE} strokeWidth={SHADE_EDGE_W} />
		</g>
		<g id="gt-head-line" fill="none" stroke={ink} strokeLinecap="round" strokeLinejoin="round">
			<g clipPath="url(#gt-head-clip)">
				<path d={HAIR} strokeWidth={0.6} />
				<path d={BAND_BRAID} strokeWidth={0.5} />
			</g>
			<path d={BAND_EDGES} strokeWidth={0.55} />
			<path d={HEAD_PATH} strokeWidth={OUTLINE_W} />
			<path d={HEAD_SHADE_EDGE} strokeWidth={SHADE_EDGE_W} />
		</g>
		<g id="gt-head-line-sapa" fill="none" stroke={ink} strokeLinecap="round" strokeLinejoin="round">
			<g clipPath="url(#gt-head-clip)">
				<path d={HAIR} strokeWidth={0.6} />
			</g>
			<path d={BAND_FILL} fill={ink} stroke="none" />
			<path d={HEAD_PATH} strokeWidth={OUTLINE_W} />
			<path d={HEAD_SHADE_EDGE} strokeWidth={SHADE_EDGE_W} />
			{TASSELS.map((x) => (
				<g key={x}>
					<path d={`M${x} ${BAND_BOT(x).toFixed(2)}L${(x * 1.05).toFixed(3)} -9.3`} strokeWidth={0.5} />
					<ellipse cx={x * 1.05} cy={-8.85} rx={0.42} ry={0.62} fill={ink} stroke="none" />
				</g>
			))}
		</g>
		<radialGradient id="gt-soak">
			<stop offset="0" stopColor="#fff" />
			<stop offset="0.7" stopColor="#fff" />
			<stop offset="1" stopColor="#000" />
		</radialGradient>
		<radialGradient id="gt-soak-inv">
			<stop offset="0" stopColor="#000" stopOpacity={1} />
			<stop offset="0.7" stopColor="#000" stopOpacity={1} />
			<stop offset="1" stopColor="#000" stopOpacity={0} />
		</radialGradient>
	</>
);

// Per-instance placement (static): the figure's lean about its base, the
// tunic's width/height, the head's scale and tilt on the neck joint.
const f3 = (v: number) => v.toFixed(3);
const FIG_T = FIGS.map(
	(f) => `translate(${f3(f.x + f.dx)} ${f3(f.y + f.dy)}) scale(${f.s}) rotate(${f3(f.lean)} 0 ${FIG_BASE})`,
);
const BODY_T = FIGS.map((f) => `translate(0 ${FIG_BASE}) scale(${f3(f.sw)} ${f3(f.sh)}) translate(0 ${-FIG_BASE})`);
const HEAD_T = FIGS.map(
	(f) => `translate(0 ${f3(neckJointY(f.sh))}) rotate(${f3(f.tilt)}) scale(${f3(f.hs)}) translate(0 ${-NECK_JOINT})`,
);

/** One figure layer: its body and head symbols in place. */
const FigLayer: React.FC<{f: Fig; body: string; head: string}> = ({f, body, head}) => (
	<g transform={FIG_T[f.id]}>
		<use href={body} transform={BODY_T[f.id]} />
		<use href={head} transform={HEAD_T[f.id]} />
	</g>
);

// ------------------------------------------------------------- the pen --
const n2 = (v: number) => v.toFixed(2);

/**
 * Outline of a variable-width nib stroke drawn from its first sample up to
 * arc length `head` (head-led), with round ends. Samples carry their own arc
 * length, so a streak can start part-way along the lasso.
 */
const strokeOutline = (pts: PenSample[], head: number): string => {
	// Nothing until the nib has actually moved: a zero-length stroke would
	// still draw its round cap as a dot.
	if (pts.length < 2 || head <= pts[0].s + 0.05) {
		return '';
	}
	const ss: PenSample[] = [];
	for (let i = 0; i < pts.length; i++) {
		const q = pts[i];
		if (q.s <= head) {
			ss.push(q);
			continue;
		}
		if (i > 0 && ss.length > 0) {
			const a = pts[i - 1];
			const t = (head - a.s) / (q.s - a.s);
			ss.push({
				x: a.x + (q.x - a.x) * t,
				y: a.y + (q.y - a.y) * t,
				s: head,
				nx: a.nx + (q.nx - a.nx) * t,
				ny: a.ny + (q.ny - a.ny) * t,
				w: a.w + (q.w - a.w) * t,
			});
		}
		break;
	}
	if (ss.length < 2) {
		return '';
	}
	const left: string[] = [];
	const right: string[] = [];
	for (const q of ss) {
		const h = q.w / 2;
		left.push(`${n2(q.x + q.nx * h)} ${n2(q.y + q.ny * h)}`);
		right.push(`${n2(q.x - q.nx * h)} ${n2(q.y - q.ny * h)}`);
	}
	const cap = (q: PenSample, back: boolean): string[] => {
		const out: string[] = [];
		const h = q.w / 2;
		const tx = q.ny;
		const ty = -q.nx;
		for (let k = 1; k < 8; k++) {
			const ph = (Math.PI * k) / 8;
			const sgn = back ? -1 : 1;
			out.push(
				`${n2(q.x + sgn * h * (q.nx * Math.cos(ph) + tx * Math.sin(ph)))} ${n2(
					q.y + sgn * h * (q.ny * Math.cos(ph) + ty * Math.sin(ph)),
				)}`,
			);
		}
		return out;
	};
	const pts2 = [
		...left,
		...cap(ss[ss.length - 1], false),
		...right.reverse(),
		...cap(ss[0], true),
	];
	return `M${pts2.join('L')}Z`;
};

// The X is printed with the sheet: static outlines.
const X_PATHS = XSTROKES.map((st) => strokeOutline(st, Infinity));
// The lasso body stops where its taper reaches zero; the streaks carry on.
const LASSO_BODY_END = LASSO_LEN - LASSO_TAIL + 14;

// ------------------------------------------------------------ the flow --
const hexRgb = (h: string) => [
	parseInt(h.slice(1, 3), 16),
	parseInt(h.slice(3, 5), 16),
	parseInt(h.slice(5, 7), 16),
];
const mixHex = (a: string, b: string, k: number) => {
	const ca = hexRgb(a);
	const cb = hexRgb(b);
	const c = ca.map((v, i) => Math.round(v + (cb[i] - v) * k));
	return `rgb(${c[0]},${c[1]},${c[2]})`;
};

/** A stretch [a, b] (fractions of the line) of a lineage line. */
const Seg: React.FC<{d: string; a: number; b: number; color: string; w: number}> = ({
	d,
	a,
	b,
	color,
	w,
}) => {
	if (b - a < 1e-4) {
		return null;
	}
	const whole = a <= 0 && b >= 1;
	return (
		<path
			d={d}
			fill="none"
			stroke={color}
			strokeWidth={w}
			strokeLinecap="round"
			pathLength={whole ? undefined : 1}
			strokeDasharray={whole ? undefined : `${(b - a).toFixed(5)} 3`}
			strokeDashoffset={whole ? undefined : (-a).toFixed(5)}
		/>
	);
};

const LineInk: React.FC<{l: Line; frame: number; ink: string; deep: string; bright: string}> = ({
	l,
	frame,
	ink,
	deep,
	bright,
}) => {
	const p = lineFront(l, frame);
	// Fresh ink is bright for BRIGHT_FRAMES behind the front, in three steps.
	const q1 = lineFront(l, frame - BRIGHT_FRAMES / 3);
	const q2 = lineFront(l, frame - (2 * BRIGHT_FRAMES) / 3);
	const q3 = lineFront(l, frame - BRIGHT_FRAMES);
	return (
		<>
			<Seg d={l.d} a={p} b={1} color={ink} w={LINE_W} />
			<Seg d={l.d} a={0} b={q3} color={deep} w={LINE_W_INKED} />
			<Seg d={l.d} a={q3} b={q2} color={mixHex(deep, bright, 1 / 6)} w={LINE_W_INKED} />
			<Seg d={l.d} a={q2} b={q1} color={mixHex(deep, bright, 1 / 2)} w={LINE_W_INKED} />
			<Seg d={l.d} a={q1} b={p} color={mixHex(deep, bright, 5 / 6)} w={LINE_W_INKED} />
		</>
	);
};

// Soak: the ink spreads from where it enters (a figure's crown; the Sapa
// Inca's chest, where the lasso closes on him) as a feathered stain; the white
// core (inner 70%) must reach the figure's far corners.
const soakCentre = (f: Fig): [number, number] => (f.id === 0 ? f.chest : f.crown);
const soakReach = (f: Fig) => (f.id === 0 ? (19 * f.s) / 0.7 + 2 : (34 * f.s) / 0.7 + 2);

// -------------------------------------------------------------- component --
const GoToTheTop: React.FC<GoToTheTopProps> = ({ink, accent, accentBright}) => {
	const frame = useCurrentFrame();
	const sheet = sheetIn(frame);

	const soaks = FIGS.map((f) => (frame >= ARRIVE[f.id] ? soakOf(frame, f.id) : 0));
	const midSoak = FIGS.filter((f) => soaks[f.id] > 0 && soaks[f.id] < 1);

	const route = strokeOutline(ROUTE, routeHead(frame));
	const barbs = BARBS.map((b, i) => strokeOutline(b, barbHead(frame, i)));
	const lh = lassoHead(frame);
	const lasso = strokeOutline(LASSO_PATH, Math.min(lh, LASSO_BODY_END));
	const streaks = STREAK_PATHS.map((sp) => strokeOutline(sp, lh));

	return (
		<AbsoluteFill>
			<div
				style={{
					position: 'absolute',
					left: TEX_LEFT,
					top: TEX_TOP,
					width: TEX_W,
					height: TEX_H,
					opacity: sheet.opacity,
					transform: `translateY(${sheet.dy.toFixed(3)}px) rotate(${ROT_DEG}deg)`,
					transformOrigin: '50% 50%',
					isolation: 'isolate',
				}}
			>
				<Img
					src={staticFile('playbook/playbook-sheet.png')}
					style={{position: 'absolute', left: 0, top: 0, width: TEX_W, height: TEX_H}}
				/>
				<svg
					width={TEX_W}
					height={TEX_H}
					viewBox={`${-PAD} ${-PAD} ${TEX_W} ${TEX_H}`}
					style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'multiply'}}
				>
					<defs>
						<FigureDefs ink={ink} />
						{midSoak.map((f) => {
							const [cx, cy] = soakCentre(f);
							const r = Math.max(0.01, soakReach(f) * soaks[f.id]);
							const box = {x: f.x - 70, y: f.y - 70, width: 140, height: 140};
							return (
								<React.Fragment key={f.id}>
									<mask id={`gt-soak-${f.id}`} maskUnits="userSpaceOnUse" {...box}>
										<circle cx={cx} cy={cy} r={r} fill="url(#gt-soak)" />
									</mask>
									<mask id={`gt-dry-${f.id}`} maskUnits="userSpaceOnUse" {...box}>
										<rect {...box} fill="#fff" />
										<circle cx={cx} cy={cy} r={r} fill="url(#gt-soak-inv)" />
									</mask>
								</React.Fragment>
							);
						})}
					</defs>

					{/* The light orange wash under a soaked figure. */}
					{FIGS.map((f) =>
						soaks[f.id] > 0 ? (
							<g key={f.id} mask={soaks[f.id] < 1 ? `url(#gt-soak-${f.id})` : undefined}>
								<g opacity={WASH} fill={accent}>
									<FigLayer f={f} body="#gt-body-sil" head="#gt-head-sil" />
								</g>
							</g>
						) : null,
					)}

					{/* The lineage lines: printed sepia, flooded orange by the flow. */}
					{LINES.map((l) => (
						<LineInk key={l.child} l={l} frame={frame} ink={ink} deep={accent} bright={accentBright} />
					))}

					{/* Modelling, sepia where the ink has not reached... */}
					{FIGS.map((f) =>
						soaks[f.id] < 1 ? (
							<g
								key={f.id}
								stroke={ink}
								strokeWidth={HATCH_W}
								mask={soaks[f.id] > 0 ? `url(#gt-dry-${f.id})` : undefined}
							>
								<FigLayer f={f} body="#gt-body-hatch" head="#gt-head-hatch" />
							</g>
						) : null,
					)}
					{/* ...and orange where it has soaked in. */}
					{FIGS.map((f) =>
						soaks[f.id] > 0 ? (
							<g
								key={f.id}
								stroke={accent}
								strokeWidth={HATCH_W_INKED}
								mask={soaks[f.id] < 1 ? `url(#gt-soak-${f.id})` : undefined}
							>
								<FigLayer f={f} body="#gt-body-hatch" head="#gt-head-hatch" />
							</g>
						) : null,
					)}

					{/* The firm sepia outline, band and hair: never orange. */}
					{FIGS.map((f) => (
						<FigLayer
							key={f.id}
							f={f}
							body="#gt-body-line"
							head={f.id === 0 ? '#gt-head-line-sapa' : '#gt-head-line'}
						/>
					))}

					{/* The play: one pen in deep orange. */}
					<g fill={accent}>
						{X_PATHS.map((d, i) => (
							<path key={`x${i}`} d={d} />
						))}
						{route ? <path d={route} /> : null}
						{barbs.map((d, i) => (d ? <path key={`b${i}`} d={d} /> : null))}
						{lasso ? <path d={lasso} /> : null}
						{streaks.map((d, i) => (d ? <path key={`s${i}`} d={d} /> : null))}
					</g>
				</svg>
			</div>
		</AbsoluteFill>
	);
};

export default GoToTheTop;
