import {loadFont} from '@remotion/fonts';
import React from 'react';
import {
	AbsoluteFill,
	Easing,
	interpolate,
	staticFile,
	useCurrentFrame,
} from 'remotion';
import {z} from 'zod';

/**
 * The client's brand face, loaded from `public/` at module scope so a missing
 * or broken file surfaces before a single frame is drawn. Two weights of one
 * family: ExtraBold (800) carries the numeral and the question, Medium (500)
 * is loaded for parity with the rest of the Sporttouchen set. There is no
 * fallback stack on purpose — if these do not load, the render is wrong and
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

/**
 * Sporttouchen question plate — option B, "Ramen" (the frame).
 *
 * What the plate is made of, top to bottom:
 * 1. An outline rectangle: no fill, 6px white stroke, 12px corners, x 80..1000
 *    (width 920), height driven by the number of question lines with padding
 *    96 / 64 / 64 (extra at the top so the numeral has room to break in). Its
 *    vertical centre sits at y 880. It is drawn as ONE open SVG path that runs
 *    from the right of the gap, round the whole rectangle, and back to the left
 *    of the gap — so the top edge is genuinely missing behind the numeral
 *    rather than being covered by a patch. The gap is the numeral's width plus
 *    40px of air each side.
 * 2. The index numeral, ExtraBold 800 at 220px, centred on x 540 with its
 *    optical centre on the plate's top stroke line, so it breaks the frame.
 *    Filled with the brand gradient (90deg #A300AF -> #520EF1, background-clip
 *    text). There is no label in this option: the numeral is the label.
 * 3. The question, ExtraBold 800 at 66px, white, lineHeight 1.1, centred, one
 *    <div> per line so the wrap is authored rather than left to the browser.
 *
 * Where the stroke is on and off — every stroke is an OUTSIDE stroke, built as
 * a stroked copy (`color: transparent`, centred `-webkit-text-stroke` of
 * 2 * strokeWidth) sitting behind a fill copy, both inheriting one set of text
 * metrics from a shared wrapper. A centred stroke is half-eaten by the fill
 * painted over it, so 8px centred reads as 4px outside.
 * - Numeral: stroke ON, 4px, WHITE (the fill is the gradient).
 * - Question: stroke ON, 4px, BLACK (the fill is white ink). This option is
 *   designed to sit over footage with no plate fill behind it, so the type has
 *   to protect itself.
 * - The rectangle outline is an SVG stroke, not type, and carries no second
 *   stroke of its own.
 *
 * Motion, and nothing else: the outline and the question scale 0.92 -> 1 and
 * fade 0 -> 1 over frames 0-18, Easing.out(Easing.cubic); the numeral rises
 * from +130px and fades in over frames 4-16 with the same easing, inside the
 * same scaled group so it stays registered with its gap. Nothing fades out.
 */

const FRAME_W = 1080;
const FRAME_H = 1920;

export const FPS = 30;
export const DURATION = 90;

/** Plate geometry. Width 920 on the phone-first centred column. */
const CX = 540;
const CY = 880;
const PLATE_X0 = 80;
const PLATE_X1 = 1000;
const PLATE_RADIUS = 12;
const PLATE_STROKE = 6;

/** Padding inside the plate: extra at the top so the numeral has air. */
const PAD_TOP = 96;
const PAD_X = 64;
const PAD_BOTTOM = 64;

const QUESTION_SIZE = 66;
const QUESTION_LINE_HEIGHT = 1.1;

const NUMERAL_SIZE = 220;
/**
 * Tommy Soft's digits sit a little below the centre of a line-height: 1 box —
 * short cap height relative to the em, rounded terminals pushing the optical
 * mass down — so the numeral is nudged up to read centred on the stroke line.
 * The timer uses -5.5 at 400px; this is the same ratio at 220px.
 */
const NUMERAL_NUDGE_Y = -3;
/**
 * "1" carries unequal side bearings, so its ink sits left of its advance box.
 * Measured off a render and taken back so the digit's ink — not its metrics —
 * centres on x 540, which is where the gap in the top edge is centred.
 */
const NUMERAL_NUDGE_X = 7;
/** Air left between the digit's outer edge and each end of the top stroke. */
const GAP_PAD = 40;

const INTRO_END = 18;
const NUMERAL_IN = [4, 16] as const;
const NUMERAL_RISE = 130;

