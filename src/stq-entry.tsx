import {Composition, registerRoot} from 'remotion';
import SporttouchenQuiz, {
	DURATION,
	FPS,
	defaultProps,
	schema,
} from '../generated/components/SporttouchenQuiz';

// Sporttouchen quiz question graphic — "Quizkortet" plate + talking logo.
const Root = () => (
	<Composition
		id="SporttouchenQuiz"
		component={SporttouchenQuiz}
		schema={schema}
		defaultProps={defaultProps}
		durationInFrames={DURATION}
		fps={FPS}
		width={1080}
		height={1920}
	/>
);

registerRoot(Root);
