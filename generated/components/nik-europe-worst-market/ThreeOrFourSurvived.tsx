// ---------------------------------------------------------------------------
// ThreeOrFourSurvived (nik-europe-worst-market, cut 30). Cheeky Pint style (stout) in real 3D on the Europe slab world of
// the sister clip nik-revolut-ipo (revolutWorld.tsx on scott-nolan-uranium/nuclearWorld.tsx's NuclearStage, imported
// unchanged). Opaque 1080x1920, 23.976 fps, 223 frames. RENDER WITH --gl=angle.
//
// CHECK LINE: "Europe was crowded with digital banks; nearly all of them went under, and Revolut is one of the handful
// still standing." Sound off: dozens of banks stood all over Europe, almost all sank away, a few were left, and
// Revolut's (the R) is the one that rises amber.
//
// THE LINE (Nik Storonsky, Revolut co-founder/CEO): "[I think it's just because we] started in Europe where it is very
// hard. I think out of 50 digital banks, probably three or four survived. So we really survived in a tough competition,"
// WORD -> FRAME (brief, Whisper large-v3, f = round((t - 30.906) x 24000/1001); may run 2-6 f early): started 2 · in 12 ·
//   Europe 17 · where 25 · it is 41-46 · very 50 · hard 54 (ends ~65) · I think 67-73 · out of 77-81 · 50 87 ·
//   digital 97 · banks 105 (ends ~115) · probably 114 · three 119 · or 129 · four 136 · survived 139 (ends ~151) ·
//   So 152 · we 155 · really 163 · survived 176 · in a 184-192 · tough 194 · competition 206 (ends ~218)
// DURATION: the slot 30.905875 -> 40.207 s = 9.301 s x 23.976 = 223 frames (f0..f222). The edit cuts back to the
// speakers at f223.
//
// THE MOTION (survivedGeo.ts holds the banks, the front and the camera): 50 bank phones (portrait, ~1:2.5 in the world
// so they still read as phones under the wide's 50 deg pitch; a darker screen in a thin bezel, a small camera pill)
// stand on the board slab of Europe at its capitals and big cities (London, Paris, Berlin have a few), all in the
// style's dark tone except Revolut's in London, cream with the real R in ink. Non-European land recedes to the dark
// tone so Europe is the lit stage; small islands (Corsica, Sardinia and specks) are dropped (survivedLand.ts).
// f0 is already moving, close and low on London (the Revolut phone ~240 px tall); one pull-up
// and out (f-16 -> ~f104) lands on the whole crowded field filling the keep-in box at "50 digital banks". From f116 ONE
// contracting front runs from the edges of the continent in toward London (the ring as approved in V1): each tile drops
// straight down through a slot in the slab exactly its own footprint, darkening to the dark tone (9 f each; the last is
// down by f148); the slot shuts the frame the tile's top passes below the slab surface, so no mark is left behind.
// The other three survivors are the real peers from Revolut's European cohort, each at its home city: Monzo and
// Starling Bank in a short row north-west of Revolut's London tile, N26 in Berlin. They warm dark -> cream as the field
// empties (f124-146), their marks inking in with the second half of the warm (survivedLogos.ts). From f122 the camera
// pushes back in on London and turns to look east-north-east (yaw 2 -> 55, settled ~f200, then a slow creep), so
// Berlin runs into depth: London's three side by side lower left, N26 upper right, all four in the keep-in box; the
// survivors turn with the camera so their marks read face-on. On "really survived" the Revolut tile lifts one level and
// turns amber (f162 -> landed f175, the R stays ink), one LightSweep crosses the amber at the landing (f175-191, the
// only click), and the other survivors drop a step dimmer (still cream, marks at full ink, still in shot).
// f191-222: the living hold (camera creep, light pool, grain).
// AMBER = Revolut, the bank that survived (COMMON.md); cream = the survivors; dark tone = everyone else; board = the slab.
// No numerals on screen: Nik's "50" and "three or four" are his estimates (CRAFT.md); the count of tiles carries them
// (50 tiles; 4 left).
//
// SOURCES: Revolut was founded (2015) and is headquartered in London (its tile stands in London). Monzo: founded 2015 in
// London as Mondo, a UK-licensed bank, headquartered in London. Starling Bank: founded 2014 in London by Anne Boden, a
// UK-licensed bank. N26: founded 2013 in Berlin as Number26, headquartered in Berlin. Marks (public domain on Wikimedia
// Commons; SVGs and SOURCES.txt in assets-src/nik-europe-worst-market/logos/, path data inline in survivedLogos.ts):
// File:Revolut_logo.svg (the R, nik-trend-friend/revolutMark.ts), File:Monzo_2022_logo.svg (the "monzo" wordmark),
// File:Starling_Bank_Logo.svg (the circle mark only), File:N26_Logo_Black.svg (the wordmark with its bars). Land:
// world-atlas countries-50m (Natural Earth) on nik-revolut-ipo's tall Miller map. City lon/lat: standard values, coastal
// ones nudged inland so each footprint and its shadow stand wholly on the land (survivedGeo.ts). The field (the 46 that
// sink) is anonymous: no other bank's name or logo.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { NuclearStage } from "../scott-nolan-uranium/nuclearWorld";
import { project } from "../nik-revolut-ipo/revolutGeo";
import {
  DURATION as GEO_DURATION,
  LIFT_H,
  LIFT_OFF,
  LIFT_ON,
  PLACED,
  REVOLUT,
  SINK_GONE,
  SLAB_TOP,
  SWEEP_LEN,
  SWEEP_ON,
  TILE,
  WARM,
  camAt,
  sinkAt,
} from "./survivedGeo";
import { SurvivedSlab, useSurvivedBoard } from "./survivedSlab";
import { BankField, type TileState } from "./survivedWorld";

