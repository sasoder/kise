// ---------------------------------------------------------------------------
// HydraHands (caro-firing-moses, cut 24.375). The show's own hydra pictogram (the original 16:9 graphic:
// notes/reference/orig_hydraHands_seq24.375-30.375.mp4, hydraHands_seqf*.png), re-staged 9:16, continuing
// TwelvePosts. Parts in firingShared.tsx. Opaque 1080x1920, 24 fps, 144 frames.
//
// CHECK LINE: "The heads hang from two different people, the Mayor and the Governor, so no single pair of scissors
// can cut them all."
//
// THE LINE: "Some of these positions were appointed by the mayor, some of them by the governor, and so no single
// person could cut off the head simultaneously."
// WORD -> FRAME: Some 0 · of 4 · these 7 · positions 9 · were 15 · appointed 24 · by 29 · the 34 · mayor 36 ·
// some 43 · of 52 · them 55 · by 57 · the 60 · governor 63 · and 69 · so 78 · no 81 · single 88 · person 94 ·
// could 103 · cut 109 · off 113 · the 117 · head 119 · simultaneously 123.
// DURATION: the slot 24.375 -> 30.375 s = 6.0 s x 24 = 144 frames (f0..f143).
//
// THE MOTION: f0 = TwelvePosts' last frame (the twelve tagged heads). The Mayor's hand slides in from the left
// edge, arm off frame (f8-28, settled before "mayor" f36), "the Mayor" types on above it (f16-28) and six strings
// run from its fingers to the six LEFT heads, one after another (tips leave f18-28, each lands 6 f later; on its
// landing frame the head gives a small jerk toward the hand). The Governor's hand slides in from the right edge
// (f40-58, "governor" f63), "the Governor" types on (f46-58), strings to the six RIGHT heads (f48-58 + 6). Both hands
// bob slightly, the strings follow. On "no single person" a pair of white two-ring scissors slides in from the right
// at mid-neck height, blades first, opening wide (f80-106); on "cut" the blades snap shut across the necks
// (f109-113, CONTACT f113): they jam half-open on the necks — too many to cut at once — and strain (shake f113-121,
// the gripped heads jerk on f114), then open and back out to the right on "simultaneously" (f121-140), every head
// still up. f140-143 living hold: both hands holding their strings, heads swaying.
//
// FRAMING (rev 1: everything 160 px lower with the hydra): Mayor fingertip (258, 500) at s 0.36 (hand x ~88-258,
// y ~442-545, the arm off the left edge), "the Mayor" 74 px (cap 49) baseline 404 from x 104; Governor fingertip
// (826, 532) (hand x 826-1002, y ~478-581, above y 700), "the Governor" baseline 462 ending x 918 (the two labels on
// different heights, a clear gap between them). Scissors (s 0.45) pivot rests at (736, 850), blades to x ~460
// across the central necks, rings x ~830-910 (only the blades pass the right edge on the way in and out).
// Labels out of the caption bands; the fan as in HydraDozenHeads.
//
// JOIN: f0 = TwelvePosts f158 (TwelvePostsWorld at the same global frame; hands, strings, scissors all off frame).
// SOURCES: none (no figures). Hands traced from notes/reference/hydraHands_seqf700.png; scissors measured there.
// ---------------------------------------------------------------------------
import React from "react";
import { Easing, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  GovernorHand,
  HH_DURATION,
  HH_G0,
  HString,
  HeadState,
  HYDRA_DY,
  MayorHand,
  SerifLabel,
  WhiteScissors,
  neckPoint,
  neckPose,
  stringOrigin,
} from "./firingShared";
import { TwelvePostsWorld, tpHeads } from "./TwelvePosts";

export const FPS = 24;
export const DURATION = HH_DURATION;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const prog = (f: number, a: number, b: number, ease: (t: number) => number = (t) => t) =>
  ease(clamp01((f - a) / (b - a)));
