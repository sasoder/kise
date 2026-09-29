import React from 'react';
import {useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {
  BASE,
  BEACH_PIECES,
  BeachGlints,
  beachPieceStyle,
  beachPose,
  GLINT_OPACITY,
  VIEW,
  type BeachPose,
} from './BeachIconLoop';
import {
  BEACH_IN_FRAMES,
  CORE_LAND,
  CoreMemoryIconStack,
  coreMemoryTiming,
  maskStyle,
  SHADOW_OFFSET,
} from './coreMemoryIcon';

// Beach icon — CORE MEMORY PODCAST STYLE.
//
// A sister to SaplingCoreMemory and the clock/communism pairs. The artwork is
// public/beach.png (black glyph on alpha) and it is never recoloured: every
// layer of the shared stack (hard black shadow -> orange -> purple -> blue ->
// white core, coreMemoryIcon.tsx) is drawn through the stack's `renderLayer`
// slot as the WHOLE icon in its five pieces from BeachIconLoop (palm, two wave
// strips, sun, island), each piece a flat colour wearing the PNG's alpha as
// mask-image with beachPieceStyle() for its clip and transform. All five layers
// get the same beachPose() on a given frame, so the copies are identical
// shapes, stack perfectly, and the chain vanishes behind the core. The motion
// is the approved BeachIconLoop motion, reused, not re-derived. Transparent
// overlay asset, white ink.
//
// The motion, complete — nothing else happens:
//  1. Entrance (In clip only, f0-f28). The shared slide-up: orange f0, purple
//     f2, blue f4, core f6, each rising 130 px over 22 f on
//     bezier(0.16,1,0.3,1), nothing fading. The icon arrives ALIVE: every piece
//     of every layer already carries the loop pose from f0 (In f0 is loop frame
//     48), so the palm is swaying and the water lapping while the stack rises.
//     Colour layers are not rendered after blue lands (f26).
//  2. Palm sway (why: the breeze on a beach) — the palm rotates about its trunk
//     root, peak 1.5 deg landward / 1.1 seaward, one slow cycle + a 0.25 second
//     harmonic. The shadow is a copy of the same pieces, so its palm sways with
//     the core's; palm and island are both opaque in every layer, so the 5-unit
//     overlap band at the root never doubles, in white or in the shadow
//     (checked at 10x at the sway extremes, loop f16 and f75).
//  3. Wave lap (why: water moves in orbits) — each wave strip orbits x +-5 /
//     y +-1.5 icon units, the two lines half a cycle apart.
//  4. Glints (why: the sun's reflection on the water; the one flair) — the
//     approved timing and geometry (three gaps under the sun, stroke 7, round
//     caps), but WHITE, in the stack's flair slot, so they sit on the core's
//     slide only: above the shadow and the chain colours, below the white core,
//     so the waves still occlude them as they lap. No shadow, no chain colour.
//     Peak opacity 0.5 (the black version's 0.42 read a touch dim as white on
//     dark: 0.5 over #141414 peaks at ~138/255, clearly under the waves' 255).
//     In the In clip a glint firing is drawn only if it was born after the
//     core landed (f28); from In f35 the frame is identical to Loop f83+.
//  5. Breath — the loop's <= 0.3% volume-preserving squash, anchored at the
//     island base, on the whole stack so nothing shears apart.
//
// Handover and seams (1080x1080 renders composited over #141414, mean |diff|
// in 8-bit RGB): Loop adjacent frames 0.069-0.361 (median 0.205); the seam
// f95 -> f0 is 0.353 (f94 -> f95 0.361, f0 -> f1 0.337), so inside the
// adjacent range. In f47 is pixel-identical to Loop f95 (max diff 0), so the
// cut In f47 -> Loop f0 is the same 0.353 step.
//
// Margins (alpha > 0 bbox, every frame): Loop L159 T210 R144 B213 px; In L160
// T210 R154 B82 px (B82 at f0, the orange copy 130 px low). iconSize 760, as
// ClockIconCoreMemory, CommunismIconCoreMemory and BeachIconLoop.
//
// Fringe: max |R-G| (also |G-B|, |R-B|) over every alpha > 0 pixel of every
// Loop frame and In f27-f47 is 0 — the rest state is pure white/black/grey.

export const schema = z.object({
  icon: z.string(),
  iconSize: z.number().min(240).max(960),
  /** 'in' plays the entrance once; 'loop' is the seamless rest state. */
  mode: z.enum(['in', 'loop']),
  /** Hard shadow offset in canvas px, down and right. */
  shadowOffset: z.number().min(0).max(48),
  /** Glint slots, dealt round-robin to the three water gaps (BeachIconLoop). */
  glintCount: z.number().int().min(0).max(12),
  /** Peak opacity of a white glint. */
  glintOpacity: z.number().min(0).max(1),
  /** Multiplies every amplitude — 0 freezes the icon, 2 doubles the motion. */
  liveliness: z.number().min(0).max(2),
});

export type BeachIconCoreMemoryProps = z.infer<typeof schema>;

export const defaultProps: BeachIconCoreMemoryProps = schema.parse({
  icon: 'beach.png',
  iconSize: 760,
  mode: 'loop',
  shadowOffset: SHADOW_OFFSET,
  glintCount: 6,
  glintOpacity: 0.5,
  liveliness: 1,
});

const pct = (v: number) => `${(v / VIEW) * 100}%`;

const fill: React.CSSProperties = {position: 'absolute', inset: 0};

const BeachIconCoreMemory: React.FC<BeachIconCoreMemoryProps> = ({
  icon,
  iconSize,
  mode,
  shadowOffset,
  glintCount,
  glintOpacity,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const timing = coreMemoryTiming(mode, frame, BEACH_IN_FRAMES);
  const pose = beachPose(timing.cycle, liveliness, glintCount);

  // Every layer — shadow, orange, purple, blue, core — is the whole icon as
  // its five pieces, each a flat colour wearing the PNG's alpha, clipped and
  // moved exactly as in the approved black loop. Same pose on every layer, so
  // the copies are identical shapes and the chain vanishes behind the core.
  const renderLayer = (color: string) => (
    <>
      {BEACH_PIECES.map((piece) => (
        <div
          key={piece.id}
          style={{
            ...fill,
            backgroundColor: color,
            ...maskStyle(icon),
            ...beachPieceStyle(piece.id, pose),
          }}
        />
      ))}
    </>
  );

  // The glints: white, core only. In the In clip a firing is shown only if it
  // was born after the core landed — found by walking back to the first frame
  // of its run — so no glint ever pops in half-lit, and from f45 on the set is
  // exactly the loop's.
  const poseAt = (f: number) =>
    beachPose(
      coreMemoryTiming(mode, f, BEACH_IN_FRAMES).cycle,
      liveliness,
      glintCount,
    );
  const bornAfterLanding = (key: string) => {
    if (mode === 'loop') {
      return true;
    }
    let s = frame;
    while (s > 0 && poseAt(s - 1).glints.some((g) => g.key === key)) {
      s--;
    }
    return s > CORE_LAND;
  };
  const scale = glintOpacity / GLINT_OPACITY;
  const whitePose: BeachPose = {
    ...pose,
    glints: pose.glints
      .filter((g) => bornAfterLanding(g.key))
      .map((g) => ({...g, opacity: g.opacity * scale})),
  };
  const flair =
    glintCount > 0 && glintOpacity > 0 ? (
      <svg
        style={{...fill, width: '100%', height: '100%', overflow: 'visible'}}
        viewBox={`0 0 ${VIEW} ${VIEW}`}
      >
        <BeachGlints pose={whitePose} color="#FFFFFF" />
      </svg>
    ) : null;

  return (
    <div
      style={{
        ...fill,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CoreMemoryIconStack
        iconSize={iconSize}
        frame={frame}
        timing={timing}
        shadowOffset={shadowOffset}
        transformOrigin={`${pct(BASE.x)} ${pct(BASE.y)}`}
        transform={`scale(${pose.breath.sx}, ${pose.breath.sy})`}
        flair={flair}
        renderLayer={renderLayer}
      />
    </div>
  );
};

export default BeachIconCoreMemory;
