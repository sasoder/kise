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
 * family: ExtraBold (800) carries the question, Medium (500) the label. There
 * is no fallback stack on purpose — if these do not load, the render is wrong
 * and should look wrong rather than quietly fall back to a system sans.
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
 * Sporttouchen question plate, option C — "Skylten" (the sign / broadcast plate).
 *
 * What the plate is made of, top to bottom:
 * 1. Backdrop (judging surface only, never part of the plate): 'brand' paints the
 *    opaque #0B0A12 hero with one low violet radial glow at 18% around y1400,
 *    'grey' paints flat #7A7A7A as a stand-in for footage, 'none' is fully
 *    transparent — the real overlay. `transparent: true` forces 'none'.
 * 2. The plate: one flat #0B0A12 rectangle at 0.92 alpha, 12px corners, x 80..1000
 *    (920 wide), height driven by its content, vertical centre pinned to y880.
 *    The alpha lives in the fill colour, not in an element opacity, so the type on
 *    top stays fully opaque over footage. No blur, no backdrop-filter, no shadow.
 * 3. The rail: a 14px band across the plate's full top edge, filled with the one
 *    brand gradient (90deg #A300AF -> #520EF1). It is a child of the plate and the
 *    plate clips (overflow hidden, same 12px radius), so the rail follows the
 *    corner radius instead of squaring off the top.
 * 4. Label "FRÅGA {index} AV {total}", Medium 500 / 34px / uppercase, tracking
 *    0.22em with the compensating negative marginRight, filled with the brand
 *    gradient via background-clip. 24px gap below it.
 * 5. Question, ExtraBold 800 / 66px / lineHeight 1.1, white, centred, tracking
 *    -0.02em with its compensating marginRight.
 *
 * Stroke: ON for the question — 4px OUTSIDE, BLACK (white ink over a dark plate
 * that may sit over bright footage; the band is what keeps it crisp at phone
 * size). OFF for the label — a gradient-filled 34px line is too small to carry a
 * 4px band without closing up its counters, and the brief calls for no stroke
 * there. The outside stroke is built as a stroked copy (color transparent,
 * -webkit-text-stroke at 2 * strokeWidth, i.e. centred 8px of which only the
 * outer 4px survives) sitting behind a fill copy, both inheriting one set of text
 * metrics — family, weight, size, tracking, line-height and the fixed column
 * width — from one shared wrapper, so the two copies wrap identically and cannot
 * drift apart. Never a centred stroke on the fill glyph itself.
 *
 * Motion, and nothing else:
 * - Frames 0-18: the plate scales 0.92 -> 1 and fades 0 -> 1, Easing.out(cubic).
 * - Frames 4-18: the rail wipes left to right, scaleX 0 -> 1 from its left edge.
 * - Frames 6-24: label and question rise 40px into place, Easing.out(cubic).
 * Nothing fades out.
 */

const WIDTH = 1080;

/** Plate box: x 80..1000, vertical centre on the hero line at y880. */
const PLATE_LEFT = 80;
const PLATE_WIDTH = 920;
const PLATE_CENTER_Y = 880;
const PLATE_RADIUS = 12;
const PLATE_ALPHA = 0.92;

const PAD_TOP = 56;
const PAD_X = 64;
const PAD_BOTTOM = 64;

const RAIL_HEIGHT = 14;

const LABEL_SIZE = 34;
const LABEL_GAP = 24;
const QUESTION_SIZE = 66;
const QUESTION_LINE_HEIGHT = 1.1;

const RISE = 40;

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
	/** Manual line breaks. Empty array lets the column wrap on its own. */
	lines: z.array(z.string()),
	index: z.number().int().min(1),
	total: z.number().int().min(1),
	/** True renders the plate over their footage; forces backdrop 'none'. */
	transparent: z.boolean(),
	/** Judging surface behind the plate, not part of the plate itself. */
	backdrop: z.enum(['brand', 'grey', 'none']),
	accentFrom: z.string(),
	accentTo: z.string(),
	ink: z.string(),
	surface: z.string(),
	/** Visible outside band on the question, in px at 1080 wide. */
	strokeWidth: z.number().min(0),
	strokeInk: z.string(),
});

type Props = z.infer<typeof schema>;

export const defaultProps = schema.parse({
	question:
		'Vilken (fd) norsk landslagsspelare spelade i Marcus och Martinus FC förra året?',
	lines: [],
	index: 1,
	total: 3,
	transparent: false,
	backdrop: 'brand',
	accentFrom: '#A300AF',
	accentTo: '#520EF1',
	ink: '#FFFFFF',
	surface: '#0B0A12',
	strokeWidth: 4,
	strokeInk: '#000000',
});

