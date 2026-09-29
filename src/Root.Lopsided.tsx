import {Composition} from 'remotion';
import Lopsided, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/Lopsided';

// Private render entry for Lopsided, so this cut renders while other builders
// own src/Root.tsx. Sarah Paine, "in what way? ... I would use the word
// 'lopsided'": question marks on the page, a pan right to an engraved
// balance, a battle on the fulcrum, its dead fall 44 : 1 into the pans and the
// beam goes lopsided. Opaque, 1080x1920, 24fps, 10.17 s.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="Lopsided"
        component={Lopsided}
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
