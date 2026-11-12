// The tribe's cut-outs (rev 3, Nov 12: cavemen): numbers from scripts/clips/wip-biblical/bake-cavemen-16.py
// (public/wip-biblical/tr_<name>.png and tr_<name>_sil.png). All from the wood engravings of Louis Figuier, "Primitive Man"
// (New York: Putnam, 1876; drawings by Emile Bayard; PD), sources in the clip's animation_source/assets_raw/cavemen/SOURCES.txt.
// srcH = the print's height in plate px (top of the figure to its straight hand-cut bottom); the world heights are set per
// seat in tribeShared. mouthFx / mouthFy = the storyteller's mouth (the front of his beard, facing left) as fractions of his PNG.
export type TribeBakeFigure = { name: string; aspect: number; srcH: number };
const fig = (name: string, aspect: number, srcH: number): TribeBakeFigure => ({ name, aspect, srcH });

export const TRIBE_BAKE = {
  // frontispiece: the bearded father in skins, arm flung back against the rock (mirrored: he faces left), cut at the thighs
  storyteller: { ...fig("teller", 1.1435, 1164), mouthFx: 0.2592, mouthFy: 0.183 },
  listeners: {
    mother: fig("mother", 1.054, 852), // frontispiece: suckling her baby, bent towards the right
    child: fig("child", 0.5286, 910), // frontispiece: seated, his back to us, looking up and right
    crouching_boy: fig("crouching_boy", 1.3167, 540), // frontispiece: bust, crouched over his work, facing left
    seated_woman: fig("seated_woman", 1.1333, 600), // Fig. 39: bust, looking straight out
    carver: fig("carver", 1.381, 580), // Fig. 68: bust, crouched over his carving, facing right
    reclining_man: fig("reclining_man", 1.3322, 1232), // Fig. 68: sitting back, knee up, facing left over his work
  },
};
