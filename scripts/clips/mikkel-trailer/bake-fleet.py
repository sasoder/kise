#!/usr/bin/env python3
"""NewNormalFleet (mikkel-trailer, cut 02): the fleet's airship cut-outs, greyscale + alpha -> public/mikkel-trailer/fleet_*.png.

Each piece is keyed off its sky with bake-photos.py's smooth-background key, then cleaned where the key cannot see the
hull's edge (a sun flare over the nose, the mooring mast and ground balloon under it), and finished with a clean scissor
outline (the mask smoothed, specks and spurs removed, 1 px of AA), so every piece has the same cut edge as cut 12's
sceye_airship.png. The fleet also uses that cut-12 piece as is.

  threequarter  fleet_threequarter_side04.jpg (Sceye, August flight, low over the airfield): three-quarter from below,
                nose LEFT, the sun flare on the nose's lower left masked off along the hull's own curve.
  profile       fleet_profile_side01.jpg (Sceye, "HAPS over rural country"): true side profile, nose RIGHT.
  glow          fleet_glow_016a.jpg (StratoCat, flight of 2026-08-09): backlit, seen at a diagonal from below, nose
                up-right (~33 degrees); the far, light ones.
  below         fleet_below_016c.jpg (Sceye press, "HAPS-4"): from straight below at dusk, nose UP, tail fins down.
  noseup        fleet_noseup_000b.jpg (Sceye press, "HAPS" over the hangar): nose-up hover, keyed with GrabCut (thin
                cloud in the sky defeats the smooth key).

  uv run --with numpy --with pillow --with scipy --with opencv-python-headless python3 scripts/clips/mikkel-trailer/bake-fleet.py
"""
import importlib.util

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ni

spec = importlib.util.spec_from_file_location("bp", "scripts/clips/mikkel-trailer/bake-photos.py")
bp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bp)

A = "assets-src/mikkel-trailer/"
P = "public/mikkel-trailer/"


def scissor(alpha, open_r=3, sigma=2.0, keep=1):
    """A clean cut outline: opening (spurs, mooring lines), smoothing (jaggies), the largest blob(s), holes filled."""
    m = alpha > 0.5
    if open_r > 0:
        yy, xx = np.mgrid[-open_r : open_r + 1, -open_r : open_r + 1]
        m = ni.binary_opening(np.pad(m, open_r + 2), structure=xx * xx + yy * yy <= open_r * open_r)[open_r + 2 : -open_r - 2, open_r + 2 : -open_r - 2]
    m = ni.gaussian_filter(m.astype(np.float32), sigma) > 0.5
    lab, n = ni.label(m)
    sizes = ni.sum(m, lab, range(1, n + 1))
    order = np.argsort(sizes)[::-1][:keep]
    m = ni.binary_fill_holes(np.isin(lab, order + 1))
    return ni.gaussian_filter(m.astype(np.float32), 0.7)


def poly_mask(shape, pts):
    im = Image.new("L", (shape[1], shape[0]), 0)
    ImageDraw.Draw(im).polygon([tuple(p) for p in pts], fill=255)
    return np.asarray(im) > 127


def decon(a, g, alpha):
    """Edge pixels take the grey of the nearest solid pixel (no sky fringe)."""
    solid = alpha > 0.97
    _, (iy, ix) = ni.distance_transform_edt(~solid, return_indices=True)
    return np.where(solid, g, g[iy, ix])


# -- threequarter -------------------------------------------------------------------------------------------------------
def threequarter():
    crop = (150, 230, 1190, 645)
    a, g, alpha = bp.key(A + "fleet_threequarter_side04.jpg", None, 22, 45, crop, 1, 0, False, 2400)
    ox, oy = crop[0], crop[1]
    # the hull's lower-left edge under the sun flare (source px, read off a 2x zoom): everything left of / below it goes
    curve = [(195, 230), (200, 290), (212, 345), (240, 385), (285, 425), (340, 462), (420, 500), (500, 523), (560, 535)]
    cut = [(x - ox, y - oy) for x, y in curve] + [(560 - ox, 2000), (-50, 2000), (-50, 230 - oy)]
    alpha = alpha * ~poly_mask(alpha.shape, cut)
    # the ground balloon and the light pole under the lower fin
    H, W = alpha.shape
    yy, xx = np.mgrid[0:H, 0:W]
    alpha[(yy + oy > 600) & (xx + ox < 862)] = 0
    alpha[(yy + oy > 606) & (xx + ox > 966)] = 0
    alpha = scissor(alpha, open_r=2, sigma=1.5)
    bp.save_rgba(P + "fleet_threequarter.png", decon(a, g, alpha), alpha)


