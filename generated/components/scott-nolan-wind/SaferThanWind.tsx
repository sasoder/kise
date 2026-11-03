// ---------------------------------------------------------------------------
// SaferThanWind (scott-nolan-wind, cut 9). Cheeky Pint style (stout) in real 3D (energyWorld on nuclearWorld). RENDER --gl=angle.
// Opaque 1080x1920, 23.976 fps, 155 frames.
//
// CHECK LINE: "per unit of electricity, coal and gas kill vastly more people than nuclear, and nuclear is even safer than wind."
//
// THE LINE: "The thing that people forget is that nuclear is by far the cleanest and safest baseload. It's actually safer
// than wind power per terawatt hour."
// WORD -> FRAME: the -1 · thing 3 · that 6 · people 9 · forget 13 · is 20 · that 26 · nuclear 30 · is 40 · by 45 · far 48 ·
// the 55 · cleanest 59 · and 68 · safest 73 · baseload 80 · It's 90 · actually 99 · safer 103 · than 111 · wind 116 ·
// power 122 · per 131 · terawatt 137 · hour 148 (John on camera from f155)
// DURATION: the slot 9.259 -> 15.724 s = 6.465 s x 23.976 = 155 frames (f0..f154).
//
// THE MOTION: one continuous camera over the lineup, low in the frame (plinth fronts about y 1500-1560). It opens on COAL,
// GAS, NUCLEAR filling the width (coal smokes heavily, gas faintly, nuclear not at all); on "nuclear" (f30) nuclear's plinth
// lifts toward bright cream as coal and gas recede by tone. From "far" three identical glass tubes come up out of the apron
// slots, filled to deaths per TWh on one linear scale: coal's nearly full, gas's a short fill, nuclear's an amber film; the
// numerals land on one line at the tube tops and the unit title over coal's. On "It's actually" the camera comes down and
// trucks right past nuclear while the chart's vertical scale stretches 718x in one log-space glide: the tubes are the plot
// area and stay, the fills stretch, coal's and gas's overflow and shoot up out of frame (their rungs spreading, numerals
// unchanged): a zoom into the floor of the chart. Wind's plinth, revealed by the truck, raises its tube by "wind"; nuclear's
// amber and wind's cream fill stand side by side in the same tubes on one base, wind's 17% taller, numerals by "per", the unit
// between them. Living hold: rotor turning, core shimmering, a slow push.
// AMBER = nuclear: its core, its fill and its numeral, nothing else; cream = the subject, board tone = context.
//
// CAUSE -> EFFECT: each tube comes up out of its slot (the slot opens on the tube's first frame) carrying its fill; the
// rescale is visible as rungs spreading on coal and gas while every numeral stays as it was.
//
// SOURCES: DEATHS_PER_TWH (heights) and DEATHS_LABEL (numerals) in energyFacts.ts (Our World in Data, "Death rates per unit
// of electricity production", Ritchie; fossil fuels Markandya & Wilkinson 2007, nuclear OWID, wind Sovacool et al. 2016):
// fills linear in the value at one scale per frame. At the opening scale nuclear's 0.03 is about half a world unit (under
// a pixel), so its fill is drawn as a FILM of 4 units until the stretched scale passes that (true to scale from about f100).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, FONT_LABEL, FONT_NUM } from "../kits/cheeky-pint/stoutShared";
import { NuclearStage, SoftShadows, nuclearProject, nuclearTrack, nuclearCamAt, type NuclearCam, type ShadowItem } from "../scott-nolan-uranium/nuclearWorld";
import { DEATHS_LABEL, DEATHS_PER_TWH } from "./energyFacts";
import { COLUMN, Lineup, PLINTH, PlantLabels, PlinthColumn, c01, columnShadowItems, glide, slotOf, smooth, type PlantKind } from "./energyWorld";

export const FPS = 24000 / 1001;
export const DURATION = 155;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- the chart. Every tube is the same glass, TUBE world units above its plinth top: the plot area. The fills carry the data:
// world units per death/TWh glide in log space from the opening scale (coal 92% of a tube) to the floor zoom (wind 94%).
const TUBE = 500;
const U1 = (0.92 * TUBE) / DEATHS_PER_TWH.coal;
const U2 = (0.94 * TUBE) / DEATHS_PER_TWH.wind;
const RESCALE = [90, 121] as const;
const scaleAt = (f: number) => U1 * Math.pow(U2 / U1, glide(RESCALE[0], RESCALE[1], f));
const FILM = 4;
// a fill that outgrows the plot area takes its tube with it, this far above the fill
const OVER = 0.08 * TUBE;
// the fill never runs absurdly far past the frame (it is off the top long before this)
const MAX_H = 60000;
// rungs: coal and gas one per death/TWh (they spread as the scale stretches); nuclear and wind one per 0.005, at least 40 units
const rungOf = (k: PlantKind, U: number) => (k === "coal" || k === "gas" ? U : Math.max(40, 0.005 * U));

