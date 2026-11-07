// ---------------------------------------------------------------------------
// AcceleratingDemise (wip-ya-boom, cut 68, the clip's last shot). Works in Progress style (styles/works-in-progress.md,
// "Stripped-down variant"; kit generated/components/kits/works-in-progress/wipShared.tsx) with the clip's materials
// (./yaShared.tsx). Opaque 1080x1920, 24 fps, 111 frames. Rev 2: states shown as hard cuts (notes/REVISION_hardcut.md).
//
// BEAT MAP (every change is a hard cut, on the word's onset + 4 frames; nothing moves in between):
// f0   the leaning tower of 11 photocopied spines, 2.5 deg, its contact shadow on the page ("In the attempt")
// f17  a REBECCA YARROS copy on top, the tower at 5 deg ("save")
// f38  a HOOVER copy on top of that, 7.5 deg ("publishers")
// f46  another REBECCA YARROS copy on top, 10 deg ("may")
// f56  the tower leaning further, 15 deg ("just")
// f67  leaning further still, 23 deg ("accelerating")
// f91  hard cut to the heap framing: the settled heap of all 14 spines (the rev-1 end frame), held to the end ("demise")
//
// CHECK LINE: "publishers keep piling on more of the same few hits to prop the industry up, and that is exactly what knocks it
// over". With the sound off: a tall, leaning tower of photocopied book spines (REBECCA YARROS, HOOVER, SARAH J. MAAS at the top)
// gets more copies of the same books on top; with each it leans further, until it lies in a heap.
//
// THE LINE: "In the attempt to save their industry, publishers may just be accelerating its demise."
// WORD -> FRAME (onsets): In -2 · the 2 · attempt 4 · to 8 · save 13 · their 19 · industry 22 · publishers 34 · may 42 ·
// just 52 · be 58 · accelerating 63 · its 77 · demise 87
// DURATION: the slot 68.708 -> 73.333 s = 4.625 s x 24 = 111 frames (f0..f110). It ends the video.
//
// THE STATES: one rigid tower turning about its bottom right corner (the pivot, where the base spine's contact shadow sits);
// the lower spines are strips of cover art with no lettering (they lie in the caption bands), the top ones carry the names.
// The heap is the rev-1 design: two columns, art strips in the lower three rows, the named copies piled three high on top.
// Camera: still. Two framings, one hard cut between them on "demise": the tower framing (k 0.8, the tower's middle near
// y 960, wide enough for its furthest lean) and the heap framing (k 0.917, the heap fills the width, its named rows at
// y ~670-1070, the art rows through the first caption band). The frame lives through the paper grain and film life only.
// SPOT INK: none. No text: the spines are the artefacts.
//
// SOURCES (animation_source/assets_raw/SOURCES.txt): spines cut from the publishers' front covers (Fourth Wing, Iron Flame,
// Onyx Storm, It Ends with Us, It Starts with Us, Verity, The Housemaid, A Court of Thorns and Roses 2020): bands with the
// author's name, or bands of cover art with no lettering for the lower tower. Baked by
// scripts/clips/wip-ya-boom/bake-AcceleratingDemise.py into public/wip-ya-boom/ad_*.png (its hand bake is unused since rev 2).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CaptionBandsDebug, PaperGround, WipCam, WipFilmLife, WipPlane } from "../kits/works-in-progress/wipShared";
import { THEME, XeroxCutOut } from "./yaShared";

export const FPS = 24;
export const DURATION = 111;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

const D2R = Math.PI / 180;

// -- the spines -------------------------------------------------------------------------------------------------------
type Spine = { src: string; aspect: number };
const sp = (name: string, aspect: number): Spine => ({ src: `wip-ya-boom/ad_${name}.png`, aspect });
const S = {
  fwYarros: sp("fw_yarros", 6.1644),
  ifYarros: sp("if_yarros", 6.0403),
  osYarros: sp("os_yarros", 6.0403),
  iewuHoover: sp("iewu_hoover", 4.4776),
  iswuHoover: sp("iswu_hoover", 4.4118),
  verityHoover: sp("verity_hoover", 5.8065),
  hmMcfadden: sp("hm_mcfadden", 7.6923),
  acotarMaas: sp("acotar_maas", 7.8261),
  fwArt: sp("fw_art", 6.1644),
  fwArt2: sp("fw_art2", 6.1644),
  ifArt: sp("if_art", 5.9603),
  ifArt2: sp("if_art2", 7.8261),
  osArt: sp("os_art", 6.2937),
  verityArt: sp("verity_art", 6.1644),
  hmArt: sp("hm_art", 6.1644),
  hmEye: sp("hm_eye", 6.1644),
};
const BORDER = 7; // the scissor margin of a spine strip
const PITCH_GAP = 3; // between one spine's edge and the next (the paper margins overlap)

