import {Composition} from 'remotion';
import KpiMetByLuck, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-detecting-bullshit/KpiMetByLuck';

// Private render entry for KpiMetByLuck (nik-detecting-bullshit; Cheeky Pint style (stout)): the REVENUE KPI bar meets its lit target line, then opens up: a small cream team base under board-toned market and luck blocks.
// Opaque 1080x1920, 23.976 fps, 90 frames.
export const RemotionRoot = () => (
  <Composition
    id="KpiMetByLuck"
    component={KpiMetByLuck}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
