// ===================================================================================================================
// raceState — THE RACE RULER's master state for paul-twelve-hours. S5 (MonthsAhead) owns it; S6 (TwelveHoursAhead)
// opens on S5's end layout and S7 (LeadNotRealistic) returns to it. Import, never copy the numbers.
//
//   RACE.cam.start / RACE.cam.moves   S5's keyed camera (camTrack); raceTrack(f) = the Orbit of S5 frame f (no living)
//   RACE.end                          S5's last frame (f107): camera Orbit (before living), living frame, the props
//   RACE.spec                         fog and light of the ruler stage (all three cuts)
//   makeFlipPlate(w, o)               the gap plate that FLIPS between labels (a thin slab turning about its long
//                                     axis; the hidden face swaps its label while it faces away): S5 8 -> 12 -> 6,
//                                     S6 may flip "6 MONTHS?" -> "12 HOURS" with the same plate.
// To open on S5's end frame: cam = orbitCam(living(RACE.end.cam, RACE.end.livingFrame)); props from RACE.end.
// ===================================================================================================================
import { C, D2R, FONT, camTrack, clamp01, lobe, mkCanvas, screenScale, type Any, type CamDef, type Orbit, type V3, type World } from "./paulWorld";
import { RULER } from "./paulWorldSets";

/** the camera keys of S5: a side three-quarter from the near-left (the month numbers read upright, the gap runs
 *  across the frame). One long pull-back (two overlapping lobes) from close on the US token, framing the gap at 8,
 *  then at 12; then a push onto the 0..6 stretch that is still creeping at the last frame (S6 continues it). */
const CAM_START: Orbit = { target: [-0.45, 0.25, 0.0], dist: 12.8, yaw: -42, pitch: 14, fov: 26 };
const CAM_MOVES = [
  // the reveal: back and round along the ruler until US and China at 8 stand in the keep-in box (keyed from f-12, so
  // it is already moving at f0)
  { from: -12, to: 40, key: { target: [-0.04, -0.45, -1.42] as V3, dist: 20.6, yaw: -58, pitch: 20 } },
  // "ahead of China": on back to the 0..12 frame BEFORE China slides back, so its retreat reads on screen (overlaps
  // the reveal, so the pull-back never stops)
  { from: 36, to: 60, key: { target: [-0.17, -0.94, -2.28] as V3, dist: 28.4 } },
  // a slow creep while the frame holds the debate
  { from: 58, to: 86, key: { dist: 27.7 } },
  // on "six": a push onto the 0..6 stretch, then a slow creep on in that is still moving at f107 (S6 continues it)
  { from: 74, to: 100, key: { target: [0.02, -0.2, -0.99] as V3, dist: 16.4 } },
  { from: 98, to: 150, key: { dist: 15.6 } },
];
export const raceTrack = camTrack(CAM_START, CAM_MOVES);
const END_F = 107;

export const RACE = {
  fps: 24000 / 1001,
  cam: { start: CAM_START, moves: CAM_MOVES },
  spec: {
    fog: { near: 22, far: 54 },
    light: { center: [0, 0.6, -2.5] as V3, span: 7, keyDir: [-0.45, 1.0, -0.15] as V3 },
  },
  /** S5's last frame */
  end: {
    frame: END_F,
    cam: raceTrack(END_F),
    /** the frame S5 passes to living() at its last frame (S6: living(o, RACE.end.livingFrame + f)) */
    livingFrame: END_F,
    us: { month: 0, stackCards: 5, flagYawOff: -18, waveOff: 20 },
    cn: { month: 6, flagYawOff: -18, waveOff: 0 },
    ghosts: [8, 12],
    bracket: { from: 0, to: 6, y: 0.36 },
    plate: { capH: 0.17, stem: 0.04, tilt: 12, minPx: 48.5, flip: 2, frac: 0.41, labels: [["8", "MONTHS?"], ["12", "MONTHS?"], ["6", "MONTHS?"]] as [string, string][] },
  },
};

/** the flip plate on a short stem standing on the gap bracket's middle: two lines, the number large over "MONTHS?"
 *  (narrow enough to stand between the two tokens' poles at 6 months). labels = [number, unit] pairs.
 *  `flip` counts half-turns (0 = labels[0] facing, 1 = labels[1], 2 = labels[2] ...); fractional values are mid-turn;
 *  the face turned away swaps its label at each whole half-turn, unseen. Kept legible from the camera passed to
 *  update (unit caps >= minPx; the plate grows about its seat on the stem, never into the bracket).
 *  `rise` 0..1: the stem grows out of the bracket (drawn by its tip), the plate slides up it while fading in (a label
 *  panel's entrance, CRAFT.md). The plate casts no shadow (a label, not a volume of the race). */
