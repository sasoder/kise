import {loadFont} from '@remotion/fonts';
import React from 'react';
import {
	AbsoluteFill,
	Easing,
	interpolate,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {z} from 'zod';

/**
 * The client's brand face, loaded from `public/` at module scope so a missing
 * or broken file surfaces before a single frame is drawn. Two weights of one
 * family: ExtraBold (800) carries the numeral, Medium (500) the label. There
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

export const FPS = 30;

/**
 * Sporttouchen 15 s countdown. Brand ring + MADE Tommy Soft numeral.
 *
 * Motion, and nothing else:
 * 1. Intro, frames 0-18: ring + numeral scale 0.92 -> 1 and fade 0 -> 1,
 *    Easing.out(Easing.cubic). The label is off by default (empty string); when
 *    one is passed it fades in over frames 8-24 at the same place as before.
 * 2. Tick, every 30 frames (30, 60 ... 450): the outgoing numeral slides up
 *    130px and the incoming one rises from +130px over 8 frames; the ring
 *    group pops 1 -> 1.03 -> 1 over the same 8 frames. The crossfade is
 *    front-loaded so the two digits never sit half-lit on top of each other:
 *    the outgoing one is gone by frame 3 of the tick, Easing.in(Easing.quad),
 *    and the incoming one only starts lighting at frame 2 and finishes at 8,
 *    Easing.out(Easing.quad). On the integer frames those windows never both
 *    carry ink — at tick frame 2 the incoming digit is still exactly 0 — so no
 *    rendered frame stacks two half-lit numerals, which is what makes the swap
 *    read as a swap and not as mush.
 * 3. Last three, ticks landing on 3, 2 and 1: same mechanics, pop is 1.06 and
 *    the incoming numeral is filled with the brand gradient.
 * 4. Zero, frame 450: "0" arrives with the gradient fill and the 1.06 pop as
 *    the arc reaches zero length; one thin ring (stroke 6) expands from the
 *    ring radius outward over frames 450-478, ink 0.6 -> 0. Then the
 *    frame holds, frames 478-479. Nothing fades out at the end.
 *
 * Outside stroke on the numeral: every digit is drawn twice in the same masked
 * box — a back copy with `color: transparent` and a centred text stroke of
 * 2 * strokeWidth, and the front copy carrying the real fill. A centred stroke
 * half-eats the letterform, so only the outer half survives once the fill is
 * painted over it: 8px centred reads as 4px outside. Both copies inherit one
 * set of text metrics from their wrapper and are driven by the same slide and
 * opacity, so they cannot separate mid-tick. The colour follows the digit's own
 * state, not the clock's: black under plain ink, white under the gradient, so
 * the 4 -> 3 tick swaps a black-stroked "4" out for a white-stroked "3" with no
 * extra animation.
 */

const WIDTH = 1080;
const HEIGHT = 1920;

/** Ring geometry: outer diameter 720 with a 36 stroke centred on r = 342. */
const CX = 540;
const CY = 880;
const OUTER_R = 360;
const STROKE = 36;
const R = OUTER_R - STROKE / 2;
const INNER_R = OUTER_R - STROKE;
const CIRCUMFERENCE = 2 * Math.PI * R;

/** Tick transition length, and how far a numeral travels while it swaps. */
const TICK = 8;
const SLIDE = 130;
/**
 * Crossfade windows inside the tick. Front-loaded: the outgoing digit is fully
 * gone one frame after the incoming one starts, so no frame carries two
 * half-lit numerals stacked on each other.
 */
const FADE_OUT_END = 3;
const FADE_IN_START = 2;

const NUMERAL_SIZE = 400;
/**
 * Tommy Soft's digits sit a little below the centre of a line-height: 1 box —
 * its cap height is short relative to the em and the rounded terminals push
 * the optical mass down further than Montserrat's flat ones did — so the
 * numeral is nudged up to read centred in the ring.
 */
const NUMERAL_NUDGE_Y = -5.5;

const LABEL_SIZE = 44;
const LABEL_Y = 1330;

/**
 * Burst ring at zero. Growth is capped so the ring never reaches the frame
 * edge: at +220 it leaves the 1080 frame while still at ~0.3 opacity and
 * reads as clipped, so it stops at r = 500.
 */
const BURST_FRAMES = 28;
const BURST_GROW = 158;

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
	seconds: z.number().int().min(1).max(99),
	/** True renders the ring over their footage; false paints the dark hero. */
	transparent: z.boolean(),
	accentFrom: z.string(),
	accentTo: z.string(),
	ink: z.string(),
	/** Empty string hides the label. */
	label: z.string(),
	/** Visible outside band on the numeral, in px at 1080 wide. */
	strokeWidth: z.number().min(0),
	/** Stroke under a plain-ink numeral. */
	strokeInk: z.string(),
	/** Stroke under a gradient numeral. */
	strokeAccent: z.string(),
});

