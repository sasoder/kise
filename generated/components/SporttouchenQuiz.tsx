import {loadFont} from '@remotion/fonts';
import React from 'react';
import {
	AbsoluteFill,
	Easing,
	Img,
	interpolate,
	staticFile,
	useCurrentFrame,
} from 'remotion';
import {z} from 'zod';

/**
 * The client's brand face, loaded from `public/` at module scope so a missing
 * or broken file surfaces before a single frame is drawn. Two weights of one
 * family: ExtraBold (800) carries the question, Medium (500) the header label.
 * No fallback stack on purpose — if these do not load, the render is wrong and
 * should look wrong rather than quietly fall back to a system sans.
 */
const fontFamily = 'MADETommySoft';
loadFont({
	family: fontFamily,
	url: staticFile('MADETommySoft-ExtraBold.otf'),
	weight: '800',
});
loadFont({
	family: fontFamily,
	url: staticFile('MADETommySoft-Medium.otf'),
	weight: '500',
});

export const FPS = 30;
/**
 * DURATION = 300 frames = 10 s at 30fps. Derivation: the entrance is finished
 * at frame 30 (card 0-18, question 6-24, track 12-30, the last bar lands at
 * 30), which leaves a 270-frame / 9-second talking hold. The speech schedule
 * below puts four complete breaths inside those 9 s (frames 61-72, 136-150,
 * 217-231, 283-295) and the rest is phrase, so wherever the editor trims after
 * frame 30 they land mid-sentence on a live frame rather than on a settle or a
 * fade. Nothing fades out; frame 299 is a live frame mid-phrase.
 */
export const DURATION = 300;

