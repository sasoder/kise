// ---------------------------------------------------------------------------
// EmpireOfHerself (wip-taylor-swift, cut 42). Works in Progress style (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx).
// Opaque 1080x1920, 24 fps, 180 frames.
//
// CHECK LINE: "Her empire is not a company with a logo like Meta or SpaceX; it is a tower built of images of herself,
// gilded like an icon." With no sound: she rises on a tower of her own pictures, two company towers come up beside it,
// fade back, and gold runs up the frames of her pictures to her feet.
//
// THE LINE: "Taylor Swift is building an empire, but it's not a company like Meta or SpaceX. It's an iconography of her
// own life and personality."
// WORD -> FRAME: Taylor 0 · Swift 4 · is 9 · building 16 · an 23 · empire 28 · but 39 · it's 46 · not 51 · a 53 ·
// company 56 · like 66 · Meta 74 · or 81 · SpaceX 84 · It's 100 · an 111 · iconography 114 · of 130 · her 138 · own 141 ·
// life 147 · and 155 · personality 159 · (cut back at 177)
// DURATION: the slot 42.8355 -> 50.2526 s = 178 frames at 24, + 2 frames of tail handle = 180 (f0..f179).
//
// LAYOUT (COMMON.md, Nov 11): a presenter is keyed over the middle and bottom of every graphic (her head from y ~780 in
// x 300-800, her body across the width below y ~1100). So everything that matters is above y ~760 or at the sides:
// Taylor stands at y ~110-460 on the settled frame; the tower runs down behind the presenter and bleeds off the bottom;
// the company towers stand at the sides (x < 300, x > 800) with their logos above y ~700, beside her head.
//
// THE MOTION: one camera curve, close on her at f0 (k 1.25, soles at screen y ~700) easing back and up to k ~1 as she rises,
// then a slow creep in to the cut. Rows of b&w prints of her (brickwork, one wide print under her feet) slide up from
// below the page and dock under the stack, and the stack, pushed from below, lifts her 700 px (f6-f46; on screen she
// rises f12-f32 through "building an empire"). On "not a company like" the Meta sign (left) and Starship on its launch
// tower (right) slide up from below the page beside hers, landing on "Meta" (f74) and "SpaceX" (f84), shorter than hers,
// each with its real mark printed in indigo. From "It's" (f100) they drain toward the paper (to 38 %, still in shot) and
// gold leaf is laid on the frames of her prints by one front that runs up the tower from below the frame, slowing through
// the visible top (crosses y ~780 about f122) and landing at her feet on "life" (f147). A faint glint runs up the gold
// once (f150-f176); the creep and grain hold the frame alive to the end.
// Contact frames: row 2 docks on f6 (the lift starts on that contact), then rows 3-8 every 5.5 frames to f39, each
// arriving at the stack's speed. Meta flat on f74, SpaceX on f84 (slides, nothing presses). The gold front reaches each
// frame before that frame turns gold.
// COLOUR: indigo = the two printed logos. Gold = the one real colour (the iconography). No red in this cut.
//
// SOURCES (animation_source/assets_raw/SOURCES.txt; Wikimedia Commons unless noted):
// Her, standing (empire_taylor.png, Apple Vision fg matte + bake-photo.py): taylor/taylor_2009_Fearless_VMAredcarpet_fulllength.jpg,
// 2009 VMAs press room, Philip Nelson, CC BY-SA 2.0.
// Era prints (bake-empire-prints.py), all from taylor/:
//   vma23     taylor_2023_VMA_headshoulders.png, 2023 MTV VMAs, iHeartRadioCA, CC BY 3.0
//   curls     taylor_2010_Fearless_curls_headshoulders.jpg, Time 100 gala 2010, David Shankbone, CC BY 3.0
//   lover     taylor_2019_Lover_headshoulders.jpg, iHeartRadio Music Awards 2019, Toglenn (Glenn Francis), CC BY-SA 4.0
//   speaknow, speaknowb  taylor_2012_SpeakNowTour_kneeup.jpg, Speak Now tour, Sydney 2012, Eva Rinaldi, CC BY-SA 2.0
//   gg24, gg24b  taylor_2024_GoldenGlobes_headshoulders.png, 2024 Golden Globes, iHeartRadioCA, CC BY 3.0
//   tour1989  taylor_2015_1989Tour_fulllength.jpg, 1989 World Tour, Melbourne 2015, AussieLegend, CC BY-SA 4.0
//   letterman taylor_2012_Letterman_street_fulllength.jpg, outside the Letterman studio, NYC 2012, Scott Mecum, CC BY 2.0
//   redgma    taylor_2012_Red_GMA_reddress.jpg, Good Morning America 2012, Paolo Villanueva, CC BY 2.0
//   fearless  taylor_2010_FearlessTour_kneeup.jpg, Fearless Tour 2010, Keith Lehwald, CC BY-SA 3.0
//   acms      press_2010_ACMs_interview.jpg, 2010 ACM Awards carpet, Keith Hinkle, CC BY 2.0
//   stride    taylor_2024_ErasTour_stride_fulllength.jpg, Eras Tour, Lyon 2024, Crackkkedactor, CC0
//   thighup   taylor_2019_Lover_thighup.jpg, iHeartRadio Music Awards 2019, Toglenn (Glenn Francis), CC BY-SA 4.0
//   gown      taylor_2024_ErasTour_gown_fulllength.jpg, Eras Tour, Warsaw 2024, Michalowsky4, CC BY-SA 4.0
//   tiff      press_2013_TIFF_crowd.jpg, TIFF 2013, GabboT, CC BY-SA 2.0
//   gg13      press_2013_GoldenGlobes_redcarpet.jpg, 2013 Golden Globes carpet, jdeeringdavis, CC BY 2.0
// Meta (empire_meta.png, bake-empire-company.py, its own mark painted out): empire/meta_hq_infinity_sign_1HackerWay_a.jpg,
// the sign at 1 Hacker Way, Menlo Park 2022, Nokia621, CC BY-SA 4.0. The printed mark: empire/logo_meta_symbol.svg
// (Meta Platforms, public domain, PD-textlogo).
// SpaceX (empire_starship.png): empire/spacex_starship_launch_c.jpg, Starship flight 5, Oct 2024, Steve Jurvetson, CC BY 2.0.
// The printed wordmark: empire/logo_spacex_black.svg (SpaceX, public domain, PD-textlogo).
// Gold: bake-empire-gold.py, a leaf-gold palette. The gilded icon reference (empire/icon_gilded_VirginOfTenderness_a.jpg,
// unknown artist, public domain) sampled too brown through its varnish, so it is not used. No figures on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { Easing, Img, interpolate, random, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CaptionBandsDebug, CutOut, INDIGO, InkPrint, PaperGround, WipFilmLife, WipPlane, runWipCamera, slide } from "../kits/works-in-progress/wipShared";
import { GOLD_TILE_URI } from "./empireGoldData";
import { META_BOX, META_PATHS, SPACEX_BOX, SPACEX_SVG } from "./empireLogos";