const CLAMP = {
	extrapolateLeft: 'clamp',
	extrapolateRight: 'clamp',
} as const;

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

export const schema = z.object({
	question: z.string(),
	/**
	 * Authored line breaks for the question. Empty falls back to one
	 * auto-wrapping line, which makes the plate height wrong, so it is only
	 * there as an escape hatch.
	 */
	lines: z.array(z.string()),
	index: z.number().int().min(1),
	total: z.number().int().min(1),
	/** True forces backdrop 'none' — the real overlay render. */
	transparent: z.boolean(),
	/**
	 * 'brand' paints the opaque hero (#0B0A12 + one low violet glow), 'grey' a
	 * flat mid-grey stand-in for footage, 'none' nothing at all.
	 */
	backdrop: z.enum(['brand', 'grey', 'none']).default('brand'),
	accentFrom: z.string(),
	accentTo: z.string(),
	ink: z.string(),
	/** Visible outside band, in px at 1080 wide. */
	strokeWidth: z.number().min(0),
	/** Stroke under white ink. */
	strokeInk: z.string(),
	/** Stroke under gradient-filled type. */
	strokeAccent: z.string(),
	/**
	 * Measured ink width of the index numeral at NUMERAL_SIZE, stroke included.
	 * Drives the gap in the top edge; measured off a render rather than guessed.
	 */
	numeralWidth: z.number().min(0),
});

type Props = z.infer<typeof schema>;

export const defaultProps = schema.parse({
	question:
		'Vilken (fd) norsk landslagsspelare spelade i Marcus och Martinus FC förra året?',
	lines: [
		'Vilken (fd) norsk',
		'landslagsspelare',
		'spelade i Marcus och',
		'Martinus FC förra året?',
	],
	index: 1,
	total: 3,
	transparent: false,
	backdrop: 'brand',
	accentFrom: '#A300AF',
	accentTo: '#520EF1',
	ink: '#FFFFFF',
	strokeWidth: 4,
	strokeInk: '#000000',
	strokeAccent: '#FFFFFF',
	numeralWidth: 92,
});

/**
 * One block of display type drawn twice from a single set of metrics: a back
 * copy carrying only a centred stroke, a front copy carrying only the fill.
 */
const StrokedLines: React.FC<{
	lines: string[];
	width: number;
	fontSize: number;
	strokeWidth: number;
	strokeColor: string;
	fill: string;
}> = ({lines, width, fontSize, strokeWidth, strokeColor, fill}) => {
	const metrics: React.CSSProperties = {
		width,
		fontFamily,
		fontWeight: 800,
		fontSize,
		lineHeight: QUESTION_LINE_HEIGHT,
		letterSpacing: '-0.02em',
		textAlign: 'center',
	};
	// The tracking is negative, so each line box is short by 0.02em on the
	// right and the centred line would sit that much right of true centre; the
	// per-line margin takes the same amount back off the box.
	const body = lines.map((line, i) => (
		<div key={i} style={{marginRight: '0.02em'}}>
			{line}
		</div>
	));
	return (
		<div style={{position: 'relative', ...metrics}}>
			<div
				style={{
					...metrics,
					position: 'absolute',
					left: 0,
					top: 0,
					color: 'transparent',
					// Centred, so half of it survives outside the fill copy.
					WebkitTextStrokeWidth: `${strokeWidth * 2}px`,
					WebkitTextStrokeColor: strokeColor,
				}}
			>
				{body}
			</div>
			<div style={{...metrics, position: 'relative', color: fill}}>{body}</div>
		</div>
	);
};

