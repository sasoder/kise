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

// ---------------------------------------------------------------------------
// Lovable — "Hot or not: startup & dating edition". Client social video. V2:
// Q1 reads "on or before"; the missed "Uses Lovable?" question added at f558
// (seven questions, renumbered).
//
// A TRANSPARENT overlay: design 3 · TEMPERATURE SLIDER from the approved still
// (scratchpad cards.html #d3 / card3.png), on screen for the whole cut. The
// question changes per question and the knob moves to HOT / NOT on the words
// people say. 1080x1920, 24 fps, cut = 57.989 s -> round(57.989*24) = 1392.
//
// Headline size: 72 px for every question (76 overflowed the 836 px text
// width on the first lines of Q3 and Q7). Q3's first line still overflows at
// 72 (≈917 px), so Q3 is re-broken into three lines:
// "They have “CEO” / or “founder” in bio / but no revenue?".
//
// GESTURES — every gesture, the word it serves, and its frame
// (onset = round(sec*24); answer move = 10 f, onset-8 -> onset+2, chained from
// the knob's current value; bezier(0.45, 0, 0.2, 1.15) blended toward smoothstep
// on long swings so no frame step exceeds 0.30 v (~115 px) — see ANSWER_BEZIER;
// measured max |dv| over the whole cut = 0.298)
//   f0      card entrance (slide up 24 + fade, 10 f)
//   INTRO   "Startup & dating / edition" (present from the entrance)
//   f75     "hot"   v -> +1
//   f86     "not"   v -> -1
//   f96     Q1 swap: headline swap, eyebrow · 01, height 2->3, return to 0 (12 f)
//           "If somebody built you a / custom app on or before / your first date?"
//   f189    "not"   v -> -1
//   f201    "hot"   v -> +1
//   f218    "not"   v -> -1
//   f256    Q2 swap: · 02, height 3->2, return to 0
//   f330    "kind (of hot)" move starts (8 f, answer ease), lands f338 at v = +0.55
//   f357    "not"   v -> -1
//   f367    "hot"   v -> +1
//   f393    "not"   v -> -1 ("sorry, not" holds)
//   f459    Q3 swap: · 03, height 2->3, return to 0
//   f549    "not"   v -> -1 (lands f551)
//   f558    Q4 swap "Uses Lovable?": · 04, height 3->1 (Q3 clears by f558);
//           knob holds NOT
//   f560    Q4 return to 0 (12 f inOut cubic, lands f572)
//   f566    "Lovable?" the wordmark pulses 1 -> 1.08 -> 1 (12 f) — the brand moment
//   f607    "hot"   v -> +1 ("thank you" f583, "yeah" f618, "sure" f627 hold)
//   f648    Q5 swap: · 05 "Flirts with AI?", height 1->1, return to 0
//   f681    "not"   v -> -1
//   f720    "hot"   v -> +1 (lands f722)
//   f730    "nope"  v -> -1 (starts f722 from the landed value)
//   f752    "that's hot" v -> +1
//   f759    Q6 swap (text on time): · 06, height 1->2; knob holds HOT
//   f762    Q6 return to 0 (12 f inOut cubic, lands f774)
//   f837    "not"   v -> -1
//   f852    "what is NDA?" return to 0 (12 f) + HESITANT wobble
//   f959    "fine"  v -> +0.45
//   f991    Q7 swap: · 07, height 2->3, return to 0
//   f1068   "not"   v -> -1
//   f1113   "know"  v -> 0 + HESITANT wobble
//   f1206   "good"  v -> +0.4
//   f1249   "hot"   v -> +1
//   f1267   "bad"   v -> -0.3
//   f1316   "not"   v -> -1, hold to f1391
// Continuous (not gestures): idle wobble while centred, halo colour sampled
// from the gradient at the knob, NOT/HOT label emphasis driven by v, word
// reveals on each onset.
// ---------------------------------------------------------------------------

const FONT = 'LovableCameraPlain';
loadFont({
	family: FONT,
	url: staticFile('fonts/CameraPlainVariable.ttf'),
	weight: '400 900',
});

export const FPS = 24;
export const DURATION = 1392;

export const schema = z.object({
	previewBg: z.boolean(),
});

export const defaultProps = schema.parse({previewBg: false});

// Brand
const BLACK = '#1B1B1B';
const CREME = '#F7F4ED';
const PAPER = '#FCFBF8';
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
const FULL = `linear-gradient(90deg, ${FULL_STOPS.map(
	([p, c]) => `rgb(${c.join(',')}) ${Math.round(p * 100)}%`,
).join(', ')})`;