export const FPS = 24;
export const DURATION = 180;
export const schema = z.object({ bands: z.boolean(), presenter: z.boolean() });
export const defaultProps = schema.parse({ bands: false, presenter: false });

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// -- the lift: the tower rises out of the bottom of the page and carries her up --------------------------------------
const FEET_END = 462; // her soles on the settled frame (world px = screen px on the end keys, k ~1)
const RISE = 700;
const LIFT_START = 6; // row 2 docks under the stack: the push starts with the contact
const LIFT_END = 46;
const liftAt = (f: number) => interpolate(f, [LIFT_START, LIFT_END], [0, RISE], { ...clamp, easing: Easing.bezier(0.3, 0, 0.35, 1) });
const feetY = (f: number) => FEET_END + RISE - liftAt(f);

// -- the camera: close on her at f0 (soles at screen y ~640, above the presenter), easing back and up with the lift -------
const K0 = 1.25;
const FEET0_SCREEN = 700;
const CAM_Y0 = FEET_END + RISE - (FEET0_SCREEN - 960) / K0;
const camAt = runWipCamera(
  [
    { f: -20, x: 540, y: CAM_Y0, k: K0 },
    { f: 2, x: 540, y: CAM_Y0 - 10, k: K0 * 0.994, ease: "linear" },
    { f: 42, x: 540, y: 984, k: 1.02 },
    { f: 74, x: 540, y: 962, k: 1.0 },
    { f: DURATION + 20, x: 540, y: 942, k: 1.03, ease: "linear" },
  ],
  DURATION,
);

// -- her ------------------------------------------------------------------------------------------------------------
// public/wip-taylor-swift/empire_taylor.png: 2009 VMAs press room, red dress, the Moonman in her hands; soles at the foot.
const TAYLOR_ASPECT = 0.3027;
const TAYLOR_H = 350;
const TAYLOR_W = TAYLOR_H * TAYLOR_ASPECT;
const TAYLOR_X = 536;

