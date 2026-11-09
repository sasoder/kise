import {Composition} from 'remotion';
import NewsCardIEEESpectrumSceye, {DURATION, FPS, defaultProps, schema} from '../generated/components/mikkel-trailer/NewsCardIEEESpectrumSceye';

// Private render entry for NewsCardIEEESpectrumSceye (mikkel-trailer; Core memory podcast style): the IEEE Spectrum Sceye floating-cell-tower article as printed matter (headline and the airship photo), a 16:9 still.
// Opaque 2048x1080 (rendered --scale=2 to the 4096x2160 sequence), 23.976 fps, 1 frame.
export const RemotionRoot = () => (
  <Composition
    id="NewsCardIEEESpectrumSceye"
    component={NewsCardIEEESpectrumSceye}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={2048}
    height={1080}
  />
);
