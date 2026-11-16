// ---------------------------------------------------------------------------
// stupidestFolk — THE CAST of rsi-stupidest-species (shared module W2; cuts B, E, G and the tower's occupants):
// EINSTEIN (c.1920s-30s), ME (the speaker, Dwarkesh Patel), the CHIMPANZEE (+ a bonobo) and the FORAGERS (early
// humans), in the picture-book GOUACHE hand of the approved casts: covidFolk's rig, proportions and paint (imported,
// never edited: kyle-covid covidFolk / covidFolkBody; a man ~312 units = 1.75 m, ~4.4 heads, dot eyes, a blush dot, a
// small nose, mitten hands, small feet, ONE soft crescent shadow per part, pandemicFolkPaint's gouache filter, no
// outline). People and animals are NEVER orange (orange = intelligence in this clip). Geometry and poses:
// stupidestFolkBody.ts. Contract for the cut builders: <notes>/FOLK_READY.md.
//
// UNITS: rig units, up is -y, a man 312 = 1.75 m (U = 178 per metre). `at` = the feet in world px (seated / squatting
//   poses: the floor UNDER THE HIPS; the chimp: the ground under its rump (sit) / under its body's middle (on all
//   fours)), `scale` = world px per unit. On the depth kit: const { at, scale } = A.P.at(X, Z), fog={A.folkFog(Z)},
//   unitPx={cam.k}, a contact shadow <AirShadow A X Z w={62} d={30} amt={0.8} /> (the chimp: w 70 d 30 on all fours).
//   scaleForPx(px) = px / 312 (a man's height on screen); a chimp at the same scale is ~152 units tall (CHIMP_UNITS).
//   Sizes on a phone (1080 x 1920): HERO 350-600 px tall (Einstein's moustache and brows, Me's beard, brows and quiff,
//   the chimp's face read), MID 120-200 px (Einstein reads by the white hair cloud + moustache + grey suit; Me by the
//   dark beard and the cream sweater; the chimp by the big ears, tan face, long arms; the foragers by the hide tunics and
//   bare limbs), small 40-70 px (silhouettes: the cloud, the tunic, the chimp's hunched shape).
//
// FIGURES  <Einstein pose at scale uid ... />  <Me ... />  <Forager variant ... />  <Chimp variant pose ... />
//          or <Person who="einstein" | "me" | "forager" variant? ... />. Common props: frame (the cut's frame), fog
//          (FolkFog { rgb, amount }: A.folkFog(Z)), unitPx (cam.k in a WorldSvg), tone (opacity), texture (false = no
//          per-figure gouache filter, inside a shared <CovidFolkLayer>).
//   Einstein  grey-brown suit, cream shirt, a loose dark tie, the white hair CLOUD (behind and round the head, a
//             receding cap, wisps), the bushy white moustache, soft grey brows, warm light skin, dot eyes (kind).
//   Me        (after the speaker's footage) a cream knit crewneck (rib collar and cuffs), dark trousers, dark shoes,
//             short black hair with a small quiff swept up at the front, a full neatly trimmed dark beard and
//             moustache, dark brows, warm medium skin. The same height as Einstein (both builds 1.75 m).
//   Forager   variant 0..7 (FORAGER_LOOKS): v0 man (khaki tunic, bare arms, stubble), v1 woman (oatmeal, long hair),
//             v2 child (umber, sleeves), v3 elder (white beard, hide wraps on the feet), v4 man (dark umber), v5 woman
//             (khaki, ponytail), v6 youth (oatmeal, curls), v7 old woman (white curls). Hide tunics with a ragged
//             hem and a cord belt; bare legs; bare or wrapped feet.
//   Chimp     variant 0 the chimpanzee (dark umber fur, tan face / ears / hands / feet), 1 the BONOBO (slimmer, darker
//             face, a centre parting).
//
// POSES (pure, frame-driven, seek-safe; frames at 23.976; dir 1 = facing screen right; L = the arm on screen left
//   facing us = the NEAR arm facing right). PERSON_POSES (Einstein and Me take `who` where the build matters):
//   stand(yaw, frame, seed?)          standing at a yaw, breathing. Cut E's pair: PAIR_YAW = { me: 0.2, einstein: -0.2 }
//                                     (keep |yaw| <= 0.21 or >= 0.37: between them an arm crossfades behind the body)
//   stand3q(dir, frame)               three-quarter (covidFolk's stand)
//   glance(base, toward, amount)      the head turns to a screen side: Einstein to HIS right (toward -1) at Me, Me to
//                                     HIS left (toward +1) at Einstein; ease amount over ~16 frames
//   lookUp(base, toward, amount)      Me looks UP at something above Einstein (chin up, eyes up, a little awe)
//   think(who, yaw, t, frame)         Einstein's hand comes up under his chin (his right hand, armL), the other
//                                     forearm across the waist; t 0..1 = the raise (~30 frames)
//   unify(yaw, t, frame)              Einstein's two hands rise (0..0.3), hold two things apart (0..0.45), bring them
//                                     together in front of his chest (0.45..0.82), press (0.82..1): UNIFY_T; ~72 frames.
//                                     The hands every frame: personAnchors(...).mittenL / mittenR (the palms' centres)
//                                     and handL / handR (the grips): hang the two things on them
//   shrug(who, yaw, t, frame)         Me's small open-palms shrug: up 0..0.3, held, down 0.68..1 (~40 frames)
//   walk(dir, frame, amount)          planted feet: FOLK_WALK_CYCLE = 24 frames per two steps, move `at` by
//                                     folkWalkAdvance(scale) px per frame (walkers cross the frame at yaw ~0.9)
//   squat(dir, frame)                 squatting on the heels (`at` = the floor under the hips, the feet ~50 units ahead)
//   teach(dir, frame, amount, v)      an adult squatting, the FLINT CORE held out in the near hand, knapped with the
//                                     HAMMERSTONE in the far hand: KNAP_CYCLE = 28 frames per strike, the stone ON the
//                                     core at KNAP.contact (0.62) of the cycle: knapContact(frame) is true then (the
//                                     contact frame and the next; a flake / spark starts there). amount 0 = only showing
//   watch(dir, frame, v, knap)        the child squatting in front, hands on its knees, watching the hands (a small
//                                     lean-in and an "o" mouth after each strike when knap)
//   haul(dir, frame, step, v)         facing the load (dir), leaning back, both fists on a rope at HAUL.y (the near
//                                     fist HAUL.near, the far HAUL.far units ahead of `at`), a heave every HAUL_CYCLE =
//                                     36 frames; step 0..1 walks backward with planted feet: move `at` by
//                                     -dir * haulAdvance(scale) * step px per frame. The rope is the cut's: one straight
//                                     line through at + [dir * HAUL.near, HAUL.y] * scale for every hauler
//   drawPlan(dir, t, frame, v)        squatting, drawing in the sand with a STICK (drawn in the near hand): the tip runs
//                                     along PLAN_PATH on the ground ahead (t 0..1; ~60 frames); planDrawn(dir, t) = the
//                                     drawn line (figure-local units); anchors.stickTip = the tip every frame
//   + covidFolk's poses work too (any POSES pose of kyle-covid's covidFolk), and lerpPose / mirrorPose.
// CHIMP_POSES
//   sit(dir, frame, { headYaw, look, pitch })   on its haunches, knees up, the long arms down to the ground, looking
//                                     out; breathing
//   stand(dir, frame, { headYaw, look })        on all fours at rest (side view), breathing
//   knuckleWalk(dir, frame, amount, { headYaw }) the knuckle-walk: CHIMP_WALK_CYCLE = 32 frames, the lateral sequence
//                                     (hind L, fore L, hind R, fore R), knuckles and feet planted in stance (each limb's
//                                     swing leaves and lands at the ground's speed); move `at` by chimpWalkAdvance(scale)
//                                     px per frame (x amount) in dir
//
// ANCHORS (world px): personAnchors(who, pose, at, scale, { variant }) -> covidFolk's (headC headR headTop mouth
//   eyes chest shoulderL/R wristL/R handL/R mittenL/R hip kneeL/R ankleL/R toeL/R heelL/R) + chin, propL / propR
//   (the held props' centres), stickTip. chimpAnchors(variant, pose, at, scale) -> headC headR headTop eyes mouth
//   handL / handR (the knuckles) footL / footR rump chest.
// PROPS: drawn in the hands by the poses (holdL / holdR: "flint" | "hammerstone" | "stick"), or alone:
//   <FlintCore c scale rot? uid fog? />  <Hammerstone c scale rot? uid fog? />  <Stick p0 p1 scale uid fog? />
//   (c = the centre in world px, scale = world px per unit, ~11 cm and ~8 cm at a man's scale).
// Probes: stupidestFolkProbe.tsx (src/Root.StupidestFolk.tsx + src/entry.StupidestFolk.ts).
// ---------------------------------------------------------------------------
import React from "react";
import { CovidPaint, type FolkFog } from "../kyle-covid/covidFolk";
import {
  buildChimp,
  buildPerson,
  flintCoreShapes,
  hammerstoneShapes,
  stickShapes,
  type ChimpAnchors,
  type ChimpPose,
  type P2,
  type PersonAnchors,
  type PersonId,
  type PersonPose,
} from "./stupidestFolkBody";