/**
 * Sporttouchen quiz question graphic — the approved "Quizkortet" plate with the
 * client's round logo above it, talking into a waveform.
 *
 * ELEMENT SET. Three things, and deliberately nothing else:
 *
 * 1. CARD — the approved plate, geometry unchanged from
 *    `SporttouchenPlateE.tsx`: 920 wide at x 80..1000, vertical centre on the
 *    hero line y 880, 12px corners with `overflow: hidden` so every part is
 *    clipped to them.
 *    a. Header band, 112 tall, the one brand gradient (90deg #A300AF ->
 *       #520EF1), "FRÅGA n / 3" in Medium 500 / 40px / uppercase / 0.22em with
 *       the compensating negative marginRight. White ink, STROKE OFF — the
 *       label is small and sits on solid gradient, where a 4px band would close
 *       up the counters.
 *    b. Body, solid #0B0A12, padding 64/64/56. The question in ExtraBold 800 /
 *       white / 66px / lineHeight 1.1, centred, tracking -0.02em. This is the
 *       only element with the house 4px OUTSIDE STROKE, in BLACK (white ink ->
 *       black stroke).
 *    c. Progress track, 792 wide, 8 tall, radius 4 (the thin-element exception
 *       to the 12px house radius — a bar thinner than 12px would otherwise draw
 *       as a lozenge). STROKE OFF. The ONE change from PlateE: the resting ink
 *       is 0.20, not 0.12, because 0.12 was invisible against the dark body.
 *
 * 2. LOGO — a 200px disc on x 540, the client's own PNG through <Img> at the
 *    logo size with a 50% radius. Untinted, no ring, no shadow, STROKE OFF: the
 *    PNG is the mark exactly as delivered and nothing is painted on top of it.
 *    `logoSrc: ''` falls back to the vector moustache further down, which is
 *    now only there for a checkout without the asset.
 *
 *    Its vertical position is DERIVED, not fixed. V1 pinned the centre to
 *    y 430, which was right for a four-line card but left a much bigger hole
 *    above the short two-line F3 card. The logo layer now hangs off the card's
 *    top edge in the DOM, so the group travels with the card and the gap is
 *    always LOGO_GAP: centre y = cardTop - 45 - 100. That is y 450 on the
 *    four-line F1 card (top 595) and about y 522 on the two-line F3 card.
 *
 * 3. WAVEFORM — 13 white bars per side on the logo's own axis, left run
 *    x 132..410 and right run x 670..948: the group is 0.84 of its V1 size and
 *    symmetric about x 540, and the innermost bar edge stays 30px clear of the
 *    disc. Bar width 10, step 22.333, radius 5 (same thin-element exception as
 *    the track). Full-opacity white, growing symmetrically up and down from the
 *    logo's axis, resting height 10 (a dot), ceiling 110. STROKE OFF.
 *
 * EVERY GESTURE, AND WHAT IT IS FOR:
 *
 * - Entrance 1, card, frames 0-18: scale 0.92 -> 1 and fade 0 -> 1,
 *   Easing.out(Easing.cubic), about its own centre. Purpose: the plate arrives
 *   as one object. Straight from PlateE.
 * - Entrance 1b, question, frames 6-24: rises 40px, same easing. Purpose: the
 *   words arrive after the card they sit in, so the card reads as the container.
 * - Entrance 1c, track, frames 12-30: the gradient segment fills LINEARLY to
 *   index/total. Purpose: position in the set. Linear because time is linear in
 *   this brand — same clock as the timer's drain.
 * - Entrance 2, logo, frames 0-18: scale 0.92 -> 1 and fade 0 -> 1, same easing
 *   and same window as the card, about its own centre. Purpose: the mark and
 *   the plate are one unit, not a stack of two arrivals.
 * - Entrance 3, bars grow: each bar fades 0 -> 1 and grows from height 0 to its
 *   live height over 8 frames, starting one frame apart OUTWARD from the logo
 *   (innermost at frame 10, outermost at frame 22, settled at 30). Purpose: the
 *   sound reads as leaving the mark, so the waveform belongs to the logo.
 * - Hold gesture A, the speech envelope E(f): syllables (a rectified sum of a
 *   4.2 Hz and a 6.1 Hz sine, offset phases) multiplied by a phrase gate that
 *   is open 1.7-2.4 s and drops to 0.15 for 0.4-0.6 s, smoothstepped at each
 *   edge. Purpose: the waveform has to read as someone TALKING — phrases with
 *   breaths between them — not as music or as a level meter.
 * - Hold gesture B, per-bar noise n_i(f): three sines at 2.3 / 3.7 / 6.1 Hz with
 *   per-bar phases from a hash of the bar index, different seeds left and right.
 *   Purpose: neighbours differ and the two sides are not mirror images, while
 *   nothing flickers, because every term is smooth and frame-driven. Combined
 *   with a cosine falloff from 1.0 at the bar nearest the logo to 0.18 at the
 *   outermost, so the energy visibly clusters round the mark: the noise range is
 *   kept narrow (0.55..1) on purpose so it can never out-shout that falloff.
 * - Hold gesture C, logo pulse: scale = 1 + 0.035 * E(f). Purpose: the mark is
 *   the one doing the talking. 3.5% is deliberately under the timer's 1.06 tick
 *   pop — this is a breath, not a hit. No rotation, no glow, nothing else.
 *
 * All hold motion is a pure function of the frame — no Math.random, no state —
 * so any frame renders identically on its own.
 */

const WIDTH = 1080;

/** Plate geometry, identical to PlateE: x 80..1000, centred on the hero line. */
const PLATE_LEFT = 80;
const PLATE_WIDTH = 920;
const PLATE_CENTER_Y = 880;
const RADIUS = 12;

const HEADER_HEIGHT = 112;
const LABEL_SIZE = 40;

const PAD_X = 64;
const PAD_TOP = 64;
const PAD_BOTTOM = 56;

const QUESTION_SIZE = 66;
const QUESTION_LINE_HEIGHT = 1.1;

const TRACK_GAP = 40;
const TRACK_HEIGHT = 8;
/** Thin-element exception to the 12px house radius: see the header note. */
const TRACK_RADIUS = 4;
/** PlateE used 0.12 here; it disappeared on the dark body. */
const TRACK_INK = 0.2;

/**
 * Logo disc: 200 across (V2 — the whole logo-and-bars group is 0.84 of its
 * first size, so the mark sits under the card rather than competing with it).
 * Its vertical position is NOT a constant: the group hangs off the card's top
 * edge in the DOM, so a short two-line question moves the group down with the
 * card and the gap stays 45px. See the layout note in the component.
 */
const LOGO_CX = 540;
const LOGO_SIZE = 200;
/** Clear air between the disc's bottom edge and the card's top edge. */
const LOGO_GAP = 45;

