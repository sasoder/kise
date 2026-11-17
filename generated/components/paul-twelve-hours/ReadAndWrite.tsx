// ---------------------------------------------------------------------------
// ReadAndWrite (paul-twelve-hours, cut 23). Paul world, Look C "Graphite air" (styles/dwarkesh-3d.md medium,
// styles/dwarkesh.md vocabulary; the shared world paulWorld / paulWorldSets, imported, never edited). The same tower,
// lights and contributors as the sister cut TheMonorepo (S2).
// Opaque 1080x1920, 23.976 fps, 152 frames.
//
// CHECK LINE: "they could not only read OpenAI's code, they could write into it."
//
// THE LINE: "...not only the ability to see OpenAI's internal source code, but the ability to make pull requests to
//   OpenAI's monorepo."
// WORD -> FRAME (Whisper, from f0; true onsets ~5-9 f later): only 3 · the 8 · ability 11 · to 16 · see 21 ·
//   OpenAI's 26 · internal 45 · source 57 · code 63 · but 74 · the 78 · ability 80 · to 84 · make 88 · pull 91 ·
//   requests 93 · to 98 · OpenAI's 110 · monorepo 125 · And 135
// DURATION: the slot 23.023 -> 29.363 s = 6.340 s x 23.976 = 152 frames (f0..f151).
//
// THE MOTION: close on the upper panels of the OpenAI code tower, the cap and its mark above. A reading lens is
// already gliding down the face (f0), its glass magnifying the very bars behind it ~2.2x (a true magnifier: the view
// is the face under the lens, re-projected every frame); it slows over the orange line of layer 9 ("see ... source
// code", f40-70), reads on to layer 7-8 (f80), and on "but" bows out down and to the right, accelerating off the
// frame's right edge (f80-~97; hidden from f102). The cause first: a thick slate foreign panel carrying the HACKTRON
// mark, wordmark and a merge (pull-request) glyph comes in from the right edge (f62-86; leading edge on screen ~f80)
// and waits at the tower's side; then the upper stack lifts to open a slot (f84-92) and the panel slides in, flush
// (f88-101, contact f101, "pull requests" true ~f99); the lifted stack settles down onto it (f101-113, contact f113)
// and a faint glint runs along its edges (f108-130). The pull-back ends on the whole tower with the foreign panel
// inside near y 660, no lens; the lower tower sinks into the low air across the caption bands; living drift.
// Orange = the American labs' algorithmic secrets (the code's orange lines); the lens, the foreign panel and the
// contributors are neutral.
//
// CAMERA: the world's orbit camera (camTrack + living), fov 30. Opening ~515 px/m at the face (lens ~40 % of frame
// width), following the lens down and drifting right so the tower's right side has air for the panel's arrival
// (f-10..80), one eased pull-back (f44-148) to ~310 px/m (cap top ~y 295, the HACKTRON panel ~y 660, wordmark caps
// ~48 px; base in the low air).
//
// SOURCES: Hacktron (hacktron.ai), Jul 2026: reached OpenAI's internal repos and had Codex open a harmless pull request
// in the internal monorepo `openai/openai` (COMMON.md facts). Marks: public/paul-twelve-hours/hacktron(_wordmark)
// _white.svg; OpenAI mark via the world's tower cap (kits/dwarkesh/brandGlyphs).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { C, D2R, PaulStage, THREE, camTrack, clamp01, ease01, living, mix3, orbitCam, screenScale, type Any, type CamDef, type Orbit, type V3, type World, type WorldSpec } from "./paulWorld";
import { TOWER, codeRowOfLayer, layerY, makeMonorepo, makeThread, type Monorepo } from "./paulWorldSets";

export const FPS = 24000 / 1001;
export const DURATION = 152;
export const schema = z.object({ debug: z.boolean(), pick: z.array(z.number()) });
export const defaultProps = schema.parse({ debug: false, pick: [] });

