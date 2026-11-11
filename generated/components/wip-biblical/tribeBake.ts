// The tribe's cut-outs: numbers from scripts/clips/wip-biblical/bake-tribe.py (public/wip-biblical/tr_<name>.png and
// tr_<name>_sil.png). All from one real photograph, "Vieux conteur breton, auditoire attentif" (postcard, E.L.D., 1910s, PD).
// srcH = the print's height in the postcard's px (top of the figure to its straight hand-cut bottom), so every print keeps the
// photograph's one scale; mouthFx / mouthFy = the storyteller's mouth (in his beard, facing left) as fractions of his PNG.
export type TribeBakeFigure = { name: string; aspect: number; srcH: number };
const fig = (name: string, aspect: number, srcH: number): TribeBakeFigure => ({ name, aspect, srcH });

export const TRIBE_BAKE = {
  storyteller: { ...fig("storyteller", 0.7308, 524), mouthFx: 0.2913, mouthFy: 0.2462 },
  listeners: {
    coif_girl: fig("coif_girl", 0.7487, 388), // in profile, facing right
    hat_boy: fig("hat_boy", 0.5777, 408), // in profile, facing right
    curly_child: fig("curly_child", 1.0278, 140), // looking up and left
    smiling_boy: fig("smiling_boy", 0.7975, 159), // three-quarter, towards the camera
    front_girl: fig("front_girl", 0.6518, 355), // facing the camera
    standing_girl: fig("standing_girl", 0.726, 278), // looking down and left
  },
};
