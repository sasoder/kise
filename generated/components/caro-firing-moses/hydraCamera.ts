// ---------------------------------------------------------------------------
// hydraCamera: the one continuous camera over the merged Hydra cut (caro-firing-moses, 366 f). Pure data + maths
// (no React), so a bounds checker can import it. Keys are (frame, cx, cy, k): the world point (cx, cy) sits at the
// frame centre (540, 960) at zoom k. Each channel runs through its keys on a monotone cubic (Fritsch-Carlson): C1,
// no overshoot, and it only comes to rest where a channel turns round, so the camera never parks between beats.
// ---------------------------------------------------------------------------

export type CamKey = [number, number, number, number]; // frame, cx, cy, k

// The fan spans world x ~134-916; at k 1.12 the right-hand titles (to x 914) and the leftmost head both stay in
// frame only for cx ~575-589, so the glide right toward the parks and power heads is short and drops a little.
// world: the hydra as built in firingShared (HYDRA_DY 160): top head tips y ~490, lowest heads y ~1000, body top 1104.
export const CAM_KEYS: CamKey[] = [
  [0, 460, 1000, 1.34], // close on the body as the first necks rise
  [12, 505, 935, 1.15],
  [24, 528, 880, 1.02], // the fan whole by "heads"
  [34, 512, 872, 1.05],
  [60, 572, 866, 1.08], // drifting across with the count-off ripple ("12")
  [82, 540, 864, 1.03], // "at the same time": a touch back for the flare
  [100, 470, 760, 1.1], // push toward the left head on "City"
  [118, 490, 752, 1.12],
  [130, 580, 744, 1.12], // glide right to the parks head on "chairman", there as its title types
  [156, 582, 756, 1.12],
  [178, 584, 800, 1.12], // on to (and down to) the power head on the second "chairman"
  [198, 580, 806, 1.1],
  [216, 540, 860, 1.0], // ease back out to the whole hydra on "and so on"
  [238, 520, 830, 0.95], // open out on "Some of these positions"
  [258, 470, 800, 0.98], // toward the Mayor's hand as it lands
  [285, 556, 800, 1.0], // across to the Governor's
  [312, 542, 812, 1.04], // slow push in toward the necks ("no single person")
  [333, 536, 830, 1.07], // tighter on the snip (as tight as the two hand labels, each over its own hand, allow)
  [344, 541, 822, 1.06],
  [358, 532, 816, 1.0], // pull back to the whole hydra with both hands on "simultaneously"
  [365, 529, 818, 0.99], // slow living drift to the end
];

const monotone = (xs: number[], ys: number[]) => {
  const nn = xs.length;
  const d: number[] = [];
  for (let i = 0; i < nn - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m: number[] = new Array(nn).fill(0);
  m[0] = d[0];
  m[nn - 1] = d[nn - 2];
  for (let i = 1; i < nn - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < nn - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[nn - 1]) return ys[nn - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1]
    );
  };
};

const F = CAM_KEYS.map((q) => q[0]);
const cxF = monotone(F, CAM_KEYS.map((q) => q[1]));
const cyF = monotone(F, CAM_KEYS.map((q) => q[2]));
// zoom interpolates in log space (an even push)
const lkF = monotone(F, CAM_KEYS.map((q) => Math.log(q[3])));

export const hydraCam = (h: number) => ({ cx: cxF(h), cy: cyF(h), k: Math.exp(lkF(h)) });

/** world -> screen for the camera at frame h */
export const toScreen = (h: number, x: number, y: number): [number, number] => {
  const { cx, cy, k } = hydraCam(h);
  return [540 + (x - cx) * k, 960 + (y - cy) * k];
};

export const camTransform = (h: number) => {
  const { cx, cy, k } = hydraCam(h);
  return `translate(540 960) scale(${k}) translate(${-cx} ${-cy})`;
};
