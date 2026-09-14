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
 * family: ExtraBold (800) carries the question, Medium (500) the label. No
 * fallback stack on purpose — if these do not load the render is wrong and
 * should look wrong.
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
 * Sporttouchen question plate, option A — "Knappen": the brand button as a
 * plate.
 *
 * What the plate is made of, and nothing else:
 * 1. ONE solid brand-gradient rounded rectangle, `linear-gradient(90deg,
 *    #A300AF, #520EF1)`, 12px corners, x 80..1000 (width 920), padding
 *    64px 72px, height driven by its content, vertical centre pinned to
 *    y = 880. No shadow, no border, no second surface.
 * 2. Inside it, a centred column: the label "FRÅGA <index>" in Medium 500 at
 *    36px, uppercase, tracking 0.22em with the compensating negative
 *    marginRight, white at 0.85; a 28px gap; then the question in ExtraBold
 *    800 at 68px, white, lineHeight 1.1, tracking -0.02em with its own
 *    compensating marginRight, centred and balanced.
 * 3. Backdrop, behind the plate only: 'brand' paints the opaque #0B0A12 with
 *    one violet radial glow at 18% around y1400, 'grey' a flat #7A7A7A stand-in
 *    for footage, 'none' nothing at all (the real overlay). `transparent: true`
 *    forces 'none'.
 *
 * STROKE: OFF everywhere in this option, with no exception. The plate itself
 * carries the contrast — white ink on a saturated gradient needs no outside
 * band, and adding one would fight the flat button read. (Elsewhere in the
 * Sporttouchen style a big glyph gets a 4px outside stroke built as a stroked
 * copy behind the fill copy; option A deliberately does not.)
 *
 * Motion, entrance only, and nothing else ever fades out:
 * - Frames 0-18: the whole plate scales 0.92 -> 1 and fades 0 -> 1,
 *   Easing.out(Easing.cubic), scaled about its own centre at (540, 880).
 * - Frames 6-24: the question text rises 40px into place, same easing. The
 *   label does not move.
 */

const CX = 540;
const CY = 880;

const PLATE_LEFT = 80;
const PLATE_WIDTH = 920;
const PLATE_RADIUS = 12;
const PLATE_PAD_Y = 64;
const PLATE_PAD_X = 72;

const LABEL_SIZE = 36;
const LABEL_GAP = 28;
const QUESTION_SIZE = 68;
const QUESTION_LINE_HEIGHT = 1.1;

const INTRO_END = 18;
const RISE_START = 6;
const RISE_END = 24;
const RISE_DISTANCE = 40;

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

export const FPS = 30;
export const DURATION = 90;

export const schema = z.object({
	question: z.string(),
	/** Which question this is; drives the label text. */
	index: z.number().int().min(1),
	/** How many questions in the set. Carried for the set, unused in option A. */
	total: z.number().int().min(1),
	/** True forces backdrop 'none' — the real overlay render. */
	transparent: z.boolean(),
	/** 'brand' = dark hero, 'grey' = mid-grey footage stand-in, 'none' = alpha. */
	backdrop: z.enum(['brand', 'grey', 'none']),
	/**
	 * Optional manual line breaks for the question. Empty means let the plate
	 * wrap it on its own width.
	 */
	lines: z.array(z.string()),
	labelPrefix: z.string(),
	accentFrom: z.string(),
	accentTo: z.string(),
	ink: z.string(),
	surface: z.string(),
});

type Props = z.infer<typeof schema>;

export const defaultProps = schema.parse({
	question:
		'Vilken (fd) norsk landslagsspelare spelade i Marcus och Martinus FC förra året?',
	index: 1,
	total: 3,
	transparent: false,
	backdrop: 'brand',
	lines: [],
	labelPrefix: 'FRÅGA',
	accentFrom: '#A300AF',
	accentTo: '#520EF1',
	ink: '#FFFFFF',
	surface: '#0B0A12',
});

const SporttouchenPlateA: React.FC<Props> = ({
	question,
	index,
	transparent,
	backdrop,
	lines,
	labelPrefix,
	accentFrom,
	accentTo,
	ink,
	surface,
}) => {
	const frame = useCurrentFrame();

	const intro = interpolate(frame, [0, INTRO_END], [0, 1], {
		...CLAMP,
		easing: Easing.out(Easing.cubic),
	});
	const plateScale = interpolate(intro, [0, 1], [0.92, 1]);

	const rise = interpolate(frame, [RISE_START, RISE_END], [1, 0], {
		...CLAMP,
		easing: Easing.out(Easing.cubic),
	});

	const surfaceMode = transparent ? 'none' : backdrop;

	return (
		<AbsoluteFill
			style={{
				backgroundColor:
					surfaceMode === 'brand'
						? surface
						: surfaceMode === 'grey'
							? '#7A7A7A'
							: 'transparent',
			}}
		>
			{surfaceMode === 'brand' ? (
				<AbsoluteFill
					style={{
						backgroundImage: `radial-gradient(900px 900px at ${CX}px 1400px, ${hexToRgba(
							accentTo,
							0.18,
						)} 0%, ${hexToRgba(accentTo, 0)} 70%)`,
					}}
				/>
			) : null}

			{/*
			  The plate. Height is whatever the column inside needs; the wrapper
			  is pinned at y = 880 and pulled up by half its own height, so the
			  plate's vertical centre sits on the hero line regardless of how
			  many lines the question wraps to.
			*/}
			<div
				style={{
					position: 'absolute',
					left: PLATE_LEFT,
					width: PLATE_WIDTH,
					top: CY,
					translate: '0px -50%',
					scale: plateScale,
					opacity: intro,
					padding: `${PLATE_PAD_Y}px ${PLATE_PAD_X}px`,
					boxSizing: 'border-box',
					borderRadius: PLATE_RADIUS,
					backgroundImage: `linear-gradient(90deg, ${accentFrom}, ${accentTo})`,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
				}}
			>
				<div
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
						opacity: 0.85,
					}}
				>
					{`${labelPrefix} ${index}`}
				</div>

				<div
					style={{
						marginTop: LABEL_GAP,
						translate: `0px ${RISE_DISTANCE * rise}px`,
						fontFamily,
						fontWeight: 800,
						fontSize: QUESTION_SIZE,
						lineHeight: QUESTION_LINE_HEIGHT,
						letterSpacing: '-0.02em',
						// Balances the trailing letter-space so the block centres.
						marginRight: '-0.02em',
						textAlign: 'center',
						textWrap: 'balance',
						color: ink,
					}}
				>
					{lines.length === 0
						? question
						: lines.map((line, i) => <div key={`${i}-${line}`}>{line}</div>)}
				</div>
			</div>
		</AbsoluteFill>
	);
};

export default SporttouchenPlateA;
