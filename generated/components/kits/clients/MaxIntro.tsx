import {loadFont} from '@remotion/fonts';
import React from 'react';
import {
	AbsoluteFill,
	Easing,
	Img,
	interpolate,
	staticFile,
	useCurrentFrame,
} from 'remotion';
import {z} from 'zod';

// ---------------------------------------------------------------------------
// Lovable — "Full Stack Fika" · MaxIntro. Freeze-frame character introduction.
//
// CHECK LINE: after this cut the viewer can say
//   "that guy is Max, the technical evangelist at Lovable."
//
// MOTION: the footage sits exactly as the editor placed it in the 1:1 Premiere
// sequence, then on "with Max" the picture punches in on Max in one smooth move
// (levelling the -1 deg tilt on the way) and FREEZES on the frame where he
// looks into the lens and smiles; the colour drains to black and white and a
// Lovable name card (Max / gradient bar / Technical Evangelist, wordmark top
// left) slides up from behind masks. It then holds alive: a slow continuous
// push-in about his face and the gradient drifting along the bar, until the
// edit hard-cuts away.
//
// OPAQUE full-frame clip, 1080x1080 (1:1 sequence), 24 fps. Source frames are
// 1080x1920.
// DURATION: timeline 00:00:14:17 -> 00:00:21:11 = 6.75 s x 24 = 162 frames.
//
// CAMERA: one similarity transform, screen = pos(F) + s * R(rot) * (p - F),
// interpolated from BASE to END by the punch-in progress.
//   BASE (Premiere placement, f0-f43): Scale 102 %, Position (540, 568),
//        Rotation -1 deg (counter-clockwise), anchor = source centre (540, 960).
//   END  (freeze): scale END_SCALE, rotation 0, Max's face centre (source
//        825, 795) at screen (690, 330).
//
// LAYOUT (screen px, measured on f161): card left-aligned at x 70. "Max"
// letters y 545-721 (baseline 721), gradient bar y 745-757, "Technical
// Evangelist" cap top 781 / baseline 815 / descender to 824. Gap title->bar =
// gap bar->subtitle = 24 px. Nothing below y 830 (editor's captions go in
// y 830-1080 over the dark grade, which starts near y 480). Wordmark top-left
// at (70, 112), under the painting's white line.
//
// GESTURES (graphic frames)
//   f0-f43    footage in the BASE placement, no grade
//   f44-f57   punch-in on Max, BASE -> END, tilt eased to level, landing
//             exactly on the freeze transform at f57 ("with" f44, "Max" f51)
//   f57       FREEZE on f057.png + shutter blink (white, f57-f58)
//   f57-f61   colour drains to B&W, contrast up; dark grades come in
//   f58-f67   "Max" slides up from behind its mask
//   f60-f70   gradient bar wipes in left -> right under the name
//   f63-f72   "Technical Evangelist" slides up from behind its mask
//   f66-f74   Lovable wordmark slides up from behind its mask, top-left
//   f57-f161  hold: portrait pushes in x1.00 -> x1.04 about Max's face (linear,
//             never stops), gradient drifts along the bar. No exit; hard cut
//             at f162.
// ---------------------------------------------------------------------------

const FONT = 'LovableCameraPlain';
loadFont({
	family: FONT,
	url: staticFile('fonts/CameraPlainVariable.ttf'),
	weight: '400 900',
});

export const FPS = 24;
export const DURATION = 162;

export const schema = z.object({});
export const defaultProps = schema.parse({});

// Brand
const BLACK = '#1B1B1B';
const CREME = '#F7F4ED';
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

// ---------------------------------------------------------------------------
// Timing
const LAST_SRC = 57; // f057.png = the freeze frame
const ZOOM_START = 44;
const FREEZE = 57;

// Camera. Source frames are 1080x1920; the composition is 1080x1080.
const SRC_W = 1080;
const SRC_H = 1920;
const BASE = {scale: 1.02, rot: -1, cx: 540, cy: 568}; // Premiere placement
const FACE = {x: 825, y: 795}; // Max's face centre in f057 (source px)
const FACE_TO = {x: 690, y: 330}; // where it lands on screen at the freeze
const END_SCALE = 2.1;
const HOLD_PUSH = 1.04;