// -- the tower, bottom to top. dx: the spine's centre from the base spine's centre (a tower drifts as it is stacked) ------
type Book = { key: string; s: Spine; w: number; dx: number; rot: number };
const TOWER: Book[] = [
  { key: "t0", s: S.ifArt, w: 640, dx: 0, rot: 0 },
  { key: "t1", s: S.osArt, w: 600, dx: 6, rot: -0.6 },
  { key: "t2", s: S.hmEye, w: 590, dx: -4, rot: 0.8 },
  { key: "t3", s: S.verityArt, w: 600, dx: 14, rot: -0.4 },
  { key: "t4", s: S.fwArt, w: 580, dx: 8, rot: 1.0 },
  { key: "t5", s: S.ifArt2, w: 610, dx: 22, rot: -0.9 },
  { key: "t6", s: S.hmArt, w: 590, dx: 18, rot: 0.5 },
  { key: "t7", s: S.osYarros, w: 590, dx: 30, rot: -1.1 },
  { key: "t8", s: S.acotarMaas, w: 600, dx: 26, rot: 0.9 },
  { key: "t9", s: S.verityHoover, w: 590, dx: 40, rot: -0.5 },
  { key: "t10", s: S.fwYarros, w: 600, dx: 36, rot: 1.2 },
];
// the copies piled on, each there from its word on
type Add = Book & { on: number };
const ADDS: Add[] = [
  { key: "a0", s: S.fwYarros, w: 600, dx: 52, rot: -0.8, on: 17 },
  { key: "a1", s: S.iewuHoover, w: 580, dx: 66, rot: 1.4, on: 38 },
  { key: "a2", s: S.fwYarros, w: 600, dx: 84, rot: -1.6, on: 46 },
];
const ALL: Book[] = [...TOWER, ...ADDS];

// -- the states: the lean (deg about the pivot) from each cut on, then the heap -----------------------------------------
const LEANS: { f: number; lean: number }[] = [
  { f: 0, lean: 2.5 },
  { f: 17, lean: 5 },
  { f: 38, lean: 7.5 },
  { f: 46, lean: 10 },
  { f: 56, lean: 15 },
  { f: 67, lean: 23 },
];
const HEAP_F = 91; // "demise"
const leanAt = (f: number) => LEANS.reduce((l, s) => (f >= s.f ? s.lean : l), LEANS[0].lean);

// -- the tower's geometry: origin at the pivot (the base spine's bottom right corner), y down, the tower in -y -----------
const FLOOR_Y = 1500; // world
const PIVOT_X = 790; // world
const hOf = (b: Book) => b.w / b.s.aspect;
const LOCAL: { cx: number; cy: number }[] = (() => {
  const out: { cx: number; cy: number }[] = [];
  const baseCx = -ALL[0].w / 2;
  let top = 0;
  for (const b of ALL) {
    const h = hOf(b);
    out.push({ cx: baseCx + b.dx, cy: top - h / 2 });
    top -= h + PITCH_GAP;
  }
  return out;
})();
type Pose = { x: number; y: number; rot: number };
const towerPose = (i: number, lean: number): Pose => {
  const th = lean * D2R;
  const { cx, cy } = LOCAL[i];
  return {
    x: PIVOT_X + cx * Math.cos(th) - cy * Math.sin(th),
    y: FLOOR_Y + cx * Math.sin(th) + cy * Math.cos(th),
    rot: ALL[i].rot + lean,
  };
};