// -- the tower: rows of prints like bricks, top row first (she stands on row 0). Photo px; each print has a 6 px paper
// border, so 14 px between photos. Cell sizes match scripts/clips/wip-taylor-swift/bake-empire-prints.py. ---------------
const TOWER_X = 540;
const TOWER_W = 406;
const ROW_H = 160;
const GAP = 20;
const PITCH = ROW_H + GAP;
const BORDER = 6;
const ROWS: { cells: [string, number][]; dx: number }[] = [
  { cells: [["vma23", 400]], dx: 0 },
  { cells: [["curls", 220], ["lover", 166]], dx: -6 },
  { cells: [["speaknow", 160], ["gg24", 226]], dx: 7 },
  { cells: [["tour1989", 200], ["letterman", 186]], dx: -4 },
  { cells: [["redgma", 230], ["fearless", 156]], dx: 6 },
  { cells: [["acms", 170], ["stride", 216]], dx: -7 },
  { cells: [["thighup", 210], ["gown", 176]], dx: 4 },
  { cells: [["tiff", 186], ["gg13", 200]], dx: -5 },
  { cells: [["gg24b", 220], ["speaknowb", 166]], dx: 5 },
];
type Cell = { name: string; w: number; h: number; cx: number; dy: number; rot: number; row: number; tileX: number; tileY: number };
// (cx, dy): the photo's centre, dy below her soles
const CELLS: Cell[] = ROWS.flatMap((row, r) => {
  let x = TOWER_X - TOWER_W / 2 + row.dx;
  return row.cells.map(([name, w], i) => {
    const c = { name, w, h: ROW_H, cx: x + w / 2, dy: BORDER + r * PITCH + ROW_H / 2, rot: (random(`emp-rot-${r}-${i}`) - 0.5) * 1.3, row: r, tileX: Math.floor(random(`emp-tx-${r}-${i}`) * 60), tileY: Math.floor(random(`emp-ty-${r}-${i}`) * 250) };
    x += w + GAP;
    return c;
  });
});

// The build: rows 0 and 1 are under her at f0; every later row slides up from below the page and docks under the stack
// on its contact frame, matching the stack's speed, so the stack rises on the rows arriving under it. Rows that dock
// below the frame need no slide.
const DOCK_FIRST = 2;
const DOCK_AT = (r: number) => LIFT_START + (r - DOCK_FIRST) * 5.5; // row 2 on f14 ... row 8 on f47
const DOCK_DUR = 22;
const dockGap = (r: number, f: number) => {
  if (r < DOCK_FIRST) return 0;
  const c = DOCK_AT(r);
  const s0 = c - DOCK_DUR;
  // how far below its docked place the row starts: its top a little under the frame's bottom edge on that frame
  const cs = camAt(Math.max(0, s0));
  const bottom = cs.y + 960 / cs.k;
  const dockedTop = feetY(s0) + BORDER + r * PITCH - BORDER;
  const g = Math.max(0, bottom + 30 - dockedTop);
  return g * (1 - slide(f, s0, DOCK_DUR));
};

// -- the gold: leaf laid on each print's frame by a front that runs up the tower to her feet ------------------------------
const GOLD_START = 100; // "It's"
const GOLD_END = 147; // "life"
const GOLD_FROM = 1990; // world y: below the frame's bottom edge, so no frame is gilded all at once
const GOLD_BAND = 20; // the frame round each photo, world px (covers the paper border)
// Fast behind the presenter, slowing through the visible top: it crosses y ~780 about f122 and lands at her feet on "life".
const GOLD_TO = FEET_END - GOLD_BAND - 4;
const goldFrontAt = (f: number) => {
  const t = interpolate(f, [GOLD_START, GOLD_END], [0, 1], clamp);
  return GOLD_TO + (GOLD_FROM - GOLD_TO) * (1 - t) ** 2.4;
};
// leaf is laid in squares: the front is a stair of leaf-sized steps, fixed in world x
const LEAF = 22;
const STEPS = Array.from({ length: Math.ceil(TOWER_W / LEAF) + 4 }, (_, i) => (random(`emp-leaf-${i}`) - 0.5) * 16);
const goldClip = (front: number) => {
  const x0 = TOWER_X - TOWER_W / 2 - 40;
  const pts: string[] = [];
  STEPS.forEach((o, i) => {
    pts.push(`${x0 + i * LEAF}px ${front + o}px`, `${x0 + (i + 1) * LEAF}px ${front + o}px`);
  });
  const x1 = x0 + STEPS.length * LEAF;
  return `polygon(${pts.join(", ")}, ${x1}px 4000px, ${x0}px 4000px)`;
};
// a faint warm glint on the gold after it lands: one slow band up the tower, then nothing
const GLINT_START = 150;
const GLINT_END = 176;

