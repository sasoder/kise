import {Composition} from 'remotion';
import PivotalNotDecisive, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/PivotalNotDecisive';

// Private render entry for PivotalNotDecisive, so this cut renders while other
// builders own src/Root.tsx. Sarah Paine, Russo-Japanese War: "Port Arthur is
// not a decisive battle" — the fortress falls, Third Army turns north, the
// Shaho front still stands. Opaque vintage map, 1080x1920, 24 fps, 177 f.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="PivotalNotDecisive"
        component={PivotalNotDecisive}
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