type Col = { kind: PlantKind; key: keyof typeof DEATHS_LABEL; fill: "amber" | "cream"; rise: [number, number]; num: [number, number] };
const COLS: Col[] = [
  { kind: "coal", key: "coal", fill: "cream", rise: [46, 68], num: [62, 71] },
  { kind: "gas", key: "gas", fill: "cream", rise: [52, 72], num: [67, 76] },
  { kind: "nuclear", key: "nuclear", fill: "amber", rise: [58, 78], num: [71, 80] },
  { kind: "wind", key: "wind", fill: "cream", rise: [97, 117], num: [117, 127] },
];
// the unit: first over coal's numeral (it leaves with coal), then between the two tubes of the resolved pair
const TITLE_A = [64, 74] as const;
const TITLE_B = [117, 128] as const;
// every tube stands at the left front of its plinth's apron (the slot is a decal; the shared SLOT is the apron's middle), so
// the plant behind it stays readable: the turbine's tower and the cooling tower show to the right of their tubes
const DX = -60;
const colAt = (k: PlantKind): [number, number] => [slotOf(k)[0] + DX, slotOf(k)[1]];
const PAIR_X = (colAt("nuclear")[0] + colAt("wind")[0]) / 2;

// --- the camera (orbit about a target on the slot line; cy is where the target lands on screen)
const TRACK = nuclearTrack(
  { tx: -213, ty: 200, tz: -66, d: 1600, yaw: -4, pitch: 14, f: 2200, cx: 540, cy: 1215 },
  [
    { f0: -24, f1: 104, to: { d: 1575, yaw: -3, cy: 1221 } },
    { f0: 84, f1: 128, to: { tx: 122, ty: 290, d: 1075, pitch: 20, yaw: 2, cy: 932 } },
    { f0: 124, f1: 190, to: { d: 1017, yaw: 4, cy: 945 } },
  ],
  DURATION,
);
// wind's plinth edge and two blade tips sit in the opening's right margin (the plinths are 10 units apart, so no padded framing
// of coal-gas-nuclear can leave wind out). Until f80 the rotor is parked in the phase that reaches least far left (one blade
// pointing right, two at 60 deg off horizontal) and wind is down in the board tone; it spins up to its real pace (2.4 deg per
// frame, about 10 rpm) over f80-104 as the truck turns to it. Precomputed per frame so it is deterministic.
const SPIN0 = 90;
const SPIN = (() => {
  const out = [SPIN0];
  for (let f = 1; f <= DURATION + 2; f++) out.push(out[f - 1] + 2.4 * smooth(80, 104, f));
  return out;
})();
const spinAt = (f: number) => SPIN[Math.max(0, Math.min(SPIN.length - 1, Math.round(f)))];
export const camAt = (f: number): NuclearCam => nuclearCamAt(TRACK, f);
// the slot decal floats 0.4 above the plinth top and draws after the opaque fill, so a fill's first frame starts above it
const FIRST_FILL = 0.7;
const WIND_HIDE = 1;

// --- numerals and the unit: world-space billboards that slide up while fading in. The numerals' world size eases with the truck.
const numUnits = (f: number) => 44 - 6 * glide(92, 128, f);
const TITLE_A_UNITS = 34;
const TITLE_B_UNITS = 21;
const WorldText: React.FC<{ cam: NuclearCam; p: [number, number, number]; text: React.ReactNode; t: number; font: string; size: number; color: string; weight?: number; align?: "center" | "left" | "middle"; lineHeight?: number }> = ({ cam, p, text, t, font, size, color, weight, align = "center", lineHeight = 1 }) => {
  if (t <= 0) return null;
  const e = 1 - (1 - t) * (1 - t);
  const q = nuclearProject(cam, p);
  const px = size * q.s;
  // a label whose anchor has left the frame (or gone behind the eye, as coal's does once the scale stretches) is not drawn
  if (q.d <= 1 || q.y < -px * 3 || q.y > 1920 + px * 3 || q.x < -1080 || q.x > 2160) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: q.x,
        top: q.y + (1 - e) * 24,
        transform: align === "center" ? "translate(-50%, -100%)" : align === "middle" ? "translate(-50%, -50%)" : "translate(0, -50%)",
        fontFamily: font,
        fontWeight: weight,
        fontSize: px,
        letterSpacing: font === FONT_LABEL ? "0.06em" : "0",
        fontFeatureSettings: '"tnum" 1, "lnum" 1',
        lineHeight,
        textAlign: "center",
        whiteSpace: "nowrap",
        color,
        opacity: e,
        filter: `blur(${((1 - e) * 6).toFixed(2)}px)`,
        textShadow: `0 0 ${px * 0.1}px rgba(34,21,11,0.75), 0 ${px * 0.03}px ${px * 0.3}px rgba(34,21,11,0.8)`,
      }}
    >
      {text}
    </div>
  );
};

