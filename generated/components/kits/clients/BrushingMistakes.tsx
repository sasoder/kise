import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';

/**
 * BrushingMistakes — The Humble Co. "three brushing mistakes" timeline, the
 * chosen option A (Tube), as three separate transparent clips that the editor
 * drops in when the dentist names each mistake (prop `step`):
 *   step 1  För hårt     step 2  Fel vinkel     step 3  För snabbt
 * 1080x1920, 30 fps, 450 frames (15 s: a long static hold the editor trims).
 * No background, no camera, no idle motion, no outro. The graphic stays
 * centred on y = 960; the editor positions it.
 *
 * Two colours only: PURPLE #7970b4 and WHITE #FFFFFF.
 *
 * Geometry: stations at x = 200 / 540 / 880, y = 960. A white 8 px OUTLINE
 * traced round the union of the three circles (outer R 88) and a 40 px tube,
 * the tube meeting each circle through a 12 px (centreline) fillet. Purple
 * fills the inside like liquid: the union is filled and clipped to x <= front,
 * the fill edge hides under the stroke, so it sits flush with the outline's
 * inner edge. The front is a plain vertical edge (no meniscus, no wave).
 * Station interiors (the stroke's inner edge, r 80) span x = 120-280,
 * 460-620 and 800-960; these are the front's start and end points.
 *
 * Icons: one toothbrush glyph drawn on Lucide's grammar (24 grid at x4 in a
 * 96 px box, stroke 2 = 8 px, round caps/joins, no fill): a thin closed
 * rounded-rect head 8 x 1 (no inner slot), a tight tuft of four bristles 3.25
 * long at a 2.5 pitch, and a handle running along the head's top edge for 2
 * units, then rising 10 degrees (10 units in all). Modifiers: 1 the tuft
 * splays (outer bristles 22 degrees, inner 4) where it is pressed onto a
 * baseline under a down arrow; 2 the handle is the 45 degree arm of an angle
 * on a baseline, with an angle arc; 3 three staggered speed lines round the
 * handle's free end, each >= 2 units clear of the handle. Each icon is centred
 * on its stroke box, nudged halfway toward its ink centroid. White, inside
 * the liquid (clipped to the front).
 *
 * Eases: HOUSE = bezier(0.16, 1, 0.3, 1) (the house entrance: slide up + fade,
 * nothing pops). FLOW = bezier(0.65, 0, 0.35, 1) (ease-in-out liquid).
 *
 * Frame table (30 fps):
 *   step 1  f0-16    outline enters: slides up 24 px, opacity 0 -> 1 (HOUSE)
 *           f16-20   hold
 *           f20-40   front x 120 -> 280: fills station 1 (FLOW)
 *           f34-48   icon 1 slides up 16 px, opacity 0 -> 1 (HOUSE)
 *           f48-449  static hold
 *   step 2  f0       pixel-identical to step 1's last frame
 *           f0-30    front x 280 -> 620: one continuous move through the tube
 *                    and across station 2 (FLOW)
 *           f24-38   icon 2 slides up 16 px, opacity 0 -> 1 (HOUSE)
 *           f38-449  static hold
 *   step 3  f0       pixel-identical to step 2's last frame
 *           f0-30    front x 620 -> 960: tube + station 3 (FLOW)
 *           f24-38   icon 3 slides up 16 px, opacity 0 -> 1 (HOUSE)
 *           f38-449  static hold
 * Before the front arrives a station is the white outline with a hollow
 * interior (the footage shows through).
 */

export const FPS = 30;
export const DURATION = 450;