// ===================================================================================================================
// TIMING (frames)
// ===================================================================================================================
const T_LENS = { a0: -16, a1: 62, b1: 80, x1: 102 }; // the lens: glide A->C (slows on the orange line), C->E, then bows out
const T_APP = [62, 86] as const; // the HACKTRON panel comes in from the right edge to the tower's side
const T_GAP = [84, 92] as const; // the upper stack lifts (slot opens) once the panel is there
const T_INS = [88, 101] as const; // it slides into the slot (contact = f101)
const T_SETTLE = [101, 113] as const; // the lifted stack settles down onto the panel (contact f113)
const T_GLINT = [108, 130] as const;

// ===================================================================================================================
// THE FOREIGN PANEL (this cut's: thicker than a code panel so its mark reads at the closing wide)
// ===================================================================================================================
const GAP_AT = 10; // layers >= 10 and the cap lift to take the panel between layers 9 and 10
const HT = { LH: 0.42, X0: 4.0, XW: 2.5 }; // panel height; centre x off-frame (f70) and waiting at the side (f90)
const SLOT = HT.LH + (TOWER.PITCH - TOWER.LH); // the lift that seats it with the stack's own spacing
const OVER = 0.07; // extra lift while it slides in
const PANEL_Y = layerY(GAP_AT - 1) + (TOWER.PITCH + SLOT) / 2;
const WM = { w: 1.565, aspect: 5184 / 521, capFrac: 0.97 };
const WM_CAP = (WM.w / WM.aspect) * WM.capFrac; // world cap height of the wordmark (m)

const makeForeignPanel = (w: World, tower: Monorepo) => {
  const { K, T, scene } = w;
  const { W: TW, D: TD } = TOWER;
  const g = K.group(scene);
  K.box([TW, HT.LH, TD], K.clay("#77746E"), [0, 0, 0], { r: 0.035, parent: g });
  const zf = TD / 2 + 0.003;
  // left to right: the mark, the wordmark, the merge glyph (white marks: true colour, readable on the slate)
  const mkW = 0.18;
  const mk = T.image("paul-twelve-hours/hacktron_white.svg", 900 / 961, { px: 600 });
  const wm = T.image("paul-twelve-hours/hacktron_wordmark_white.svg", WM.aspect, { px: 2600 });
  const x0 = -TW / 2 + 0.05;
  K.print(mk, mkW, [x0 + mkW / 2, 0, zf], [0, 0, 0], { parent: g, trueColour: true });
  K.print(wm, WM.w, [x0 + mkW + 0.045 + WM.w / 2, 0, zf], [0, 0, 0], { parent: g, trueColour: true });
  // Lucide git-merge: two branch nodes joining (cream strokes)
  const glyph = T.draw(256, 256, (c) => {
    c.strokeStyle = "#FFFCF6";
    c.lineCap = "round";
    c.lineJoin = "round";
    // cropped to the drawing (x, y 2..22 of Lucide's 24 box), so the print is all glyph
    c.scale(256 / 20, 256 / 20);
    c.translate(-2, -2);
    c.lineWidth = 2.6;
    c.beginPath();
    c.arc(18, 18, 3, 0, 6.283);
    c.stroke();
    c.beginPath();
    c.arc(6, 6, 3, 0, 6.283);
    c.stroke();
    c.stroke(new Path2D("M6 21V9a9 9 0 0 0 9 9"));
  });
  const gW = 0.36;
  K.print(glyph, gW, [TW / 2 - 0.05 - gW / 2, 0, zf], [0, 0, 0], { parent: g, trueColour: true });
  // the glint: thin cream lines along the front top and bottom edges
  const glintMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(C.cream), emissive: new THREE.Color(C.cream), emissiveIntensity: 0, roughness: 0.5 });
  const glints = [1, -1].map((s) => K.box([TW - 0.04, 0.012, 0.012], glintMat, [0, s * (HT.LH / 2 - 0.006), TD / 2 + 0.002], { r: 0.005, parent: g, shadow: false, seg: 2 }));
  const update = (p: { x: number; glint: number }) => {
    g.position.set(tower.x + p.x, PANEL_Y, tower.z);
    glintMat.emissiveIntensity = 1.3 * clamp01(p.glint);
    glints.forEach((m) => (m.visible = p.glint > 0.01));
  };
  return { group: g, update };
};