/**
 * Waveform runs, scaled with the group. Each side is 278 wide and holds 13 bars
 * of 10 with an even gap: the outermost bar's outer edge lands on x 132 / x 948
 * and the innermost bar's inner edge on x 410 / x 670 — 30px clear of the disc,
 * which is now r 100 about x 540. The whole run is symmetric about x 540.
 *
 * The tallest a bar can get is 110, so its half-height of 55 never reaches past
 * the disc's own half-height of 100: the bars can never poke out below the
 * group's box and collide with the card.
 */
const BAR_COUNT = 13;
const BAR_W = 10;
const BAR_RADIUS = 5;
const BAR_RUN = 278;
const BAR_STEP = (BAR_RUN - BAR_W) / (BAR_COUNT - 1);
const LEFT_INNER_X = 410 - BAR_W;
const RIGHT_INNER_X = 670;
const BAR_MIN_H = 10;
const BAR_MAX_H = 110;

/** Entrance windows, in frames. */
const CARD_IN = [0, 18] as const;
const QUESTION_IN = [6, 24] as const;
const QUESTION_RISE = 40;
const TRACK_IN = [12, 30] as const;
/** Innermost bar starts at 10, each next one a frame later, 8 frames each. */
const BAR_IN_START = 10;
const BAR_IN_LENGTH = 8;

const CLAMP = {
	extrapolateLeft: 'clamp',
	extrapolateRight: 'clamp',
} as const;

const TAU = Math.PI * 2;