export const schema = z.object({
	step: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

export type BrushingMistakesProps = z.infer<typeof schema>;

export const defaultProps: BrushingMistakesProps = schema.parse({step: 1});

// ---------------------------------------------------------------- geometry --
const PURPLE = '#7970b4';
const WHITE = '#FFFFFF';
const WIDTH = 1080;
const HEIGHT = 1920;
const CY = 960;
const XS = [200, 540, 880] as const;
const R = 88;
const ICON_BOX = 96;
const ICON_SCALE = ICON_BOX / 24;

const TUBE_STROKE = 8;
const TUBE_R = R - TUBE_STROKE / 2; // stroke centreline, outer edge at R
const TUBE_H = 20 - TUBE_STROKE / 2; // centreline half-height, outer tube 40 px
const TUBE_FILLET = 12; // centreline fillet radius where the tube meets a circle
const INNER = TUBE_R - TUBE_STROKE / 2; // 80: a station's interior radius

/** Front x at a station's interior edges: 120-280, 460-620, 800-960. */
const inLeft = (i: number) => XS[i] - INNER;
const inRight = (i: number) => XS[i] + INNER;

// ---------------------------------------------------------------- timeline --
const HOUSE = Easing.bezier(0.16, 1, 0.3, 1);
const FLOW = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const OUTLINE_IN: [number, number] = [0, 16];
const OUTLINE_RISE = 24;
const STEP1_FILL: [number, number] = [20, 40];
const STEP1_ICON: [number, number] = [34, 48];
const FLOW_FILL: [number, number] = [0, 30];
const FLOW_ICON: [number, number] = [24, 38];
const ICON_RISE = 16;

type Layer = {opacity: number; dy: number};

const REST: Layer = {opacity: 1, dy: 0};

/** Slide up `rise` px while fading in, on the house ease. */
const entrance = (
	frame: number,
	range: [number, number],
	rise: number,
): Layer => ({
	opacity: interpolate(frame, range, [0, 1], {...CLAMP, easing: HOUSE}),
	dy: interpolate(frame, range, [rise, 0], {...CLAMP, easing: HOUSE}),
});

/**
 * Everything on screen for a step at a frame. Rest values are exact (clamped
 * interpolation), so each clip's last frame equals the next clip's first.
 */
const stateAt = (step: 1 | 2 | 3, frame: number) => {
	const k = step - 1; // the station this clip reveals
	const icons: (Layer | null)[] = [0, 1, 2].map((i) => (i < k ? REST : null));
	if (step === 1) {
		icons[0] = entrance(frame, STEP1_ICON, ICON_RISE);
		return {
			outline: entrance(frame, OUTLINE_IN, OUTLINE_RISE),
			front: interpolate(frame, STEP1_FILL, [inLeft(0), inRight(0)], {
				...CLAMP,
				easing: FLOW,
			}),
			icons,
		};
	}
	icons[k] = entrance(frame, FLOW_ICON, ICON_RISE);
	return {
		outline: REST,
		front: interpolate(frame, FLOW_FILL, [inRight(k - 1), inRight(k)], {
			...CLAMP,
			easing: FLOW,
		}),
		icons,
	};
};

// ------------------------------------------------------------------- icons --
type Pt = [number, number];
type Prim =
	| {kind: 'line'; pts: Pt[]}
	| {
			kind: 'rect';
			cx: number;
			cy: number;
			w: number;
			h: number;
			rx: number;
			rot: number;
	  }
	| {kind: 'arc'; cx: number; cy: number; r: number; a0: number; a1: number};

const DEG = Math.PI / 180;
// Glyph V2 (icon pass): a thin closed head (no inner slot), a tight tuft of
// four bristles, and the handle with its neck kink.
const HEAD_L = 8;
const HEAD_H = 1; // stroke 2 closes it: reads as one solid 3-unit head
const HEAD_RX = 0.5;
const HANDLE_L = 10;
const NECK = 2;
const KINK = 10;
const BRISTLES = 4;
const BRISTLE_PITCH = 2.5; // 0.5-unit gaps: tighter and the tuft fuses into a fist shape
const BRISTLE_L = 3.25;

const rotPt = ([x, y]: Pt, deg: number, tx = 0, ty = 0): Pt => {
	const c = Math.cos(deg * DEG);
	const s = Math.sin(deg * DEG);
	return [tx + x * c - y * s, ty + x * s + y * c];
};

// Glyph frame: origin = head centre, head to the right, bristles down.
const HEAD_X0 = -HEAD_L / 2;
const HEAD_Y0 = -HEAD_H / 2;
const KINK_PT: Pt = [HEAD_X0 - NECK, HEAD_Y0];
const HANDLE_END: Pt = [
	KINK_PT[0] - (HANDLE_L - NECK) * Math.cos(KINK * DEG),
	HEAD_Y0 - (HANDLE_L - NECK) * Math.sin(KINK * DEG),
];

/**
 * The one toothbrush glyph, rotated by `deg` and moved to (tx, ty). `splay`
 * leans each bristle (degrees, + = right) while its tip stays on the same
 * line, so a splayed tuft still lands flat on a surface.
 */
const brush = (splay: number[] | null, deg = 0, tx = 0, ty = 0): Prim[] => {
	const t = (pt: Pt) => rotPt(pt, deg, tx, ty);
	const [cx, cy] = t([0, 0]);
	const handle: Pt[] = [HANDLE_END, KINK_PT, [HEAD_X0 + HEAD_RX, HEAD_Y0]];
	const bristles: Prim[] = [];
	for (let j = 0; j < BRISTLES; j++) {
		const bx = (j - (BRISTLES - 1) / 2) * BRISTLE_PITCH;
		const lean = splay ? BRISTLE_L * Math.tan(splay[j] * DEG) : 0;
		bristles.push({
			kind: 'line',
			pts: [t([bx, HEAD_H / 2]), t([bx + lean, HEAD_H / 2 + BRISTLE_L])],
		});
	}
	return [
		{kind: 'rect', cx, cy, w: HEAD_L, h: HEAD_H, rx: HEAD_RX, rot: deg},
		{kind: 'line', pts: handle.map(t)},
		...bristles,
	];
};

// Pressure: the outer bristles splay ~22 degrees, the inner ones stay near vertical.
const HARD_SPLAY = [-22, -4, 4, 22];

/** 1 — too hard: the tuft splays where it is pressed onto a baseline, arrow on the head. */
const iconHard = (): Prim[] => {
	const hy = -(BRISTLE_L + HEAD_H / 2); // bristle tips on y = 0
	const base = 1.25; // baseline 1.25 below the tips: the caps overlap, pressed
	const half = 5.75; // the splayed tips (+-5.06) land inside the surface
	const tip = hy - HEAD_H / 2 - 1 - 1.75; // arrow tip 1.75 clear of the head
	const len = 6;
	const wing = 3;
	return [
		...brush(HARD_SPLAY, 0, 0, hy),
		{
			kind: 'line',
			pts: [
				[-half, base],
				[half, base],
			],
		},
		{
			kind: 'line',
			pts: [
				[0, tip - len],
				[0, tip],
			],
		},
		{
			kind: 'line',
			pts: [
				[-wing, tip - wing],
				[0, tip],
				[wing, tip - wing],
			],
		},
	];
};

/** 2 — wrong angle: the handle is the 45 degree arm of an angle on a baseline. */
const iconAngle = (): Prim[] => {
	const deg = -45 - KINK; // turn so the handle (not the head) reads 45 degrees
	const v = rotPt(HANDLE_END, deg);
	return [
		...brush(null, deg),
		{kind: 'line', pts: [v, [v[0] + 16.5, v[1]]]},
		{kind: 'arc', cx: v[0], cy: v[1], r: 6.5, a0: 0, a1: -45},
	];
};

/**
 * 3 — too fast: three staggered speed lines round the handle's free end, one
 * above and two below, evenly spaced with the handle; each keeps >= 2 units
 * of clear space from the (sloping) handle so they never merge at phone size.
 */
const iconFast = (): Prim[] => {
	const [ex, ey] = HANDLE_END;
	return [
		...brush(null),
		{
			kind: 'line',
			pts: [
				[ex - 1, ey - 4.5],
				[ex + 5.5, ey - 4.5],
			],
		},
		{
			kind: 'line',
			pts: [
				[ex - 0.5, ey + 4.75],
				[ex + 4, ey + 4.75],
			],
		},
		{
			kind: 'line',
			pts: [
				[ex - 1, ey + 9],
				[ex + 2, ey + 9],
			],
		},
	];
};

const primPoints = (pr: Prim): Pt[] => {
	if (pr.kind === 'line') {
		return pr.pts;
	}
	if (pr.kind === 'rect') {
		return [
			[-pr.w / 2, -pr.h / 2],
			[pr.w / 2, -pr.h / 2],
			[pr.w / 2, pr.h / 2],
			[-pr.w / 2, pr.h / 2],
		].map((q) => rotPt(q as Pt, pr.rot, pr.cx, pr.cy));
	}
	const out: Pt[] = [];
	for (let k = 0; k <= 32; k++) {
		const a = (pr.a0 + ((pr.a1 - pr.a0) * k) / 32) * DEG;
		out.push([pr.cx + pr.r * Math.cos(a), pr.cy + pr.r * Math.sin(a)]);
	}
	return out;
};

// Optical centring: move the box centre this share of the way toward the ink
// centroid, so a heavy head/baseline does not pull the icon off-centre.
const OPTICAL = 0.5;

/** Centre an icon on the 24 grid: stroke bounding box, nudged toward its ink centroid. */
const centred = (prims: Prim[]): Prim[] => {
	let x0 = Infinity;
	let y0 = Infinity;
	let x1 = -Infinity;
	let y1 = -Infinity;
	let sx = 0;
	let sy = 0;
	let sl = 0;
	prims.forEach((pr) => {
		const pts = primPoints(pr);
		const path = pr.kind === 'rect' ? [...pts, pts[0]] : pts;
		pts.forEach(([x, y]) => {
			x0 = Math.min(x0, x);
			y0 = Math.min(y0, y);
			x1 = Math.max(x1, x);
			y1 = Math.max(y1, y);
		});
		for (let k = 1; k < path.length; k++) {
			const [ax, ay] = path[k - 1];
			const [bx, by] = path[k];
			const l = Math.hypot(bx - ax, by - ay);
			sx += (l * (ax + bx)) / 2;
			sy += (l * (ay + by)) / 2;
			sl += l;
		}
	});
	const bx = (x0 + x1) / 2;
	const by = (y0 + y1) / 2;
	const dx = 12 - (bx + OPTICAL * (sx / sl - bx));
	const dy = 12 - (by + OPTICAL * (sy / sl - by));
	return prims.map((pr): Prim => {
		if (pr.kind === 'line') {
			return {...pr, pts: pr.pts.map(([x, y]): Pt => [x + dx, y + dy])};
		}
		return {...pr, cx: pr.cx + dx, cy: pr.cy + dy};
	});
};

const ICONS: Prim[][] = [
	centred(iconHard()),
	centred(iconAngle()),
	centred(iconFast()),
];

const n2 = (v: number) => v.toFixed(3);

const IconPrims: React.FC<{prims: Prim[]}> = ({prims}) => (
	<>
		{prims.map((pr, k) => {
			if (pr.kind === 'line') {
				const d = pr.pts
					.map(([x, y], j) => `${j ? 'L' : 'M'}${n2(x)} ${n2(y)}`)
					.join('');
				return <path key={k} d={d} />;
			}
			if (pr.kind === 'rect') {
				return (
					<rect
						key={k}
						x={-pr.w / 2}
						y={-pr.h / 2}
						width={pr.w}
						height={pr.h}
						rx={pr.rx}
						transform={`translate(${n2(pr.cx)} ${n2(pr.cy)}) rotate(${n2(pr.rot)})`}
					/>
				);
			}
			const a0 = pr.a0 * DEG;
			const a1 = pr.a1 * DEG;
			const sweep = pr.a1 > pr.a0 ? 1 : 0;
			const large = Math.abs(pr.a1 - pr.a0) > 180 ? 1 : 0;
			const d = `M${n2(pr.cx + pr.r * Math.cos(a0))} ${n2(pr.cy + pr.r * Math.sin(a0))}A${pr.r} ${pr.r} 0 ${large} ${sweep} ${n2(pr.cx + pr.r * Math.cos(a1))} ${n2(pr.cy + pr.r * Math.sin(a1))}`;
			return <path key={k} d={d} />;
		})}
	</>
);

// ------------------------------------------------------------ the tube --
const f2 = (v: number) => v.toFixed(2);
const pt = ([x, y]: Pt) => `${f2(x)} ${f2(y)}`;

/** Tangent points where the tube's edge meets circle `cx` (side +1 right / -1 left, edge -1 top / +1 bottom). */
const junction = (cx: number, side: 1 | -1, edge: 1 | -1) => {
	const f = TUBE_FILLET;
	const dx = Math.sqrt((TUBE_R + f) ** 2 - (TUBE_H + f) ** 2);
	const fx = cx + side * dx;
	const fy = CY + edge * (TUBE_H + f);
	const k = TUBE_R / (TUBE_R + f);
	return {
		line: [fx, CY + edge * TUBE_H] as Pt,
		circ: [cx + (fx - cx) * k, CY + (fy - CY) * k] as Pt,
	};
};

/** Outline of the union of the three circles and the tube, traced clockwise. */
const tubePath = (): string => {
	const [x0, x1, x2] = XS;
	const f = TUBE_FILLET;
	const a = (r: number, large: number, sweep: number, to: Pt) =>
		`A${f2(r)} ${f2(r)} 0 ${large} ${sweep} ${pt(to)}`;
	const j = junction;
	return [
		`M${pt([x0 - TUBE_R, CY])}`,
		a(TUBE_R, 0, 1, j(x0, 1, -1).circ),
		a(f, 0, 0, j(x0, 1, -1).line),
		`L${pt(j(x1, -1, -1).line)}`,
		a(f, 0, 0, j(x1, -1, -1).circ),
		a(TUBE_R, 0, 1, j(x1, 1, -1).circ),
		a(f, 0, 0, j(x1, 1, -1).line),
		`L${pt(j(x2, -1, -1).line)}`,
		a(f, 0, 0, j(x2, -1, -1).circ),
		a(TUBE_R, 1, 1, j(x2, -1, 1).circ),
		a(f, 0, 0, j(x2, -1, 1).line),
		`L${pt(j(x1, 1, 1).line)}`,
		a(f, 0, 0, j(x1, 1, 1).circ),
		a(TUBE_R, 0, 1, j(x1, -1, 1).circ),
		a(f, 0, 0, j(x1, -1, 1).line),
		`L${pt(j(x0, 1, 1).line)}`,
		a(f, 0, 0, j(x0, 1, 1).circ),
		a(TUBE_R, 0, 1, [x0 - TUBE_R, CY]),
		'Z',
	].join('');
};

const TUBE_PATH = tubePath();

/** White station icon in its 96 px box, with its entrance offset and fade. */
const StationIcon: React.FC<{i: number; layer: Layer}> = ({i, layer}) => (
	<g
		opacity={layer.opacity}
		transform={`translate(${XS[i]} ${CY + layer.dy}) scale(${ICON_SCALE}) translate(-12 -12)`}
		fill="none"
		stroke={WHITE}
		strokeWidth={2}
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<IconPrims prims={ICONS[i]} />
	</g>
);

// -------------------------------------------------------------- component --
const BrushingMistakes: React.FC<BrushingMistakesProps> = ({step}) => {
	const frame = useCurrentFrame();
	const {outline, front, icons} = stateAt(step, frame);
	return (
		<AbsoluteFill>
			<svg
				width={WIDTH}
				height={HEIGHT}
				viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
				style={{position: 'absolute', left: 0, top: 0}}
			>
				{front > inLeft(0) ? (
					<>
						<clipPath id="tube-front">
							<rect x={0} y={0} width={front} height={HEIGHT} />
						</clipPath>
						<g clipPath="url(#tube-front)">
							<path d={TUBE_PATH} fill={PURPLE} />
							{icons.map((layer, i) =>
								layer && layer.opacity > 0 ? (
									<StationIcon key={i} i={i} layer={layer} />
								) : null,
							)}
						</g>
					</>
				) : null}
				<g opacity={outline.opacity} transform={`translate(0 ${outline.dy})`}>
					<path
						d={TUBE_PATH}
						fill="none"
						stroke={WHITE}
						strokeWidth={TUBE_STROKE}
						strokeLinejoin="round"
					/>
				</g>
			</svg>
		</AbsoluteFill>
	);
};

export default BrushingMistakes;