export const FPS = 24000 / 1001;
export const DURATION = 223;
export const schema = z.object({});
export const defaultProps = schema.parse({});
if (GEO_DURATION !== DURATION) throw new Error("ThreeOrFourSurvived: camera track length differs from DURATION");

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (a: number, b: number, v: number) => {
  const t = c01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeInOutCubic = (t: number) => {
  const u = c01(t);
  return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** fog start and end in multiples of cam.d (the far north recedes into the ground) */
const FOG: [number, number] = [1.45, 2.3];
/** world units one board texture spans (fixed for the cut) */
const BOARD_UNITS = 300;
/** the survivors drop a step dimmer when Revolut turns amber: still cream, a step toward board */
const SURVIVOR_DIM = 0.18;

const statesAt = (f: number): Record<string, TileState> => {
  const st: Record<string, TileState> = {};
  const lift = easeInOutCubic((f - LIFT_ON) / (LIFT_OFF - LIFT_ON));
  for (const b of PLACED) {
    if (b.revolut) {
      const sw = (f - SWEEP_ON) / SWEEP_LEN;
      st[b.id] = {
        sink: 0,
        slot: 0,
        cream: 1,
        amber: smooth(LIFT_ON + 1, LIFT_OFF - 2, f),
        lift: LIFT_H * lift,
        sweep: sw > 0 && sw < 1 ? lerp(-0.25, 1.25, sw) : -1,
        logo: 1,
      };
    } else if (b.survivor) {
      // the mark inks in with the second half of the warm (on cream, never on the dark face) and stays at full ink
      // through the dim
      st[b.id] = {
        sink: 0,
        slot: 0,
        cream: smooth(WARM[0], WARM[1], f) * (1 - SURVIVOR_DIM * smooth(LIFT_ON, LIFT_OFF, f)),
        amber: 0,
        lift: 0,
        sweep: -1,
        logo: smooth(lerp(WARM[0], WARM[1], 0.4), WARM[1], f),
      };
    } else {
      // the slot is the tile's own footprint: open while the tile goes down through it, shut the frame the tile's top
      // passes below the slab surface (SINK_GONE), so nothing is left on the map after the tile's last visible frame
      const sink = sinkAt(b.id, f);
      const slot = sink > 0 && sink < SINK_GONE ? smooth(0, 0.03, sink) : 0;
      st[b.id] = { sink, slot, cream: 0, amber: 0, lift: 0, sweep: -1, logo: 0 };
    }
  }
  return st;
};

const ThreeOrFourSurvived: React.FC<z.infer<typeof schema>> = () => {
  useSurvivedBoard();
  const f = useCurrentFrame();
  const cam = camAt(f);
  // the cream pool rides on the Revolut tile, opening to the continent's middle at the wide
  const r = project(cam, [REVOLUT.x, SLAB_TOP + TILE.H * 0.6, REVOLUT.z]);
  const wide = smooth(120, 270, cam.d);
  const pool = { x: lerp(r.x + 40, 560, wide), y: lerp(r.y - 20, 800, wide), strength: 1 };
  return (
    <NuclearStage
      cam={cam}
      S={f + 2100}
      fog={FOG}
      boardUnits={BOARD_UNITS}
      floor={false}
      pool={pool}
      world={
        <>
          <SurvivedSlab cam={cam} boardUnits={BOARD_UNITS} fog={FOG} />
          <BankField cam={cam} banks={PLACED} states={statesAt(f)} fog={FOG} />
        </>
      }
    />
  );
};

export default ThreeOrFourSurvived;