const sampleFull = (p: number): [number, number, number] => {
	const x = Math.min(1, Math.max(0, p));
	for (let i = 1; i < FULL_STOPS.length; i++) {
		const [p1, c1] = FULL_STOPS[i];
		const [p0, c0] = FULL_STOPS[i - 1];
		if (x <= p1) {
			const t = (x - p0) / (p1 - p0);
			return [0, 1, 2].map((k) => c0[k] + (c1[k] - c0[k]) * t) as [
				number,
				number,
				number,
			];
		}
	}
	return FULL_STOPS[FULL_STOPS.length - 1][1];
};

// Layout (from .d3)
const CARD_X = 70;
const CARD_TOP = 300;
const PAD_T = 44;
const PAD_X = 52;
const PAD_B = 50;
const TEXT_W = 1080 - CARD_X * 2 - PAD_X * 2; // 836
const HEAD_SIZE = 72;
const LINE_H = HEAD_SIZE * 0.98;
const TRACK_W = TEXT_W;
const KNOB = 76;
const KNOB_TRAVEL = TRACK_W / 2 - KNOB / 2; // 380

// ---------------------------------------------------------------------------
// Questions
type Word = {w: string; f: number};
type Question = {n: number | null; swap: number; lines: Word[][]};

const L = (...pairs: [string, number][]): Word[] =>
	pairs.map(([w, f]) => ({w, f}));

const QUESTIONS: Question[] = [
	{
		n: null,
		swap: 0,
		lines: [
			L(['Startup', -99], ['&', -99], ['dating', -99]),
			L(['edition', -99]),
		],
	},
	{
		n: 1,
		swap: 96,
		lines: [
			L(['If', 96], ['somebody', 97], ['built', 108], ['you', 118], ['a', 121]),
			L(['custom', 127], ['app', 136], ['on', 146], ['or', 154], ['before', 158]),
			L(['your', 164], ['first', 169], ['date?', 176]),
		],
	},
	{
		n: 2,
		swap: 256,
		lines: [
			L(['If', 256], ['they', 259], ['made', 263], ['a', 270], ['startup', 282]),
			L(['their', 292], ['whole', 300], ['personality?', 304]),
		],
	},
	{
		n: 3,
		swap: 459,
		lines: [
			L(['They', 459], ['have', 461], ['“CEO”', 466]),
			L(['or', 474], ['“founder”', 480], ['in', 489], ['bio', 496]),
			L(['but', 511], ['no', 530], ['revenue?', 533]),
		],
	},
	{
		n: 4,
		swap: 558,
		lines: [L(['Uses', 558], ['Lovable?', 566])],
	},
	{
		n: 5,
		swap: 648,
		lines: [L(['Flirts', 648], ['with', 659], ['AI?', 666])],
	},
	{
		n: 6,
		swap: 759,
		lines: [
			L(['Makes', 759], ['you', 764], ['sign', 768], ['an', 776], ['NDA', 780]),
			L(['before', 795], ['your', 804], ['first', 810], ['date?', 817]),
		],
	},
	{
		n: 7,
		swap: 991,
		lines: [
			L(['Asks', 991], ['you', 997], ['to', 1002], ['work', 1006], ['together', 1010]),
			L(['or', 1018], ['co-found', 1024], ['a', 1033], ['company', 1036]),
			L(['on', 1043], ['your', 1046], ['first', 1049], ['date?', 1054]),
		],
	},
];

// ---------------------------------------------------------------------------
// Knob model: v in [-1 NOT, +1 HOT]
type Move = {start: number; dur: number; to: number; answer: boolean};

// Answer move: 10 f, onset-8 -> onset+2, bezier(0.45, 0, 0.2, 1.15) — eases out
// of rest, fast middle, small overshoot on arrival. That curve's peak step is
// 0.294 x the swing distance per frame at 10 f, so it alone keeps the knob
// under the 0.30 v/frame (≈115 px) speed cap only for swings up to ~1.0. For
// longer swings (NOT <-> HOT is 2.0) the curve is blended toward smoothstep by
// the smallest amount that keeps every frame step <= MAX_STEP; a full swing is
// therefore a pure smoothstep slide (peak step 0.296, no overshoot).
const ANSWER_BEZIER = Easing.bezier(0.45, 0, 0.2, 1.15);
const smoothstep = (t: number) => t * t * (3 - 2 * t);
const MAX_STEP = 0.298;
const RETURN = Easing.inOut(Easing.cubic);

