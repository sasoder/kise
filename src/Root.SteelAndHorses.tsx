import {Composition} from 'remotion';
import SteelAndHorses, {
  DURATION,
  FPS,
  SteelAndHorsesSheet,
  defaultProps,
  schema,
} from '../generated/components/SteelAndHorses';

// Private render entry for SteelAndHorses (Si Sheppard, "Conquistador
// advantages", cut B): one pull-back from a steel blade breaking obsidian, to
// the mounted conquistador, to his band of two hundred as dots on the Gulf
// coast, to the Aztec empire turning orange. Opaque umber page, 1080x1920,
// 23.976 fps, 189 frames. SteelAndHorsesSheet is the review sheet of the cast.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SteelAndHorses"
        component={SteelAndHorses}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition id="SteelAndHorsesSheet" component={SteelAndHorsesSheet} durationInFrames={1} fps={24} width={1080} height={1920} />
    </>
  );
};
