import {loadFont} from '@remotion/google-fonts/Montserrat';
import React from 'react';
import {
	AbsoluteFill,
	Img,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {z} from 'zod';

const {fontFamily} = loadFont('normal', {
	weights: ['800'],
	subsets: ['latin'],
});

export const FPS = 30;
export const DURATION = 1200;

const WIDTH = 1080;
const HEIGHT = 1920;

/** Five slots across the frame; a bar sits in the middle of each. */
const SLOTS = 5;
/** Keeps the widest product off the frame edge. */
const EDGE_INSET = 26;
const SLOT_W = (WIDTH - EDGE_INSET * 2) / SLOTS;
const slotCenter = (i: number) => EDGE_INSET + SLOT_W * (i + 0.5);

const BAR_W = 72;
/** Height of a bar showing 0, measured from the bottom edge of the frame. */
const BASE_H = 300;
/** Extra height per counted mention. */
const STEP_H = 175;
/** How far the product image sinks into the top of its bar. */
const OVERLAP = 55;
/** Rendered height of a square product at scale 1. */
const PRODUCT_H = 175;
/**
 * The products range from a flat sandwich to a tall thin bottle. Sizing them all
 * to one height would tower the bottles; sizing to one width would shrink them.
 * Scaling height by aspect^-0.35 lands between the two, so every product carries
 * roughly the same visual weight while keeping its own proportions.
 */
const ASPECT_COMPENSATION = -0.35;

const itemSchema = z.object({
	label: z.string(),
	image: z.string(),
	/** Frames on which this item's counter ticks up by one. */
	ticks: z.array(z.number()),
	/** Intrinsic width / height of the cropped product image. */
	aspect: z.number(),
	scale: z.number(),
	nudgeY: z.number(),
	/** Moves the counter off the product's centre, e.g. clear of its logo. */
	numberNudgeY: z.number(),
});

const chartSchema = z.object({
	label: z.string(),
	inFrame: z.number(),
	outFrame: z.number(),
	items: z.array(itemSchema),
});

export const schema = z.object({
	charts: z.array(chartSchema),
	/**
	 * Renders one settled state instead of the timeline. Index counts through
	 * every chart's tick events in order, with an empty state before each chart.
	 */
	snapshot: z.number().nullable(),
	barColor: z.string(),
	numberColor: z.string(),
	numberSize: z.number(),
});

type Item = z.infer<typeof itemSchema>;
type Chart = z.infer<typeof chartSchema>;
type Props = z.infer<typeof schema>;

/** Every tick in a chart, flattened and ordered as they happen. */
const tickEvents = (chart: Chart) =>
	chart.items
		.flatMap((item, itemIndex) => item.ticks.map((frame) => ({itemIndex, frame})))
		.sort((a, b) => a.frame - b.frame);

/** Maps a snapshot index onto a chart and a number of ticks applied to it. */
const resolveSnapshot = (charts: Chart[], snapshot: number) => {
	let remaining = snapshot;
	for (let i = 0; i < charts.length; i++) {
		const size = tickEvents(charts[i]).length + 1;
		if (remaining < size) {
			return {chartIndex: i, ticksApplied: remaining};
		}
		remaining -= size;
	}
	const last = charts.length - 1;
	return {chartIndex: last, ticksApplied: tickEvents(charts[last]).length};
};

const Bar: React.FC<{
	item: Item;
	centerX: number;
	/** Bar height in counted steps; fractional while a tick springs in. */
	value: number;
	count: number;
	pop: number;
	barColor: string;
	numberColor: string;
	numberSize: number;
}> = ({item, centerX, value, count, pop, barColor, numberColor, numberSize}) => {
	const barTop = HEIGHT - (BASE_H + value * STEP_H);
	// Aspect compensation alone lets a very wide product (the ciabatta) spill into
	// its neighbour's slot, so cap the rendered width and back the height out of it.
	const wanted =
		PRODUCT_H * Math.pow(item.aspect, ASPECT_COMPENSATION) * item.scale;
	// The ciabatta is nearly 2:1, so let it borrow a little of the slack in its
	// neighbours' slots rather than squashing it to a sliver.
	const maxW = SLOT_W * 1.05;
	const productH = Math.min(wanted, maxW / item.aspect);

	return (
		<>
			<div
				style={{
					position: 'absolute',
					left: centerX - BAR_W / 2,
					top: barTop,
					width: BAR_W,
					height: HEIGHT - barTop,
					backgroundColor: barColor,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: centerX,
					top: barTop + OVERLAP + item.nudgeY,
					transform: 'translate(-50%, -100%)',
				}}
			>
				<div style={{position: 'relative', display: 'inline-block'}}>
					<Img
						src={staticFile(`produkter/${item.image}`)}
						style={{
							height: productH,
							width: 'auto',
							display: 'block',
							// The juice label is almost the bar's own yellow, so each product
							// needs its own edge to read as sitting in front of the bar.
							filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.45))',
						}}
					/>
					<div
						style={{
							position: 'absolute',
							inset: 0,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							transform: `translateY(${item.numberNudgeY}px)`,
						}}
					>
						<span
							style={{
								fontFamily,
								fontWeight: 800,
								fontSize: numberSize,
								lineHeight: 1,
								color: numberColor,
								textShadow:
									'0 0 18px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.5)',
								transform: `scale(${pop})`,
							}}
						>
							{count}
						</span>
					</div>
				</div>
			</div>
		</>
	);
};