// ===================================================================================================================
// THE READING LENS (this cut's: a true magnifier. The glass shows the tower face under it at MAG, re-projected along
// the camera ray through the lens centre every frame, so the enlarged bars slide as the lens moves)
// ===================================================================================================================
const LENS = { R: 0.34, MAG: 2.2, Z: 1.2 };
const FACE = { X0: -TOWER.W / 2, X1: TOWER.W / 2, Y0: 1.9, Y1: 3.98, PPM: 1000, Z: TOWER.D / 2 + 0.03 };
const makeReader = (w: World) => {
  const { K, T, scene } = w;
  const R = LENS.R;
  const g = K.group(scene);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.05, 20, 72), K.clay(C.clay));
  g.add(ring);
  K.cyl(0.045, 0.05, 0.5, K.clay(C.clayWarm), [R * 1.24, -R * 1.24, 0], { rot: [0, 0, 45], parent: g, seg: 24 });
  // the face, painted once at FACE.PPM: panels, recesses, bars (the same geometry as the world's codeBars)
  const cw = Math.round((FACE.X1 - FACE.X0) * FACE.PPM);
  const ch = Math.round((FACE.Y1 - FACE.Y0) * FACE.PPM);
  const X = (x: number) => (x - FACE.X0) * FACE.PPM;
  const Y = (y: number) => (FACE.Y1 - y) * FACE.PPM;
  const capBase = layerY(TOWER.NL - 1) + TOWER.LH / 2 + 0.04;
  const paint = (c: CanvasRenderingContext2D, glow: boolean) => {
    c.fillStyle = glow ? "#000" : "#8E8A83";
    c.fillRect(0, 0, cw, ch);
    if (!glow) {
      // the cap
      c.fillStyle = C.clay;
      c.fillRect(0, Y(capBase + TOWER.CAP_H), cw, TOWER.CAP_H * FACE.PPM);
    }
    for (let i = 0; i < TOWER.NL; i++) {
      const yc = layerY(i);
      if (yc + 0.2 < FACE.Y0) continue;
      if (!glow) {
        const top = Y(yc + TOWER.LH / 2);
        const hh = TOWER.LH * FACE.PPM;
        const gr = c.createLinearGradient(0, top, 0, top + hh);
        const base = i % 2 === 1 ? C.clay : C.clayAlt;
        gr.addColorStop(0, "#F6F2EA");
        gr.addColorStop(0.12, base);
        gr.addColorStop(0.8, base);
        gr.addColorStop(1, "#C9C4BB");
        c.fillStyle = gr;
        c.beginPath();
        c.roundRect(-40, top, cw + 80, hh, 0.035 * FACE.PPM);
        c.fill();
      }
      codeRowOfLayer(i).forEach(([ind, len, o]) => {
        if (glow && !o) return;
        const x0 = -TOWER.W / 2 + 0.22 + ind * 0.1;
        const wd = len * 0.1 - 0.05;
        c.fillStyle = glow ? "#fff" : o ? C.orange : C.slate;
        c.beginPath();
        c.roundRect(X(x0), Y(yc + 0.0375), wd * FACE.PPM, 0.075 * FACE.PPM, 0.017 * FACE.PPM);
        c.fill();
      });
    }
  };
  const faceT = T.draw(cw, ch, (c) => paint(c, false));
  const glowT = T.draw(cw, ch, (c) => paint(c, true));
  const viewMat = new THREE.MeshStandardMaterial({ map: faceT.tex, emissive: new THREE.Color("#FF9A00"), emissiveMap: glowT.tex, emissiveIntensity: 0.6, roughness: 0.88 });
  // the flat painting renders ~20 % darker than the modelled face (no rims, no bounce): lift it to match
  viewMat.color.setScalar(1.25);
  const view = new THREE.Mesh(new THREE.CircleGeometry(R * 0.97, 96), viewMat);
  view.position.z = -0.005;
  g.add(view);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(R * 0.97, 96), new THREE.MeshStandardMaterial({ color: new THREE.Color("#F6F3EC"), transparent: true, opacity: 0.1, roughness: 0.15, depthWrite: false }));
  glass.position.z = 0.01;
  g.add(glass);
  [faceT.tex, glowT.tex].forEach((t: Any) => {
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  });
  // a floating lens throws a blotchy VSM shadow across the panel gaps: it casts none (as the world's lens)
  g.traverse((m: Any) => {
    m.castShadow = false;
    m.receiveShadow = false;
  });
  const update = (p: { pos: V3; rot: V3; show: boolean; cam: CamDef }) => {
    g.visible = p.show;
    g.position.set(...p.pos);
    g.rotation.set(p.rot[0] * D2R, p.rot[1] * D2R, p.rot[2] * D2R);
    // the view stays upright while the hand rolls the lens (a magnifier does not rotate what it shows)
    view.rotation.z = -p.rot[2] * D2R;
    // the face point behind the lens centre along the camera ray
    const [cx, cy, cz] = p.cam.pos;
    const t = (FACE.Z - cz) / (p.pos[2] - cz);
    const fx = cx + (p.pos[0] - cx) * t;
    const fy = cy + (p.pos[1] - cy) * t;
    // the face patch seen: radius R*0.97 / MAG (and the depth ratio, so the glass reads as a true 2.2x)
    const rv = (R * 0.97 * t) / LENS.MAG;
    const W2 = FACE.X1 - FACE.X0;
    const H2 = FACE.Y1 - FACE.Y0;
    [faceT.tex, glowT.tex].forEach((tx: Any) => {
      tx.repeat.set((2 * rv) / W2, (2 * rv) / H2);
      tx.offset.set((fx - rv - FACE.X0) / W2, (fy - rv - FACE.Y0) / H2);
    });
  };
  return { group: g, update };
};