export {
  CHIMP_LOOKS,
  CHIMP_POSES,
  CHIMP_UNITS,
  CHIMP_VARIANTS,
  CHIMP_WALK_CYCLE,
  EINSTEIN_INKS,
  FOLK_FPS,
  FOLK_WALK_CYCLE,
  FORAGER_LOOKS,
  FORAGER_VARIANTS,
  GESTURE_FRAMES,
  HAUL,
  HAUL_CYCLE,
  KNAP,
  KNAP_CYCLE,
  MAN_UNITS,
  ME_INKS,
  PAIR_YAW,
  PERSON_POSES,
  PLAN_PATH,
  STICK_LEN,
  U,
  UNIFY_T,
  buildChimp,
  buildPerson,
  chimpLookName,
  chimpWalkAdvance,
  folkWalkAdvance,
  foragerLookOf,
  haulAdvance,
  knapContact,
  lerpPose,
  mirrorPose,
  personGripTo,
  planDrawn,
  scaleForPx,
} from "./stupidestFolkBody";
export type {
  ChimpAnchors,
  ChimpBuild,
  ChimpLook,
  ChimpPose,
  ForagerLook,
  HoldProp,
  PersonAnchors,
  PersonBuild,
  PersonId,
  PersonPose,
} from "./stupidestFolkBody";
export { CovidFolkLayer, type FolkFog } from "../kyle-covid/covidFolk";