// Card layout (screen px)
const MARGIN = 70;
const NAME_SIZE = 250; // cap height 0.70 em -> 175 px letters
const NAME_BASE = 721;
const BAR_Y = 745;
const BAR_H = 12;
const BAR_W = 690; // x 70 -> 760
const SUB_SIZE = 48;
const SUB_BASE = 815;
const MARK_W = 240;
const MARK_Y = 112; // below the white line in the painting (y ~66-85)
const BASELINE_EM = 0.839; // baseline offset in a line-height:1 box (hhea 2028/-639)

// ---------------------------------------------------------------------------
// Wordmark: the `word` symbol from cards.html, inlined verbatim.
const Wordmark: React.FC<{width: number}> = ({width}) => (
	<svg
		width={width}
		height={(width * 9) / 52}
		viewBox="0 3 52 9"
		style={{
			color: CREME,
			display: 'block',
		}}
	>
		<defs>
			<radialGradient
				id="maxintro-heartg"
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
			fill="url(#maxintro-heartg)"
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

const pad3 = (n: number) => String(n).padStart(3, '0');

// A line that slides up from behind a hard mask (never fades from nothing).
const Rise: React.FC<{
	frame: number;
	from: number;
	to: number;
	left: number;
	top: number;
	width: number;
	height: number;
	children: React.ReactNode;
}> = ({frame, from, to, left, top, width, height, children}) => {
	const p = interpolate(frame, [from, to], [0, 1], {
		...clampOpts,
		easing: Easing.bezier(0.16, 1, 0.3, 1),
	});
	if (frame < from) return null;
	return (
		<div
			style={{
				position: 'absolute',
				left,
				top,
				width,
				height,
				overflow: 'hidden',
			}}
		>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					transform: `translateY(${(1 - p) * (height + 4)}px)`,
				}}
			>
				{children}
			</div>
		</div>
	);
};

