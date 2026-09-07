import {Composition} from 'remotion';
import InventorOfXboxArrow, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/InventorOfXboxArrow';

// the credit and the point — the label lands, then an arrow draws in from above
// it and points right: "Inventor of Xbox".
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="InventorOfXboxArrow"
        component={InventorOfXboxArrow}
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