type Common = {
  at: P2;
  scale: number;
  uid: string;
  frame?: number;
  fog?: FolkFog;
  unitPx?: number;
  tone?: number;
  texture?: boolean;
};

/** a person of the clip's cast */
export const Person: React.FC<
  Common & { who: PersonId; variant?: number; pose: PersonPose }
> = ({
  who,
  variant = 0,
  pose,
  at,
  scale,
  uid,
  frame = 0,
  fog,
  unitPx,
  tone,
  texture,
}) => {
  const b = buildPerson(who, pose, { variant, frame });
  return (
    <CovidPaint
      shapes={b.shapes}
      at={at}
      scale={scale}
      uid={uid}
      fog={fog}
      unitPx={unitPx}
      tone={tone}
      texture={texture}
    />
  );
};
type PersonProps = Omit<React.ComponentProps<typeof Person>, "who" | "uid"> & {
  uid?: string;
};
/** EINSTEIN (cut E): the white hair cloud, the moustache, the grey-brown suit */
export const Einstein: React.FC<PersonProps> = ({ uid = "ein", ...p }) => (
  <Person who="einstein" uid={uid} {...p} />
);
/** ME, the speaker (cut E): full dark beard, cream knit crewneck, black hair with a small quiff */
export const Me: React.FC<PersonProps> = ({ uid = "me", ...p }) => (
  <Person who="me" uid={uid} {...p} />
);
/** a FORAGER (cut G): variant 0..7 */
export const Forager: React.FC<PersonProps> = ({ uid = "fgr", ...p }) => (
  <Person who="forager" uid={uid} {...p} />
);
/** the CHIMPANZEE (cuts B, G): variant 0 chimp, 1 bonobo */
export const Chimp: React.FC<
  Common & { variant?: number; pose: ChimpPose }
