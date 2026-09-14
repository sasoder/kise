import {Composition, registerRoot} from 'remotion';
import SporttouchenPlateE, {
	DURATION,
	FPS,
	defaultProps,
	schema,
} from '../generated/components/SporttouchenPlateE';

// Sporttouchen quiz question plate — option E, "Quizkortet".
const Root = () => (
	<Composition
		id="SporttouchenPlateE"
		component={SporttouchenPlateE}
		schema={schema}
		defaultProps={defaultProps}
		durationInFrames={DURATION}
		fps={FPS}
		width={1080}
		height={1920}
	/>
);

registerRoot(Root);
