import React from 'react';
import {Composition} from 'remotion';
import {z} from 'zod';
import OnceAYear, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-managers-underperformers/OnceAYear';
import {DEC, PLANNER_WIDE, Planner, QUARTER_ENDS, WallStage} from '../generated/components/nik-managers-underperformers/plannerShared';
import {amberBandFor} from '../generated/components/kits/cheeky-pint/stoutShared';

// Private render entry for OnceAYear (nik-managers-underperformers; Cheeky Pint style, picture-book office): a hand
// presses one amber sticker onto December and the camera pulls back to the whole empty year.
// Opaque 1080x1920, 23.976 fps, 81 frames. PlannerProbe: the wide planner stills for cut C (one sticker / four).
const probeSchema = z.object({four: z.boolean()});
const PlannerProbe: React.FC<z.infer<typeof probeSchema>> = ({four}) => {
	const band = amberBandFor(PLANNER_WIDE);
	const stickers = (four ? [...QUARTER_ENDS] : [DEC]).map((month) => ({month, press: 1}));
	return (
		<WallStage S={80} cam={PLANNER_WIDE}>
			<Planner k={1} band={band} stickers={stickers} />
		</WallStage>
	);
};

export const RemotionRoot = () => (
	<>
		<Composition
			id="OnceAYear"
			component={OnceAYear}
			schema={schema}
			defaultProps={defaultProps}
			durationInFrames={DURATION}
			fps={FPS}
			width={1080}
			height={1920}
		/>
		<Composition
			id="PlannerProbe"
			component={PlannerProbe}
			schema={probeSchema}
			defaultProps={{four: false}}
			durationInFrames={1}
			fps={FPS}
			width={1080}
			height={1920}
		/>
	</>
);