type Props = z.infer<typeof schema>;

export const defaultProps = schema.parse({
	seconds: 15,
	transparent: false,
	accentFrom: '#A300AF',
	accentTo: '#520EF1',
	ink: '#FFFFFF',
	label: '',
	strokeWidth: 4,
	strokeInk: '#000000',
	strokeAccent: '#FFFFFF',
});

export const DURATION = defaultProps.seconds * FPS + 30;

const Numeral: React.FC<{
	value: number;
	offsetY: number;
	opacity: number;
	gradient: boolean;
	accentFrom: string;
	accentTo: string;
	ink: string;
	strokeWidth: number;
	strokeInk: string;
	strokeAccent: string;
}> = ({
	value,
	offsetY,
	opacity,
	gradient,
	accentFrom,
	accentTo,
	ink,
	strokeWidth,
	strokeInk,
	strokeAccent,
}) => {
	/**
	 * A gradient digit gets the light stroke, a plain one the dark stroke. The
	 * choice is per numeral, so during a tick the outgoing and incoming digits
	 * can carry different stroke colours without any extra animation.
	 */
	const strokeColor = gradient ? strokeAccent : strokeInk;
	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				translate: `0px ${offsetY + NUMERAL_NUDGE_Y}px`,
				opacity,
			}}
		>
			{/*
			  One wrapper carries every metric — family, weight, size, tracking,
			  line-height and the trailing-space balance — so the stroke copy and
			  the fill copy are laid out from identical text metrics and cannot
			  drift apart. Both copies are positioned, so DOM order alone decides
			  which paints on top.
			*/}
			<div
				style={{
					position: 'relative',
					fontFamily,
					fontWeight: 800,
					fontSize: NUMERAL_SIZE,
					lineHeight: 1,
					letterSpacing: '-0.02em',
					// Balances the trailing letter-space so the digits centre.
					marginRight: '0.02em',
				}}
			>
				<span
					style={{
						position: 'absolute',
						left: 0,
						top: 0,
						color: 'transparent',
						// Centred, so half of it survives outside the fill.
						WebkitTextStrokeWidth: `${strokeWidth * 2}px`,
						WebkitTextStrokeColor: strokeColor,
					}}
				>
					{value}
				</span>
				<span
					style={{
						position: 'relative',
						color: gradient ? 'transparent' : ink,
						backgroundImage: gradient
							? `linear-gradient(90deg, ${accentFrom}, ${accentTo})`
							: undefined,
						WebkitBackgroundClip: gradient ? 'text' : undefined,
						backgroundClip: gradient ? 'text' : undefined,
					}}
				>
					{value}
				</span>
			</div>
		</div>
	);
};