// the lens path (world, on the plane z = LENS.Z): A -> C slows over layer 9's orange line, C -> E settles on layer 7
const LENS_A = new THREE.CatmullRomCurve3(
  ([
    [-0.66, 3.34],
    [-0.3, 3.16],
    [0.02, 2.95],
    [0.2, 2.84],
  ] as [number, number][]).map(([x, y]) => new THREE.Vector3(x, y, LENS.Z)),
  false,
  "centripetal",
);
const LENS_B = new THREE.CatmullRomCurve3(
  ([
    [0.2, 2.84],
    [0.21, 2.66],
    [-0.15, 2.42],
  ] as [number, number][]).map(([x, y]) => new THREE.Vector3(x, y, LENS.Z)),
  false,
  "centripetal",
);
// the exit: on "but" the lens bows out, down and to the right, accelerating off the frame's right edge
const LENS_X = new THREE.CatmullRomCurve3(
  ([
    [-0.15, 2.42],
    [0.55, 2.0],
    [1.9, 1.35],
    [3.4, 0.8],
  ] as [number, number][]).map(([x, y]) => new THREE.Vector3(x, y, LENS.Z)),
  false,
  "centripetal",
);
const lensAt = (f: number): { pos: V3; rot: V3; show: boolean } => {
  const x = clamp01((f - T_LENS.b1) / (T_LENS.x1 - T_LENS.b1));
  const b = ease01(T_LENS.a1, T_LENS.b1, f);
  const v = x > 0 ? LENS_X.getPointAt(x * x) : b > 0 ? LENS_B.getPointAt(b) : LENS_A.getPointAt(ease01(T_LENS.a0, T_LENS.a1, f));
  return {
    pos: [v.x, v.y, v.z],
    // the hand's roll; on the exit it tips a little further, the way a hand lowers a glass
    rot: [-3 + 0.6 * Math.sin(f / 31), 9 + 10 * x * x, -7 + 1.5 * Math.sin(f / 27) - 14 * x * x],
    show: x < 1,
  };
};

/** the HACKTRON panel's centre x (tower-relative): in from off the right edge to the tower's side, then into the slot */
const panelX = (f: number) => HT.X0 - (HT.X0 - HT.XW) * ease01(T_APP[0], T_APP[1], f) - HT.XW * ease01(T_INS[0], T_INS[1], f);