const blendCache = new Map<string, number>();
const answerBlend = (dist: number, dur: number): number => {
	const key = `${dist.toFixed(5)}|${dur}`;
	const hit = blendCache.get(key);
	if (hit !== undefined) return hit;
	let w = 0;
	for (; w < 1; w += 0.01) {
		let prev = 0;
		let max = 0;
		for (let i = 1; i <= dur; i++) {
			const t = i / dur;
			const y = (1 - w) * ANSWER_BEZIER(t) + w * smoothstep(t);
			max = Math.max(max, Math.abs(y - prev) * dist);
			prev = y;
		}
		if (max <= MAX_STEP) break;
	}
	w = Math.min(1, w);
	blendCache.set(key, w);
	return w;
};

const ans = (onset: number, to: number): Move => ({
	start: onset - 8,
	dur: 10,
	to,
	answer: true,
});
const ret = (start: number): Move => ({start, dur: 12, to: 0, answer: false});

const MOVES: Move[] = [
	ans(75, 1),
	ans(86, -1),
	ret(96),
	ans(189, -1),
	ans(201, 1),
	ans(218, -1),
	ret(256),
	{start: 330, dur: 8, to: 0.55, answer: true}, // "kind of hot"
	ans(357, -1),
	ans(367, 1),
	ans(393, -1),
	ret(459),
	ans(549, -1),
	ret(560), // Q4 "Uses Lovable?": hold NOT past the f558 swap, then return
	ans(607, 1), // "hot" ("thank you" f583 and "yeah"/"sure" f618/f627 hold)
	ret(648),
	ans(681, -1),
	ans(720, 1),
	ans(730, -1),
	ans(752, 1),
	ret(762), // Q6: hold HOT past the f759 swap, then return
	ans(837, -1),
	ret(852), // "what is NDA?"
	ans(959, 0.45),
	ret(991),
	ans(1068, -1),
	ans(1113, 0), // "I don't know"
	ans(1206, 0.4),
	ans(1249, 1),
	ans(1267, -0.3),
	ans(1316, -1),
];

const HESITANT: [number, number][] = [
	[852, 952],
	[1106, 1199],
];

const evalMove = (m: Move, from: number, f: number) => {
	const t = Math.min(1, Math.max(0, (f - m.start) / m.dur));
	let y: number;
	if (m.answer) {
		const w = answerBlend(Math.abs(m.to - from), m.dur);
		y = (1 - w) * ANSWER_BEZIER(t) + w * smoothstep(t);
	} else {
		y = RETURN(t);
	}
	return from + (m.to - from) * y;
};

const vBase = (f: number): number => {
	let cur: Move | null = null;
	let curFrom = 0;
	for (const m of MOVES) {
		if (f < m.start) break;
		const startVal = cur ? evalMove(cur, curFrom, m.start) : 0;
		cur = m;
		curFrom = startVal;
	}
	return cur ? evalMove(cur, curFrom, f) : 0;
};

const isHesitant = (f: number) => HESITANT.some(([a, b]) => f >= a && f < b);

// Wobble envelopes: the per-frame flag averaged over 8 frames, so the
// amplitude ramps in/out and never pops.
const envelope = (f: number, hesitant: boolean) => {
	let sum = 0;
	for (let k = -4; k < 4; k++) {
		const g = f + k;
		const centred = Math.abs(vBase(g)) < 0.05;
		const h = isHesitant(g);
		if (centred && (hesitant ? h : !h)) sum++;
	}
	return smoothstep(sum / 8);
};

export const knobV = (f: number): number => {
	const base = vBase(f);
	const t = f / FPS;
	const idle = envelope(f, false) * 0.025 * Math.sin(2 * Math.PI * 0.8 * t);
	const hes =
		envelope(f, true) * 0.08 * Math.sin(2 * Math.PI * 0.6 * t + 0.6);
	return base + idle + hes;
};

