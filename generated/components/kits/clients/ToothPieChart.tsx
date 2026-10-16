import {loadFont} from '@remotion/fonts';
import {
	AbsoluteFill,
	cancelRender,
	continueRender,
	delayRender,
	Easing,
	Img,
	interpolate,
	staticFile,
	useCurrentFrame,
} from 'remotion';
import {z} from 'zod';

const fontFamily = 'Neulis Cursive';

const fontHandle = delayRender('Loading Neulis Cursive Bold');

loadFont({
	family: fontFamily,
	url: staticFile('NeulisCursive-Bold.otf'),
	weight: '700',
})
	.then(() => continueRender(fontHandle))
	.catch((err) => cancelRender(err));

export const schema = z.object({
	percent: z.number().min(0).max(100),
	label: z.string(),
	fillColor: z.string(),
	trackColor: z.string(),
	backgroundColor: z.string(),
	radius: z.number().min(50).max(540),
});

export const defaultProps = schema.parse({
	percent: 40,
	label: '~40%',
	fillColor: '#7970b4',
	trackColor: '#544d7d',
	backgroundColor: '#12101a',
	radius: 330,
});

const CX = 540;
const CY = 940;

// Wedge starting at 12 o'clock, sweeping clockwise.
const wedgePath = (sweep: number, r: number) => {
	if (sweep <= 0) {
		return '';
	}
	// A full circle cannot be drawn with a single arc, so nudge it just short.
	const angle = (Math.min(sweep, 359.999) * Math.PI) / 180;
	const x = CX + r * Math.sin(angle);
	const y = CY - r * Math.cos(angle);
	const largeArc = sweep > 180 ? 1 : 0;
	return `M ${CX} ${CY} L ${CX} ${CY - r} A ${r} ${r} 0 ${largeArc} 1 ${x} ${y} Z`;
};

export const ToothPieChart = ({
	percent,
	label,
	fillColor,
	trackColor,
	backgroundColor,
	radius,
}: z.infer<typeof schema>) => {
	const frame = useCurrentFrame();

	const sweep = interpolate(frame, [6, 46], [0, percent * 3.6], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.bezier(0.33, 0, 0.15, 1),
	});

	return (
		<AbsoluteFill style={{backgroundColor}}>
			<AbsoluteFill
				style={{
					scale: interpolate(frame, [0, 18], [0.94, 1], {
						extrapolateLeft: 'clamp',
						extrapolateRight: 'clamp',
						easing: Easing.bezier(0.16, 1, 0.3, 1),
					}),
				}}
			>
				<svg width={1080} height={1920} viewBox="0 0 1080 1920">
					<circle cx={CX} cy={CY} r={radius} fill={trackColor} />
					<path d={wedgePath(sweep, radius)} fill={fillColor} />
				</svg>
			</AbsoluteFill>

			<AbsoluteFill
				style={{
					justifyContent: 'center',
					alignItems: 'center',
					top: CY - 960,
					fontFamily,
					fontWeight: 700,
					fontSize: 190,
					color: '#ffffff',
					letterSpacing: '0.01em',
					scale: interpolate(frame, [22, 42], [0.86, 1], {
						extrapolateLeft: 'clamp',
						extrapolateRight: 'clamp',
						easing: Easing.bezier(0.16, 1, 0.3, 1),
					}),
					// Exit only: rises out of frame as the tooth rises in to replace it.
					translate: `0px ${interpolate(frame, [76, 90], [0, -130], {
						extrapolateLeft: 'clamp',
						extrapolateRight: 'clamp',
						easing: Easing.bezier(0.5, 0, 0.75, 0),
					})}px`,
					opacity:
						interpolate(frame, [22, 40], [0, 1], {
							extrapolateLeft: 'clamp',
							extrapolateRight: 'clamp',
							easing: Easing.bezier(0.33, 0, 0.15, 1),
						}) *
						interpolate(frame, [76, 88], [1, 0], {
							extrapolateLeft: 'clamp',
							extrapolateRight: 'clamp',
							easing: Easing.bezier(0.5, 0, 0.75, 0),
						}),
				}}
			>
				{label}
			</AbsoluteFill>

			<AbsoluteFill
				style={{
					justifyContent: 'center',
					alignItems: 'center',
					top: CY - 960,
					translate: `0px ${interpolate(frame, [82, 108], [250, 0], {
						extrapolateLeft: 'clamp',
						extrapolateRight: 'clamp',
						easing: Easing.bezier(0.16, 1, 0.3, 1),
					})}px`,
					opacity: interpolate(frame, [82, 94], [0, 1], {
						extrapolateLeft: 'clamp',
						extrapolateRight: 'clamp',
						easing: Easing.bezier(0.16, 1, 0.3, 1),
					}),
				}}
			>
				<Img
					src={staticFile('tooth.png')}
					style={{
						width: 380,
						height: 380,
						filter: 'brightness(0) invert(1)',
					}}
				/>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

export default ToothPieChart;