// ===================================================================================================================
// THE CONTRIBUTORS (as TheMonorepo's: clay person tokens and >_ terminals, each feeding a side panel below the slot)
// ===================================================================================================================
type Feeder = { at: [number, number]; terminal: boolean; face: "left" | "right"; layer: number; u: number; period: number; phase: number };
const FEEDERS: Feeder[] = [
  { at: [-1.6, 1.15], terminal: true, face: "left", layer: 2, u: 0.55, period: 34, phase: 3 },
  { at: [-2.0, 0.35], terminal: false, face: "left", layer: 7, u: 0.75, period: 38, phase: 21 },
  { at: [-2.25, -0.55], terminal: false, face: "left", layer: 5, u: 0.05, period: 36, phase: 11 },
  { at: [-1.35, -1.95], terminal: true, face: "left", layer: 3, u: -0.8, period: 33, phase: 27 },
  { at: [1.4, -2.0], terminal: false, face: "right", layer: 8, u: -0.8, period: 37, phase: 7 },
  { at: [2.25, -1.2], terminal: true, face: "right", layer: 6, u: -0.45, period: 35, phase: 30 },
  { at: [2.6, -0.6], terminal: true, face: "right", layer: 4, u: -0.25, period: 33, phase: 16 },
];
const TRAVEL = 18;
const makeFeeders = (w: World, tower: Monorepo) => {
  const { K, T, scene } = w;
  const screenT = T.draw(256, 160, (c) => {
    c.fillStyle = "#3A3835";
    c.fillRect(0, 0, 256, 160);
    c.fillStyle = C.cream;
    c.font = `700 70px monospace`;
    c.fillText(">_", 30, 100);
  });
  return FEEDERS.map((F) => {
    const [px, pz] = F.at;
    const yawToTower = Math.atan2(tower.x - px, tower.z - pz) / D2R;
    const tg = K.group(scene, [px, 0, pz], yawToTower);
    tg.scale.setScalar(1.35);
    if (F.terminal) {
      K.box([0.42, 0.06, 0.3], K.clay(C.clayWarm), [0, 0.03, 0.06], { r: 0.02, parent: tg });
      const scr = K.group(tg, [0, 0.06, -0.06]);
      scr.rotation.x = -14 * D2R;
      K.box([0.42, 0.3, 0.04], K.clay(C.clay), [0, 0.15, 0], { r: 0.02, parent: scr });
      K.print(screenT, 0.36, [0, 0.15, 0.021], [0, 0, 0], { parent: scr, h: 0.22 });
    } else {
      K.puck(0.2, 0.06, 0.02, K.clay(C.clayWarm, { mottle: false }), [0, 0, 0], { parent: tg });
      K.box([0.3, 0.2, 0.16], K.clay(C.stone), [0, 0.16, 0], { r: 0.07, parent: tg });
      K.sphere(0.085, K.clay(C.clay), [0, 0.35, 0], tg);
    }
    K.blob(px + 0.04, pz + 0.04, 0.6, 0.5, 0.45);
    const end = tower.facePoint(F.face, F.layer, F.u);
    const fwd: V3 = [Math.sin(yawToTower * D2R), 0, Math.cos(yawToTower * D2R)];
    const start: V3 = [px + fwd[0] * 0.3, F.terminal ? 0.34 : 0.3, pz + fwd[2] * 0.3];
    const th = makeThread(w, [start, mix3(start, end, 0.5), end], { r: 0.02, beads: 2, beadR: 0.075 });
    return { F, th };
  });
};

// ===================================================================================================================
// THE STAGE
// ===================================================================================================================
const SPEC: WorldSpec = {
  fog: { near: 12, far: 40 },
  light: { center: [0.3, 1.6, 0.3], span: 6 },
  build: (w) => {
    const T = makeMonorepo(w);
    const feeders = makeFeeders(w, T);
    const Hk = makeForeignPanel(w, T);
    const L = makeReader(w);
    const cap0 = T.cap.position.y;
    return (f, cam) => {
      T.update({ gapAt: GAP_AT, gapOpen: 0 });
      // the slot: the upper stack lifts (SLOT + OVER) and settles back by OVER onto the panel
      const lift = (SLOT + OVER) * ease01(T_GAP[0], T_GAP[1], f) - OVER * ease01(T_SETTLE[0], T_SETTLE[1], f);
      T.layers.forEach((Ly, i) => {
        if (i >= GAP_AT) Ly.g.position.y = layerY(i) + lift;
      });
      T.cap.position.y = cap0 + lift;
      Hk.update({ x: panelX(f), glint: Math.sin(Math.PI * clamp01((f - T_GLINT[0]) / (T_GLINT[1] - T_GLINT[0]))) });
      L.update({ ...lensAt(f), cam });
      feeders.forEach(({ F, th }) => {
        const ts: number[] = [];
        for (let n = -2; n < 8; n++) {
          const t = (f - (F.phase + n * F.period)) / TRAVEL;
          if (t >= 0 && t <= 1) ts.push(t);
        }
        th.update({ draw: 1, lit: 0.8, beads: ts.length ? ts : [-1] });
      });
    };
  },
};

