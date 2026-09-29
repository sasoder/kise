import {Composition} from 'remotion';
import PivotalNotDecisiveV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/PivotalNotDecisiveV2';

// Private render entry for PivotalNotDecisiveV2, so this cut renders while
// other builders own src/Root.tsx. Sarah Paine, Russo-Japanese War: "Port
// Arthur is not a decisive battle" — the siege on the map, then the fortress
// glyph lands on cut 1's war timeline and the war runs on past it to the
// Treaty of Portsmouth. Opaque, 1080x1920, 24 fps, 177 f.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="PivotalNotDecisiveV2"
        component={PivotalNotDecisiveV2}
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