const SporttouchenPlateC: React.FC<Props> = ({
	question,
	lines,
	index,
	total,
	transparent,
	backdrop,
	accentFrom,
	accentTo,
	ink,
	surface,
	strokeWidth,
	strokeInk,
}) => {
	const frame = useCurrentFrame();

	const surfaceMode = transparent ? 'none' : backdrop;
	const gradient = `linear-gradient(90deg, ${accentFrom}, ${accentTo})`;

	/** Plate: scale + fade, frames 0-18. */
	const intro = interpolate(frame, [0, 18], [0, 1], {
		...CLAMP,
		easing: Easing.out(Easing.cubic),
	});
	const plateScale = interpolate(intro, [0, 1], [0.92, 1]);

	/** Rail: left-to-right wipe, frames 4-18. */
	const wipe = interpolate(frame, [4, 18], [0, 1], {
		...CLAMP,
		easing: Easing.out(Easing.cubic),
	});

	/** Type: rises 40px into place, frames 6-24. */
	const rise = interpolate(frame, [6, 24], [RISE, 0], {
		...CLAMP,
		easing: Easing.out(Easing.cubic),
	});

	const body = lines.length > 0 ? lines.join('\n') : question;
	const columnWidth = PLATE_WIDTH - PAD_X * 2;

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
						backgroundImage: `radial-gradient(900px 900px at ${
							WIDTH / 2
						}px 1400px, ${hexToRgba(accentTo, 0.18)} 0%, ${hexToRgba(
							accentTo,
							0,
						)} 70%)`,
					}}
				/>
			) : null}

			{/*
			  The plate. Height is content-driven, so it is laid out normally and
			  pulled back by half its own height to sit centred on y880. overflow
			  hidden + the 12px radius is what makes the rail follow the corners.
			*/}
			<div
				style={{
					position: 'absolute',
					left: PLATE_LEFT,
					top: PLATE_CENTER_Y,
					width: PLATE_WIDTH,
					transform: `translateY(-50%) scale(${plateScale})`,
					transformOrigin: 'center center',
					opacity: intro,
					backgroundColor: hexToRgba(surface, PLATE_ALPHA),
					borderRadius: PLATE_RADIUS,
					overflow: 'hidden',
				}}
			>
				<div
					style={{
						position: 'absolute',
						left: 0,
						top: 0,
						width: '100%',
						height: RAIL_HEIGHT,
						backgroundImage: gradient,
						transform: `scaleX(${wipe})`,
						transformOrigin: 'left center',
					}}
				/>

				<div
					style={{
						padding: `${PAD_TOP}px ${PAD_X}px ${PAD_BOTTOM}px`,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						textAlign: 'center',
					}}
				>
					{/* Label: gradient fill, no stroke. */}
					<div
						style={{
							transform: `translateY(${rise}px)`,
							marginBottom: LABEL_GAP,
							fontFamily,
							fontWeight: 500,
							fontSize: LABEL_SIZE,
							lineHeight: 1.2,
							letterSpacing: '0.22em',
							// Balances the trailing letter-space so the line centres.
							marginRight: '-0.22em',
							textTransform: 'uppercase',
							color: 'transparent',
							backgroundImage: gradient,
							WebkitBackgroundClip: 'text',
							backgroundClip: 'text',
						}}
					>
						{`FRÅGA ${index} AV ${total}`}
					</div>

					{/*
					  One wrapper carries every metric — family, weight, size, tracking,
					  line-height, column width and the trailing-space balance — so the
					  stroke copy and the fill copy wrap from identical text metrics and
					  cannot drift apart. Both are positioned, so DOM order alone decides
					  which paints on top.
					*/}
					<div
						style={{
							position: 'relative',
							transform: `translateY(${rise}px)`,
							width: columnWidth,
							fontFamily,
							fontWeight: 800,
							fontSize: QUESTION_SIZE,
							lineHeight: QUESTION_LINE_HEIGHT,
							letterSpacing: '-0.02em',
							// Balances the trailing letter-space so the lines centre.
							marginRight: '-0.02em',
							whiteSpace: 'pre-wrap',
							textAlign: 'center',
						}}
					>
						<span
							style={{
								position: 'absolute',
								left: 0,
								top: 0,
								width: '100%',
								color: 'transparent',
								// Centred, so half of it survives outside the fill.
								WebkitTextStrokeWidth: `${strokeWidth * 2}px`,
								WebkitTextStrokeColor: strokeInk,
							}}
						>
							{body}
						</span>
						<span style={{position: 'relative', color: ink}}>{body}</span>
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};

export default SporttouchenPlateC;
