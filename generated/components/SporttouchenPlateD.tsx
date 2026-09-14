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
 * family: ExtraBold (800) carries the question lines, Medium (500) the label.
 * No fallback stack on purpose.
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
 * Sporttouchen question plate — option D, "Ordplattor".
 *
 * What the plate is made of, top to bottom, all centred on x = 540 with the
 * whole stack's vertical centre at y = 880:
 * 1. A small brand-gradient pill (12px corners, padding 8/24) carrying
 *    "FRÅGA <index>" in MADE Tommy Soft Medium 500, 32px, uppercase, tracking
 *    0.22em with the compensating negative marginRight. Ink is white.
 * 2. A 20px gap, then one WHITE rounded plate per hard-wrapped line of the
 *    question (12px corners, padding 10/30), each sized to its own text
 *    (inline-block) and stacked with 14px gaps. The line text is ExtraBold
 *    800, 64px, lineHeight 1.05, tracking -0.02em with the compensating
 *    marginRight, filled with the one brand gradient (90deg #A300AF ->
 *    #520EF1) via background-clip: text, so the gradient spans that line's own
 *    plate rather than the whole stack.
 *
 * STROKE: OFF everywhere in this option. Gradient type on a white plate needs
 * no outside band, and the pill's white Medium label sits on the gradient at a
 * size where a stroke would only thicken it. So there is no stroked back copy
 * anywhere in this file — deliberately, not by omission.
 *
 * Motion, and nothing else: the pill pops in at frame 0 and each line plate
 * follows 4 frames after the one above it, every element scaling 0.9 -> 1 and
 * fading 0 -> 1 over 10 frames with Easing.out(Easing.cubic). Nothing fades
 * out, nothing else moves.
 */

export const FPS = 30;
export const DURATION = 90;

/** Stack geometry. */
const CX = 540;
const CY = 880;
const LINE_GAP = 14;
const PILL_GAP = 20;

/** Type. */
const LINE_SIZE = 64;
const LINE_HEIGHT = 1.05;
const LABEL_SIZE = 32;

/** Entrance. */
const POP_FRAMES = 10;
const POP_STAGGER = 4;

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
	/** Kept as the source of truth; `lines` is the hard wrap actually drawn. */
	question: z.string(),
	/** One white plate per entry. Empty falls back to a single plate. */
	lines: z.array(z.string()),
	index: z.number().int().min(1),
	total: z.number().int().min(1),
	/** True forces backdrop 'none' — the real overlay render. */
	transparent: z.boolean(),
	/** 'brand' = opaque hero, 'grey' = mid-grey footage stand-in, 'none' = alpha. */
	backdrop: z.enum(['brand', 'grey', 'none']),
	accentFrom: z.string(),
	accentTo: z.string(),
	ink: z.string(),
	plate: z.string(),
});

type Props = z.infer<typeof schema>;

export const defaultProps = schema.parse({
	question:
		'Vilken (fd) norsk landslagsspelare spelade i Marcus och Martinus FC förra året?',
	/**
	 * Four lines rather than five: at 64px the five-line split left every
	 * plate around 550px wide in a 1080 frame, which reads small. This wrap
	 * runs the two long lines out to ~815px — still inside the ~860px ceiling
	 * — so the stack fills the column, and no line ends on a single orphan.
	 */
	lines: [
		'Vilken (fd) norsk',
		'landslagsspelare spelade',
		'i Marcus och Martinus FC',
		'förra året?',
	],
	index: 1,
	total: 3,
	transparent: false,
	backdrop: 'brand',
	accentFrom: '#A300AF',
	accentTo: '#520EF1',
	ink: '#FFFFFF',
	plate: '#FFFFFF',
});

const SporttouchenPlateD: React.FC<Props> = ({
	question,
	lines,
	index,
	transparent,
	backdrop,
	accentFrom,
	accentTo,
	ink,
	plate,
}) => {
	const frame = useCurrentFrame();

	const surface = transparent ? 'none' : backdrop;
	const rows = lines.length > 0 ? lines : [question];

	/** Scale + fade for the nth element of the stack, pill first. */
	const pop = (order: number) => {
		const start = order * POP_STAGGER;
		const t = interpolate(frame, [start, start + POP_FRAMES], [0, 1], {
			...CLAMP,
			easing: Easing.out(Easing.cubic),
		});
		return {opacity: t, scale: interpolate(t, [0, 1], [0.9, 1])};
	};

	const pill = pop(0);

	return (
		<AbsoluteFill
			style={{
				backgroundColor:
					surface === 'brand' ? '#0B0A12' : surface === 'grey' ? '#7A7A7A' : 'transparent',
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

			{/* The whole stack, centred on x 540 with its vertical centre at y 880. */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: CY,
					translate: '0px -50%',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
				}}
			>
				<div
					style={{
						backgroundImage: `linear-gradient(90deg, ${accentFrom}, ${accentTo})`,
						borderRadius: 12,
						padding: '8px 24px',
						marginBottom: PILL_GAP,
						opacity: pill.opacity,
						scale: String(pill.scale),
					}}
				>
					<span
						style={{
							display: 'block',
							fontFamily,
							fontWeight: 500,
							fontSize: LABEL_SIZE,
							lineHeight: 1.1,
							letterSpacing: '0.22em',
							// Balances the trailing letter-space so the label centres.
							marginRight: '-0.22em',
							textTransform: 'uppercase',
							color: ink,
							whiteSpace: 'pre',
						}}
					>
						{`FRÅGA ${index}`}
					</span>
				</div>

				{rows.map((line, i) => {
					const step = pop(i + 1);
					return (
						<div
							key={`${i}-${line}`}
							style={{
								backgroundColor: plate,
								borderRadius: 12,
								padding: '10px 30px',
								marginTop: i === 0 ? 0 : LINE_GAP,
								opacity: step.opacity,
								scale: String(step.scale),
							}}
						>
							{/*
							  The gradient paints the text's own background box,
							  which is this line's plate minus its padding — so
							  each line carries a full left-to-right sweep of the
							  one brand gradient. No stroke copy in this option.
							*/}
							<span
								style={{
									display: 'block',
									fontFamily,
									fontWeight: 800,
									fontSize: LINE_SIZE,
									lineHeight: LINE_HEIGHT,
									letterSpacing: '-0.02em',
									// Balances the trailing letter-space.
									marginRight: '0.02em',
									whiteSpace: 'pre',
									color: 'transparent',
									backgroundImage: `linear-gradient(90deg, ${accentFrom}, ${accentTo})`,
									WebkitBackgroundClip: 'text',
									backgroundClip: 'text',
								}}
							>
								{line}
							</span>
						</div>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};

export default SporttouchenPlateD;
