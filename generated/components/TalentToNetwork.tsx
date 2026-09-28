import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';

// ---------------------------------------------------------------------------
// Lovable — "What's more important: talent or the right network?" Client
// social video, opening icon. A TRANSPARENT overlay: one app-icon tile in the
// Lovable gradient, centred at (540, 960), static (no camera, no drift). A
// white TALENT star inside it turns into a white NETWORK glyph as ONE
// continuous shape change: the star's inner radius collapses to 0, so its
// round-joined stroke becomes five spokes to the tips, and the tips become the
// nodes. No crossfade, no text.
//
// DURATION = 4.0 s x 24 fps = 96 frames. 1080x1920.
//
// GESTURES — every gesture and its frame span
//   f0–12   tile entrance: scale 0.6 -> 1 (peak ≈ 1.04, settles, no wobble),
//           fade 0 -> 1 over f0–8 with a 24 px slide up
//   f3–15   star scales 0.7 -> 1 inside the tile, same ease, trailing 3 f
//   f12–36  star holds; one slow eased rotation 0 -> 6°
//   f36–40  anticipation: star contracts 1 -> 0.94 (a breath)
//   f40–58  MORPH (inOut cubic, 18 f): inner radius 0.42R -> 0, stroke
//           18 -> 11, glyph scale 0.94 -> 1, rotation 6° -> 0°
//           (the hold drift unwinds; top node lands at 12 o'clock)
//   f46–56  hub grows at the centre
//   f48–60  outer nodes grow at the tips, clockwise from the top, 1.5 f
//           stagger, each 1 -> 1.12 -> 1
//   f56–72  pentagon ring draws on, one clockwise stroke from the top node
//           (ease-out quad)
//   f72–86  network holds; one soft pulse: the hub swells 1 -> 1.1 -> 1
//           (f72–78), then all five outer nodes 1 -> 1.15 -> 1 (f78–86), so it
//           reads as a signal leaving the hub and arriving at the nodes. (A
//           bead travelling the spokes was tried: at 11 px stroke it read as a
//           lump on the line, so it was cut.)
//   f86–95  exit: scale 1 -> 0.85, fade to 0, drift down 16 px (ease-in);
//           gone by f95
// Continuous (not a gesture): the gradient angle drifts 131° -> 139° over the
// whole 4 s so the tile never sits dead.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 96; // 4.0 s x 24

export const schema = z.object({
	previewBg: z.boolean(),
});

export const defaultProps = schema.parse({previewBg: false});

// Brand (from LovableHotOrNot)
const FULL_STOPS: [number, [number, number, number]][] = [
	[0, [79, 136, 255]],
	[0.14, [98, 137, 255]],
	[0.24, [145, 160, 255]],
	[0.33, [206, 175, 251]],
	[0.43, [243, 136, 222]],
	[0.52, [253, 73, 168]],
	[0.62, [252, 26, 88]],
	[0.71, [250, 39, 51]],
	[0.81, [252, 84, 31]],
	[0.9, [254, 119, 29]],
	[1, [255, 143, 27]],
];
const gradientAt = (deg: number) =>
	`linear-gradient(${deg.toFixed(3)}deg, ${FULL_STOPS.map(
		([p, c]) => `rgb(${c.join(',')}) ${(p * 100).toFixed(0)}%`,
	).join(', ')})`;

// Geometry
const CX = 540;
const CY = 960;
const TILE = 380;
const TILE_R = Math.round(0.26 * TILE); // 99
const R = 118; // star tip radius = node radius from centre
const R_IN = 0.42 * R;
const W_STAR = 18;
const W_NET = 11;
const HUB_R = 22;
const NODE_R = 16;
const ROT_HOLD = 6; // degrees reached at the end of the hold
// Rotation turns back 6° -> 0° during the morph (the hold drift unwinds, so
// the top node lands at 12 o'clock). A full 72° step was tried: it read as a
// spinning pinwheel competing with the morph, so the calm unwind won.
const ROT_END = 0;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const OVERSHOOT = Easing.bezier(0.34, 1.56, 0.64, 1); // peaks ≈ 1.098
const IO = Easing.inOut(Easing.cubic);

const tip = (k: number): [number, number] => {
	const a = ((-90 + 72 * k) * Math.PI) / 180;
	return [R * Math.cos(a), R * Math.sin(a)];
};
const TIPS = [0, 1, 2, 3, 4].map(tip);

const starPath = (r: number) => {
	const pts: string[] = [];
	for (let k = 0; k < 5; k++) {
		const [x, y] = TIPS[k];
		const a = ((-90 + 36 + 72 * k) * Math.PI) / 180;
		pts.push(`${x.toFixed(3)},${y.toFixed(3)}`);
		pts.push(`${(r * Math.cos(a)).toFixed(3)},${(r * Math.sin(a)).toFixed(3)}`);
	}
	return `M${pts.join('L')}Z`;
};