/** every column's state at frame f: fill level and tube height (world units above the plinth top), rise, rung, numeral anchor */
export const columnsAt = (f: number) => {
  const U = scaleAt(f);
  return COLS.map((c) => {
    const trueH = DEATHS_PER_TWH[c.key] * U;
    const level = Math.min(MAX_H, Math.max(FILM, trueH));
    const height = Math.max(TUBE, level + OVER);
    const r = glide(c.rise[0], c.rise[1], f);
    const rise = r > 0 ? Math.max(r, FIRST_FILL / height) : 0;
    const [X, Z] = colAt(c.kind);
    const anchor: [number, number, number] = [X, PLINTH.H + height * rise + 12, Z];
    return { ...c, level, height, rise, rung: rungOf(c.kind, U), anchor, numT: c01((f - c.num[0]) / (c.num[1] - c.num[0])) };
  });
};
/** the unit's two anchors: A over coal's numeral (rides coal's tube top out of frame), B between the resolved pair's tubes */
export const titleAnchorA = (f: number): [number, number, number] => {
  const coal = columnsAt(f)[0];
  return [coal.anchor[0] - COLUMN.R, coal.anchor[1] + numUnits(f) * 1.95, coal.anchor[2]];
};
export const TITLE_B_AT: [number, number, number] = [PAIR_X, PLINTH.H + 0.62 * TUBE, colAt("nuclear")[1]];

const SaferThanWind: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const S = f + 400;
  const cam = camAt(f);
  const lit = glide(26, 40, f);
  const recede = 0.32 * glide(26, 40, f);
  // wind's plinth edge sits in the opening's right margin: it stays down in the board tone until the truck turns to it
  const hidden = WIND_HIDE * (1 - glide(84, 102, f));
  const state = columnsAt(f);
  const shadows: ShadowItem[] = state.flatMap((c) => columnShadowItems(c.kind, c.rise, Math.min(c.height, 640), Math.min(c.level, 640)).map((it) => ({ ...it, x: it.x + DX })));
  const nu = numUnits(f);
  return (
    <NuclearStage
      cam={cam}
      S={S}
      boardUnits={800}
      pool={{ x: 560, y: 820, strength: 0.9 }}
      world={
        <>
          <Lineup
            S={S}
            only={["coal", "gas", "nuclear", "wind"]}
            smoke={{ coal: 1.5, gas: 0.45 }}
            spin={spinAt(f)}
            lift={{ nuclear: lit, wind: 0.35 * glide(100, 116, f) }}
            dim={{ coal: recede, gas: recede, wind: hidden }}
          />
          <PlantLabels only={["coal", "gas", "nuclear", "wind"]} dim={{ coal: recede, gas: recede, wind: hidden }} />
          <SoftShadows items={shadows} y={0.02} />
          {state.map((c, i) => (
            <group key={c.kind} position={[DX, 0, 0]}>
              <PlinthColumn kind={c.kind} rise={c.rise} height={c.height} level={c.level} fill={c.fill} camF={cam.f} rung={c.rung} order={i} />
            </group>
          ))}
        </>
      }
      overlay={
        <>
          {state.map((c) => (
            <WorldText key={c.kind} cam={cam} p={c.anchor} text={DEATHS_LABEL[c.key]} t={c.numT} font={FONT_NUM} weight={700} size={nu} color={c.fill === "amber" ? COLOR.amberTop : COLOR.cream} />
          ))}
          <WorldText cam={cam} p={titleAnchorA(f)} text="DEATHS PER TWh" t={smooth(TITLE_A[0], TITLE_A[1], f)} font={FONT_LABEL} size={TITLE_A_UNITS} color={COLOR.inkCream} align="left" />
          <WorldText
            cam={cam}
            p={TITLE_B_AT}
            text={
              <>
                DEATHS
                <br />
                PER TWh
              </>
            }
            t={smooth(TITLE_B[0], TITLE_B[1], f)}
            font={FONT_LABEL}
            size={TITLE_B_UNITS}
            color={COLOR.inkCream}
            align="middle"
            lineHeight={1.15}
          />
        </>
      }
    />
  );
};

export default SaferThanWind;