const hexToRgba = (hex: string, alpha: number) => {
	const value = hex.replace('#', '');
	const full =
		value.length === 3
			? value
					.split('')
					.map((c) => c + c)
					.join('')
			: value;
	const r = parseInt(full.slice(0, 2), 16);
	const g = parseInt(full.slice(2, 4), 16);
	const b = parseInt(full.slice(4, 6), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const smoothstep = (u: number) => {
	const t = clamp01(u);
	return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Deterministic 0..1 hash. Only used to spread per-bar phases: the same index
 * always yields the same phase, so the waveform is identical on every render.
 */
const hash = (n: number) => {
	const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
	return s - Math.floor(s);
};

/**
 * The phrase schedule: how long the speaker talks and how long they breathe,
 * in seconds. 12.75 s of material, looped, so the 9 s hold never repeats a
 * phrase and never lands on the seam.
 */
const PHRASES = [
	{open: 2.2, breath: 0.5},
	{open: 1.7, breath: 0.45},
	{open: 2.4, breath: 0.6},
	{open: 1.9, breath: 0.4},
	{open: 2.1, breath: 0.5},
] as const;
const PHRASE_TOTAL = PHRASES.reduce((sum, p) => sum + p.open + p.breath, 0);
/** Level the gate drops to between phrases, and how long each edge takes. */
const GATE_CLOSED = 0.15;
const GATE_RAMP = 0.16;
/**
 * Where frame 0 sits in that 12.75 s loop. Chosen, not arbitrary: at 7.66 s the
 * 300-frame window carries four complete breaths (frames 61-72, 136-150,
 * 217-231, 283-295) and frame 299 lands mid-phrase, so the last frame is a live
 * frame and the tail cannot be mistaken for a fade-out.
 */
const PHRASE_OFFSET = 7.66;

/** 1 while a phrase runs, GATE_CLOSED during a breath, smooth at both edges. */
const phraseGate = (time: number) => {
	const t = time + PHRASE_OFFSET;
	const tt = ((t % PHRASE_TOTAL) + PHRASE_TOTAL) % PHRASE_TOTAL;
	let start = 0;
	for (const phrase of PHRASES) {
		const openEnd = start + phrase.open;
		const breathEnd = openEnd + phrase.breath;
		if (tt < openEnd) {
			const toClose = openEnd - tt;
			return toClose < GATE_RAMP
				? mix(1, GATE_CLOSED, smoothstep(1 - toClose / GATE_RAMP))
				: 1;
		}
		if (tt < breathEnd) {
			const toOpen = breathEnd - tt;
			return toOpen < GATE_RAMP
				? mix(GATE_CLOSED, 1, smoothstep(1 - toOpen / GATE_RAMP))
				: GATE_CLOSED;
		}
		start = breathEnd;
	}
	return 1;
};

/**
 * Speech envelope, 0..1. Syllables are the rectified sum of two sines whose
 * rates do not divide each other (4.2 and 6.1 Hz), so the pulse pattern never
 * settles into a loop the eye can count; the phrase gate is what turns that
 * from a tone into speech.
 */
export const speechEnvelope = (frame: number) => {
	const t = frame / FPS;
	const raw =
		Math.sin(TAU * 4.2 * t + 0.4) + 0.72 * Math.sin(TAU * 6.1 * t + 2.1);
	const syllable = 0.22 + 0.78 * Math.min(Math.abs(raw) / 1.72, 1);
	return clamp01(syllable * phraseGate(t));
};

/**
 * 0.55..1, smooth, per bar and per side. Never 0, so no bar ever stalls. The
 * range is deliberately narrow: it has to differentiate neighbours without
 * being able to out-shout the falloff, or the tallest bar stops being the one
 * next to the logo and the energy no longer reads as coming from the mark.
 */
const barNoise = (index: number, side: number, frame: number) => {
	const t = frame / FPS;
	const seed = index + side * 37.13;
	const a = Math.sin(TAU * 2.3 * t + hash(seed) * TAU);
	const b = Math.sin(TAU * 3.7 * t + hash(seed + 11.7) * TAU);
	const c = Math.sin(TAU * 6.1 * t + hash(seed + 23.4) * TAU);
	const raw = a * 0.5 + b * 0.3 + c * 0.2;
	return 0.55 + 0.45 * (0.5 + 0.5 * raw);
};

/**
 * 1.0 at the bar nearest the logo, 0.18 at the outermost, cosine between — so
 * the loud bars cluster round the mark and the runs taper away to the card's
 * edges. Paired with the narrow noise range above, the falloff dominates: at a
 * loud frame the tallest bars are always the innermost few.
 */
const barFalloff = (index: number) => {
	const u = index / (BAR_COUNT - 1);
	return 0.18 + 0.82 * (0.5 * (1 + Math.cos(Math.PI * u)));
};

/** Live bar height in px, before the entrance grow multiplies it. */
export const barHeight = (index: number, side: number, frame: number) => {
	const h =
		BAR_MIN_H +
		(BAR_MAX_H - BAR_MIN_H) *
			speechEnvelope(frame) *
			barFalloff(index) *
			barNoise(index, side, frame);
	return Math.min(Math.max(h, BAR_MIN_H), BAR_MAX_H);
};

export const schema = z.object({
	/** The set; `index` picks the one on screen. */
	questions: z.array(z.string()).min(1),
	/**
	 * Optional manual line breaks. When non-empty these lines replace the
	 * natural wrap, so a bad last-line orphan can be fixed without touching
	 * the type size.
	 */
	lines: z.array(z.string()),
	index: z.number().int().min(1),
	total: z.number().int().min(1),
	/** True forces backdrop 'none' — the real overlay render. */
	transparent: z.boolean(),
	/**
	 * 'brand' paints the opaque dark hero, 'grey' a flat mid-grey stand-in for
	 * footage, 'none' leaves the canvas fully transparent.
	 */
	backdrop: z.enum(['brand', 'grey', 'none']).default('brand'),
	/**
	 * A path inside `public/`: the client's own logo, and the default. The
	 * empty string is the escape hatch back to the vector moustache below,
	 * which now only exists as a fallback for a machine without the asset.
	 */
	logoSrc: z.string(),
	accentFrom: z.string(),
	accentTo: z.string(),
	ink: z.string(),
	surface: z.string(),
	/** Visible outside band on the question, in px at 1080 wide. */
	strokeWidth: z.number().min(0),
	/** Stroke under white ink. */
	strokeInk: z.string(),
});

type Props = z.infer<typeof schema>;

export const defaultProps = schema.parse({
	questions: [
		'Vilken (fd) norsk landslagsspelare spelade i Marcus och Martinus FC förra året?',
		'Vilken Serie A-spelare spelade Sporttouchen FC mot förra året?',
		'Vem gjorde första straffmålet förra året?',
	],
	lines: [],
	index: 1,
	total: 3,
	transparent: false,
	backdrop: 'brand',
	logoSrc: 'sporttouchen-logo.png',
	accentFrom: '#A300AF',
	accentTo: '#520EF1',
	ink: '#FFFFFF',
	surface: '#0B0A12',
	strokeWidth: 4,
	strokeInk: '#000000',
});

/**
 * Outside stroke, built the house way: a back copy with `color: transparent`
 * and a centred stroke of 2 * strokeWidth, and a front copy carrying the real
 * fill. A centred stroke half-eats the letterform, so only the outer half
 * survives once the fill paints over it — 8px centred reads as 4px outside.
 * Both copies inherit one set of text metrics from this wrapper and are stacked
 * in the same box, so they cannot drift apart.
 */
const StrokedText: React.FC<{
	children: React.ReactNode;
	color: string;
	strokeColor: string;
	strokeWidth: number;
	style?: React.CSSProperties;
}> = ({children, color, strokeColor, strokeWidth, style}) => (
	<div style={{position: 'relative', ...style}}>
		<span
			style={{
				position: 'absolute',
				left: 0,
				top: 0,
				right: 0,
				color: 'transparent',
				// Centred, so half of it survives outside the fill.
				WebkitTextStrokeWidth: `${strokeWidth * 2}px`,
				WebkitTextStrokeColor: strokeColor,
			}}
		>
			{children}
		</span>
		<span style={{position: 'relative', color}}>{children}</span>
	</div>
);

/**
 * The vector fallback mark: a plump white handlebar moustache on the logo's own
 * 135deg disc gradient. The path is one closed outline, the right half an exact
 * x -> 1000 - x mirror of the left, so the mark cannot go lopsided. Landmarks,
 * left half: the soft top-centre dip (500,382) — its first control sits at the
 * same y, so the two lobes meet in a rounded valley and not a cusp; a fat lobe
 * plateau at (360,338); a convex sweep out to the shoulder (214,404); the small
 * curl notch (200,428) -> (214,441); the outer edge sweeping down AND OUT to
 * (122,578) and narrowing into a softly rounded hanging tip at (114,632); then
 * the inner edge climbing back as a long concave S through (250,590),
 * (360,555), (450,538) to the bottom-centre join (500,535), whose control also
 * sits at the same y so that join is smooth too.
 *
 * This is tuned by eye, not copied: it went through seven renders. The earlier
 * versions failed the same way each time — tips that dropped straight down and
 * a deep V at the centre read as an M, a bird or a bull's head. What fixes it is
 * a 2.6:1 aspect, the outer edge travelling outward as it descends, and the
 * centre dip kept shallow. The client's real PNG replaces all of it via the
 * `logoSrc` prop, so this only has to read right, not match pixel for pixel.
 */
const MOUSTACHE =
	'M 500 382 ' +
	'C 466 383, 410 340, 360 338 ' +
	'C 320 338, 248 358, 214 404 ' +
	'C 208 412, 202 420, 200 428 ' +
	'C 205 436, 210 439, 214 441 ' +
	'C 180 476, 138 522, 122 578 ' +
	'C 116 600, 112 618, 114 632 ' +
	'C 117 646, 130 644, 150 624 ' +
	'C 178 613, 212 598, 250 590 ' +
	'C 290 582, 325 566, 360 555 ' +
	'C 392 548, 422 541, 450 538 ' +
	'C 468 536, 486 535, 500 535 ' +
	'C 514 535, 532 536, 550 538 ' +
	'C 578 541, 608 548, 640 555 ' +
	'C 675 566, 710 582, 750 590 ' +
	'C 788 598, 822 613, 850 624 ' +
	'C 870 644, 883 646, 886 632 ' +
	'C 888 618, 884 600, 878 578 ' +
	'C 862 522, 820 476, 786 441 ' +
	'C 790 439, 795 436, 800 428 ' +
	'C 798 420, 792 412, 786 404 ' +
	'C 752 358, 680 338, 640 338 ' +
	'C 590 340, 534 383, 500 382 Z';

const VectorLogo: React.FC = () => (
	<svg
		width={LOGO_SIZE}
		height={LOGO_SIZE}
		viewBox="0 0 1000 1000"
		style={{display: 'block'}}
	>
		<defs>
			<linearGradient id="sporttouchen-disc" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0%" stopColor="#C0267F" />
				<stop offset="30%" stopColor="#6E1F6A" />
				<stop offset="52%" stopColor="#3A1848" />
				<stop offset="80%" stopColor="#2B3F92" />
				<stop offset="100%" stopColor="#2F55B5" />
			</linearGradient>
			<clipPath id="sporttouchen-disc-clip">
				<circle cx="500" cy="500" r="500" />
			</clipPath>
		</defs>
		<g clipPath="url(#sporttouchen-disc-clip)">
			<rect
				x="0"
				y="0"
				width="1000"
				height="1000"
				fill="url(#sporttouchen-disc)"
			/>
			<path d={MOUSTACHE} fill="#FFFFFF" />
		</g>
	</svg>
);

const SporttouchenQuiz: React.FC<Props> = ({
	questions,
	lines,
	index,
	total,
	transparent,
	backdrop,
	logoSrc,
	accentFrom,
	accentTo,
	ink,
	surface,
	strokeWidth,
	strokeInk,
}) => {
	const frame = useCurrentFrame();

	const mode = transparent ? 'none' : backdrop;
	const gradient = `linear-gradient(90deg, ${accentFrom}, ${accentTo})`;

	const intro = interpolate(frame, [CARD_IN[0], CARD_IN[1]], [0, 1], {
		...CLAMP,
		easing: Easing.out(Easing.cubic),
	});
	const introScale = interpolate(intro, [0, 1], [0.92, 1]);

	const questionIn = interpolate(
		frame,
		[QUESTION_IN[0], QUESTION_IN[1]],
		[0, 1],
		{...CLAMP, easing: Easing.out(Easing.cubic)},
	);
	const questionY = (1 - questionIn) * QUESTION_RISE;

	/** Linear: time is linear in this brand, same clock as the timer's drain. */
	const fill =
		interpolate(frame, [TRACK_IN[0], TRACK_IN[1]], [0, 1], CLAMP) *
		(index / total);

	const envelope = speechEnvelope(frame);
	/** The mark talks: one breath-sized pulse, nothing else on the logo. */
	const logoScale = introScale * (1 + 0.035 * envelope);

	const question = questions[index - 1] ?? questions[0];
	const body = lines.length > 0 ? lines : [question];

	/** One entry per bar: which side, where it sits, how tall it is now. */
	const bars: {key: string; x: number; height: number; opacity: number}[] = [];
	for (let side = 0; side < 2; side++) {
		for (let i = 0; i < BAR_COUNT; i++) {
			const grow = interpolate(
				frame,
				[BAR_IN_START + i, BAR_IN_START + i + BAR_IN_LENGTH],
				[0, 1],
				{...CLAMP, easing: Easing.out(Easing.cubic)},
			);
			bars.push({
				key: `${side}-${i}`,
				x:
					side === 0
						? LEFT_INNER_X - i * BAR_STEP
						: RIGHT_INNER_X + i * BAR_STEP,
				height: barHeight(i, side, frame) * grow,
				opacity: grow,
			});
		}
	}

	return (
		<AbsoluteFill
			style={{
				backgroundColor:
					mode === 'brand'
						? surface
						: mode === 'grey'
							? '#7A7A7A'
							: 'transparent',
			}}
		>
			{mode === 'brand' ? (
				<AbsoluteFill
					style={{
						backgroundImage: `radial-gradient(900px 900px at ${WIDTH / 2}px 1400px, ${hexToRgba(
							accentTo,
							0.18,
						)} 0%, ${hexToRgba(accentTo, 0)} 70%)`,
					}}
				/>
			) : null}

			{/*
			  The group. Full frame width, its top edge on the hero line and then
			  pulled up by half its own height, so whatever height the card wraps
			  to, the card's centre lands on y 880. The card is this box's only
			  in-flow child, so the box IS the card's height — which is what lets
			  the logo layer hang off the card's top edge instead of off a fixed
			  y. Nothing here is clipped or scaled; the card and the logo each
			  carry their own transform.
			*/}
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: PLATE_CENTER_Y,
					width: WIDTH,
					translate: '0px -50%',
				}}
			>
				{/*
				  2 + 3. LOGO AND WAVEFORM, as one layer exactly LOGO_SIZE tall
				  whose bottom sits LOGO_GAP above the card's top edge
				  (`bottom: 100%` puts the margin edge on the card's top; the
				  marginBottom then lifts the box clear of it). Because the layer
				  is pinned to the card and not to a constant y, a short two-line
				  question moves the whole group down with the card and the 45px
				  of air is preserved.
				*/}
				<div
					style={{
						position: 'absolute',
						left: 0,
						width: WIDTH,
						height: LOGO_SIZE,
						bottom: '100%',
						marginBottom: LOGO_GAP,
					}}
				>
					{/* The mark: the client's PNG, untinted and unstroked. */}
					<div
						style={{
							position: 'absolute',
							left: LOGO_CX - LOGO_SIZE / 2,
							top: 0,
							width: LOGO_SIZE,
							height: LOGO_SIZE,
							scale: String(logoScale),
							opacity: intro,
						}}
					>
						{logoSrc === '' ? (
							<VectorLogo />
						) : (
							<Img
								src={staticFile(logoSrc)}
								style={{
									width: LOGO_SIZE,
									height: LOGO_SIZE,
									borderRadius: '50%',
									display: 'block',
								}}
							/>
						)}
					</div>

					{/* The bars, on the logo's own axis, growing up and down. */}
					{bars.map((bar) => (
						<div
							key={bar.key}
							style={{
								position: 'absolute',
								left: bar.x,
								top: LOGO_SIZE / 2 - bar.height / 2,
								width: BAR_W,
								height: bar.height,
								borderRadius: BAR_RADIUS,
								backgroundColor: ink,
								opacity: bar.opacity,
							}}
						/>
					))}
				</div>

				{/*
				  1. CARD. In flow, so its wrapped height drives the group above.
				  `overflow: hidden` is what clips the gradient header and the
				  body to the 12px corners.
				*/}
				<div
					style={{
						position: 'relative',
						marginLeft: PLATE_LEFT,
						width: PLATE_WIDTH,
						scale: String(introScale),
						opacity: intro,
						borderRadius: RADIUS,
						overflow: 'hidden',
					}}
				>
					{/* 1a. Header band — solid brand gradient, label, no stroke. */}
					<div
						style={{
							height: HEADER_HEIGHT,
							backgroundImage: gradient,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<span
							style={{
								fontFamily,
								fontWeight: 500,
								fontSize: LABEL_SIZE,
								lineHeight: 1,
								letterSpacing: '0.22em',
								// Balances the trailing letter-space so the label centres.
								marginRight: '-0.22em',
								textTransform: 'uppercase',
								color: ink,
							}}
						>
							{`Fråga ${index} / ${total}`}
						</span>
					</div>

					{/* 1b. Body — solid dark surface, the question, then the track. */}
					<div
						style={{
							backgroundColor: surface,
							padding: `${PAD_TOP}px ${PAD_X}px ${PAD_BOTTOM}px`,
						}}
					>
						<StrokedText
							color={ink}
							strokeColor={strokeInk}
							strokeWidth={strokeWidth}
							style={{
								fontFamily,
								fontWeight: 800,
								fontSize: QUESTION_SIZE,
								lineHeight: QUESTION_LINE_HEIGHT,
								letterSpacing: '-0.02em',
								// Balances the trailing letter-space so the lines centre.
								marginRight: '-0.02em',
								textAlign: 'center',
								translate: `0px ${questionY}px`,
								opacity: questionIn,
							}}
						>
							{body.map((line, i) => (
								<React.Fragment key={line}>
									{i === 0 ? null : <br />}
									{line}
								</React.Fragment>
							))}
						</StrokedText>

						{/* 1c. Progress track — ink 0.20 under a gradient segment. */}
						<div
							style={{
								marginTop: TRACK_GAP,
								height: TRACK_HEIGHT,
								borderRadius: TRACK_RADIUS,
								backgroundColor: hexToRgba(ink, TRACK_INK),
								overflow: 'hidden',
							}}
						>
							<div
								style={{
									width: `${fill * 100}%`,
									height: '100%',
									borderRadius: TRACK_RADIUS,
									backgroundImage: gradient,
								}}
							/>
						</div>
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};

export default SporttouchenQuiz;