// ---------------------------------------------------------------------------
// Wordmark: the `word` symbol from cards.html, inlined verbatim.
const Wordmark: React.FC<{scale: number}> = ({scale}) => (
	<svg
		width={150}
		height={26}
		viewBox="0 3 52 9"
		style={{
			color: CREME,
			display: 'block',
			transform: `scale(${scale})`,
			transformOrigin: 'center center',
		}}
	>
		<defs>
			<radialGradient
				id="lovable-heartg"
				cx="0"
				cy="0"
				r="1"
				gradientTransform="matrix(-1.54236 7.07838 -10.231 -2.15602 4.627 5.022)"
				gradientUnits="userSpaceOnUse"
			>
				<stop offset=".106" stopColor="#FE7B02" />
				<stop offset=".394" stopColor="#FE3F21" />
				<stop offset=".608" stopColor="#F858BC" />
				<stop offset=".929" stopColor="#575ECF" />
			</radialGradient>
		</defs>
		<path
			fill="currentColor"
			fillRule="evenodd"
			d="M20.318 5.25c.643 0 1.206.14 1.69.418a2.81 2.81 0 0 1 1.118 1.191c.266.513.4 1.115.4 1.807s-.134 1.296-.4 1.812a2.81 2.81 0 0 1-1.118 1.193c-.484.278-1.047.418-1.690.418s-1.208-.14-1.695-.418a2.85 2.85 0 0 1-1.125-1.193c-.262-.516-.393-1.12-.393-1.812s.131-1.294.393-1.807a2.848 2.848 0 0 1 1.125-1.191c.487-.279 1.052-.418 1.695-.418Zm0 1.425c-.27 0-.504.076-.7.228-.193.147-.34.37-.443.67-.102.295-.153.66-.153 1.093 0 .435.05.801.153 1.1.102.3.25.524.443.676.196.147.43.22.7.22.27 0 .502-.073.694-.22.193-.152.341-.375.443-.67.103-.299.153-.667.153-1.106 0-.65-.112-1.145-.337-1.481a1.08 1.08 0 0 0-.953-.51ZM32.7 5.25c.61 0 1.127.1 1.549.3.422.197.74.48.953.849.217.368.325.809.325 1.32v2.704c0 .29.02.562.062.812.044.245.108.4.19.466V12h-1.935a5.895 5.895 0 0 1-.105-.684 7.745 7.745 0 0 1-.02-.228 2.293 2.293 0 0 1-.151.203c-.205.242-.47.437-.793.584-.32.143-.685.215-1.094.215-.406 0-.77-.08-1.094-.24a1.845 1.845 0 0 1-.756-.682 1.984 1.984 0 0 1-.27-1.045c0-.606.178-1.069.535-1.388.356-.324.87-.534 1.542-.633l1.125-.16c.225-.032.403-.074.534-.123a.622.622 0 0 0 .288-.196.549.549 0 0 0 .093-.327.65.65 0 0 0-.11-.367.702.702 0 0 0-.32-.27c-.14-.07-.31-.105-.51-.105-.32 0-.576.083-.768.251-.193.164-.298.39-.314.676h-1.923c.016-.434.147-.82.393-1.155.25-.34.596-.604 1.039-.792.442-.189.954-.283 1.535-.283Zm.99 3.498a.98.98 0 0 1-.215.14 2.49 2.49 0 0 1-.584.178l-.473.092c-.315.061-.553.156-.713.283-.155.127-.233.305-.233.534 0 .23.084.412.252.547.168.135.383.203.645.203s.494-.058.694-.173c.201-.118.355-.282.461-.49.11-.21.166-.448.166-.714v-.6Zm4.526-2.375c.065-.125.138-.243.221-.349.197-.25.437-.44.719-.571.282-.135.6-.203.952-.203.528 0 .988.138 1.377.412.389.275.688.67.896 1.186.21.512.314 1.120.314 1.824 0 .7-.107 1.309-.32 1.825-.213.512-.518.906-.915 1.18-.393.275-.854.412-1.383.412-.352 0-.667-.062-.946-.184a1.832 1.832 0 0 1-.7-.554 2.2 2.2 0 0 1-.234-.383V12h-1.843V3h1.862v3.373Zm1.284.296c-.274 0-.51.085-.707.253-.192.163-.338.397-.436.7a3.376 3.376 0 0 0-.148 1.05c0 .406.05.759.148 1.058.098.299.243.53.436.694.197.164.433.246.707.246.279 0 .512-.082.7-.246.193-.164.336-.395.43-.694.099-.3.148-.652.148-1.058 0-.405-.05-.757-.147-1.056-.095-.299-.238-.53-.43-.694a1.015 1.015 0 0 0-.7-.253Zm9.416-1.419c.602 0 1.136.131 1.604.393.466.262.829.643 1.086 1.143.263.5.394 1.097.394 1.794 0 .25-.002.449-.006.596H47.51c.018.288.071.538.164.75a1.3 1.3 0 0 0 .491.596c.214.13.465.196.757.196.319 0 .583-.082.792-.246.209-.167.34-.403.393-.706h1.862a2.48 2.48 0 0 1-.485 1.235 2.54 2.54 0 0 1-1.051.805c-.439.188-.949.283-1.53.283-.655 0-1.225-.125-1.708-.375a2.672 2.672 0 0 1-1.13-1.143c-.267-.508-.4-1.137-.4-1.887 0-.712.14-1.327.418-1.843a2.86 2.86 0 0 1 1.155-1.186c.491-.27 1.051-.405 1.678-.405Zm-.044 1.345c-.274 0-.516.068-.725.203a1.29 1.29 0 0 0-.479.59 2.045 2.045 0 0 0-.132.498h2.562a1.873 1.873 0 0 0-.138-.602 1.061 1.061 0 0 0-.418-.516 1.243 1.243 0 0 0-.67-.173Z"
			clipRule="evenodd"
		/>
		<path
			fill="currentColor"
			d="m26.605 9.995 1.342-4.566h1.924L27.628 12h-2.07l-2.33-6.57h1.98l1.397 4.565Zm-13.013.143h2.256c1.632 0 1.421 1.837 1.418 1.861h-5.603V3h1.93v7.138Zm31.516 1.861h-1.862V3h1.862v8.999Z"
		/>
		<path
			fill="url(#lovable-heartg)"
			fillRule="evenodd"
			d="M2.7 3c1.492 0 2.7 1.192 2.7 2.663v1.012h.9c1.49 0 2.7 1.192 2.7 2.662S7.791 12 6.3 12H0V5.663C0 4.193 1.209 3 2.7 3Z"
			clipRule="evenodd"
		/>
	</svg>
);

