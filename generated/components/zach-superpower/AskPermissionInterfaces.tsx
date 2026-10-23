// ---------------------------------------------------------------------------
// AskPermissionInterfaces (zach-superpower, cut 51). Core memory podcast style (styles/core-memory.md).
// Opaque 1080x1920, 23.976 fps, 128 frames. The world is doctrineWorld.tsx (owned by this cut; cut 57
// MarineKnowsWhatToDo imports it and opens pixel for pixel on this cut's last frame, t 127).
//
// CHECK LINE: "Under Russian doctrine the squad under fire can't act: the sergeant's question has to climb up a
// long chain of commanders, one handoff after another, while the squad waits."
//
// THE LINE: "In the sort of Russian communist doctrine, they get on the radio, and they ask permission, and what
// do I do? And that's interfaces."
// WORD -> FRAME (local, Whisper): In f-3 · the sort of f3-15 · Russian f15-28 · communist f28-38 · doctrine f38-49 ·
// they f52 · get on the f54-59 · radio f59-66 · and they f67-71 · ask f71-74 · permission f74-81 · and what do I do
// f84-96 · And f100-108 · that's f108-113 · interfaces f113-119 · END f128.
// DURATION: the slot 51.9269 -> 57.2655 s = 5.339 s x 23.976 = 128 frames (f0..f127; sequence f1245 -> f1373).
//
// THE MOTION: a squad pinned behind a sandbag wall (tracers strike its top course, the nearest man ducks). On the
// run-on line the sergeant lifts the handset of the radio pack on his back (f28-41); a white "?" pill rises out of
// the pack (clear of the squad by ~f46) and climbs an org-chart cable that zig-zags across the frame through four
// commanders' desks, further apart going up. It stops 5 frames at each plug joint while that commander picks up
// (contact f56 / f82 / f103, the handset starts the frame after), then creeps on toward the top post under the star
// through "that's interfaces". The camera is one eased pull-back (f26 -> f106, anchored on the ground line, leaning
// right while the question goes out to the platoon) laid over a push-in creep that never stops; it lands on the
// whole chain (~77% of the width, all above y 1080). No new tracers once the camera is wide (k < 0.7), so the wide is
// clean; nothing fades.
// CHAIN = COPIES in this clip; nothing here is a copy, so no chain echo.
//
// SOURCES: none (no figures). The star is the generic five-pointed Soviet star, drawn.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { PAPER_BASE } from "../kits/core-memory/deathCountShared";
import { CONTENT, DoctrineFrame, JOIN_T, PACK, POSTS, SOLDIERS, doctrineCameraAt } from "./doctrineWorld";

export const FPS = 24000 / 1001;
export const DURATION = 128;
if (JOIN_T !== DURATION - 1) throw new Error("doctrineWorld JOIN_T must be this cut's last frame");

export const schema = z.object({
  debugCaptions: z.boolean(),
  probe: z.enum(["none", "squad", "ladder"]),
  probeT: z.number(),
});
export const defaultProps = schema.parse({ debugCaptions: false, probe: "none", probeT: 127 });

const W = 1080;
const H = 1920;

/** the user's caption bands, previews only */
const Bands: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    {[
      [1080, 1250],
      [1360, 1460],
    ].map(([a, b]) => (
      <div key={a} style={{ position: "absolute", left: 0, top: a, width: W, height: b - a, backgroundColor: "rgba(255,0,255,0.25)" }} />
    ))}
  </AbsoluteFill>
);

const probeCam = (probe: "squad" | "ladder") => {
  if (probe === "squad") {
    const x0 = SOLDIERS[0].x - 70;
    const x1 = SOLDIERS[SOLDIERS.length - 1].x + 70;
    return { cx: (x0 + x1) / 2, cy: PACK.top + 60, k: W / (x1 - x0) };
  }
  const top = CONTENT.top - 40;
  const bottom = POSTS[0].D + 200;
  const k = H / (bottom - top);
  return { cx: (CONTENT.left + CONTENT.right) / 2, cy: (top + bottom) / 2, k };
};

const AskPermissionInterfaces: React.FC<z.infer<typeof schema>> = ({ debugCaptions, probe, probeT }) => {
  const frame = useCurrentFrame();
  const t = probe === "none" ? frame : probeT;
  const cam = probe === "none" ? doctrineCameraAt(frame) : probeCam(probe);
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <DoctrineFrame t={t} cam={cam} id="api" />
      {debugCaptions ? <Bands /> : null}
    </AbsoluteFill>
  );
};

export default AskPermissionInterfaces;