// -- the heap (rev 1's settled frame): per spine its layer (0 = the page), its tilt and where its bottom right corner rests
// (world x); the layers rise in paint order, so a later spine never lies under an earlier one -----------------------------
type Spec = { layer: number; rot: number; x: number };
const LAYER_H = 90;
const SPEC: Record<string, Spec> = {
  // the base lies flat where it stood
  t0: { layer: 0, rot: 0, x: PIVOT_X },
  // the left column: art strips below (they lie in the first caption band at the end), named copies on top
  t1: { layer: 0, rot: 0.6, x: 1200 },
  t2: { layer: 1, rot: 2.5, x: 1240 },
  t3: { layer: 2, rot: -2, x: 1180 },
  // the right column's art strips
  t4: { layer: 0, rot: 0.4, x: 1790 },
  t5: { layer: 1, rot: -1.5, x: 1820 },
  t6: { layer: 2, rot: 3, x: 1780 },
  // the named copies: left, right, left ...
  t7: { layer: 3, rot: 2.5, x: 1210 },
  t8: { layer: 4, rot: -3, x: 1170 },
  t9: { layer: 5, rot: 3.5, x: 1230 },
  t10: { layer: 3, rot: -2, x: 1800 },
  a0: { layer: 4, rot: 3, x: 1770 },
  a1: { layer: 5, rot: -2.5, x: 1830 },
  // the last copy highest, on the right column
  a2: { layer: 6.5, rot: -1.5, x: 1800 },
};
const centreFromCorner = (b: Book, cx: number, cy: number, rot: number): Pose => {
  const w = b.w + BORDER;
  const h = hOf(b) + BORDER;
  const c = Math.cos(rot * D2R);
  const s = Math.sin(rot * D2R);
  return { x: cx + (-w / 2) * c - (-h / 2) * s, y: cy + (-w / 2) * s + (-h / 2) * c, rot };
};
const heapPose = (i: number): Pose => {
  const sp = SPEC[ALL[i].key];
  return centreFromCorner(ALL[i], sp.x, FLOOR_Y - sp.layer * LAYER_H, sp.rot);
};

// -- the camera: two still framings, one hard cut ----------------------------------------------------------------------
const TOWER_CAM: WipCam = { x: 740, y: 850, k: 0.8 };
const HEAP_CAM: WipCam = { x: 1197, y: 1130, k: 0.917 };
const camAt = (f: number): WipCam => ({ ...(f >= HEAP_F ? HEAP_CAM : TOWER_CAM), x0: TOWER_CAM.x, y0: TOWER_CAM.y });

// -- the base spine's contact shadow on the page: the dense core at the pivot is always there; along the spine it is
// fainter the higher the far end stands off the page (static in each state) ------------------------------------------------
const ContactShadow: React.FC<{ lean: number }> = ({ lean }) => {
  const b = ALL[0];
  const w = b.w + BORDER;
  const h = hOf(b) + BORDER;
  const lift = Math.max(0, Math.sin(lean * D2R)) * w; // the far end's height above the page
  const along = Math.max(0, 1 - lift / 90);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: PIVOT_X - w,
          top: FLOOR_Y - 10,
          width: w,
          height: 22,
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(20,22,20,0.4), rgba(20,22,20,0))",
          filter: "blur(4px)",
          opacity: along,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: PIVOT_X - 110 - h * 0.1,
          top: FLOOR_Y - 12,
          width: 170,
          height: 28,
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(20,22,20,0.6), rgba(20,22,20,0))",
          filter: "blur(3px)",
        }}
      />
    </>
  );
};

const AcceleratingDemise: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const heap = frame >= HEAP_F;
  const lean = heap ? 0 : leanAt(frame);
  return (
    <>
      <WipFilmLife frame={frame} theme={THEME}>
        <PaperGround cam={cam} theme={THEME} />
        <WipPlane cam={cam}>
          <ContactShadow lean={lean} />
          {ALL.map((b, i) => {
            const add = i >= TOWER.length ? ADDS[i - TOWER.length] : null;
            if (add && frame < add.on) return null;
            const pose = heap ? heapPose(i) : towerPose(i, lean);
            return (
              <XeroxCutOut
                key={b.key}
                src={b.s.src}
                kind="cover"
                x={pose.x}
                y={pose.y}
                w={b.w}
                aspect={b.s.aspect}
                rotate={pose.rot}
                border={BORDER}
                seed={`ad-${b.key}`}
              />
            );
          })}
        </WipPlane>
      </WipFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default AcceleratingDemise;