# -- profile ------------------------------------------------------------------------------------------------------------
def profile():
    crop = (40, 300, 790, 640)
    a, g, alpha = bp.key(A + "fleet_profile_side01.jpg", None, 22, 45, crop, 1, 0, False, 2400)
    # a pale cloud touching the nose's underside joins the key: everything beyond the nose's own curve (source px) goes
    beyond = [(726, 250), (726, 395), (712, 430), (690, 452), (640, 486), (590, 511), (560, 525), (560, 700), (800, 700), (800, 250)]
    alpha = alpha * ~poly_mask(alpha.shape, [(x - crop[0], y - crop[1]) for x, y in beyond])
    alpha = scissor(alpha, open_r=2, sigma=1.5)
    bp.save_rgba(P + "fleet_profile.png", decon(a, g, alpha), alpha)


# -- glow -----------------------------------------------------------------------------------------------------------------
def glow():
    a, g, alpha = bp.key(A + "fleet_glow_016a.jpg", None, 18, 40, (250, 250, 900, 650), 1, 0, False, 2400)
    alpha = scissor(alpha, open_r=2, sigma=1.2)
    bp.save_rgba(P + "fleet_glow.png", decon(a, g, alpha), alpha)


# -- below ----------------------------------------------------------------------------------------------------------------
def below():
    a, g, alpha = bp.key(A + "fleet_below_016c.jpg", None, 14, 30, (3000, 1000, 4200, 3000), 1, 0, False, 2400)
    alpha = scissor(alpha, open_r=3, sigma=2.0)
    bp.save_rgba(P + "fleet_below.png", decon(a, g, alpha), alpha)


# -- noseup (GrabCut) -------------------------------------------------------------------------------------------------------
def noseup():
    import cv2

    crop = (1780, 60, 2560, 2260)
    im = Image.open(A + "fleet_noseup_000b.jpg").convert("RGB").crop(crop)
    a = np.asarray(im).astype(np.float32)
    bgr = cv2.cvtColor(np.asarray(im), cv2.COLOR_RGB2BGR)
    H, W = bgr.shape[:2]
    # seed from the smooth key: sure sky far from the hull, probable inside
    _, _, k = bp.key(A + "fleet_noseup_000b.jpg", None, 18, 40, crop, 1, 0, False, 4000)
    mask = np.full((H, W), cv2.GC_PR_BGD, np.uint8)
    hull = k > 0.5
    mask[ni.binary_dilation(hull, iterations=25) == 0] = cv2.GC_BGD
    mask[hull] = cv2.GC_PR_FGD
    # the hull's spine (the middle third of the bounding columns of the brightest long run) as sure foreground
    ys, xs = np.where(hull)
    cx = np.median(xs)
    mask[(np.abs(np.arange(W)[None, :] - cx) < 60) & (np.arange(H)[:, None] > ys.min() + 80) & (np.arange(H)[:, None] < ys.max() - 200)] = cv2.GC_FGD
    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)
    cv2.grabCut(bgr, mask, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
    alpha = ((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD)).astype(np.float32)
    # The hull is seen square from below, so it is mirror-symmetric about its long axis; the sky-blue chrome of its right
    # flank defeats the key there, so the outline is the LEFT half's (clean, dark sky against bright chrome) mirrored
    # onto the right. The axis comes from the lower body, where both edges are clean.
    m = alpha > 0.5
    rows = [y for y in range(int(H * 0.55), int(H * 0.75)) if m[y].any()]
    cx = float(np.median([(np.where(m[y])[0].min() + np.where(m[y])[0].max()) / 2 for y in rows]))
    xs_ = np.arange(W)
    mx = np.clip(np.round(2 * cx - xs_).astype(int), 0, W - 1)
    alpha = np.where(xs_[None, :] <= cx, alpha, alpha[:, mx])
    print("noseup axis x", cx)
    alpha = scissor(alpha, open_r=4, sigma=2.5)
    g = bp.grey(a)
    bp.save_rgba(P + "fleet_noseup.png", decon(a, g, alpha), alpha)


if __name__ == "__main__":
    import sys

    todo = sys.argv[1:] or ["threequarter", "profile", "glow", "below", "noseup"]
    for t in todo:
        globals()[t]()
