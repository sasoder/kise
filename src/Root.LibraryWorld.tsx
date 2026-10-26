import {Composition} from 'remotion';
import LibraryWorldProbe, {defaultProps, schema} from '../generated/components/kyle-vaccine/libraryWorldProbe';

// Private render entry for the kyle-vaccine library world probe (libraryWorld.tsx): stills from any camera.
export const RemotionRoot = () => (
  <Composition id="LibraryWorld" component={LibraryWorldProbe} schema={schema} defaultProps={defaultProps} durationInFrames={160} fps={30000 / 1001} width={1080} height={1920} />
);
