// Kyle Harper, "Did disease help the first farmers replace hunter-gatherers?" (Dwarkesh map style).
// Clip-wide constants, written by the director so every module of this clip agrees. Additions only.
// Orange rule for this clip: ORANGE = the incoming farmers' side (their people, fields, villages, and the germs they
// carry; in the analogy cut, the Europeans). Cream = the foragers / hunter-gatherers and everything else.
export const FPS = 30000 / 1001; // the Premiere sequence is 29.97
export const FRAME_W = 1080;
export const FRAME_H = 1920;

export const SEA = "#1B2226";
export const LAND = "#3F3428"; // land, and the umber page of non-map cuts
export const LAND_RIM = "#6A5838";
export const INK = "#E9DDBF"; // cream
export const INK_DEEP = "#D3C5A2"; // cream, shaded side
export const ACCENT = "#FFB000"; // the farmers' side
export const ACCENT_DEEP = "#D98A0C";
export const DARK = "#17120D"; // casing / outline, deep brown
export const DEAD = "#8A7B62"; // a fallen forager, a dead line
export const INK_HI = 0.9; // cream in play
export const INK_LO = 0.5; // cream as context

// Caption bands (CRAFT.md Framing): nothing readable inside these y-ranges of 1920.
export const CAPTION_BANDS: [number, number][] = [
  [1080, 1250],
  [1360, 1460],
];
