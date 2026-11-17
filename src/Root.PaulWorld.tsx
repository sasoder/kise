import { Composition, useCurrentFrame } from "remotion";
import PaulWorldProbe, { FPS, defaultProps, schema } from "../generated/components/paul-twelve-hours/paulWorldProbe";

// paul-twelve-hours shared world: probe stills (0 = outsider style sheet, 1..7 = the sets at cut framings) and a
// 48-frame motion probe (probe 8). PaulWorldProbeAll renders probes 0..7 as frames 0..7.
const All = () => {
  const frame = useCurrentFrame();
  return <PaulWorldProbe probe={Math.min(7, frame)} frameOverride={30} />;
};
export const RemotionRoot = () => (
  <>
    {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
      <Composition key={n} id={`PaulWorldProbe${n}`} component={PaulWorldProbe} durationInFrames={1} fps={FPS} width={1080} height={1920} schema={schema} defaultProps={{ ...defaultProps, probe: n }} />
    ))}
    <Composition id="PaulWorldMotion" component={PaulWorldProbe} durationInFrames={48} fps={FPS} width={1080} height={1920} schema={schema} defaultProps={{ ...defaultProps, probe: 8 }} />
    <Composition id="PaulWorldProbeAll" component={All} durationInFrames={8} fps={FPS} width={1080} height={1920} />
  </>
);
