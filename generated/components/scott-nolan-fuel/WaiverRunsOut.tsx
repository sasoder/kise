// ---------------------------------------------------------------------------
// WaiverRunsOut (scott-nolan-fuel, cut 30). Cheeky Pint style (stout) in real 3D (nuclearWorld.tsx). RENDER --gl=angle.
// Opaque 1080x1920, 23.976 fps, 182 frames.
//
// CHECK LINE: "Russian HALEU still flows to the US under a waiver, but on 1 Jan 2028 that supply is shut off, and the US reactors
// have no one making their fuel."
//
// THE LINE: "Right now, they're still importing under a waiver. But January 1st, 2028, that ends. And so all these companies are
// wondering who's going to produce HALEU."
// WORD -> FRAME: Right ~0 · now 4 · they're 10 · still 13 · importing 17 · under 25 · a 31 · waiver 34 · But ~44 · January 46 ·
//   1st 52 · 2028 61 · that 68 · ends 81 · And 93 · so 97 · all 101 · these 106 · companies 111 · are 122 · wondering 128 ·
//   who's 135 · going 149 · to 152 · produce 154 · HALEU 164 · (cut back to the speaker at 182)
// DURATION: the slot 30.155 -> 37.746 s = 7.591 s x 23.976 = 182 frames (f0..f181).
//
// THE MOTION: one view over the tilted North Atlantic, looking east-north-east from inland US (yaw 67, pitch 48): the US group
// near and large in the lower middle, Scandinavia, the Baltic and western Russia far at the top. f0: a steady, busy stream of
// amber 30B cylinders (one size, one speed, one spacing: 9.5 units a frame, one every 7 frames, ~7 on the route at once) runs
// out of the warm-lit dispatch door of a cream depot at St Petersburg, round Europe and across the ocean, up the coast and into
// its twin, a cream receiving depot at the mouth of Chesapeake Bay beside the US group (three SMR modules, one gigawatt plant,
// one empty lit slot at its centre-front). RUSSIA (by f10) and U.S. (by f20) are map type printed flat on their land. From f36
// a cream date counter over the mid-Atlantic rolls to JAN 1 2028 (lands f61). THE CUT-OFF IS AT THE SOURCE, on "that" (f68):
// the last cylinder leaves at f67 and nothing follows; the depot's door light goes out (f67-72) and the door shutters (f70-79).
// The stream's tail pulls away from Russia, the lane behind it draining to board dim, and runs into the US depot by ~f120:
// nothing arriving. From f85 one slow eased push in on the US group, settling ~f150 on the empty slot with the dim route
// beyond; then a living hold (steam, a slow creep). The US end is exaggerated x1.6 against the map.
// AMBER = uranium fuel (the cylinders) and nothing else; cream = land, reactors, depots; the sea is the bare board.
//
// SOURCES (COMMON.md, verified by the director, Nov 4): Russia (Rosatom/TENEX) is the only commercial HALEU supplier today; the
// Prohibiting Russian Uranium Imports Act (13 May 2024) lets DOE waivers allow imports only until 1 Jan 2028. The cylinder is a
// 30B UF6 cylinder (30 in x 81 in, the standard enriched-product cylinder; ANSI N14.1). The sea lane St Petersburg -> Baltimore
// runs on real waypoints. Land: world-atlas countries-50m (Natural Earth), the tall Miller slab (mapProjectTall).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, FONT_LABEL, FONT_NUM } from "../kits/cheeky-pint/stoutShared";
import { NuclearStage, SHADOW_DIR, SHADOW_LEN, SoftShadows, WorldSlab, mapProjectTall, nuclearProject, nuclearTrack, slabTop, type NuclearCam, type ShadowItem } from "../scott-nolan-uranium/nuclearWorld";
import { GigawattPlant, SmrModule, gigawattShadowItems, smrShadowItems } from "./fuelShared";
import {
  AHEAD,
  CYL_D,
  CYL_L,
  DEPOT_SCALE,
  GW_RF,
  GW_SCALE,
  LAND_Y,
  L_END,
  SLOT_D,
  SLOT_RF,
  SLOT_W,
  SMR_RF,
  SMR_SCALE,
  US_F,
  US_M,
  US_R,
  US_YAW,
  cylAt,
  laneAt,
  laneLit,
  lightAt,
  shutAt,
  projectTall,
  smooth,
  travelY,
  usAt,
  type Cyl,
  type V3,
} from "./waiverMotion";
import { Cylinders, DEPOT, Depot, EmptySlot, LaneRibbon, SlotRim, type CylPose } from "./waiverWorld";