const MaxIntro: React.FC<z.infer<typeof schema>> = () => {
	const frame = useCurrentFrame();
	const src = Math.min(frame, LAST_SRC);

	// Punch-in: one move, in-out with a long soft landing, ends exactly on FREEZE.
	const zp = interpolate(frame, [ZOOM_START, FREEZE], [0, 1], {
		...clampOpts,
		easing: Easing.bezier(0.5, 0, 0.12, 1),
	});
	// Hold push-in, linear from the freeze to the last frame (about the face).
	const hold = interpolate(frame, [FREEZE, DURATION - 1], [1, HOLD_PUSH], clampOpts);

	// Where the face sits on screen in the BASE placement.
	const b0 = (BASE.rot * Math.PI) / 180;
	const dx = FACE.x - SRC_W / 2;
	const dy = FACE.y - SRC_H / 2;
	const faceBase = {
		x: BASE.cx + BASE.scale * (Math.cos(b0) * dx - Math.sin(b0) * dy),
		y: BASE.cy + BASE.scale * (Math.sin(b0) * dx + Math.cos(b0) * dy),
	};
	const s = BASE.scale + (END_SCALE - BASE.scale) * zp;
	const rot = BASE.rot * (1 - zp);
	const fx = faceBase.x + (FACE_TO.x - faceBase.x) * zp;
	const fy = faceBase.y + (FACE_TO.y - faceBase.y) * zp;
	const r = (rot * Math.PI) / 180;
	// screen = (fx, fy) + s * R(rot) * (p - FACE)  ->  translate, rotate, scale
	const tx = fx - s * (Math.cos(r) * FACE.x - Math.sin(r) * FACE.y);
	const ty = fy - s * (Math.sin(r) * FACE.x + Math.cos(r) * FACE.y);

	// Colour drain
	const bw = interpolate(frame, [FREEZE, FREEZE + 4], [0, 1], clampOpts);
	const flash = interpolate(
		frame,
		[FREEZE - 1, FREEZE, FREEZE + 1, FREEZE + 2],
		[0, 0.32, 0.14, 0],
		clampOpts,
	);
	const grade = interpolate(frame, [FREEZE, FREEZE + 6], [0, 1], clampOpts);

	// Card
	const barP = interpolate(frame, [60, 70], [0, 1], {
		...clampOpts,
		easing: Easing.bezier(0.16, 1, 0.3, 1),
	});
	const drift = interpolate(frame, [60, DURATION - 1], [0, 100], clampOpts);

	const nameTop = NAME_BASE - NAME_SIZE * 0.7 - 10;
	const nameH = NAME_SIZE * 0.7 + 20;
	const subTop = SUB_BASE - SUB_SIZE * 0.72 - 6;
	const subH = SUB_SIZE * 0.72 + 6 + SUB_SIZE * 0.26;
	const markH = (MARK_W * 9) / 52;

	return (
		<AbsoluteFill style={{backgroundColor: BLACK, overflow: 'hidden'}}>
			{/* footage / freeze frame */}
			<AbsoluteFill
				style={{
					transformOrigin: `${FACE_TO.x}px ${FACE_TO.y}px`,
					transform: hold === 1 ? undefined : `scale(${hold})`,
					filter:
						bw > 0
							? `grayscale(${bw}) contrast(${1 + 0.14 * bw}) brightness(${1 + 0.04 * bw})`
							: undefined,
				}}
			>
				<Img
					src={staticFile(`lovable/fika1/src/f${pad3(src)}.png`)}
					style={{
						position: 'absolute',
						left: 0,
						top: 0,
						width: SRC_W,
						height: SRC_H,
						transformOrigin: '0 0',
						transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${s})`,
					}}
				/>
			</AbsoluteFill>

			{/* grade: card + caption zone below, a touch at the top for the wordmark */}
			{grade > 0 ? (
				<AbsoluteFill
					style={{
						opacity: grade,
						background: `linear-gradient(180deg, rgba(27,27,27,0.42) 0%, rgba(27,27,27,0) 20%, rgba(27,27,27,0) 44%, rgba(27,27,27,0.42) 56%, rgba(27,27,27,0.8) 72%, rgba(27,27,27,0.92) 100%)`,
					}}
				/>
			) : null}

			{/* shutter blink */}
			{flash > 0 ? (
				<AbsoluteFill style={{backgroundColor: '#FFFFFF', opacity: flash}} />
			) : null}

			{/* name */}
			<Rise
				frame={frame}
				from={58}
				to={67}
				left={MARGIN - 20}
				top={nameTop}
				width={1080 - MARGIN * 2 + 20}
				height={nameH}
			>
				<div
					style={{
						position: 'absolute',
						left: 20 - NAME_SIZE * 0.035,
						top: NAME_BASE - NAME_SIZE * BASELINE_EM - nameTop,
						fontFamily: FONT,
						fontWeight: 800,
						fontSize: NAME_SIZE,
						lineHeight: `${NAME_SIZE}px`,
						letterSpacing: '-0.035em',
						color: CREME,
						whiteSpace: 'nowrap',
					}}
				>
					Max
				</div>
			</Rise>

			{/* gradient bar: the only colour in the frame */}
			{frame >= 60 ? (
				<div
					style={{
						position: 'absolute',
						left: MARGIN,
						top: BAR_Y,
						width: BAR_W,
						height: BAR_H,
						clipPath: `inset(0 ${(1 - barP) * 100}% 0 0)`,
						backgroundImage: FULL,
						backgroundSize: '190% 100%',
						backgroundPosition: `${drift}% 0`,
					}}
				/>
			) : null}

			{/* role */}
			<Rise
				frame={frame}
				from={63}
				to={72}
				left={MARGIN}
				top={subTop}
				width={560}
				height={subH}
			>
				<div
					style={{
						position: 'absolute',
						left: 0,
						top: SUB_BASE - SUB_SIZE * BASELINE_EM - subTop,
						fontFamily: FONT,
						fontWeight: 500,
						fontSize: SUB_SIZE,
						lineHeight: `${SUB_SIZE}px`,
						letterSpacing: '-0.01em',
						color: CREME,
						whiteSpace: 'nowrap',
					}}
				>
					Technical Evangelist
				</div>
			</Rise>

			{/* sign-off */}
			<Rise
				frame={frame}
				from={66}
				to={74}
				left={MARGIN}
				top={MARK_Y - 2}
				width={MARK_W}
				height={markH + 4}
			>
				<div style={{position: 'absolute', left: 0, top: 2}}>
					<Wordmark width={MARK_W} />
				</div>
			</Rise>
		</AbsoluteFill>
	);
};

export default MaxIntro;
