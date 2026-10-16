import {Composition} from 'remotion';
import OutNowCoreMemory, {
  defaultProps,
  schema,
} from '../generated/components/cm-early-js-trailer/OutNowCoreMemory';

// Private render entry: the approved OUT NOW! sting (OutNowCoreMemory) with the
// text OUT SOON!, for the end of the CM_EARLY_JS 9:16 trailer. Transparent
// overlay, 1080x1920, at the sequence's 24000/1001 fps; 119 frames so it holds
// for the whole end hit (sequence 67.025-71.989 s).
export const RemotionRoot = () => {
  return (
    <Composition
      id="OutSoonCoreMemory"
      component={OutNowCoreMemory}
      schema={schema}
      defaultProps={{...defaultProps, text: 'OUT SOON!', fontSize: 164}}
      durationInFrames={119}
      fps={24000 / 1001}
      width={1080}
      height={1920}
    />
  );
};