export const FPS = 24000 / 1001;
export const DURATION = 182;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
// the motion model restates the tall projection and the land's height; they must agree with the stage's
{
  const a = projectTall(-76.48, 39.22);
  const b = mapProjectTall(-76.48, 39.22);
  if (Math.abs(a[0] - b[0]) > 1e-6 || Math.abs(a[1] - b[1]) > 1e-6) throw new Error("waiverMotion projection drifted from mapProjectTall");
  if (Math.abs(LAND_Y - slabTop()) > 1e-9) throw new Error("waiverMotion LAND_Y drifted from slabTop()");
}

// --- the two depots: St Petersburg's door is the lane's start, the receiving depot's door (a twin, off the Delmarva coast) its end
const DOOR = laneAt(0);
/** the St Petersburg depot drawn bigger than its US twin: it is far off, and its dispatch door is the cut-off's beat */
const RU_DEPOT_SCALE = 9;
const US_DOOR = laneAt(L_END);

// --- the reactors round the empty slot (layout in waiverMotion)
const SMRS = SMR_RF.map(([r, f]) => usAt(r, f));
const GW_AT = usAt(...GW_RF);
const SLOT_AT = usAt(...SLOT_RF);
// the tower behind and to the left of its containment (the base offset (132, 108) turned by the plant's yaw)
const GW_YAW = (() => {
  const want = Math.atan2(US_F[1] - US_R[1] * 0.25, US_F[0] - US_R[0] * 0.25);
  return ((want - Math.atan2(108, 132)) * 180) / Math.PI;
})();

// --- the lane line: a little broader toward Russia, where it is far
const laneHalfWidth = (s: number) => CYL_D * (0.12 + 0.3 * smooth(L_END - 60, 40, s));
const RIBBON_Y = 0.25;

// --- a cylinder on the lane: centre and axis, lifted while it travels, settling when stopped; cut at a depot's door
const DOOR_CLIP_US: [number, number, number, number] = [-US_DOOR.tx, 0, -US_DOOR.tz, US_DOOR.tx * US_DOOR.x + US_DOOR.tz * US_DOOR.z];
const DOOR_CLIP_RU: [number, number, number, number] = [DOOR.tx, 0, DOOR.tz, -(DOOR.tx * DOOR.x + DOOR.tz * DOOR.z)];
const poseOf = (c: Cyl): CylPose | null => {
  if (c.s < -CYL_L / 2 - 0.3 || c.s > L_END + CYL_L / 2 + 0.3) return null;
  const p = laneAt(c.s);
  return { p: [p.x, travelY(c.moving), p.z], dir: [p.tx, 0, p.tz], clip: c.s < L_END / 2 ? DOOR_CLIP_RU : DOOR_CLIP_US };
};

// --- the camera: one view over the North Atlantic, the US near and Russia far; one slow eased push in on the US group
const CAM0: NuclearCam = { tx: -318, ty: 0, tz: 88, d: 165, yaw: US_YAW, pitch: 48, f: 750, cx: 540, cy: 920 };
const TRACK = nuclearTrack(
  CAM0,
  [
    { f0: -30, f1: 85, to: { d: 160 } },
    { f0: 85, f1: 150, to: { tx: -319.7, tz: 87, d: 140, f: 900, pitch: 49, cy: 860 } },
    { f0: 140, f1: 240, to: { d: 134 } },
  ],
  DURATION,
);
const camAt = (f: number): NuclearCam => TRACK[Math.max(0, Math.min(TRACK.length - 1, f))];