// ---------------------------------------------------------------------------
const clampOpts = {
	extrapolateLeft: 'clamp',
	extrapolateRight: 'clamp',
} as const;

const Headline: React.FC<{q: Question; next: Question | undefined; frame: number}> = ({
	q,
	next,
	frame,
}) => {
	const exit = next
		? interpolate(frame, [next.swap - 6, next.swap], [0, 1], {
				...clampOpts,
				easing: Easing.inOut(Easing.cubic),
			})
		: 0;
	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				top: 0,
				width: TEXT_W,
				opacity: 1 - exit,
				transform: `translateY(${-16 * exit}px)`,
			}}
		>
			{q.lines.map((line, li) => (
				<div key={li} style={{height: LINE_H, whiteSpace: 'nowrap'}}>
					{line.map((word, wi) => {
						const r = interpolate(frame, [word.f - 2, word.f + 4], [0, 1], {
							...clampOpts,
							easing: Easing.out(Easing.cubic),
						});
						return (
							<React.Fragment key={wi}>
								{wi > 0 ? ' ' : null}
								<span
									style={{
										display: 'inline-block',
										opacity: r,
										transform: `translateY(${24 * (1 - r)}px)`,
									}}
								>
									{word.w}
								</span>
							</React.Fragment>
						);
					})}
				</div>
			))}
		</div>
	);
};