const out3 = Easing.out(Easing.cubic);
const inOut = Easing.inOut(Easing.cubic);
const in2 = Easing.in(Easing.quad);
const bump = (f: number, a: number, b: number) => (f <= a || f >= b ? 0 : Math.sin(Math.PI * ((f - a) / (b - a))));

export const HAND_S = 0.36;
export const HAND_LABEL_SIZE = 74; // 1.22x the first pass (cap 49); 1.3x made the two labels touch
const MAYOR_TIP: [number, number] = [258, 340 + HYDRA_DY];
const GOV_TIP: [number, number] = [826, 372 + HYDRA_DY];
const STRING_U = 0.88; // where on the neck a string ties

// hand entrances: the fingertip slides in from off frame (the whole white part off frame at the start)
const MAYOR_IN: [number, number] = [8, 28];
const GOV_IN: [number, number] = [40, 58];
const mayorStringAt = (k: number) => 18 + k * 2; // k = 0..5 (left necks 0..5), tip leaves the hand
const govStringAt = (k: number) => 48 + k * 2; // k = 0..5 (right necks 6..11)
const STRING_RUN = 6;

// scissors
const SC_S = 0.45;
const SC_REST: [number, number] = [736, 690 + HYDRA_DY];
const SC_IN: [number, number] = [80, 106]; // one long eased approach, still creeping in while they open
const SC_OPEN: [number, number] = [86, 98];
const SNIP: [number, number] = [109, 113]; // blades shut on the bundle: CONTACT f113
const STRAIN: [number, number] = [113, 121];
const SC_OUT: [number, number] = [121, 140];

// The hands act as a reusable layer (the merged Hydra cut re-places the labels and the scissors and swaps the jam's
// head jerks for one flinch): HANDS_V1 is this cut's own layout, so HydraHands renders exactly as delivered.
export type HandsLayout = {
  mayorLabel: { x: number; y: number; anchor: "start" | "middle" | "end" };
  govLabel: { x: number; y: number; anchor: "start" | "middle" | "end" };
  scRest: [number, number];
  jamJerks: boolean; // V1: the gripped heads 3-8 jerk while the scissors strain
};
export const HANDS_V1: HandsLayout = {
  mayorLabel: { x: 104, y: 404, anchor: "start" },
  govLabel: { x: 918, y: 462, anchor: "end" },
  scRest: SC_REST,
  jamJerks: true,
};
export const HANDS_SNIP = SNIP;
export const HANDS_STRAIN = STRAIN;
export const HAND_TIPS = { mayor: MAYOR_TIP, governor: GOV_TIP };

