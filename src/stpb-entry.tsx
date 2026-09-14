import {Composition, registerRoot} from 'remotion';
import SporttouchenPlateB, {
	DURATION,
	FPS,
	defaultProps,
	schema,
} from '../generated/components/SporttouchenPlateB';

// Sporttouchen question plate, option B — "Ramen". Private render entry.
const Root = () => (
	<Composition
		id="SporttouchenPlateB"
		component={SporttouchenPlateB}
		schema={schema}
		defaultProps={defaultProps}
		durationInFrames={DURATION}
		fps={FPS}
		width={1080}
		height={1920}
	/>
);

registerRoot(Root);