const LovableHotOrNot: React.FC<z.infer<typeof schema>> = ({previewBg}) => {
	const frame = useCurrentFrame();

	// Card entrance
	const enter = interpolate(frame, [0, 10], [0, 1], {
		...clampOpts,
		easing: Easing.out(Easing.cubic),
	});

	// Active questions: visible from 2 f before their swap until the next swap.
	const visible = QUESTIONS.map((q, i) => ({q, next: QUESTIONS[i + 1]})).filter(
		({q, next}) => frame >= q.swap - 2 && (!next || frame < next.swap),
	);

	// Headline block height eases over 10 f centred on each swap.
	let lines = QUESTIONS[0].lines.length;
	for (let i = 1; i < QUESTIONS.length; i++) {
		const s = QUESTIONS[i].swap;
		const k = interpolate(frame, [s - 5, s + 5], [0, 1], {
			...clampOpts,
			easing: Easing.inOut(Easing.cubic),
		});
		lines = lines + (QUESTIONS[i].lines.length - QUESTIONS[i - 1].lines.length) * k;
	}
	const headH = lines * LINE_H;

	// Eyebrow number crossfade (8 f centred on the swap)
	const suffixOpacity = (i: number) => {
		const inO =
			i === 0
				? 1
				: interpolate(frame, [QUESTIONS[i].swap - 4, QUESTIONS[i].swap + 4], [0, 1], clampOpts);
		const next = QUESTIONS[i + 1];
		const outO = next
			? interpolate(frame, [next.swap - 4, next.swap + 4], [1, 0], clampOpts)
			: 1;
		return Math.min(inO, outO);
	};

	// Knob
	const v = knobV(frame);
	const knobCx = TRACK_W / 2 + v * KNOB_TRAVEL;
	const [hr, hg, hb] = sampleFull(knobCx / TRACK_W);
	const a = Math.min(1, Math.abs(v));
	const hotA = v > 0 ? a : 0;
	const notA = v < 0 ? a : 0;
	const labelStyle = (mine: number, other: number, origin: string) => ({
		display: 'inline-block',
		opacity: 0.6 + 0.4 * mine - 0.25 * other,
		transform: `scale(${1 + 0.08 * mine})`,
		transformOrigin: origin,
	});

	// Wordmark pulse on "Lovable"
	const pt = interpolate(frame, [566, 578], [0, 1], clampOpts);
	const wordScale = 1 + 0.08 * (0.5 - 0.5 * Math.cos(2 * Math.PI * pt));

	return (
		<AbsoluteFill style={{backgroundColor: previewBg ? '#4e463d' : undefined}}>
			<div
				style={{
					position: 'absolute',
					left: CARD_X,
					right: CARD_X,
					top: CARD_TOP,
					background: BLACK,
					borderRadius: 44,
					padding: `${PAD_T}px ${PAD_X}px ${PAD_B}px`,
					boxShadow:
						'0 30px 80px rgba(0,0,0,.35), inset 0 0 0 1px rgba(247,244,237,.08)',
					fontFamily: FONT,
					WebkitFontSmoothing: 'antialiased',
					opacity: enter,
					transform: `translateY(${24 * (1 - enter)}px)`,
				}}
			>
				{/* Row 1: eyebrow + wordmark */}
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
					}}
				>
					<div
						style={{
							color: 'rgba(247,244,237,.6)',
							fontSize: 26,
							fontWeight: 500,
							textTransform: 'uppercase',
							letterSpacing: '.02em',
							lineHeight: 1.4,
							whiteSpace: 'pre',
						}}
					>
						HOT OR NOT
						<span style={{display: 'inline-grid'}}>
							{QUESTIONS.map((q, i) =>
								q.n === null ? null : (
									<span
										key={i}
										style={{
											gridArea: '1 / 1',
											whiteSpace: 'pre',
											opacity: suffixOpacity(i),
										}}
									>
										{` · ${String(q.n).padStart(2, '0')}`}
									</span>
								),
							)}
						</span>
					</div>
					<Wordmark scale={wordScale} />
				</div>

				{/* Headline */}
				<div
					style={{
						position: 'relative',
						marginTop: 30,
						height: headH,
						color: CREME,
						fontSize: HEAD_SIZE,
						fontWeight: 600,
						letterSpacing: '-0.035em',
						lineHeight: 0.98,
					}}
				>
					{visible.map(({q, next}) => (
						<Headline key={q.swap} q={q} next={next} frame={frame} />
					))}
				</div>

				{/* Track + knob */}
				<div
					style={{
						position: 'relative',
						marginTop: 58,
						height: 28,
						borderRadius: 999,
						background: FULL,
					}}
				>
					<div
						style={{
							position: 'absolute',
							top: '50%',
							left: knobCx,
							width: KNOB,
							height: KNOB,
							margin: `${-KNOB / 2}px 0 0 ${-KNOB / 2}px`,
							borderRadius: '50%',
							background: PAPER,
							boxShadow: `0 8px 24px rgba(0,0,0,.45), 0 0 0 6px rgba(27,27,27,1), 0 0 20px 10px rgba(${hr.toFixed(0)},${hg.toFixed(0)},${hb.toFixed(0)},.55)`,
						}}
					/>
				</div>

				{/* End labels */}
				<div
					style={{
						marginTop: 26,
						display: 'flex',
						justifyContent: 'space-between',
						fontSize: 30,
						fontWeight: 600,
						letterSpacing: '.04em',
					}}
				>
					<span style={{...labelStyle(notA, hotA, 'left center'), color: 'rgb(98,137,255)'}}>
						NOT
					</span>
					<span style={{...labelStyle(hotA, notA, 'right center'), color: 'rgb(255,134,27)'}}>
						HOT
					</span>
				</div>
			</div>
		</AbsoluteFill>
	);
};

export default LovableHotOrNot;