/** The hands act at its local frame f (0..143): the head states and the layer of strings, hands, labels, scissors. */
export const handsAct = (f: number, layout: HandsLayout = HANDS_V1, headsIn?: HeadState[]) => {
  const G = HH_G0 + f;

  // ---- head states: TwelvePosts' (tags settled) plus the jerks of the strings landing and of the jam -----------
  const heads = (headsIn ?? tpHeads(G)).map((h, i) => {
    const land = (i < 6 ? mayorStringAt(i) : govStringAt(i - 6)) + STRING_RUN;
    const toward = i < 6 ? -1 : 1; // a tug turns the head toward its hand
    const tug = toward * 5 * bump(f, land, land + 8);
    const jam =
      layout.jamJerks && i >= 3 && i <= 8
        ? 3.5 * Math.sin((f - STRAIN[0]) * 2.4) * bump(f, STRAIN[0], STRAIN[1] + 2)
        : 0;
    return { ...h, nod: (h.nod ?? 0) + tug + jam };
  });
  const poses = heads.map((h, i) => neckPose(i, G, h.grow, h.nod, h.bend));

  // ---- hands: slide in, then a slow bob (the strings follow) ---------------------------------------------------
  const mIn = prog(f, MAYOR_IN[0], MAYOR_IN[1], out3);
  const gIn = prog(f, GOV_IN[0], GOV_IN[1], out3);
  const bobM = 3 * Math.sin((2 * Math.PI * (f - MAYOR_IN[1])) / 52) * prog(f, MAYOR_IN[1] - 4, MAYOR_IN[1] + 8);
  const bobG = 3 * Math.sin((2 * Math.PI * (f - GOV_IN[1])) / 57 + 1) * prog(f, GOV_IN[1] - 4, GOV_IN[1] + 8);
  const mTip: [number, number] = [MAYOR_TIP[0] - (1 - mIn) * 330, MAYOR_TIP[1] + bobM];
  const gTip: [number, number] = [GOV_TIP[0] + (1 - gIn) * 330, GOV_TIP[1] + bobG];
  const mRot = 1.2 * Math.sin((2 * Math.PI * f) / 52) * mIn;
  const gRot = -1.2 * Math.sin((2 * Math.PI * f) / 57 + 1) * gIn;
  const mo = stringOrigin("mayor", mTip[0], mTip[1], HAND_S, mRot);
  const go = stringOrigin("governor", gTip[0], gTip[1], HAND_S, gRot);

  const strings = poses.map((p, i) => {
    const at = i < 6 ? mayorStringAt(i) : govStringAt(i - 6);
    const g = prog(f, at, at + STRING_RUN, out3);
    return <HString key={`s${i}`} from={i < 6 ? mo : go} to={neckPoint(p, STRING_U)} grow={g} />;
  });

  // ---- labels type on letter by letter (the original's way) ----------------------------------------------------
  const mLabel = prog(f, 16, 28) * "the Mayor".length;
  const gLabel = prog(f, 46, 58) * "the Governor".length;

  // ---- scissors ---------------------------------------------------------------------------------------------------
  const scIn = prog(f, SC_IN[0], SC_IN[1], out3);
  const scOut = prog(f, SC_OUT[0], SC_OUT[1], in2);
  let open = 0.15 + 0.85 * prog(f, SC_OPEN[0], SC_OPEN[1], out3);
  open -= 0.55 * prog(f, SNIP[0], SNIP[1], Easing.in(Easing.cubic)); // jams at 0.45
  open += 0.4 * prog(f, STRAIN[1], STRAIN[1] + 6, inOut); // gives up, opens again
  const shake = bump(f, STRAIN[0], STRAIN[1]);
  const scX = layout.scRest[0] + (1 - scIn) * 520 + scOut * 560 + 3 * Math.sin((f - STRAIN[0]) * 2.9) * shake;
  const scY = layout.scRest[1] + 2.5 * Math.sin((f - STRAIN[0]) * 3.7) * shake;
  const scRot = -4 + 2.5 * Math.sin((f - STRAIN[0]) * 2.2) * shake;
  const scissorsOn = f >= SC_IN[0] && f < SC_OUT[1];

  const layer = (
    <g>
      {strings}
      {f >= MAYOR_IN[0] && <MayorHand x={mTip[0]} y={mTip[1]} s={HAND_S} rot={mRot} />}
      {f >= GOV_IN[0] && <GovernorHand x={gTip[0]} y={gTip[1]} s={HAND_S} rot={gRot} />}
      <SerifLabel
        text="the Mayor"
        x={layout.mayorLabel.x}
        y={layout.mayorLabel.y}
        size={HAND_LABEL_SIZE}
        anchor={layout.mayorLabel.anchor}
        shown={mLabel}
      />
      <SerifLabel
        text="the Governor"
        x={layout.govLabel.x}
        y={layout.govLabel.y}
        size={HAND_LABEL_SIZE}
        anchor={layout.govLabel.anchor}
        shown={gLabel}
      />
      {scissorsOn && <WhiteScissors x={scX} y={scY} s={SC_S} rot={scRot} open={open} />}
    </g>
  );
  return { G, heads, layer, tips: { mayor: mTip, governor: gTip }, scissors: { x: scX, y: scY, open, on: scissorsOn } };
};

const HydraHands: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const { G, heads, layer } = handsAct(frame);
  return (
    <TwelvePostsWorld G={G} heads={heads}>
      {layer}
    </TwelvePostsWorld>
  );
};

export default HydraHands;
