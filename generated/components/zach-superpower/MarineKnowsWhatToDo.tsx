// ---------------------------------------------------------------------------
// MarineKnowsWhatToDo (zach-superpower, cut 57). Core memory podcast style (styles/core-memory.md).
// Opaque 1080x1920, 23.976 fps, 116 frames. Joined pixel for pixel to cut 51 (AskPermissionInterfaces): f0 here is
// cut 51's last frame (t 127 of the doctrine world, doctrineWorld.tsx, imported read-only). This cut's own motion is
// in marineSquadMoves.tsx.
//
// CHECK LINE: "Under American doctrine nobody waits on that chain: the sergeant already has the authority, makes the
// call himself, and the squad moves right away."
//
// THE LINE: "In the American doctrine, that Marine. He knows what he is authorized to do right there. He's got
// creativity. He's going to problem solve it." (Zach Shore)
// WORD -> FRAME (local, Whisper): In f-4 · the American f3 · doctrine f8-16 · that f19 · Marine f22-32 ·
// He knows f37-41 · what he is f41-54 · authorized f54-61 · to do right there f68-77 · He's got creativity f83-96 ·
// he's going to problem solve it f103-115 · END f116.
// DURATION: the slot 57.2655 -> 62.1037 s = 4.838 s x 23.976 = 116 frames (f0..f115; sequence f1373 -> f1489).
//
// THE MOTION: from cut 51's wide (the whole chain of command over the pinned squad) the camera comes back down in
// one eased move (f0-24, damped, landing ~f29 on "Marine") close on the squad, while the chain and its "?" drain to
// the dim OP_LOW; the fire resumes. The sergeant puts the handset back down on the wall (f37-49), rises from his
// crouch (f45-57) and points the way out past the wall's end (arm up f49-59, held through "right there"), while the
// camera starts drifting toward where he points (f60-104). On the call he and the soldier beside him run out from
// behind the wall's end round the flank at a constant pace, feet planted on the ground (f80-100 / f84-104), and kneel
// on the open ground on the flank (settled f105/f109); the other three shift one place right behind the wall
// (f86-102). No tracer is fired once a runner is in the open, so the fire stops as the flank closes. The radio stays
// behind with the handset on it and the dim cable still running up to the chain. Nothing fades at the end; the
// camera creeps on.
// CHAIN = COPIES in this clip; nothing here is a copy, so no chain echo.
// CAUSE -> EFFECT: the handset is lowered by his raised hand's pose (the handset at his ear is the pose); his arm
// rises out from behind his body; the runners start only after the arm is up (f80 / f84 vs f59).
//
// SOURCES: none (no figures).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { PAPER_BASE } from "../kits/core-memory/deathCountShared";
import { DoctrineFrame, DoctrineScene, JOIN_T } from "./doctrineWorld";
import { DURATION_57, MarineSquad, chainOpacityAt, marineCameraAt, marineGate, tOf } from "./marineSquadMoves";

export const FPS = 24000 / 1001;
export const DURATION = 116;
if (DURATION !== DURATION_57) throw new Error("MarineKnowsWhatToDo: DURATION mismatch with marineSquadMoves");
if (tOf(0) !== JOIN_T) throw new Error("MarineKnowsWhatToDo: f0 must be cut 51's last frame");

export const schema = z.object({
  debugCaptions: z.boolean(),
});
export const defaultProps = schema.parse({ debugCaptions: false });

const W = 1080;

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

const ID = "mkw";

const MarineKnowsWhatToDo: React.FC<z.infer<typeof schema>> = ({ debugCaptions }) => {
  const f = useCurrentFrame();
  const t = tOf(f);
  const cam = marineCameraAt(f);
  const op = chainOpacityAt(f);
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <DoctrineFrame t={t} cam={cam} id={ID}>
        <DoctrineScene
          t={t}
          id={ID}
          chainOpacity={op}
          questionOpacity={op}
          squad={<MarineSquad f={f} id={ID} />}
          tracerGate={marineGate}
        />
      </DoctrineFrame>
      {debugCaptions ? <Bands /> : null}
    </AbsoluteFill>
  );
};

export default MarineKnowsWhatToDo;
