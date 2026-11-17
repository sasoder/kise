import { Composition, useCurrentFrame } from "remotion";
import PaulWorldProbe, {
  FPS,
  OUTSIDER_LOOP_N,
  OUTSIDER_SCALE_N,
  OUTSIDER_SHOTS,
  PaulOutsiderLoop,
  PaulOutsiderScale,
  PaulOutsiderShots,
  PaulSlackBlack,
  PaulVaultOpen,
  PaulVaultStates,
  VAULT_OPEN_N,
  defaultProps,
  schema,
} from "../generated/components/paul-twelve-hours/paulWorldProbe";

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
    {/* rev 1: the 3D clay outsider (turnaround 0-3, S2 close-up 4, poses 5+), the bank vaults, the black Slack mark */}
    <Composition id="PaulOutsiderShots" component={PaulOutsiderShots} durationInFrames={OUTSIDER_SHOTS} fps={FPS} width={1080} height={1920} />
    <Composition id="PaulOutsiderLoop" component={PaulOutsiderLoop} durationInFrames={OUTSIDER_LOOP_N} fps={FPS} width={1080} height={1920} />
    <Composition id="PaulVaultStates" component={PaulVaultStates} durationInFrames={5} fps={FPS} width={1080} height={1920} />
    <Composition id="PaulVaultOpen" component={PaulVaultOpen} durationInFrames={VAULT_OPEN_N} fps={FPS} width={1080} height={1920} />
    <Composition id="PaulSlackBlack" component={PaulSlackBlack} durationInFrames={2} fps={FPS} width={1080} height={1920} />
    <Composition id="PaulOutsiderScale" component={PaulOutsiderScale} durationInFrames={OUTSIDER_SCALE_N} fps={FPS} width={1080} height={1920} />
  </>
);
