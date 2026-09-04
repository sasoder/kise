import {loadFont} from '@remotion/google-fonts/Inter';
import {
	AbsoluteFill,
	Easing,
	interpolate,
	spring,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {z} from 'zod';

const {fontFamily} = loadFont('normal', {
	weights: ['400', '500', '700'],
	subsets: ['latin'],
});

const monthSchema = z.object({
	name: z.string(),
	days: z.number().int().min(28).max(31),
	// Column (0 = Monday) that the 1st of the month falls on.
	startCol: z.number().int().min(0).max(6),
});

export const schema = z.object({
	months: z.array(monthSchema).min(1),
	startMonth: z.number().int().min(0),
	startDay: z.number().int().min(1).max(31),
	endMonth: z.number().int().min(0),
	endDay: z.number().int().min(1).max(31),
	color: z.string(),
	gridOpacity: z.number().min(0).max(1),
	dateOpacity: z.number().min(0).max(1),
	sweepStart: z.number().int().min(0),
	sweepEnd: z.number().int().min(1),
});

export const defaultProps = schema.parse({
	// Internally consistent generic alignment: May starts Fri, June Mon, July Wed.
	months: [
		{name: 'MAY', days: 31, startCol: 4},
		{name: 'JUNE', days: 30, startCol: 0},
		{name: 'JULY', days: 31, startCol: 2},
	],
	startMonth: 0,
	startDay: 26,
	endMonth: 2,
	endDay: 4,
	color: '#ffffff',
	gridOpacity: 0.2,
	dateOpacity: 0.45,
	sweepStart: 21,
	sweepEnd: 86,
});

const WIDTH = 1080;
const HEIGHT = 1920;

const COL_W = 120;
const ROW_H = 78;
const ROWS = 5;
const GRID_X = 120;
const GRID_Y = 130;
const BLOCK_H = GRID_Y + ROWS * ROW_H;
const BLOCK_GAP = 60;

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const cellCenterX = (col: number) => GRID_X + col * COL_W + COL_W / 2;
const cellCenterY = (row: number) => GRID_Y + row * ROW_H + ROW_H / 2;

type Pill = {x: number; y: number; width: number; height: number};

const CalendarSpan: React.FC<z.infer<typeof schema>> = ({
	months,
	startMonth,
	startDay,
	endMonth,
	endDay,
	color,
	gridOpacity,
	dateOpacity,
	sweepStart,
	sweepEnd,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	// Running day offset so the range can be measured across month boundaries.
	const offsets: number[] = [];
	let running = 0;
	for (const month of months) {
		offsets.push(running);
		running += month.days;
	}

	const rangeStart = offsets[startMonth] + startDay - 1;
	const rangeEnd = offsets[endMonth] + endDay - 1;
	const rangeLength = rangeEnd - rangeStart + 1;

	// Days of the span filled so far — the whole piece is driven by this.
	const filled = interpolate(frame, [sweepStart, sweepEnd], [0, rangeLength], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.inOut(Easing.quad),
	});

	const totalH = months.length * BLOCK_H + (months.length - 1) * BLOCK_GAP;
	const topOffset = (HEIGHT - totalH) / 2;

	return (
		<AbsoluteFill>
			<svg
				width={WIDTH}
				height={HEIGHT}
				viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
				xmlns="http://www.w3.org/2000/svg"
			>
				{months.map((month, m) => {
					const entrance = spring({
						frame,
						fps,
						config: {damping: 200, mass: 0.7},
						delay: m * 5,
					});
					const dy = interpolate(entrance, [0, 1], [36, 0]);

					// Every cell of this month that carries a date.
					const cells = [];
					for (let day = 1; day <= month.days; day++) {
						const index = month.startCol + day - 1;
						cells.push({
							day,
							row: Math.floor(index / 7),
							col: index % 7,
							// Position of this day within the highlighted span.
							t: offsets[m] + day - 1 - rangeStart,
						});
					}

					const inRange = cells.filter(
						(cell) => cell.t >= 0 && cell.t < rangeLength,
					);

					// One pill per row: span days are contiguous, so the filled part
					// of a row is always a prefix of that row's span cells.
					const pills: Pill[] = [];
					for (let row = 0; row < ROWS; row++) {
						const rowCells = inRange
							.filter((cell) => cell.row === row)
							.sort((a, b) => a.col - b.col);
						if (rowCells.length === 0) {
							continue;
						}
						const amount = rowCells.reduce(
							(sum, cell) => sum + Math.min(Math.max(filled - cell.t, 0), 1),
							0,
						);
						if (amount <= 0.001) {
							continue;
						}
						pills.push({
							x: GRID_X + rowCells[0].col * COL_W,
							y: GRID_Y + row * ROW_H + 5,
							width: amount * COL_W,
							height: ROW_H - 10,
						});
					}

					const outsideId = `outside-${m}`;
					const knockoutId = `knockout-${m}`;

					return (
						<g key={month.name} transform={`translate(0 ${topOffset + m * (BLOCK_H + BLOCK_GAP) + dy})`} opacity={entrance}>
							<defs>
								{/* Dates render everywhere except under a pill. */}
								<mask id={outsideId}>
									<rect x={0} y={0} width={WIDTH} height={BLOCK_H} fill="#fff" />
									{pills.map((pill, i) => (
										<rect
											key={i}
											x={pill.x}
											y={pill.y}
											width={pill.width}
											height={pill.height}
											rx={16}
											fill="#000"
										/>
									))}
								</mask>
								{/* The pills themselves, with span dates punched out of them. */}
								<mask id={knockoutId}>
									{pills.map((pill, i) => (
										<rect
											key={i}
											x={pill.x}
											y={pill.y}
											width={pill.width}
											height={pill.height}
											rx={16}
											fill="#fff"
										/>
									))}
									{inRange.map((cell) => (
										<text
											key={cell.day}
											x={cellCenterX(cell.col)}
											y={cellCenterY(cell.row)}
											fill="#000"
											fontFamily={fontFamily}
											fontSize={36}
											fontWeight={500}
											textAnchor="middle"
											dominantBaseline="central"
										>
											{cell.day}
										</text>
									))}
								</mask>
							</defs>

							<text
								x={GRID_X}
								y={62}
								fill={color}
								fontFamily={fontFamily}
								fontSize={58}
								fontWeight={700}
								letterSpacing={6}
							>
								{month.name}
							</text>

							{WEEKDAYS.map((weekday, col) => (
								<text
									key={col}
									x={cellCenterX(col)}
									y={GRID_Y - 22}
									fill={color}
									fillOpacity={0.55}
									fontFamily={fontFamily}
									fontSize={26}
									fontWeight={700}
									letterSpacing={2}
									textAnchor="middle"
									dominantBaseline="central"
								>
									{weekday}
								</text>
							))}

							<g stroke={color} strokeOpacity={gridOpacity} strokeWidth={2}>
								{Array.from({length: ROWS + 1}, (_, row) => (
									<line
										key={`h${row}`}
										x1={GRID_X}
										y1={GRID_Y + row * ROW_H}
										x2={GRID_X + 7 * COL_W}
										y2={GRID_Y + row * ROW_H}
									/>
								))}
								{Array.from({length: 8}, (_, col) => (
									<line
										key={`v${col}`}
										x1={GRID_X + col * COL_W}
										y1={GRID_Y}
										x2={GRID_X + col * COL_W}
										y2={GRID_Y + ROWS * ROW_H}
									/>
								))}
							</g>

							<g mask={`url(#${outsideId})`}>
								{cells.map((cell) => (
									<text
										key={cell.day}
										x={cellCenterX(cell.col)}
										y={cellCenterY(cell.row)}
										fill={color}
										fillOpacity={dateOpacity}
										fontFamily={fontFamily}
										fontSize={36}
										fontWeight={500}
										textAnchor="middle"
										dominantBaseline="central"
									>
										{cell.day}
									</text>
								))}
							</g>

							<g mask={`url(#${knockoutId})`}>
								<rect x={0} y={0} width={WIDTH} height={BLOCK_H} fill={color} />
							</g>
						</g>
					);
				})}
			</svg>
		</AbsoluteFill>
	);
};

export default CalendarSpan;