// The tip that ends at 12 o'clock after the ROT_END turn, then clockwise:
// the order the nodes grow and the ring draws.
const TOP = (5 - ((ROT_END / 72) % 5)) % 5;
const ORDER = [0, 1, 2, 3, 4].map((i) => (TOP + i) % 5);
const RING_PATH = `M${ORDER.map((k) => TIPS[k])
	.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`)
	.join('L')}Z`;
const RING_LEN = 5 * 2 * R * Math.sin(Math.PI / 5);

// 0 -> peak -> 1 bump with zero slope at the peak
const pop = (f: number, start: number, dur: number, peak: number) => {
	const t = (f - start) / dur;
	if (t <= 0) return 0;
	if (t >= 1) return 1;
	const split = 0.6;
	if (t < split) return peak * Easing.out(Easing.cubic)(t / split);
	return peak + (1 - peak) * Easing.inOut(Easing.sin)((t - split) / (1 - split));
};

// 1 -> 1+amp -> 1 soft pulse
const pulse = (f: number, start: number, dur: number, amp: number) => {
	const t = Math.min(1, Math.max(0, (f - start) / dur));
	return 1 + amp * Math.sin(Math.PI * t) ** 2;
};

const TalentToNetwork: React.FC<z.infer<typeof schema>> = ({previewBg}) => {
	const frame = useCurrentFrame();

	// Tile entrance / exit
	const enterScale = interpolate(frame, [0, 12], [0.6, 1], {...clamp, easing: OVERSHOOT});
	const enterFade = interpolate(frame, [0, 8], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const exit = interpolate(frame, [86, 95], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
	const tileScale = enterScale * (1 - 0.15 * exit);
	const tileOpacity = enterFade * (1 - exit);
	const tileY = 24 * (1 - enterFade) + 16 * exit;

	// Gradient drift
	const angle = interpolate(frame, [0, DURATION], [131, 139], clamp);

	// Glyph scale: entrance, breath, recovery
	const starIn = interpolate(frame, [3, 15], [0.7, 1], {...clamp, easing: OVERSHOOT});
	const breath = interpolate(frame, [36, 40, 58], [1, 0.94, 1], {...clamp, easing: IO});
	const glyphScale = starIn * breath;

	// Morph
	const m = interpolate(frame, [40, 58], [0, 1], {...clamp, easing: IO});
	const rIn = R_IN * (1 - m);
	const stroke = W_STAR + (W_NET - W_STAR) * m;
	const holdRot = interpolate(frame, [12, 36], [0, ROT_HOLD], {...clamp, easing: IO});
	const rot = holdRot + (ROT_END - ROT_HOLD) * m;

	// Nodes
	const hubS = pop(frame, 46, 10, 1.12) * pulse(frame, 72, 6, 0.1);
	const nodeS = TIPS.map((_, k) => pop(frame, 48 + 1.5 * ORDER.indexOf(k), 6, 1.12) * pulse(frame, 78, 8, 0.15));

	// Ring
	const ring = interpolate(frame, [56, 72], [0, 1], {...clamp, easing: Easing.out(Easing.quad)});

	return (
		<AbsoluteFill
			style={{
				background: previewBg
					? 'linear-gradient(90deg, #3A3A3A 0 50%, #B9B2A6 50% 100%)'
					: undefined,
			}}
		>
			<div
				style={{
					position: 'absolute',
					left: CX - TILE / 2,
					top: CY - TILE / 2,
					width: TILE,
					height: TILE,
					borderRadius: TILE_R,
					background: gradientAt(angle),
					boxShadow: '0 18px 40px rgba(0,0,0,0.28)',
					opacity: tileOpacity,
					transform: `translateY(${tileY}px) scale(${tileScale})`,
					overflow: 'hidden',
				}}
			>
				{/* faint top inner highlight */}
				<div
					style={{
						position: 'absolute',
						inset: 0,
						background:
							'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 20%, rgba(255,255,255,0) 34%)',
					}}
				/>
				<svg
					width={TILE}
					height={TILE}
					viewBox={`${-TILE / 2} ${-TILE / 2} ${TILE} ${TILE}`}
					style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}
				>
					<g transform={`rotate(${rot.toFixed(4)}) scale(${glyphScale.toFixed(5)})`}>
						{ring > 0 ? (
							<path
								d={RING_PATH}
								fill="none"
								stroke="#FFFFFF"
								strokeWidth={W_NET}
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeDasharray={`${RING_LEN} ${RING_LEN}`}
								strokeDashoffset={RING_LEN * (1 - ring)}
							/>
						) : null}
						<path
							d={starPath(rIn)}
							fill="#FFFFFF"
							stroke="#FFFFFF"
							strokeWidth={stroke}
							strokeLinejoin="round"
						/>
						{hubS > 0 ? <circle cx={0} cy={0} r={HUB_R * hubS} fill="#FFFFFF" /> : null}
						{TIPS.map(([x, y], k) =>
							nodeS[k] > 0 ? (
								<circle key={k} cx={x} cy={y} r={NODE_R * nodeS[k]} fill="#FFFFFF" />
							) : null,
						)}
					</g>
				</svg>
			</div>
		</AbsoluteFill>
	);
};

export default TalentToNetwork;
