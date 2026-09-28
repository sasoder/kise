import {Composition} from 'remotion';
import NotConveyingAnything, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/NotConveyingAnything';

// Private render entry for NotConveyingAnything, so this cut renders while
// other builders own src/Root.tsx. Sarah Paine, "if you use it to mean
// 'important', you're actually not conveying anything": the war as a dim row
// of battles, IMPORTANT underlines all of it, and it settles back to the
// plain row. Opaque, 1080x1920, 24fps, 5.00 s.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="NotConveyingAnything"
        component={NotConveyingAnything}
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
