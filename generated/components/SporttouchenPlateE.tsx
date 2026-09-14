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
export const DURATION = 90;

/**
 * Sporttouchen question plate, option E — "Quizkortet".
 *
 * What the plate is made of, top to bottom, all inside one 920-wide card with
 * 12px corners and `overflow: hidden` so every part is clipped to those corners:
 * 1. Header band, 112px tall, filled with the one brand gradient
 *    (90deg #A300AF -> #520EF1). Centred in it: "FRÅGA 1 / 3", Medium 500,
 *    40px, uppercase, tracking 0.22em with the compensating negative
 *    marginRight. White ink, NO STROKE — the label is small and sits on the
 *    solid gradient, where a 4px band would close up the counters.
 * 2. Body, solid #0B0A12 (opaque, no blur, no transparency), padding
 *    64px 64px 56px. The question in ExtraBold 800, white, 66px, lineHeight
 *    1.1, centred, tracking -0.02em with the compensating marginRight. This is
 *    the one element that carries the house 4px OUTSIDE STROKE, in BLACK
 *    (white ink -> black stroke).
 * 3. Footer inside the body, 40px below the question: a progress track the
 *    full content width (920 - 2*64 = 792), 8px tall. Track is ink at 0.12; the
 *    fill segment is the same 90deg brand gradient and covers index/total of
 *    the width. Radius 4 on this one element only — a bar thinner than the
 *    house 12px radius would otherwise draw as a lozenge. No stroke here.
 *
 * The card's height is whatever the question wraps to; it is centred on the
 * hero line y = 880 with a translateY(-50%), so the plate grows up and down
 * around that line rather than off the bottom.
 *
 * Entrance, and nothing else — no fade-out, ever:
 * - Frames 0-18: the whole card scales 0.92 -> 1 and fades 0 -> 1,
 *   Easing.out(Easing.cubic), about its own centre.
 * - Frames 6-24: the question rises 40px into place, same easing. The header
 *   and the track do not move; only the question travels.
 * - Frames 12-30: the gradient segment fills 0 -> index/total LINEARLY. Time is
 *   linear in this brand, and this bar is the same clock as the timer's drain.
 */

const WIDTH = 1080;

/** Plate geometry: x 80..1000, vertical centre on the hero line. */
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

/** Gap between the question block and the progress track. */
const TRACK_GAP = 40;
const TRACK_HEIGHT = 8;
/** The one exception to the 12px house radius: see the header note. */
const TRACK_RADIUS = 4;

/** Entrance windows, in frames. */
const CARD_IN = [0, 18] as const;
const QUESTION_IN = [6, 24] as const;
const QUESTION_RISE = 40;
const TRACK_IN = [12, 30] as const;

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
	 * Optional manual line breaks. When non-empty these lines replace the
	 * natural wrap of `question`, so a bad last-line orphan can be fixed
	 * without touching the type size.
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

const SporttouchenPlateE: React.FC<Props> = ({
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

	const mode = transparent ? 'none' : backdrop;
	const gradient = `linear-gradient(90deg, ${accentFrom}, ${accentTo})`;

	const intro = interpolate(frame, [CARD_IN[0], CARD_IN[1]], [0, 1], {
		...CLAMP,
		easing: Easing.out(Easing.cubic),
	});
	const cardScale = interpolate(intro, [0, 1], [0.92, 1]);

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

	const body = lines.length > 0 ? lines : [question];

	return (
		<AbsoluteFill
			style={{
				backgroundColor:
					mode === 'brand' ? surface : mode === 'grey' ? '#7A7A7A' : 'transparent',
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
			  The card. Height is driven by the wrapped question, and the whole
			  thing is pulled up by half its own height so its centre lands on the
			  hero line. `overflow: hidden` is what clips the gradient header and
			  the body to the 12px corners.
			*/}
			<div
				style={{
					position: 'absolute',
					left: PLATE_LEFT,
					top: PLATE_CENTER_Y,
					width: PLATE_WIDTH,
					translate: '0px -50%',
					scale: String(cardScale),
					opacity: intro,
					borderRadius: RADIUS,
					overflow: 'hidden',
				}}
			>
				{/* 1. Header band — solid brand gradient, label, no stroke. */}
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

				{/* 2. Body — solid dark surface, the question, then the track. */}
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

					{/* 3. Progress track — ink 0.12 under a gradient segment. */}
					<div
						style={{
							marginTop: TRACK_GAP,
							height: TRACK_HEIGHT,
							borderRadius: TRACK_RADIUS,
							backgroundColor: hexToRgba(ink, 0.12),
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
		</AbsoluteFill>
	);
};

export default SporttouchenPlateE;