export const PLATE_CAPS = 3.36; // plate height in unit-line caps (0.32 pad, number 1.35, gap 0.37, unit 1, 0.32 pad)
export const makeFlipPlate = (w: World, o: { labels: [string, string][]; capH?: number; stem?: number; tilt?: number; depth?: number; minPx?: number }) => {
  const { K, T, scene } = w;
  const capH = o.capH ?? 0.17;
  const stemH = o.stem ?? 0.07;
  const tilt = o.tilt ?? 8;
  const d = o.depth ?? 0.07;
  const minPx = o.minPx ?? 48;
  // the face texture: u = unit-line font px; number line NUM u; caps 0.711 em
  const u = 150;
  const NUM = 1.35;
  const cap = 0.711 * u;
  const meas = mkCanvas(8, 8).getContext("2d") as Any;
  const TR = 0.015; // tracking (em)
  const widthOf = (s: string, px: number) => {
    meas.font = `700 ${px}px "${FONT}"`;
    meas.letterSpacing = `${TR * px}px`;
    return meas.measureText(s).width;
  };
  const Hc = Math.round(cap * PLATE_CAPS);
  const Wc = Math.round(Math.max(...o.labels.map(([n, un]) => Math.max(widthOf(n, NUM * u), widthOf(un, u)))) + 0.3 * u);
  const texs = o.labels.map(([n, un]) =>
    T.draw(Wc, Hc, (c) => {
      c.clearRect(0, 0, Wc, Hc);
      c.fillStyle = C.ink;
      c.textAlign = "center";
      c.textBaseline = "alphabetic";
      const ls = (px: number) => ((c as Any).letterSpacing = `${TR * px}px`);
      c.font = `700 ${NUM * u}px "${FONT}"`;
      ls(NUM * u);
      const top = 0.32 * cap;
      c.fillText(n, Wc / 2 + (TR / 2) * NUM * u, top + NUM * cap);
      c.font = `700 ${u}px "${FONT}"`;
      ls(u);
      c.fillText(un, Wc / 2 + (TR / 2) * u, top + NUM * cap + 0.37 * cap + cap);
    }),
  );
  const ph = capH * PLATE_CAPS;
  const pw = (ph * Wc) / Hc;
  const root = K.group(scene);
  const yawG = K.group(root);
  const stem = K.box([0.05, 1, 0.05], K.clay(C.cream, { mottle: false }), [0, 0.5, 0], { r: 0.02, parent: yawG });
  const lift = K.group(yawG);
  const pivot = K.group(lift);
  const slabMat = K.clay(C.clay).clone();
  const slab = K.box([pw + 0.03, ph, d], slabMat, [0, 0, 0], { r: 0.035, parent: pivot, shadow: false });
  slab.renderOrder = 2;
  // front faces (labels 0, 2, 4 ...) and back faces (labels 1, 3 ...), all prebuilt; one of each shown at a time
  const faces = texs.map((t, i) => {
    const back = i % 2 === 1;
    const m = K.print(t, pw, [0, 0, back ? -d / 2 - 0.002 : d / 2 + 0.002], back ? [180, 0, 0] : [0, 0, 0], { parent: pivot, h: ph });
    m.renderOrder = 3;
    return m;
  });
  const st = { x: RULER.LANE_LINE, y: 0.42, z: 0, yaw: 0, flip: 0, rise: 1, scale: 1 };
  const update = (p: { at?: V3; cam?: CamDef; yaw?: number; flip?: number; rise?: number }) => {
    if (p.at) [st.x, st.y, st.z] = [p.at[0], p.at[1], p.at[2]];
    if (p.yaw !== undefined) st.yaw = p.yaw;
    if (p.flip !== undefined) st.flip = p.flip;
    if (p.rise !== undefined) st.rise = p.rise;
    if (p.cam) {
      const ppm = screenScale(p.cam, [st.x, st.y + stemH + ph / 2, st.z]);
      st.scale = Math.max(1, minPx / (capH * ppm));
    }
    const s = st.scale;
    const r = clamp01(st.rise);
    root.visible = r > 0.001;
    root.position.set(st.x, st.y, st.z);
    yawG.rotation.y = st.yaw * D2R;
    // the stem grows from the bracket: the unit box spans 0..sh (scaled about its own centre, then seated)
    const sh = Math.max(0.001, stemH * lobe(clamp01(r / 0.5)));
    stem.scale.set(1, sh + 0.02, 1);
    stem.position.y = (sh + 0.02) / 2 - 0.02;
    // the plate slides up onto the stem while fading in
    const a = lobe(clamp01((r - 0.15) / 0.85));
    lift.scale.setScalar(s);
    lift.position.set(0, stemH + (ph * s) / 2 - 0.2 * (1 - a), 0);
    const op = clamp01(a * 1.15);
    lift.visible = op > 0.01;
    const fade = op < 0.999;
    if (slabMat.transparent !== fade) {
      slabMat.transparent = fade;
      slabMat.needsUpdate = true;
    }
    slabMat.opacity = op;
    // flip: whole half-turns about the plate's long (x) axis, top tipping toward the camera
    const fl = Math.max(0, st.flip);
    const k = Math.floor(fl + 1e-6);
    pivot.rotation.x = -tilt * D2R + fl * Math.PI;
    // at half-turn k the face toward the camera carries labels[k]; the face turned away carries labels[k + 1] (the
    // next one), swapped while unseen
    const front = k % 2 === 0 ? k : k + 1;
    const back = k % 2 === 1 ? k : k + 1;
    faces.forEach((m: Any, i: number) => {
      m.visible = i === front || i === back;
      m.material.opacity = op;
    });
  };
  update({});
  return { root, update, width: pw, height: ph, stemH, scale: () => st.scale };
};