const SporttouchenTimer: React.FC<Props> = ({
	seconds,
	transparent,
	accentFrom,
	accentTo,
	ink,
	label,
	strokeWidth,
	strokeInk,
	strokeAccent,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const total = seconds * fps;

	/** Linear, straight off the frame: a timer has to read as constant. */
	const progress = Math.min(Math.max(frame / total, 0), 1);
	const remaining = CIRCUMFERENCE * (1 - progress);

	const elapsed = Math.min(Math.floor(frame / fps), seconds);
	const current = Math.max(seconds - elapsed, 0);
	const sinceTick = frame - elapsed * fps;
	const ticking = elapsed > 0 && sinceTick < TICK;

	const peak = current <= 3 ? 1.06 : 1.03;
	const pop = !ticking
		? 1
		: sinceTick <= TICK / 2
			? interpolate(sinceTick, [0, TICK / 2], [1, peak], {
					...CLAMP,
					easing: Easing.out(Easing.quad),
				})
			: interpolate(sinceTick, [TICK / 2, TICK], [peak, 1], {
					...CLAMP,
					easing: Easing.inOut(Easing.quad),
				});

	const intro = interpolate(frame, [0, 18], [0, 1], {
		...CLAMP,
		easing: Easing.out(Easing.cubic),
	});
	const groupScale = interpolate(intro, [0, 1], [0.92, 1]) * pop;

	/** Travel, shared by both numerals so they move as one exchange. */
	const enter = interpolate(sinceTick, [0, TICK], [0, 1], {
		...CLAMP,
		easing: Easing.out(Easing.cubic),
	});

	/** Ink, front-loaded and asymmetric — see the tick note in the header. */
	const leaveOpacity = interpolate(sinceTick, [0, FADE_OUT_END], [1, 0], {
		...CLAMP,
		easing: Easing.in(Easing.quad),
	});
	const enterOpacity = interpolate(sinceTick, [FADE_IN_START, TICK], [0, 1], {
		...CLAMP,
		easing: Easing.out(Easing.quad),
	});

	const burstR = interpolate(frame, [total, total + BURST_FRAMES], [R, R + BURST_GROW], {
		...CLAMP,
		easing: Easing.out(Easing.cubic),
	});
	const burstOpacity = interpolate(
		frame,
		[total, total + BURST_FRAMES],
		[0.6, 0],
		CLAMP,
	);

	return (
		<AbsoluteFill
			style={{
				backgroundColor: transparent ? 'transparent' : '#0B0A12',
			}}
		>
			{transparent ? null : (
				<AbsoluteFill
					style={{
						backgroundImage: `radial-gradient(900px 900px at ${CX}px 1400px, ${hexToRgba(
							accentTo,
							0.18,
						)} 0%, ${hexToRgba(accentTo, 0)} 70%)`,
					}}
				/>
			)}

			{/* Ring group: track, draining arc and the numeral, popped together. */}
			<AbsoluteFill
				style={{
					opacity: intro,
					scale: groupScale,
					transformOrigin: `${CX}px ${CY}px`,
				}}
			>
				<svg
					width={WIDTH}
					height={HEIGHT}
					viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
					style={{position: 'absolute', inset: 0}}
				>
					<defs>
						<linearGradient id="sporttouchen-arc" x1="0" y1="0" x2="1" y2="0">
							<stop offset="0%" stopColor={accentFrom} />
							<stop offset="100%" stopColor={accentTo} />
						</linearGradient>
					</defs>
					<circle
						cx={CX}
						cy={CY}
						r={R}
						fill="none"
						stroke={ink}
						strokeOpacity={0.12}
						strokeWidth={STROKE}
					/>
					{/* A round cap on a zero-length dash would leave a dot at 12
					    o'clock, so the arc stops being drawn once it is spent. */}
					{progress < 1 ? (
						<circle
							cx={CX}
							cy={CY}
							r={R}
							fill="none"
							stroke="url(#sporttouchen-arc)"
							strokeWidth={STROKE}
							strokeLinecap="round"
							strokeDasharray={`${remaining} ${CIRCUMFERENCE}`}
							strokeDashoffset={-CIRCUMFERENCE * progress}
							transform={`rotate(-90 ${CX} ${CY})`}
						/>
					) : null}
				</svg>

				{/* Masked to the ring's inner disc so the swap slides in clean. */}
				<div
					style={{
						position: 'absolute',
						left: CX - INNER_R,
						top: CY - INNER_R,
						width: INNER_R * 2,
						height: INNER_R * 2,
						overflow: 'hidden',
					}}
				>
					{ticking ? (
						<Numeral
							value={current + 1}
							offsetY={-SLIDE * enter}
							opacity={leaveOpacity}
							gradient={current + 1 <= 3}
							accentFrom={accentFrom}
							accentTo={accentTo}
							ink={ink}
							strokeWidth={strokeWidth}
							strokeInk={strokeInk}
							strokeAccent={strokeAccent}
						/>
					) : null}
					<Numeral
						value={current}
						offsetY={ticking ? SLIDE * (1 - enter) : 0}
						opacity={ticking ? enterOpacity : 1}
						gradient={current <= 3}
						accentFrom={accentFrom}
						accentTo={accentTo}
						ink={ink}
						strokeWidth={strokeWidth}
						strokeInk={strokeInk}
						strokeAccent={strokeAccent}
					/>
				</div>
			</AbsoluteFill>

			{frame >= total ? (
				<svg
					width={WIDTH}
					height={HEIGHT}
					viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
					style={{position: 'absolute', inset: 0}}
				>
					<circle
						cx={CX}
						cy={CY}
						r={burstR}
						fill="none"
						stroke={ink}
						strokeOpacity={burstOpacity}
						strokeWidth={6}
					/>
				</svg>
			) : null}

			{label === '' ? null : (
				<div
					style={{
						position: 'absolute',
						left: 0,
						right: 0,
						top: LABEL_Y - LABEL_SIZE / 2,
						height: LABEL_SIZE,
						lineHeight: `${LABEL_SIZE}px`,
						textAlign: 'center',
						opacity:
							0.7 *
							interpolate(frame, [8, 24], [0, 1], {
								...CLAMP,
								easing: Easing.out(Easing.cubic),
							}),
					}}
				>
					<span
						style={{
							fontFamily,
							fontWeight: 500,
							fontSize: LABEL_SIZE,
							letterSpacing: '0.22em',
							marginRight: '-0.22em',
							color: ink,
							textTransform: 'uppercase',
						}}
					>
						{label}
					</span>
				</div>
			)}
		</AbsoluteFill>
	);
};

export default SporttouchenTimer;