> = ({ variant = 0, pose, at, scale, uid, fog, unitPx, tone, texture }) => {
  const b = buildChimp(variant, pose);
  return (
    <CovidPaint
      shapes={b.shapes}
      at={at}
      scale={scale}
      uid={uid}
      fog={fog}
      unitPx={unitPx}
      tone={tone}
      texture={texture}
    />
  );
};

const toWorld =
  (at: P2, scale: number) =>
  (v: P2): P2 => [at[0] + v[0] * scale, at[1] + v[1] * scale];
/** a person's anchors in WORLD px (pass the same pose, variant and frame the figure gets) */
export const personAnchors = (
  who: PersonId,
  pose: PersonPose,
  at: P2,
  scale: number,
  o: { variant?: number } = {},
): PersonAnchors => {
  const a = buildPerson(who, pose, { variant: o.variant ?? 0 }).anchors;
  const w = toWorld(at, scale);
  const out = {} as Record<string, unknown>;
  for (const [key, v] of Object.entries(a)) {
    if (v === null) out[key] = null;
    else if (key === "mouthDir") out[key] = v;
    else if (key === "headR") out[key] = (v as number) * scale;
    else if (key === "eyes") out[key] = (v as P2[]).map(w);
    else out[key] = w(v as P2);
  }
  return out as PersonAnchors;
};
/** the chimp's anchors in WORLD px */
export const chimpAnchors = (
  variant: number,
  pose: ChimpPose,
  at: P2,
  scale: number,
): ChimpAnchors => {
  const a = buildChimp(variant, pose).anchors;
  const w = toWorld(at, scale);
  return {
    ...a,
    headC: w(a.headC),
    headR: a.headR * scale,
    headTop: w(a.headTop),
    eyes: a.eyes.map(w),
    mouth: w(a.mouth),
    handL: w(a.handL),
    handR: w(a.handR),
    footL: w(a.footL),
    footR: w(a.footR),
    rump: w(a.rump),
    chest: w(a.chest),
  };
};

// ---- the props on their own (world px centre, world px per unit) ------------------------------------------------------
type PropProps = {
  c: P2;
  scale: number;
  rot?: number;
  uid: string;
  fog?: FolkFog;
  unitPx?: number;
};
/** the shapes are built round the origin (units) and painted at c */
export const FlintCore: React.FC<PropProps> = ({
  c,
  scale,
  rot = 0,
  uid,
  fog,
  unitPx,
}) => (
  <CovidPaint
    shapes={flintCoreShapes([0, 0], 1, rot)}
    at={c}
    scale={scale}
    uid={uid}
    fog={fog}
    unitPx={unitPx}
  />
);
export const Hammerstone: React.FC<PropProps> = ({
  c,
  scale,
  rot = 0,
  uid,
  fog,
  unitPx,
}) => (
  <CovidPaint
    shapes={hammerstoneShapes([0, 0], 1, rot)}
    at={c}
    scale={scale}
    uid={uid}
    fog={fog}
    unitPx={unitPx}
  />
);
/** a stick from p0 to p1 (world px) */
export const Stick: React.FC<{
  p0: P2;
  p1: P2;
  scale: number;
  uid: string;
  fog?: FolkFog;
  unitPx?: number;
}> = ({ p0, p1, scale, uid, fog, unitPx }) => (
  <CovidPaint
    shapes={stickShapes(
      [0, 0],
      [(p1[0] - p0[0]) / scale, (p1[1] - p0[1]) / scale],
    )}
    at={p0}
    scale={scale}
    uid={uid}
    fog={fog}
    unitPx={unitPx}
  />
);
