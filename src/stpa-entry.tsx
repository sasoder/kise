import {Composition, registerRoot} from 'remotion';
import SporttouchenPlateA, {
	DURATION,
	FPS,
	defaultProps,
	schema,
} from '../generated/components/SporttouchenPlateA';

// Sporttouchen question plate, option A — "Knappen". Private render entry.
const Root = () => (
	<Composition
		id="SporttouchenPlateA"
		component={SporttouchenPlateA}
		schema={schema}
		defaultProps={defaultProps}
		durationInFrames={DURATION}
		fps={FPS}
		width={1080}
		height={1920}
	/>
);

registerRoot(Root);