// --- map type: Söhne Kräftig caps in inkDark printed flat on the land (a CSS homography of the world rectangle), stretched along
// the view so they read far off (road-marking style), sliding up on entry
const homography = (q: [number, number][]) => {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / den;
  const h = (dx1 * dy3 - dx3 * dy1) / den;
  return { a: x1 - x0 + g * x1, b: x3 - x0 + h * x3, c: x0, d: y1 - y0 + g * y1, e: y3 - y0 + h * y3, f: y0, g, h };
};
const BASE_PX = 240;
const MapType: React.FC<{ cam: NuclearCam; at: [number, number]; text: string; t: number; w: number; stretch: number }> = ({ cam, at, text, t, w, stretch }) => {
  if (t <= 0) return null;
  const e = 1 - (1 - c01(t)) * (1 - c01(t));
  const BW = BASE_PX * (text.length * 0.74 + 0.3);
  const BH = BASE_PX * 1.0;
  const hw = w / 2;
  const hd = ((w * BH) / BW / 2) * stretch;
  const slide = -(1 - e) * hd * 0.9;
  const pt = (r: number, f: number) => {
    const q = nuclearProject(cam, [at[0] + US_R[0] * r + US_F[0] * (f + slide), LAND_Y + 0.05, at[1] + US_R[1] * r + US_F[1] * (f + slide)]);
    return [q.x, q.y] as [number, number];
  };
  const H = homography([pt(-hw, hd), pt(hw, hd), pt(hw, -hd), pt(-hw, -hd)]);
  const m = [H.a / BW, H.d / BW, 0, H.g / BW, H.b / BH, H.e / BH, 0, H.h / BH, 0, 0, 1, 0, H.c, H.f, 0, 1];
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: BW,
        height: BH,
        transformOrigin: "0 0",
        transform: `matrix3d(${m.map((v) => v.toFixed(6)).join(",")})`,
        fontFamily: FONT_LABEL,
        fontSize: BASE_PX,
        lineHeight: `${BH}px`,
        letterSpacing: "0.06em",
        textAlign: "center",
        whiteSpace: "nowrap",
        color: COLOR.inkDark,
        opacity: e * 0.9,
      }}
    >
      {text}
    </div>
  );
};

// --- the date counter: cream over the dark sea. It rolls a year of whole dates (JAN 1 2027 -> JAN 1 2028), landing at f61.
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "JAN"];
const ROLL_F0 = 42;
const ROLL_F1 = 61;
const monthPos = (f: number) => {
  const t = c01((f - ROLL_F0) / (ROLL_F1 - ROLL_F0));
  return 12 * (1 - Math.pow(1 - t, 2.6));
};
/** the twelve whole dates the counter rolls through, JAN 1 2027 to JAN 1 2028 */
const DATES = MONTHS.map((m, i) => `${m} 1 ${i < 12 ? 2027 : 2028}`);
// one whole centred string per frame (the date the roll has reached), slid a little along the roll and blurred vertically in proportion to
// the roll's speed; never two strings on top of each other
const DateCounter: React.FC<{ cam: NuclearCam; at: V3; f: number; size: number }> = ({ cam, at, f, size }) => {
  const t = c01((f - 36) / 10);
  if (t <= 0) return null;
  const e = 1 - (1 - t) * (1 - t);
  const q = nuclearProject(cam, at);
  const px = size * q.s;
  const m = monthPos(f);
  const i = Math.min(12, Math.floor(m + 1e-6)); // a date shows until the roll has fully reached the next: JAN 1 2028 at f61
  const off = m - i; // 0..1 of a step
  const speed = Math.abs(monthPos(f + 0.5) - monthPos(f - 0.5)); // months per frame
  const blur = Math.min(px * 0.09, speed * px * 0.06);
  return (
    <div
      style={{
        position: "absolute",
        left: q.x,
        top: q.y + (1 - e) * 0.5 * px - off * px * 0.25,
        transform: "translate(-50%, -50%)",
        fontFamily: FONT_NUM,
        fontWeight: 700,
        fontSize: px,
        lineHeight: 1.05,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
        color: COLOR.cream,
        opacity: e * (1 - 0.35 * off),
        fontFeatureSettings: '"tnum" 1, "lnum" 1',
        filter: blur > 0.3 ? "url(#waiverCounterBlur)" : undefined,
      }}
    >
      {blur > 0.3 ? (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <filter id="waiverCounterBlur" x="-10%" y="-60%" width="120%" height="220%">
            <feGaussianBlur stdDeviation={`0 ${blur.toFixed(2)}`} />
          </filter>
        </svg>
      ) : null}
      {DATES[i]}
    </div>
  );
};

