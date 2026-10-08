import {Composition} from 'remotion';
import VeryLongTimeV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/VeryLongTimeV2';
import {ARMY_SHEET, ArmySheet} from '../generated/components/apacheFigures';

// Private render entry for VeryLongTimeV2, so this cut renders while other
// builders own src/Root.tsx. Si Sheppard: "...resist European powers for a very
// long time." The Apache country behind its reinforced border, army after army
// turned away while the year runs 1600 -> 1886. Dwarkesh map style, 1080x1920,
// 24fps, 67 frames. ArmySheet = the check sheet of the three figure kinds.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="VeryLongTimeV2"
        component={VeryLongTimeV2}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="ApacheArmySheet"
        component={ArmySheet}
        durationInFrames={1}
        fps={FPS}
        width={ARMY_SHEET.w}
        height={ARMY_SHEET.h}
      />
    </>
  );
};