const GOLD_TILE = 512;
const GoldFrame: React.FC<{ c: Cell; top: number; sheen: number; sheenA: number }> = ({ c, top, sheen, sheenA }) => {
  const ow = c.w + 2 * GOLD_BAND;
  const oh = c.h + 2 * GOLD_BAND;
  const left = c.cx - ow / 2;
  const t = top - oh / 2;
  const ring = `path(evenodd, "M0 0 H${ow} V${oh} H0 Z M${GOLD_BAND} ${GOLD_BAND} V${GOLD_BAND + c.h} H${GOLD_BAND + c.w} V${GOLD_BAND} Z")`;
  const sheenY = sheen - t;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: t,
        width: ow,
        height: oh,
        transform: `rotate(${c.rot}deg)`,
        clipPath: ring,
      }}
    >
      {/* the leaf: the inlined tile (it cannot race frame capture), each frame cut from its own place on it */}
      <Img
        src={GOLD_TILE_URI}
        style={{ position: "absolute", left: -c.tileX, top: -c.tileY, width: GOLD_TILE, height: GOLD_TILE, maxWidth: "none" }}
      />
      {/* the fresh leaf catches the light at the front, and the glint later */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: sheenY - 34,
          width: ow,
          height: 90,
          background: `linear-gradient(to bottom, rgba(255,247,218,0) 0px, rgba(255,247,218,${sheenA}) 34px, rgba(255,247,218,0) 90px)`,
        }}
      />
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 0 1.5px rgba(255,236,170,0.55)" }} />
      {/* the dark keyline where the leaf meets the picture */}
      <div style={{ position: "absolute", left: GOLD_BAND - 1.5, top: GOLD_BAND - 1.5, width: c.w + 3, height: c.h + 3, boxShadow: "0 0 0 1.5px rgba(70,44,8,0.75)" }} />
    </div>
  );
};

// -- the companies: two prints that slide up from below the page beside her tower, landing on their names ---------------
// Meta: the sign at 1 Hacker Way, its own mark painted out and the real mark printed over it in indigo (its place in the
// print measured by bake-empire-company.py: centre (0.494, 0.680) of the print, 0.888 of its width). SpaceX: Starship on
// its launch tower, the wordmark printed on the paper just above the print.
const COMPANY_W = 200;
const COMPANIES = [
  { key: "meta", src: "wip-taylor-swift/empire_meta.png", x: 200, top: 470, aspect: 420 / 528, land: 74, dur: 34 },
  { key: "spacex", src: "wip-taylor-swift/empire_starship.png", x: 878, top: 420, aspect: 445 / 1400, land: 84, dur: 36 },
] as const;
const companyDrop = (land: number, dur: number, f: number, top: number) => {
  const s0 = land - dur;
  const cs = camAt(s0);
  const g = cs.y + 960 / cs.k + 30 - top;
  return g * (1 - slide(f, s0, dur));
};
const META_MARK_W = COMPANY_W * 0.888;
const META_MARK_H = (META_MARK_W * META_BOX.h) / META_BOX.w;
const SPACEX_W = 196;
const SPACEX_H = (SPACEX_W * SPACEX_BOX.h) / SPACEX_BOX.w;
const SPACEX_GAP = 14; // between the wordmark and the print's top
// "It's" (f100): they drain toward the paper, still in shot
const DIM_START = 100;
const DIM_END = 118;
const DIM_TO = 0.38;

// a stand-in for the presenter, for checking the layout only (never on in a final)
const PresenterDebug: React.FC<{ on: boolean }> = ({ on }) =>
  on ? (
    <>
      <div style={{ position: "absolute", left: 300, top: 780, width: 500, height: 320, background: "rgba(0,0,0,0.6)" }} />
      <div style={{ position: "absolute", left: 100, top: 1100, width: 900, height: 820, background: "rgba(0,0,0,0.6)" }} />
    </>
  ) : null;