/** one soft capsule shadow per cylinder along its axis, thrown by its height along the key's direction */
const cylShadow = (p: CylPose, surf: number): ShadowItem | null => {
  const hl = Math.hypot(p.dir[0], p.dir[2]);
  const h = p.p[1] - surf;
  if (h < 0) return null;
  const ox = SHADOW_DIR[0] * h * SHADOW_LEN;
  const oz = SHADOW_DIR[1] * h * SHADOW_LEN;
  const len = Math.max(0.01, CYL_L * hl - CYL_D * 0.8);
  const dx = hl > 1e-3 ? p.dir[0] / hl : 1;
  const dz = hl > 1e-3 ? p.dir[2] / hl : 0;
  const a = 0.85;
  return { x: p.p[0] - dx * len * 0.5 + ox, z: p.p[2] - dz * len * 0.5 + oz, len, r: CYL_D * 0.42, soft: CYL_D * 0.35 + h * 0.05, alpha: a * (1 - c01((h - 6 * US_M) / (14 * US_M))), dirX: dx, dirZ: dz };
};

// label and counter places
const RUSSIA_AT = mapProjectTall(45.5, 50.5); // on the Volga, just right of the St Petersburg depot's door (the cut-off's beat) and clear of the top edge at the end
const US_LABEL_AT = usAt(-3, -11); // just under the group, clear of the slot
const COUNTER_AT: V3 = (() => {
  const p = mapProjectTall(-38, 47.5);
  return [p[0], 6, p[1]];
})();

const WaiverRunsOut: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const S = f + 900;
  const cam = camAt(f);
  const poses: (CylPose | null)[] = [];
  for (let j = -AHEAD; j <= 0; j++) poses.push(poseOf(cylAt(j, f)));
  const seaSh: ShadowItem[] = [];
  for (const p of poses) {
    if (!p) continue;
    const it = cylShadow(p, 0);
    if (it) seaSh.push(it);
  }
  const usShadows: ShadowItem[] = [...SMRS.flatMap((at) => smrShadowItems(at, { scale: SMR_SCALE })), ...gigawattShadowItems(GW_AT, { scale: GW_SCALE, yaw: GW_YAW })];
  return (
    <NuclearStage
      cam={cam}
      S={S}
      boardUnits={120}
      fog={[5, 14]}
      pool={{ x: 495, y: 925, strength: 1 }}
      world={
        <>
<WorldSlab projection="tall" islandMin={2.5} />
          <EmptySlot at={SLOT_AT} w={SLOT_W} d={SLOT_D} depth={2.2 * US_M} y={LAND_Y} along={US_R} />
          <SlotRim at={SLOT_AT} w={SLOT_W} d={SLOT_D} y={LAND_Y} along={US_R} rim={0.9 * US_M} />
          <LaneRibbon lit={(s) => laneLit(s, f)} halfWidth={laneHalfWidth} yAt={() => RIBBON_Y} />
          <SoftShadows
            items={[
              ...seaSh,
              ...([[DOOR, RU_DEPOT_SCALE, 1], [US_DOOR, DEPOT_SCALE, -1]] as const).map(([d, k, sg]) => ({ x: d.x - d.tx * DEPOT.W * 0.5 * k * sg, z: d.z - d.tz * DEPOT.W * 0.5 * k * sg, len: (DEPOT.H + 1) * k * SHADOW_LEN, r: DEPOT.D * 0.5 * k, soft: 0.6 * k })),
            ]}
            y={0.02}
          />
          <SoftShadows items={usShadows} y={LAND_Y + 0.02} />
          <Depot at={[DOOR.x, DOOR.z]} facing={[DOOR.tx, DOOR.tz]} y={0} scale={RU_DEPOT_SCALE} shut={shutAt(f)} light={lightAt(f)} />
          <Depot at={[US_DOOR.x, US_DOOR.z]} facing={[-US_DOOR.tx, -US_DOOR.tz]} y={0} scale={DEPOT_SCALE} />
          {SMRS.map((at, i) => (
            <SmrModule key={i} at={at} y={LAND_Y} scale={SMR_SCALE} shadow={false} />
          ))}
          <GigawattPlant at={GW_AT} y={LAND_Y} scale={GW_SCALE} yaw={GW_YAW} shadow={false} S={S} steam={0.07} />
          <Cylinders poses={poses} D={CYL_D} />
        </>
      }
      overlay={
        <>
          <MapType cam={cam} at={RUSSIA_AT} text="RUSSIA" t={c01((f - 0) / 10)} w={110} stretch={3.4} />
          <MapType cam={cam} at={US_LABEL_AT} text="U.S." t={c01((f - 8) / 12)} w={15 * US_M} stretch={1.15} />
          <DateCounter cam={cam} at={COUNTER_AT} f={f} size={17} />
        </>
      }
    />
  );
};

export default WaiverRunsOut;
