import {Composition, registerRoot} from 'remotion';
import ElonArbitrage, {
  DURATION as EA_DURATION,
  FPS as EA_FPS,
  defaultProps as eaDefaultProps,
  schema as eaSchema,
} from '../generated/components/ElonArbitrage';
import CircularDependency, {
  DURATION as CD_DURATION,
  FPS as CD_FPS,
  defaultProps as cdDefaultProps,
  schema as cdSchema,
} from '../generated/components/CircularDependency';
import HoardingPowerStructure, {
  DURATION as HP_DURATION,
  FPS as HP_FPS,
  defaultProps as hpDefaultProps,
  schema as hpSchema,
} from '../generated/components/HoardingPowerStructure';
import RepricingRegime, {
  DURATION as RR_DURATION,
  FPS as RR_FPS,
  defaultProps as rrDefaultProps,
  schema as rrSchema,
} from '../generated/components/RepricingRegime';

// Dylan_Elon_Arbitrage (recut, 1:05.560) — Dwarkesh-style grid-background
// cutaways, 24fps, opaque. Its own entry point, like the other per-clip
// entries here, so it never contends with whatever Root.tsx is carrying.
//
//   bunx remotion render src/arbitrage-entry.tsx <CompositionId> out/<name>.mov
const Root = () => (
  <>
    {/* 0:03.940 -> 0:12.919 — the Elon arbitrage, $60B+/GW */}
    <Composition
      id="ElonArbitrage"
      component={ElonArbitrage}
      schema={eaSchema}
      defaultProps={eaDefaultProps}
      durationInFrames={EA_DURATION}
      fps={EA_FPS}
      width={1080}
      height={1920}
    />
    {/* 0:26.579 -> 0:34.899 — the capital / customer deadlock */}
    <Composition
      id="CircularDependency"
      component={CircularDependency}
      schema={cdSchema}
      defaultProps={cdDefaultProps}
      durationInFrames={CD_DURATION}
      fps={CD_FPS}
      width={1080}
      height={1920}
    />
    {/* 0:34.899 -> 0:46.039 — hoarding on a balance sheet, no end customer */}
    <Composition
      id="HoardingPowerStructure"
      component={HoardingPowerStructure}
      schema={hpSchema}
      defaultProps={hpDefaultProps}
      durationInFrames={HP_DURATION}
      fps={HP_FPS}
      width={1080}
      height={1920}
    />
    {/* 0:55.380 -> 1:05.560 — not $13B, $25B, $50B and more, per gigawatt */}
    <Composition
      id="RepricingRegime"
      component={RepricingRegime}
      schema={rrSchema}
      defaultProps={rrDefaultProps}
      durationInFrames={RR_DURATION}
      fps={RR_FPS}
      width={1080}
      height={1920}
    />
  </>
);

registerRoot(Root);
