import {Composition} from 'remotion';
import DiesOutLineage, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/kyle-plague/DiesOutLineage';

// Private render entry for DiesOutLineage (plague clip), so this cut renders
// while other builders own src/Root.tsx. Opaque, 1080x1920, 29.97 fps, 159 f.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="DiesOutLineage"
        component={DiesOutLineage}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