// the camera: close on the upper panels (cap above) following the lens down -> one eased pull-back to the tower
const START: Orbit = { target: [-0.28, 2.74, 0.75], dist: 6.95, yaw: 10, pitch: 4, fov: 30 };
const TRACK = camTrack(START, [
  { from: -10, to: 80, key: { target: [0.35, 2.25, 0.75], dist: 7.5, yaw: 11 } },
  { from: 44, to: 148, key: { target: [0.25, 2.23, 0.75], dist: 11.5, yaw: 12, pitch: 5 } },
]);
const camOf = (f: number) => orbitCam(living(TRACK(f), f));

/** the lower tower sinks further into the low air across the caption bands (a soft band of the low-air tone over the
 *  3D render, under the world's own shafts, haze and grade), so its orange lines there keep out of the captions' way */
const LowBand: React.FC<{ amt: number }> = ({ amt }) => (
  <>
    <defs>
      <linearGradient id="rawLowBand" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3A3936" stopOpacity={0} />
        <stop offset="0.12" stopColor="#3A3936" stopOpacity={0.3} />
        <stop offset="0.4" stopColor="#3A3936" stopOpacity={0.62} />
        <stop offset="1" stopColor="#3A3936" stopOpacity={0.8} />
      </linearGradient>
    </defs>
    <rect x={0} y={1010} width={1080} height={910} fill="url(#rawLowBand)" opacity={amt} />
  </>
);

const ReadAndWrite: React.FC<z.infer<typeof schema>> = ({ debug, pick }) => {
  const cur = useCurrentFrame();
  // review stills: `pick` maps the render's frames onto chosen cut frames
  const f = pick.length ? pick[Math.min(cur, pick.length - 1)] : cur;
  const cam = camOf(f);
  return (
    <PaulStage
      spec={SPEC}
      cam={cam}
      frame={f}
      air={{ lowAir: 1 + 0.45 * ease01(60, 140, f) }}
      overlay={(P) => {
        const band = <LowBand amt={0.55 + 0.45 * ease01(60, 140, f)} />;
        if (!debug) return band;
        const lp = lensAt(f).pos;
        const ls = P(lp);
        const pc: V3 = [panelX(f), PANEL_Y, TOWER.D / 2];
        const lead = P([panelX(f) - TOWER.W / 2, PANEL_Y, TOWER.D / 2])[0];
        const face = P([TOWER.W / 2, PANEL_Y, TOWER.D / 2])[0];
        const pp = P(pc);
        const capPx = WM_CAP * screenScale(cam, pc);
        const lensPx = 2 * (LENS.R + 0.05) * screenScale(cam, lp);
        const capTop = P([0, 3.86 + SLOT, 0.83])[1];
        return (
          <>
            {band}
            <circle cx={ls[0]} cy={ls[1]} r={6} fill="red" />
            <circle cx={pp[0]} cy={pp[1]} r={6} fill="blue" />
            <text x={20} y={60} fontSize={34} fill="red">{`f${f} lens ${ls[0].toFixed(0)},${ls[1].toFixed(0)} d=${lensPx.toFixed(0)}px  panel y ${pp[1].toFixed(0)} caps ${capPx.toFixed(0)}px  capTop ${capTop.toFixed(0)}  lead ${lead.toFixed(0)} face ${face.toFixed(0)}`}</text>
          </>
        );
      }}
    />
  );
};

export default ReadAndWrite;