export const FrukostBarChart: React.FC<Props> = ({
	charts,
	snapshot,
	barColor,
	numberColor,
	numberSize,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	if (snapshot !== null) {
		const {chartIndex, ticksApplied} = resolveSnapshot(charts, snapshot);
		const chart = charts[chartIndex];
		const applied = tickEvents(chart).slice(0, ticksApplied);

		return (
			<AbsoluteFill style={{filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.32))'}}>
				{chart.items.map((item, i) => {
					const count = applied.filter((e) => e.itemIndex === i).length;
					return (
						<Bar
							key={item.label}
							item={item}
							centerX={slotCenter(i)}
							value={count}
							count={count}
							pop={1}
							barColor={barColor}
							numberColor={numberColor}
							numberSize={numberSize}
						/>
					);
				})}
			</AbsoluteFill>
		);
	}

	return (
		<AbsoluteFill>
			{charts.map((chart) => {
				if (frame < chart.inFrame || frame > chart.outFrame) {
					return null;
				}

				// Slide the whole chart up on entry and back down on exit, so the two
				// charts hand over without either of them ever fading.
				const enter = spring({
					frame: frame - chart.inFrame,
					fps,
					config: {damping: 18, mass: 0.9, stiffness: 90},
				});
				const exit = spring({
					frame: frame - (chart.outFrame - 18),
					fps,
					config: {damping: 20, mass: 0.9, stiffness: 90},
				});
				const offsetY = (1 - enter) * 900 + exit * 900;

				return (
					<AbsoluteFill
						key={chart.label}
						style={{
							transform: `translateY(${offsetY}px)`,
							filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.32))',
						}}
					>
						{chart.items.map((item, i) => {
							// The bar's height and its label both come from the same ticks,
							// so they can never drift apart when the timing is retuned.
							const value = item.ticks.reduce(
								(sum, tick) =>
									sum +
									spring({
										frame: frame - tick,
										fps,
										config: {damping: 14, mass: 0.7, stiffness: 130},
									}),
								0,
							);
							const count = item.ticks.filter((tick) => frame >= tick).length;
							const pop = item.ticks.reduce((scale, tick) => {
								const since = frame - tick;
								if (since < 0 || since > 14) {
									return scale;
								}
								return (
									scale +
									interpolate(since, [0, 5, 14], [0, 0.3, 0], {
										extrapolateLeft: 'clamp',
										extrapolateRight: 'clamp',
									})
								);
							}, 1);

							return (
								<Bar
									key={item.label}
									item={item}
									centerX={slotCenter(i)}
									value={value}
									count={count}
									pop={pop}
									barColor={barColor}
									numberColor={numberColor}
									numberSize={numberSize}
								/>
							);
						})}
					</AbsoluteFill>
				);
			})}
		</AbsoluteFill>
	);
};

const item = (
	label: string,
	image: string,
	aspect: number,
	ticks: number[],
	scale = 1,
	nudgeY = 0,
	numberNudgeY = 0,
) => ({label, image, aspect, ticks, scale, nudgeY, numberNudgeY});

export const defaultProps = schema.parse({
	// Tick frames are lifted from the SRT at 30fps, in the order the user confirmed:
	// macka macka macka kvarg agg macka hamburgare yoghurt, then
	// juice mjolk vatten kaffe juice kaffe oboy.
	charts: [
		{
			label: 'mat',
			inFrame: 60,
			outFrame: 815,
			items: [
				// 00:02.759 "mackor tror jag" / 00:05.280 "det är macka"
				// 00:06.419 "alltså alltid macka" / 00:12.339 "jag tar nog all macka"
				item('macka', '01_macka_ost_skinka.png', 1.794, [83, 158, 193, 370]),
				// 00:07.240 "oj eh kvark"
				item('kvarg', '02_kvarg.png', 0.831, [217]),
				// 00:09.179 "jag skulle säga ägg"
				item('agg', '03_agg.png', 0.985, [275]),
				// 00:21.219 "hamburgare"
				item('hamburgare', '04_hamburgare.png', 1.185, [637]),
				// 00:23.500 "joghurt"
				item('yoghurt', '05_yoghurt.png', 1.133, [705]),
			],
		},
		{
			label: 'dryck',
			inFrame: 820,
			outFrame: 1200,
			items: [
				// 00:28.879 "apelsinjuice" / 00:32.520 "eh juice ... hallonjuice"
				item('juice', '06_apelsinjuice.png', 0.351, [866, 976]),
				// 00:29.239 "eh mjölk faktiskt"
				item('mjolk', '08_mjolk.png', 0.453, [877]),
				// 00:30.940 "jag brukar ta vatten"
				item('vatten', '09_vatten.png', 0.287, [928]),
				// 00:31.539 "det är ju kaffe såklart" / 00:34.679 "en kaffe" (then O'boy)
				// Lifted onto the dark coffee; on the yellow band it fought the bar colour.
				item('kaffe', '10_kaffe.png', 0.77, [946, 1040], 1, 0, 20),
				// 00:37.140 "en oboj"
				// Nudged clear of the O'boy wordmark, which the counter otherwise sits on.
				item('oboy', 'oboy.png', 0.663, [1114], 1.05, 0, 30),
			],
		},
	],
	snapshot: null,
	barColor: '#FFCD00',
	numberColor: '#FFFFFF',
	numberSize: 96,
});

export default FrukostBarChart;