const EmpireOfHerself: React.FC<z.infer<typeof schema>> = ({ bands, presenter }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const feet = feetY(frame);
  const front = goldFrontAt(frame);
  const gilding = frame >= GOLD_START;
  const glintT = interpolate(frame, [GLINT_START, GLINT_END], [0, 1], clamp);
  const glintOn = frame >= GLINT_START && frame <= GLINT_END;
  const sheen = glintOn ? interpolate(glintT, [0, 1], [1100, FEET_END - 60]) : front;
  const sheenA = glintOn ? 0.3 * Math.sin(glintT * Math.PI) : interpolate(frame, [GOLD_START, GOLD_START + 6, GOLD_END, GOLD_END + 5], [0, 0.55, 0.55, 0], clamp);
  const dim = interpolate(frame, [DIM_START, DIM_END], [1, DIM_TO], { ...clamp, easing: Easing.bezier(0.45, 0, 0.4, 1) });
  // bottom of the frame in world y, so prints far below it are not drawn
  const bottom = cam.y + 960 / cam.k + 40;
  const cells = CELLS.filter((c) => feet + c.dy + dockGap(c.row, frame) - c.h / 2 - 30 < bottom);
  return (
    <>
      <WipFilmLife frame={frame}>
        <PaperGround cam={cam} />
        {/* her tower: the prints, then their gold frames as the leaf is laid */}
        <WipPlane cam={cam}>
          {cells.map((c) => (
            <CutOut
              key={`${c.name}-${c.dy}`}
              src={`wip-taylor-swift/empire_print_${c.name}.png`}
              x={c.cx}
              y={feet + c.dy + dockGap(c.row, frame)}
              w={c.w}
              aspect={c.w / c.h}
              rotate={c.rot}
              border={BORDER}
              grain={0.12}
              seed={`print-${c.name}`}
            />
          ))}
          {gilding ? (
            <div style={{ position: "absolute", inset: 0, clipPath: goldClip(front) }}>
              {cells.map((c) => (
                <GoldFrame key={`g-${c.name}-${c.dy}`} c={c} top={feet + c.dy} sheen={sheen} sheenA={sheenA} />
              ))}
            </div>
          ) : null}
        </WipPlane>
        {/* the companies */}
        <WipPlane cam={cam}>
          {COMPANIES.map((c) => {
            if (frame < c.land - c.dur) return null;
            const h = COMPANY_W / c.aspect;
            const top = c.top + companyDrop(c.land, c.dur, frame, c.top);
            return (
              <div key={c.key} style={{ position: "absolute", inset: 0, opacity: dim }}>
                <CutOut src={c.src} x={c.x} y={top + h / 2} w={COMPANY_W} aspect={c.aspect} border={BORDER} grain={0.12} seed={`co-${c.key}`} />
              </div>
            );
          })}
        </WipPlane>
        <WipPlane cam={cam} ink>
          {COMPANIES.map((c) => {
            if (frame < c.land - c.dur) return null;
            const h = COMPANY_W / c.aspect;
            const top = c.top + companyDrop(c.land, c.dur, frame, c.top);
            const left = c.x - COMPANY_W / 2;
            return (
              <div key={c.key} style={{ position: "absolute", inset: 0, opacity: dim }}>
                {c.key === "meta" ? (
                  <InkPrint
                    x={left + COMPANY_W * 0.494 - META_MARK_W / 2}
                    y={top + h * 0.68 - META_MARK_H / 2}
                    w={META_MARK_W}
                    h={META_MARK_H}
                    ink={INDIGO}
                    seed="ink-meta"
                    rough={1}
                    wear={0.2}
                    misregister={0.8}
                  >
                    <svg width={META_MARK_W} height={META_MARK_H} viewBox={`0 0 ${META_BOX.w} ${META_BOX.h}`} style={{ position: "absolute", left: 0, top: 0 }}>
                      {META_PATHS.map((d) => (
                        <path key={d.slice(0, 12)} d={d} fill="currentColor" />
                      ))}
                    </svg>
                  </InkPrint>
                ) : (
                  <InkPrint x={c.x - SPACEX_W / 2} y={top - SPACEX_GAP - SPACEX_H} w={SPACEX_W} h={SPACEX_H} ink={INDIGO} seed="ink-spacex" rough={0.8} wear={0.15} misregister={0.6}>
                    <svg
                      width={SPACEX_W}
                      height={SPACEX_H}
                      viewBox={`0 0 ${SPACEX_BOX.w} ${SPACEX_BOX.h}`}
                      style={{ position: "absolute", left: 0, top: 0 }}
                      dangerouslySetInnerHTML={{ __html: SPACEX_SVG }}
                    />
                  </InkPrint>
                )}
              </div>
            );
          })}
        </WipPlane>
        {/* her, on top */}
        <WipPlane cam={cam}>
          <CutOut src="wip-taylor-swift/empire_taylor.png" x={TAYLOR_X} y={feet - TAYLOR_H / 2 + 2} w={TAYLOR_W} aspect={TAYLOR_ASPECT} border={5} grain={0.1} seed="taylor" />
        </WipPlane>
      </WipFilmLife>
      <PresenterDebug on={presenter} />
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default EmpireOfHerself;