const SporttouchenPlateB: React.FC<Props> = ({
	question,
	lines,
	index,
	transparent,
	backdrop,
	accentFrom,
	accentTo,
	ink,
	strokeWidth,
	strokeInk,
	strokeAccent,
	numeralWidth,
}) => {
	const frame = useCurrentFrame();

	const surface = transparent ? 'none' : backdrop;

	const body = lines.length > 0 ? lines : [question];
	const textHeight = body.length * QUESTION_SIZE * QUESTION_LINE_HEIGHT;
	const plateHeight = PAD_TOP + textHeight + PAD_BOTTOM;
	const plateTop = CY - plateHeight / 2;
	const plateBottom = plateTop + plateHeight;

	/** Half the missing span in the top edge, centred on x 540. */
	const gapHalf = numeralWidth / 2 + GAP_PAD;
	const gapLeft = CX - gapHalf;
	const gapRight = CX + gapHalf;

	const r = PLATE_RADIUS;
	const outline = [
		`M ${gapRight} ${plateTop}`,
		`L ${PLATE_X1 - r} ${plateTop}`,
		`A ${r} ${r} 0 0 1 ${PLATE_X1} ${plateTop + r}`,
		`L ${PLATE_X1} ${plateBottom - r}`,
		`A ${r} ${r} 0 0 1 ${PLATE_X1 - r} ${plateBottom}`,
		`L ${PLATE_X0 + r} ${plateBottom}`,
		`A ${r} ${r} 0 0 1 ${PLATE_X0} ${plateBottom - r}`,
		`L ${PLATE_X0} ${plateTop + r}`,
		`A ${r} ${r} 0 0 1 ${PLATE_X0 + r} ${plateTop}`,
		`L ${gapLeft} ${plateTop}`,
	].join(' ');

	const intro = interpolate(frame, [0, INTRO_END], [0, 1], {
		...CLAMP,
		easing: Easing.out(Easing.cubic),
	});
	const plateScale = interpolate(intro, [0, 1], [0.92, 1]);

	const numeralIn = interpolate(frame, [NUMERAL_IN[0], NUMERAL_IN[1]], [0, 1], {
		...CLAMP,
		easing: Easing.out(Easing.cubic),
	});
	const numeralY = NUMERAL_RISE * (1 - numeralIn);

	return (
		<AbsoluteFill
			style={{
				backgroundColor:
					surface === 'brand'
						? '#0B0A12'
						: surface === 'grey'
							? '#7A7A7A'
							: 'transparent',
			}}
		>
			{surface === 'brand' ? (
				<AbsoluteFill
					style={{
						backgroundImage: `radial-gradient(900px 900px at ${CX}px 1400px, ${hexToRgba(
							accentTo,
							0.18,
						)} 0%, ${hexToRgba(accentTo, 0)} 70%)`,
					}}
				/>
			) : null}

			{/* Outline, question and numeral pop as one object. */}
			<AbsoluteFill
				style={{
					opacity: intro,
					scale: String(plateScale),
					transformOrigin: `${CX}px ${CY}px`,
				}}
			>
				<svg
					width={FRAME_W}
					height={FRAME_H}
					viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
					style={{position: 'absolute', inset: 0}}
				>
					<path
						d={outline}
						fill="none"
						stroke={ink}
						strokeWidth={PLATE_STROKE}
						strokeLinejoin="round"
					/>
				</svg>

				{/* Question block, centred in the padded column. */}
				<div
					style={{
						position: 'absolute',
						left: PLATE_X0 + PAD_X,
						top: plateTop + PAD_TOP,
						width: PLATE_X1 - PLATE_X0 - PAD_X * 2,
						height: textHeight,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<StrokedLines
						lines={body}
						width={PLATE_X1 - PLATE_X0 - PAD_X * 2}
						fontSize={QUESTION_SIZE}
						strokeWidth={strokeWidth}
						strokeColor={strokeInk}
						fill={ink}
					/>
				</div>

				{/* Numeral, optically centred on the top stroke line. */}
				<div
					style={{
						position: 'absolute',
						left: 0,
						right: 0,
						top: plateTop,
						height: 0,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						translate: `${NUMERAL_NUDGE_X}px ${numeralY + NUMERAL_NUDGE_Y}px`,
						opacity: numeralIn,
					}}
				>
					<div
						style={{
							position: 'relative',
							fontFamily,
							fontWeight: 800,
							fontSize: NUMERAL_SIZE,
							lineHeight: 1,
							letterSpacing: '-0.02em',
							marginRight: '0.02em',
						}}
					>
						<span
							style={{
								position: 'absolute',
								left: 0,
								top: 0,
								color: 'transparent',
								WebkitTextStrokeWidth: `${strokeWidth * 2}px`,
								WebkitTextStrokeColor: strokeAccent,
							}}
						>
							{index}
						</span>
						<span
							style={{
								position: 'relative',
								color: 'transparent',
								backgroundImage: `linear-gradient(90deg, ${accentFrom}, ${accentTo})`,
								WebkitBackgroundClip: 'text',
								backgroundClip: 'text',
							}}
						>
							{index}
						</span>
					</div>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

export default SporttouchenPlateB;
