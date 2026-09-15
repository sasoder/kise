import React from "react";
import {
  DOT_RADIUS,
  OP_READ,
  SQUIRCLE_RATIO,
  SQUIRCLE_SMOOTH,
  hash,
  iconShadow,
  smoothstep,
  squirclePath,
} from "./fieldShared";
import {
  CONTACT_SHADOW_OP,
  CONTACT_SHADOW_RX,
  CONTACT_SHADOW_RY,
  TILE_GRAD_BOTTOM,
  TILE_GRAD_TOP,
  TILE_SHADOW,
} from "./d1Shared";

// ---------------------------------------------------------------------------
// equifaxShared — what the three cuts of the Christina "nobody churns off
// Equifax" clip share. Cheeky Pint style (MEMORY.md): the kraft sheet, the
// white gradient squircle tile with its figure KNOCKED OUT so the paper shows
// through, the two-tone amber, the damped camera. Everything here is either a
// measurement of a real logo or a placement the three cuts must agree on.
//
// The clip's one object is a BRAND TILE. The clip's one event is a tile
// LEAKING DATA DOTS out of its bottom edge — a breach. A data dot is NOT
// d1Shared's `Coin`: a coin is r 11, has a radial highlight and a "$" knocked
// out of it and means money; a data dot is a plain solid disc of DOT_R and
// means one record. They are deliberately different objects in the same world.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// THE MARKS. Every `knock` is path data lifted from the SVG in the brief's
// logos/ folder and is KNOCKED OUT of the tile, so the kraft shows through the
// figure. `ink` is the optional second pass drawn back in tile-white INSIDE
// that knock — the "f" of Facebook, the "in" of LinkedIn, the "T" of T-Mobile,
// the lettering of Home Depot. Path data only: nothing here is an <image> and
// nothing is fetched at render time.
//
// `w` / `h` are the viewBox's own width and height, so a mark can be fitted
// without re-parsing its viewBox; `viewBox` still carries the origin, which is
// not 0 0 for LinkedIn (the mark is a crop of a wider file).
// ---------------------------------------------------------------------------
export type BrandName =
  | "EQUIFAX"
  | "TARGET"
  | "FACEBOOK"
  | "LINKEDIN"
  | "ADOBE"
  | "TMOBILE"
  | "HOMEDEPOT";

export const BRAND: Record<
  BrandName,
  { viewBox: string; w: number; h: number; knock: string; ink?: string }
> = {
  // EQUIFAX: the wordmark: three polygons and three paths from equifax.svg, every polygon rewritten as a path. The ACTOR of the clip.
  EQUIFAX: {
    viewBox: "0 0 187.475 36.993",
    w: 187.475,
    h: 36.993,
    knock:
      "M 29.825,5.877 L 31.01,0.311 L 6.414,0.311 L 3.154,15.62 L 0.388,27.948 L 25.676,27.948 L 26.96,22.083 L 12.934,22.083 L 14.218,16.117 L 26.071,16.117 L 27.355,10.55 L 15.501,10.55 L 16.489,5.877 L 29.825,5.877 Z M 96.599,3.392 L 93.932,15.62 L 91.265,27.948 L 101.34,27.948 L 106.773,3.392 L 96.599,3.392 Z M 131.468,8.263 L 132.653,3.392 L 110.625,3.392 L 105.291,27.948 L 115.466,27.948 L 117.737,17.409 L 127.714,17.409 L 128.109,15.62 L 128.702,12.836 L 118.824,12.836 L 119.812,8.263 L 131.468,8.263 Z M50.469,16.117h8.594c0.304-1.797,0.869-4.478,0.988-6.661 c0.137-2.555-0.865-4.436-3.062-5.667C53.841,2.033,49.203,2.127,45.728,2c-4.764-0.174-10.433,0.444-13.434,4.672 c-1.548,2.181-2.419,5.56-2.761,8.202c-0.423,3.224-2.04,8.634,0.884,11.282c2.174,1.973,7.038,2.629,9.866,2.59 c2.88-0.041,5.676-0.23,8.507-0.799l7.408,9.045h11.557L50.469,16.117L50.469,16.117z M49.185,16.316 c-0.945,4.286-2.232,7.892-7.211,7.853c-4.999-0.037-3.34-5.415-2.864-8.548c0.673-4.452,2.383-9.121,7.507-8.749 C51.804,7.25,49.973,12.752,49.185,16.316L49.185,16.316z M64.199,3.392h10.273L70.62,20.79 c-0.471,2.127,1.513,3.236,3.214,3.383c2.188,0.191,4.151-1.184,4.688-3.482l4.05-17.298h10.174l-4.05,18.392 c-1.734,4.795-5.751,6.678-10.186,7.148c-2.75,0.293-5.661,0.045-8.286-0.389l-9.087-10.936L64.199,3.392L64.199,3.392z M154.285,3.392h12.94l3.951,6.363l6.42-6.363h9.878l-12.939,11.432 l8.495,13.124h-12.644l-4.149-7.457l-7.111,7.457h-15.113l-0.593-5.369h-10.471l-3.654,5.369h-7.112L139.37,3.392h12.347 l2.371,19.882l8.198-7.555L154.285,3.392L154.285,3.392z M136.308,17.31l5.531-8.351l0.988,8.351H136.308L136.308,17.31z",
  },
  // TARGET: written as FILLS, not a stroke: the outer annulus (r 150 minus r 100, opposite windings so plain nonzero fill leaves the ring) and the centre disc r 50, centred (150, 150).
  TARGET: {
    viewBox: "0 0 300 300",
    w: 300,
    h: 300,
    knock:
      "M150 0 A150 150 0 1 1 150 300 A150 150 0 1 1 150 0 Z M150 50 A100 100 0 1 0 150 250 A100 100 0 1 0 150 50 Z M150 100 A50 50 0 1 1 150 200 A50 50 0 1 1 150 100 Z",
  },
  // FACEBOOK: the blue disc is the knock, the white "f" is drawn back in tile-white.
  FACEBOOK: {
    viewBox: "0 0 14222 14222",
    w: 14222,
    h: 14222,
    knock:
      "M14222 7111c0,-3927 -3184,-7111 -7111,-7111 -3927,0 -7111,3184 -7111,7111 0,3549 2600,6491 6000,7025l0 -4969 -1806 0 0 -2056 1806 0 0 -1567c0,-1782 1062,-2767 2686,-2767 778,0 1592,139 1592,139l0 1750 -897 0c-883,0 -1159,548 -1159,1111l0 1334 1972 0 -315 2056 -1657 0 0 4969c3400,-533 6000,-3475 6000,-7025z",
    ink:
      "M9879 9167l315 -2056 -1972 0 0 -1334c0,-562 275,-1111 1159,-1111l897 0 0 -1750c0,0 -814,-139 -1592,-139 -1624,0 -2686,984 -2686,2767l0 1567 -1806 0 0 2056 1806 0 0 4969c362,57 733,86 1111,86 378,0 749,-30 1111,-86l0 -4969 1657 0z",
  },
  // LINKEDIN: ONLY the blue rounded square (x 424-568) and the white "in" inside it. The black "Linked" lettering is dropped and the viewBox is cropped to the box so the mark sits square.
  LINKEDIN: {
    viewBox: "424.287 0 144.004 144",
    w: 144.004,
    h: 144,
    knock:
      "M557.632,0H434.916c-5.864,0-10.629,4.648-10.629,10.376V133.61c0,5.734,4.765,10.39,10.629,10.39 h122.716c5.874,0,10.659-4.655,10.659-10.39V10.376C568.291,4.648,563.506,0,557.632,0z",
    ink:
      "M445.638,53.985h21.359v68.722h-21.359V53.985z M456.322,19.825c6.828,0,12.377,5.549,12.377,12.38 c0,6.837-5.549,12.386-12.377,12.386c-6.846,0-12.387-5.549-12.387-12.386C443.936,25.375,449.477,19.825,456.322,19.825 M480.394,53.985h20.485v9.39h0.286c2.852-5.403,9.818-11.099,20.209-11.099 c21.628,0,25.621,14.234,25.621,32.736v37.694h-21.344v-33.42c0-7.969-0.146-18.22-11.099-18.22 c-11.113,0-12.819,8.681-12.819,17.644v33.996h-21.34V53.985z",
  },
  // ADOBE: the red "A" only (class st0, x 0-270.8); the grey wordmark is dropped.
  ADOBE: {
    viewBox: "0 0 270.8 239.3",
    w: 270.8,
    h: 239.3,
    knock:
      "M170.5,0l100.3,239.3V0H170.5z M0,0v239.3L100.3,0H0z M91.7,190.5h45.8l20.1,48.7h41.5L134.7,87.4L91.7,190.5z",
  },
  // TMOBILE: the magenta square is the knock, the white "T" is drawn back.
  TMOBILE: {
    viewBox: "0 0 52 52",
    w: 52,
    h: 52,
    knock:
      "M0 0h52v52H0z",
    ink:
      "M17.8312 31.94155h-7.42858v-7.42857h7.41547v7.42857zM10.40261 7.42857v12.62988h2.22726v-.36684c0-5.9481 3.3409-9.65583 9.65583-9.65583h.36685V36.776c0 3.70774-1.48048 5.20131-5.20131 5.20131h-1.11363v2.5941h19.31166v-2.5941h-1.11363c-3.70773 0-5.2013-1.48047-5.2013-5.2013V10.02267h.36683c6.31495 0 9.65584 3.70773 9.65584 9.65583v.36684h2.22726V7.42857Zm23.76619 24.51298h7.42857v-7.42857h-7.41547v7.42857z",
  },
  // HOMEDEPOT: the white background rect is dropped; the orange is the knock and the white lettering is drawn back. The letters that run past the orange square are tile-white on a tile-white ground, exactly as they are white-on-white in the original.
  HOMEDEPOT: {
    viewBox: "0 0 227 228",
    w: 227,
    h: 228,
    knock:
      "M.532.834H142.53c11.431 0 22.863-.024 34.27.023-3.161 3.208-6.394 6.393-9.577 9.602 1.258 1.33 2.589 2.566 3.849 3.873 2.9-1.996 6.179-3.588 9.744-3.85 3.208-.333 6.441.499 9.387 1.783 1.117.475 2.163 1.235 3.422 1.354 1.236-.071 2.163-1.164 2.591-2.258.356-.759.023-1.663-.57-2.21-2.757-2.78-5.538-5.513-8.271-8.294 13.166-.071 26.332 0 39.475-.023 0 12.833.023 25.69 0 38.547-2.709-2.661-5.348-5.371-8.034-8.032-.713-.738-1.876-1.118-2.851-.666-.642.309-1.26.808-1.545 1.497-.357 1.379.262 2.733.808 3.968 1.664 3.518 2.401 7.487 1.902 11.361-.333 2.638-1.284 5.228-2.71 7.486-.38.546-.736 1.116-1.069 1.688 1.378 1.187 2.543 2.613 3.945 3.778 3.137-3.232 6.369-6.393 9.554-9.602 0 21.46.023 42.921 0 64.381-.619.214-1.308.642-1.95.332-.855-.546-1.497-1.354-2.21-2.043-7.7-7.653-15.329-15.377-23.052-23.005-3.066 3.066-6.083 6.155-9.198 9.15 1.641 1.853 3.471 3.493 5.182 5.275 6.179 6.18 12.357 12.359 18.561 18.537.522.547 1.14 1.023 1.425 1.736.095.784-.451 1.449-.665 2.162-.309.832.357 1.83 1.236 1.853.784.144 1.45-.38 1.949-.902 2.899-2.924 5.822-5.823 8.722-8.723v107.539H119.287c2.757-2.756 5.514-5.49 8.271-8.247a15855.845 15855.845 0 0 1-28.115-28.114c-3.065 2.947-6.012 6.013-9.054 8.983-.642.666-1.355 1.307-1.663 2.21-.143.879.665 1.711 1.52 1.759.761-.095 1.402-.595 2.163-.761.665-.046 1.189.476 1.663.904 5.562 5.608 11.147 11.17 16.732 16.755 1.401 1.472 2.923 2.803 4.229 4.325.595.665.191 1.52-.142 2.186H50.559l15.185-15.186c.95-.903 1.925-1.948 2.067-3.327.214-1.592-1.401-3.185-2.994-2.852-1.331.261-2.423 1.307-3.802 1.307-.879-.071-1.545-.713-2.139-1.283-12.097-12.073-24.169-24.169-36.242-36.243-.808-.807-1.782-1.591-2.068-2.757-.047-1.377.927-2.495 1.284-3.754.451-1.592-1.046-3.328-2.663-3.208-1.116.071-2.114.712-2.874 1.497-5.229 5.3-10.552 10.528-15.781 15.828C.508 118.4.532 59.606.532.834 M.532 184.849c.95-.38 1.854-.975 2.9-.951 1.259.238 2.044 1.355 2.922 2.186 11.955 11.907 23.861 23.837 35.791 35.743.665.738 1.521 1.474 1.64 2.52-.048 1.021-.595 1.925-1.021 2.828-14.094-.024-28.162-.024-42.232-.024 0-14.093-.024-28.21 0-42.302",
    ink:
      "M163.776 13.881c.214-.237.594-.452.808-.095a49488.629 49488.629 0 0 1 49.67 49.669 11945.554 11945.554 0 0 0-17.42 17.444c-.761.713-1.688 1.307-2.733 1.378-1.45.12-2.9-1.188-2.781-2.662.048-1.449 1.283-2.566 1.307-4.04.048-.927-.665-1.615-1.259-2.258-12.287-12.262-24.55-24.548-36.837-36.836-.689-.665-1.449-1.497-2.495-1.425-1.545.023-2.709 1.449-4.277 1.283-.904.023-1.641-.69-2.092-1.426-.618-1.283-.048-2.828.88-3.778 5.751-5.752 11.502-11.503 17.229-17.254m23.861 4.824c.475-.879 1.378-1.687 2.447-1.545 1.188.096 2.044 1.069 2.828 1.854a8356.34 8356.34 0 0 0 14.26 14.283c.903.88 1.972 1.735 2.186 3.042.119 1.354-1.117 2.566-2.424 2.709-1.093.024-2.091-.57-3.041-1.093-2.021-1.188-4.302-2.139-6.703-2.02-1.236-.024-2.423.475-3.541.974-1.307-1.402-2.804-2.661-4.04-4.111.38-1.069.879-2.091.951-3.233.167-2.589-.879-5.061-2.187-7.224-.665-1.069-1.188-2.401-.736-3.636M82.902 31.301c2.568-2.709 5.277-5.252 7.843-7.938 2.448 2.376 4.824 4.777 7.225 7.177.784.761.071 2.044-.808 2.353-.737.095-1.379-.404-2.044-.642-2.566-1.259-5.751-1.401-8.317-.023-.666.285-1.213.855-1.926.974-.713-.57-1.307-1.283-1.973-1.901m-1.615 1.52c3.493 3.375 6.868 6.869 10.314 10.267 5.395 5.371 10.765 10.79 16.184 16.161a1152.46 1152.46 0 0 1-9.316 9.316c-.642.712-1.925 1.022-2.543.142-.76-.808.071-1.806.309-2.638.285-.618-.213-1.164-.618-1.591a7115.543 7115.543 0 0 1-18.632-18.633c-.57-.523-1.046-1.164-1.735-1.521-.95-.214-1.687.642-2.614.69-.713-.072-1.378-.784-1.283-1.522.047-.57.38-1.069.784-1.473 3.042-3.066 6.132-6.084 9.15-9.198m12.405 3.803c-.308-.784.238-1.734 1.07-1.853.618-.095 1.117.379 1.545.784 2.566 2.566 5.132 5.157 7.723 7.7.451.499 1.093.95 1.141 1.687.095.737-.618 1.45-1.378 1.378-.999 0-1.759-.784-2.662-1.117-1.331-.617-2.947-.665-4.254.048-.689-.689-1.379-1.402-2.092-2.044.31-1.046.595-2.162.333-3.256-.19-1.235-1.046-2.186-1.426-3.327m45.511 1.854c.642-.642 1.449-1.117 2.353-1.236 1.591-.237 3.255 1.307 2.947 2.923-.214 1.426-1.402 2.566-1.308 4.065.238 1.044 1.094 1.757 1.782 2.495 12.145 12.12 24.289 24.216 36.385 36.36.666.595 1.331 1.379 2.282 1.379 1.426 0 2.519-1.069 3.874-1.308 1.568-.26 3.113 1.284 2.922 2.853-.094 1.069-.736 1.996-1.472 2.732-6.109 6.084-12.193 12.216-18.3 18.3-.784.784-1.782 1.497-2.946 1.497-1.285.071-2.52-1.021-2.686-2.281-.167-1.664 1.378-2.9 1.33-4.564-.071-.784-.617-1.425-1.14-1.996-10.671-10.646-21.318-21.317-31.988-31.964 8.817 16.374 17.705 32.702 26.522 49.076.142.237.261.499.38.784-.641.593-1.259 1.235-1.877 1.877-17.658-8.697-35.292-17.492-52.926-26.213-2.78-1.378-5.537-2.994-8.674-3.374-1.046-.144-1.759.713-2.519 1.259-.785.618-1.831.998-2.804.689-1.165-.522-1.973-1.901-1.616-3.161.237-.855.831-1.568 1.449-2.187 5.704-5.679 11.384-11.382 17.088-17.039 8.887 4.349 17.799 8.603 26.712 12.953.285.213.593.427.855.712.143-.167.262-.333.404-.499l-.333.047c-4.681-8.912-9.6-17.705-14.283-26.617 5.894-5.846 11.717-11.716 17.587-17.562m-31.204 4.016c.428-.784 1.64-.879 2.21-.214 2.4 2.424 4.849 4.848 7.272 7.273a910.815 910.815 0 0 1-8.174 8.151c-.618-.713-1.451-1.283-1.926-2.115.784-1.331 1.616-2.686 1.83-4.254.404-2.163.048-4.444-.879-6.44-.262-.761-.832-1.64-.333-2.401m-39.902 3.565c.475-.499.998-1.022 1.687-1.188.69-.142 1.545.285 1.64 1.045.167.832-.451 1.522-.617 2.329-.096.642.427 1.094.807 1.522 6.346 6.344 12.667 12.69 19.013 19.011.428.405.879.904 1.497 1.046.76-.071 1.401-.57 2.139-.736.903-.096 1.734.879 1.449 1.734-.118.642-.617 1.118-1.045 1.569-3.09 3.09-6.18 6.179-9.269 9.245-.546.547-1.259 1.117-2.068.927-.451-.191-.831-.547-.998-.998-.237-1.046.88-1.902.618-2.948-.237-.403-.57-.713-.879-1.045-2.899-2.876-5.775-5.799-8.698-8.674a191.478 191.478 0 0 1-3.09 3.089c-.713-.689-1.426-1.379-2.091-2.115 1.045-1.022 2.068-2.067 3.114-3.09-2.568-2.518-5.111-5.086-7.653-7.629-.547-.522-1.022-1.092-1.664-1.472-1.164-.381-2.281 1.259-3.398.356-.904-.641-.618-1.926.119-2.591 3.113-3.161 6.273-6.25 9.387-9.387 M55.929 58.394c.714-.453 1.783-.167 2.115.641.333.974-.546 1.806-.57 2.757-.024.499.38.855.689 1.188 6.583 6.584 13.143 13.166 19.726 19.725 1.187 1.283 2.709-.927 3.992.024.832.666.547 1.972-.166 2.59-3.09 3.114-6.203 6.179-9.269 9.292-.499.476-.998 1.046-1.687 1.26-.761.214-1.688-.262-1.782-1.069-.143-.95.713-1.688.665-2.615-.12-.404-.38-.736-.665-1.045A6697.122 6697.122 0 0 1 50.32 72.486c-.593-.546-1.092-1.236-1.877-1.521-.855-.047-1.568.595-2.4.689-.713.024-1.331-.618-1.355-1.306-.071-.738.452-1.331.951-1.83 3.089-3.09 6.178-6.18 9.245-9.269.332-.309.641-.618 1.045-.855M38.747 75.386c1.426-1.379 2.804-2.805 4.23-4.207 2.496 2.425 4.943 4.943 7.439 7.391.428.475.95.903 1.187 1.521.286 1.165-1.044 2.448-2.209 1.925-1.165-.523-2.091-1.45-3.209-2.068-1.877-1.164-4.064-1.901-6.297-1.639-.642-.665-1.355-1.284-1.925-1.996.189-.381.499-.642.784-.927M28.385 85.747c2.662-2.614 5.276-5.252 7.914-7.89a4525.2 4525.2 0 0 0 15.019 15.02c2.757 2.732 5.443 5.514 8.223 8.199.785.879 1.83.143 2.686-.167.855-.38 1.854.381 1.83 1.283 0 .618-.357 1.141-.76 1.57-3.232 3.208-6.417 6.416-9.625 9.625-.452.451-1.023.902-1.688.855-.737.072-1.45-.641-1.379-1.355.048-.76.642-1.378.642-2.139.048-.642-.499-1.046-.879-1.474-7.581-7.533-15.091-15.137-22.696-22.648.238-.309.452-.594.713-.879m178.359-2.329a771.351 771.351 0 0 1 8.77 8.769c.926.88.261 2.638-.975 2.829-1.141.166-2.02-.737-2.899-1.331-2.353-1.617-5.134-3.137-8.08-2.638-.785-.713-1.545-1.45-2.187-2.281 1.83-1.759 3.589-3.566 5.371-5.348M25.961 88.242c.88.333 1.426 1.331 2.139 1.949-.38 2.757.926 5.347 2.471 7.51.452.69.998 1.331 1.283 2.115.31 1.046-.712 2.139-1.758 2.02-.594 0-.998-.499-1.378-.855-2.591-2.615-5.204-5.181-7.795-7.795 1.711-1.617 3.304-3.351 5.038-4.944m52.878 13.405c4.729-1.522 9.862-1.688 14.734-.69 8.271 1.759 15.59 6.607 21.437 12.619 5.727 5.799 10.29 13.072 11.835 21.175.855 4.444.665 9.102-.617 13.451-1.26 4.302-3.543 8.271-6.418 11.693-1.236-1.307-2.59-2.519-3.779-3.85 0-.642.404-1.189.524-1.806.641-2.091 0-4.444-1.593-5.966-11.739-11.763-23.527-23.527-35.268-35.291-1.069-1.093-2.423-1.972-3.968-2.091-1.26-.166-2.496.285-3.684.712-.476.262-.784-.331-1.093-.57-.951-1.021-1.997-1.948-2.947-2.994 0-.071-.024-.214-.024-.285 3.161-2.709 6.869-4.824 10.861-6.107m32.036-1.308c1.093.356 2.091.903 3.113 1.426 3.827 1.854 7.628 3.779 11.479 5.656.332.167.641.428.927.689 3.231 3.28 6.488 6.512 9.743 9.768a16.91 16.91 0 0 0 6.369 4.23c1.687.642 3.589.642 5.276.047.856-.285 1.783-.617 2.686-.332a2.665 2.665 0 0 1 1.639 2.234c-.071 1.307-.903 2.4-1.782 3.303a765.314 765.314 0 0 1-8.793 8.77c-.784.713-1.687 1.449-2.781 1.568-1.568.237-3.113-1.425-2.638-2.947.452-1.545 1.07-3.113.809-4.729-.381-2.71-1.926-5.11-3.637-7.177-6.44-6.464-12.904-12.905-19.368-19.393-.999-1.046-2.092-1.996-3.042-3.113m72.483 6.464c1.784-1.782 3.589-3.565 5.372-5.37.784.641 1.473 1.402 2.21 2.115-.309 2.376.5 4.728 1.735 6.725.641 1.141 1.568 2.115 2.139 3.303.309.571.095 1.212-.119 1.782a30.553 30.553 0 0 1 7.724 7.51c2.4 3.399 4.087 7.439 3.992 11.669.024 4.017-1.711 7.866-4.254 10.908-.689-.713-1.497-1.354-2.092-2.162.12-.88.547-1.735.333-2.614-.237-1.141-1.117-1.949-1.901-2.734-6.273-6.25-12.524-12.499-18.774-18.75-.618-.618-1.355-1.188-2.235-1.259-.831-.096-1.663.142-2.423.403-.737-.688-1.473-1.426-2.186-2.139 3.16-2.709 7.271-4.444 11.478-4.23 1.616-.047 3.185.333 4.753.689-1.901-1.972-3.922-3.826-5.752-5.846m-124.363 13.95c1.307-3.636 3.374-6.963 5.822-9.934 1.212 1.237 2.496 2.424 3.684 3.684.237.761-.38 1.474-.499 2.234-.618 2.044.19 4.278 1.688 5.751 11.549 11.574 23.123 23.124 34.697 34.697 1.117 1.213 2.471 2.353 4.182 2.615 1.521.238 3.019-.285 4.421-.808 1.283 1.283 2.567 2.543 3.85 3.826-2.805 2.448-6.061 4.373-9.53 5.728-5.229 2.019-11.075 2.352-16.565 1.141-8.342-1.831-15.685-6.845-21.555-12.953-5.418-5.679-9.792-12.643-11.336-20.415-1.045-5.156-.712-10.622 1.141-15.566m108.013 6.869c.286-3.612 1.878-7.058 4.255-9.768.688.713 1.426 1.426 2.138 2.139-.261.856-.666 1.759-.427 2.661.142.809.688 1.451 1.259 2.021 6.274 6.25 12.5 12.524 18.775 18.774.736.713 1.449 1.569 2.495 1.854.951.262 1.925-.072 2.851-.357.714.714 1.451 1.427 2.14 2.187-2.995 2.471-6.726 4.207-10.671 4.207-3.826.166-7.581-1.189-10.765-3.185-2.306-1.473-4.421-3.256-6.179-5.324.831 2.781.642 5.895-.666 8.509-1.283 2.566-3.279 4.658-5.252 6.678-.713-.713-1.45-1.451-2.187-2.163.619-.999 1.023-2.187.642-3.351-.451-1.189-1.426-2.044-2.281-2.947a1071.462 1071.462 0 0 0-5.324-5.347c-1.045-.975-2.163-2.092-3.66-2.187-.879-.094-1.663.357-2.4.785-.736-.713-1.449-1.45-2.186-2.162 2.851-2.876 6.107-5.847 10.29-6.37 3.422-.571 6.868.903 9.292 3.256-1.521-3.042-2.471-6.465-2.139-9.91m-125.267 8.294c.713-.689 1.64-1.212 2.638-1.283 1.64-.096 3.138 1.615 2.685 3.208-.356 1.212-1.235 2.281-1.283 3.589.095 1.14 1.046 1.948 1.807 2.709l36.598 36.598c.571.547 1.212 1.093 2.02 1.164 1.378 0 2.448-1.021 3.755-1.33 1.568-.309 3.137 1.117 3.066 2.685-.048 1.07-.642 2.044-1.379 2.804L73.23 204.479c-.808.784-1.806 1.473-2.97 1.473-1.426.048-2.757-1.306-2.639-2.757.144-1.425 1.331-2.566 1.356-4.04-.048-.879-.738-1.545-1.284-2.162-5.466-5.49-10.956-10.933-16.398-16.398-.214-.166-.499-.642-.808-.31-1.901 1.83-3.731 3.756-5.633 5.585-1.283-1.283-2.566-2.566-3.85-3.873a180.625 180.625 0 0 1 5.656-5.656c0-.096.025-.309.025-.405-5.158-5.061-10.22-10.195-15.353-15.304-.784-.737-1.522-1.663-2.614-1.925-1.497-.096-2.662 1.069-4.064 1.331-1.806.309-3.446-1.735-2.828-3.423.309-1.188 1.259-2.044 2.091-2.851 5.941-5.965 11.906-11.883 17.824-17.848m106.112 6.417c2.852 2.661 5.538 5.513 8.342 8.246 5.324 5.347 10.671 10.694 16.018 16.041.38.31.736.737 1.235.832 1.023.096 1.83-.903 2.853-.713.618.214 1.187.809 1.117 1.497 0 .927-.785 1.569-1.356 2.187-3.35 3.304-6.654 6.654-10.004 9.958-.737.808-2.116.404-2.567-.499-.665-1.117 1.141-2.306.191-3.327a8207.186 8207.186 0 0 1-20.653-20.653c-.499-.451-.926-1.021-1.521-1.331-1.022-.285-1.83.571-2.78.69-.737-.071-1.45-.713-1.403-1.474-.071-.832.547-1.472 1.069-2.019 3.162-3.138 6.323-6.298 9.459-9.435m-21.198 21.175c2.827-2.781 5.584-5.656 8.46-8.39 2.543 2.567 5.11 5.11 7.653 7.676.855.832-.048 2.092-.927 2.472-.618.071-1.189-.309-1.736-.546-2.185-1.071-4.705-1.593-7.105-.975-1.521.309-2.852 1.164-4.183 1.948-.713-.736-1.425-1.472-2.162-2.185m-11.551 11.573c3.281-3.327 6.608-6.583 9.887-9.887 5.323 5.253 10.575 10.6 15.923 15.852 4.088 4.064 8.128 8.176 12.239 12.216-3.184 3.279-6.463 6.464-9.649 9.719-.451.5-1.093.785-1.687 1.046-.594-.213-1.331-.427-1.521-1.092-.356-1.118.808-1.997.666-3.09-.476-.927-1.308-1.593-2.021-2.329l-17.325-17.326c-1.021-.95-1.877-2.09-3.089-2.803-1.212-.239-2.305 1.306-3.469.474-.998-.641-.713-2.067.046-2.78m23.053-5.893c-.38-.975.523-2.116 1.545-1.95.475.119.831.428 1.164.761 2.495 2.52 5.015 4.991 7.487 7.51.807.832 1.853 1.545 2.186 2.733-.309.523-.642 1.236-1.354 1.307-1.166.119-2.021-.808-3.067-1.189a5.104 5.104 0 0 0-4.586.025c-.76-.761-1.497-1.522-2.258-2.258.523-1.117.761-2.4.38-3.589-.285-1.212-1.093-2.21-1.497-3.35m15.281 6.202c.499-.76 1.711-.879 2.305-.166 2.567 2.591 5.182 5.157 7.724 7.771-2.923 2.852-5.727 5.846-8.722 8.627-.688-.737-1.426-1.45-2.139-2.187 2.543-3.136 2.9-7.676 1.189-11.288-.31-.856-.975-1.902-.357-2.757 M111.16 184.207c4.23-.356 8.437 1.164 11.93 3.47 2.733 1.83 5.276 3.945 7.224 6.583 2.33 3.113 3.755 6.916 3.78 10.837.07 4.468-1.688 8.983-4.872 12.143a88.187 88.187 0 0 1-2.163-2.162c.427-.807.926-1.663.784-2.614-.237-1.426-1.212-2.591-2.187-3.565l-16.041-16.042c-1.093-1.069-2.329-2.234-3.945-2.352-.879-.095-1.664.356-2.4.784-.69-.761-1.64-1.331-2.068-2.281 2.614-2.686 6.179-4.564 9.958-4.801z",
  },};

// ---------------------------------------------------------------------------
// SIZES. A company in the crowd is a square tile; Equifax is a wide wordmark
// tile, at rest in the crowd and a size up when it is the subject.
// ---------------------------------------------------------------------------
export const RING_TILE = 84; // the six square company tiles
export const EFX_REST = { w: 300, h: 96 }; // Equifax, one of the crowd
export const EFX_SPOT = { w: 340, h: 108 }; // Equifax, spotlighted at the centre
export const MARK_FRACTION = 0.62; // a square mark fills this much of the tile's shorter side
export const WORD_FRACTION = 0.8; // the wordmark fills this much of the tile's width

// A mark this wide is a WORDMARK and is fitted to the tile's width; anything
// squarer is fitted to the tile's shorter side. One rule, so a tile never has
// to be told which kind of mark it is carrying.
export const WORD_ASPECT = 2;

// ---------------------------------------------------------------------------
// THE PLACEMENTS the three cuts agree on. CENTER is where Equifax ends up and
// where every camera in the clip is pointed; the six companies resolve onto the
// vertices of one hexagon around it. i = 0 is at +x, so two tiles sit level
// with the centre tile and four sit above and below it at x +/- 130, y -/+ 225.
// ---------------------------------------------------------------------------
export const CENTER = { x: 540, y: 835 };
export const HEX_R = 260;
export const hexPos = (i: number) => {
  const a = (i * Math.PI) / 3;
  return { x: CENTER.x + HEX_R * Math.cos(a), y: CENTER.y - HEX_R * Math.sin(a) };
};

// Six companies, every one of them with a documented breach of its own. The
// order IS the index: RING_ORDER[i] sits at hexPos(i) when the crowd resolves.
export const RING_ORDER: Exclude<BrandName, "EQUIFAX">[] = [
  "TARGET",
  "FACEBOOK",
  "LINKEDIN",
  "ADOBE",
  "TMOBILE",
  "HOMEDEPOT",
];

// ---------------------------------------------------------------------------
// A BRAND TILE. The house material: a white squircle with a vertical gradient,
// the drop shadow, and the mark knocked out of it through a mask (white rect,
// black `knock`, white `ink`). `contact` is off by default — nothing in this
// clip stands on a ground, the tiles float in the sheet's own light.
// ---------------------------------------------------------------------------
export const BrandTile: React.FC<{
  x: number; // world px, the tile's CENTRE
  y: number;
  brand: BrandName;
  w: number;
  h: number;
  k: number; // camera zoom, for the shadow in screen px
  opacity?: number;
  contact?: boolean;
}> = ({ x, y, brand, w, h, k, opacity = OP_READ, contact = false }) => {
  const b = BRAND[brand];
  const [vx, vy] = b.viewBox.split(/\s+/).map(Number);
  const tile = squirclePath(w, h, SQUIRCLE_RATIO, SQUIRCLE_SMOOTH);
  // A wordmark is fitted to the tile's width; a square mark to its shorter side.
  const word = b.w / b.h > WORD_ASPECT;
  const s = word
    ? (w * WORD_FRACTION) / b.w
    : (Math.min(w, h) * MARK_FRACTION) / Math.max(b.w, b.h);
  const ox = (w - b.w * s) / 2 - vx * s;
  const oy = (h - b.h * s) / 2 - vy * s;
  const id = `bt-${brand}-${Math.round(w)}-${Math.round(x)}-${Math.round(y)}`;
  return (
    <g transform={`translate(${x - w / 2} ${y - h / 2})`} style={{ filter: TILE_SHADOW(k) }}>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
          <rect width={w} height={h} fill="#fff" />
          <g transform={`translate(${ox.toFixed(4)} ${oy.toFixed(4)}) scale(${s.toFixed(6)})`}>
            <path d={b.knock} fill="#000" />
            {b.ink ? <path d={b.ink} fill="#fff" /> : null}
          </g>
        </mask>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={TILE_GRAD_TOP} />
          <stop offset="100%" stopColor={TILE_GRAD_BOTTOM} />
        </linearGradient>
      </defs>
      {contact ? (
        <ellipse
          cx={w / 2}
          cy={h + 1}
          rx={w * CONTACT_SHADOW_RX}
          ry={CONTACT_SHADOW_RY}
          fill="#000"
          opacity={CONTACT_SHADOW_OP}
          style={{ filter: "blur(3px)" }}
        />
      ) : null}
      <path d={tile} fill={`url(#${id}-g)`} opacity={opacity} mask={`url(#${id})`} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE LEAK. A breach is a tile shedding records out of its bottom edge: plain
// solid dots, born on the edge, falling under gravity, fading out as they go.
//
// DOT_R is fieldShared's DOT_RADIUS — the same unit dot the whole house is
// built out of. A DataDot is NOT a Coin: no "$", no highlight, no amber unless
// the cut says so. A coin is money; a dot is a record.
// ---------------------------------------------------------------------------
export const DOT_R = DOT_RADIUS;

// `r` is optional and defaults to DOT_R: the canonical record is 5.5 and cut 1
// never passes anything else, but a cut whose leak swells wants the same object
// a size up rather than a second kind of dot.
export const DataDot: React.FC<{
  x: number;
  y: number;
  k: number;
  opacity: number;
  color: string;
  r?: number;
}> = ({ x, y, k, opacity, color, r = DOT_R }) => (
  <circle cx={x} cy={y} r={r} fill={color} opacity={opacity} style={{ filter: iconShadow(k) }} />
);

// Frames between two dots. A company's breach drips; Equifax, once it is the
// subject, pours; cut 3's swell is the same leak again at twice that.
export const LEAK_SLOW = 9;
export const LEAK_FAST = 4;
export const LEAK_HUGE = 2;

export const LEAK_FALL = 170; // world px a dot falls before it is gone
export const LEAK_LIFE = 44; // frames it takes to fall them
export const LEAK_DRIFT = 6; // sideways wander, world px
export const LEAK_FADE = 0.65; // the point in a dot's life it starts to go

export type LeakDot = { key: number; birth: number; x: number; y: number; opacity: number };

// A pure function of `frame`: the dots currently in the air under a tile whose
// bottom edge is at `y` and spans `x` +/- width/2. Dot i is born at
// `start + i * rate` jittered by its own hash, at a hashed x on that edge, and
// falls `fall` px over `life` frames on y = fall * t^2 — a real acceleration,
// so a leak reads as gravity and not as a conveyor. It drifts sideways on a
// hashed sine and fades from LEAK_FADE of its life to nothing.
//
// Each dot carries its `birth`, so a cut that changes a leak's rate or colour
// part way through (Equifax on its own name) can keep the dots that were
// already in the air as they were and only colour the new ones.
export const leakDots = ({
  frame,
  seed,
  start,
  rate,
  x,
  y,
  width,
  fall = LEAK_FALL,
  life = LEAK_LIFE,
}: {
  frame: number;
  seed: number;
  start: number;
  rate: number;
  x: number;
  y: number;
  width: number;
  fall?: number;
  life?: number;
}): LeakDot[] => {
  const out: LeakDot[] = [];
  if (frame < start) return out;
  // A dot's jitter is at most 0.4 of the gap, so two extra indices either side
  // of the nominal window is always enough.
  const first = Math.max(0, Math.floor((frame - life - start) / rate) - 2);
  const last = Math.floor((frame - start) / rate) + 2;
  for (let i = first; i <= last; i++) {
    const birth = start + i * rate + (hash(i, seed) * 2 - 1) * rate * 0.4;
    const t = (frame - birth) / life;
    if (t <= 0 || t >= 1) continue;
    out.push({
      key: i,
      birth,
      x:
        x +
        (hash(i, seed + 101) - 0.5) * width +
        LEAK_DRIFT * Math.sin(t * 3.2 + hash(i, seed + 202) * 6.28),
      y: y + fall * t * t,
      opacity: t < LEAK_FADE ? 1 : 1 - (t - LEAK_FADE) / (1 - LEAK_FADE),
    });
  }
  return out;
};

// ---------------------------------------------------------------------------
// THE JOIN. Cut 1 resolves here and cut 3 opens on it.
// ---------------------------------------------------------------------------
export const K_FINAL_1 = 1.28;
export const EFX_FINAL = CENTER;

// ===========================================================================
// V2 (2026-09-15). The user, on the first take: "the balls dropping from the
// company logo is way too abstract and doesn't feel motivated. Replace the dots
// with documents so it shows actual data."
//
// So the second take restates the clip's one event in two objects, added here
// and used identically by all three V2 cuts. Nothing above this line changes:
// the V1 components still import BRAND, BrandTile, DataDot and leakDots and
// still render byte-identically.
//
//   DATA IS A RECORD   — `RecordCard`, a personal file: the house tile
//                        material at card scale with a person-and-two-lines
//                        figure knocked out of it, so the paper shows through
//                        the way it does through every mark in this world.
//   A BREACH IS THE TILE BREAKING OPEN — `CrackedBrandTile`, the same
//                        BrandTile split down a jagged crack, the two halves
//                        prised apart at the foot, records spilling out of the
//                        break and heaping on the sheet below.
//
// Layouts are composed, never hashed: `heapSlots` is rows on a centred axis.
// The only hashing left is inside a heap — a card's rest angle and its ±3 px
// of slop — which is the difference between a pile and a stack of tiles.
// ===========================================================================

// ---------------------------------------------------------------------------
// A RECORD. Default 34 x 44 world px — a card, portrait, at about the ratio of
// an ID card. It has to read at two very different sizes: at 34 x 44 in a heap
// under a full-size tile, and at 12 x 16 under cut 2's 150 x 48 chart tag. Both
// are verified in the shared still before anything is animated.
//
// Every dimension below is a fraction of w or h, so the figure is the same
// drawing at any size; only the corner radius is capped in absolute px (3 at
// the default size, proportional under it, so a 12 px card is not a lozenge).
// ---------------------------------------------------------------------------
export const RECORD_W = 34;
export const RECORD_H = 44;
export const RECORD_RADIUS = 3; // world px at the default size
export const RECORD_RADIUS_FRACTION = 0.09; // of the card's width, under it

// The figure, in fractions of the card. HEAD/SHOULDER/LINE_* are exported so a
// cut can measure the glyph (cut 2 checks the person is still resolvable at
// 12 x 16 on a 270 px phone crop) without re-deriving them.
export const REC_HEAD_R = 0.14; // x w
export const REC_HEAD_CY = 0.3; // x h
// THE SHOULDERS ARE 0.42 w, NOT THE BRIEF'S 0.32. The head is 0.28 w across
// (r 0.14), so a 0.32 w bust is four per cent wider than the head it carries:
// rendered at both sizes it reads as a keyhole or a mushroom, not a person.
// 0.42 puts the shoulders half again as wide as the head, which is the ratio
// every ID-card glyph uses, and it is the one figure change in this file.
export const REC_SHOULDER_W = 0.42; // x w
export const REC_SHOULDER_TOP = 0.42; // x h
export const REC_SHOULDER_BOTTOM = 0.555; // x h
export const REC_LINE_STROKE = 0.06; // x h
export const REC_LINE_1 = { y: 0.68, len: 0.6 };
export const REC_LINE_2 = { y: 0.8, len: 0.42 };

// The person-and-lines figure as one path, in the card's own w x h space. It is
// KNOCKED OUT (drawn black into the card's mask), never stroked in ink: a
// record is made of the same material as everything else in this world.
export const recordFigure = (w: number, h: number): string => {
  const cx = w / 2;
  const r = REC_HEAD_R * w;
  const hy = REC_HEAD_CY * h;
  const sw = REC_SHOULDER_W * w;
  const sr = sw / 2;
  const sy = REC_SHOULDER_TOP * h;
  const sb = REC_SHOULDER_BOTTOM * h;
  const n = (v: number) => v.toFixed(3);
  // head: a full circle as two arcs. shoulders: a bust with a rounded top.
  const head =
    `M${n(cx - r)} ${n(hy)}A${n(r)} ${n(r)} 0 1 1 ${n(cx + r)} ${n(hy)}` +
    `A${n(r)} ${n(r)} 0 1 1 ${n(cx - r)} ${n(hy)}Z`;
  const bust =
    `M${n(cx - sr)} ${n(sb)}L${n(cx - sr)} ${n(sy + sr)}` +
    `A${n(sr)} ${n(sr)} 0 0 1 ${n(cx + sr)} ${n(sy + sr)}` +
    `L${n(cx + sr)} ${n(sb)}Z`;
  // the two lines, as rectangles with square ends (a stroke would need its own
  // paint server inside the mask; a rect is the same shape and one less node).
  const line = (spec: { y: number; len: number }) => {
    const t = REC_LINE_STROKE * h;
    const l = spec.len * w;
    return `M${n(cx - l / 2)} ${n(spec.y * h - t / 2)}h${n(l)}v${n(t)}h${n(-l)}Z`;
  };
  return `${head}${bust}${line(REC_LINE_1)}${line(REC_LINE_2)}`;
};

export const RecordCard: React.FC<{
  x: number; // world px, the card's CENTRE
  y: number;
  w?: number;
  h?: number;
  rot?: number; // degrees, about the centre
  k: number; // camera zoom, for the shadow
  opacity?: number;
}> = ({ x, y, w = RECORD_W, h = RECORD_H, rot = 0, k, opacity = 1 }) => {
  const r = Math.min(RECORD_RADIUS, w * RECORD_RADIUS_FRACTION);
  const id = `rc-${Math.round(w)}-${Math.round(x * 4)}-${Math.round(y * 4)}`;
  return (
    <g
      transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot.toFixed(2)}) translate(${(-w / 2).toFixed(2)} ${(-h / 2).toFixed(2)})`}
      style={{ filter: TILE_SHADOW(k) }}
    >
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
          <rect width={w} height={h} fill="#fff" />
          <path d={recordFigure(w, h)} fill="#000" />
        </mask>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={TILE_GRAD_TOP} />
          <stop offset="100%" stopColor={TILE_GRAD_BOTTOM} />
        </linearGradient>
      </defs>
      <rect
        width={w}
        height={h}
        rx={r}
        ry={r}
        fill={`url(#${id}-g)`}
        opacity={opacity}
        mask={`url(#${id})`}
      />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE CRACK. A jagged polyline from the tile's TOP edge to its BOTTOM edge,
// deterministic in `seed`: it starts at 0.56 w on the top and ends at 0.50 w on
// the bottom, so the break is off-centre at the top and the two halves are
// different sizes — a snapped tile, not a folded one.
//
// THE WANDER IS CLAMPED BY THE TILE'S OWN ASPECT. The brief's +/- 0.08 w is
// right for a square company tile (84 x 84: +/- 6.7 px over 14 px of rise) and
// wrong for cut 2's 150 x 48 tag, where it would be +/- 12 px of wander over 8
// px of rise — segments more horizontal than vertical, which reads as a torn
// zigzag lying across the tile rather than a crack running down it. So the
// amplitude is min(0.08 w, 0.55 h / segments): the brief's figure wherever the
// tile is square enough to carry it, and a crack that stays steep where it is
// not.
// ---------------------------------------------------------------------------
export const CRACK_SEGS = 6;
export const CRACK_TOP_X = 0.56;
export const CRACK_FOOT_X = 0.5;
export const CRACK_WANDER = 0.08; // x w, before the aspect clamp

export const crackAmp = (w: number, h: number) =>
  Math.min(CRACK_WANDER * w, (0.55 * h) / CRACK_SEGS);

export const crackPoints = (w: number, h: number, seed: number): { x: number; y: number }[] => {
  const amp = crackAmp(w, h);
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= CRACK_SEGS; i++) {
    const t = i / CRACK_SEGS;
    const base = (CRACK_TOP_X + (CRACK_FOOT_X - CRACK_TOP_X) * t) * w;
    // the ends are fixed; between them the crack alternates side, with a hashed
    // magnitude, so it zig-zags instead of drifting.
    const wob =
      i === 0 || i === CRACK_SEGS
        ? 0
        : (i % 2 === 0 ? 1 : -1) * (0.4 + 0.6 * hash(i, seed)) * amp;
    pts.push({ x: base + wob, y: t * h });
  }
  return pts;
};

export const crackPath = (w: number, h: number, seed: number): string => {
  const pts = crackPoints(w, h, seed);
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join("");
};

export const crackFoot = (w: number, h: number, seed: number) => {
  const pts = crackPoints(w, h, seed);
  return pts[pts.length - 1];
};

// The two clip regions, as closed polygons that run well outside the tile so
// the clip never cuts the tile's own outline. CRACK_OVERLAP is the half-pixel
// of overlap that keeps the two halves from showing an antialiasing seam while
// they are still closed; once they separate it is invisible.
export const CRACK_OVERLAP = 0.5;

const crackHalfPath = (w: number, h: number, seed: number, side: -1 | 1): string => {
  const pts = crackPoints(w, h, seed);
  const pad = Math.max(w, h);
  const o = side * CRACK_OVERLAP;
  const edge = side < 0 ? -pad : w + pad;
  const d = [`M${edge.toFixed(2)} ${(-pad).toFixed(2)}`];
  d.push(`L${(pts[0].x + o).toFixed(2)} ${(-pad).toFixed(2)}`);
  for (const p of pts) d.push(`L${(p.x + o).toFixed(2)} ${p.y.toFixed(2)}`);
  d.push(`L${(pts[pts.length - 1].x + o).toFixed(2)} ${(h + pad).toFixed(2)}`);
  d.push(`L${edge.toFixed(2)} ${(h + pad).toFixed(2)}`);
  d.push("Z");
  return d.join("");
};

// ---------------------------------------------------------------------------
// A BREACH, AS A PICTURE: THE TILE BREAKS OPEN. `open` 0 is the intact
// BrandTile — literally, it renders one path, so there is nothing to see at the
// join — and `open` 1 is the two halves prised apart, the kraft showing through
// the break.
//
// THE MOUTH IS AT THE FOOT. The brief gives the gap as CRACK_GAP 14 world px at
// the foot and 6 at the top, and separately describes the halves as hinged at
// their outer feet. Those are opposite pictures — a hinge at the foot splays
// the TOP — and the gap figures are the ones that matter, because in every V2
// cut the records come out of the crack's FOOT and fall: the break has to be
// widest where the data leaves it. So the halves are prised apart 7 px each at
// the foot and lean back towards each other at the top, which closes the break
// to 6 px there. The angle is solved from the two gaps rather than written down
// (the brief's 1.5 degrees is a 48 px tile's answer to this same sum):
//     sin(theta) = (CRACK_GAP - CRACK_GAP_TOP) / 2 / h
// so a tag and a full tile break the same way instead of by the same number.
//
// ONE SHADOW OVER BOTH HALVES, not one each: the drop shadow is a straight-down
// offset with an 8/k blur, so a shadow per half paints a soft dark band down
// the crack of a CLOSED tile. Over the pair it is the silhouette's own shadow,
// which is also what puts shade INSIDE the break once it opens.
// ---------------------------------------------------------------------------
export const CRACK_GAP = 14; // world px, the break at the foot, at open 1
export const CRACK_GAP_TOP = 6; // world px, the break at the top

export const CrackedBrandTile: React.FC<{
  x: number;
  y: number;
  brand: BrandName;
  w: number;
  h: number;
  k: number;
  open: number; // 0 intact, 1 broken open
  opacity?: number;
  seed?: number;
  contact?: boolean;
}> = ({ x, y, brand, w, h, k, open, opacity = OP_READ, seed = 11, contact = false }) => {
  const o = Math.max(0, Math.min(1, open));
  if (o <= 0.001)
    return (
      <BrandTile x={x} y={y} brand={brand} w={w} h={h} k={k} opacity={opacity} contact={contact} />
    );

  const b = BRAND[brand];
  const [vx, vy] = b.viewBox.split(/\s+/).map(Number);
  const tile = squirclePath(w, h, SQUIRCLE_RATIO, SQUIRCLE_SMOOTH);
  const word = b.w / b.h > WORD_ASPECT;
  const s = word
    ? (w * WORD_FRACTION) / b.w
    : (Math.min(w, h) * MARK_FRACTION) / Math.max(b.w, b.h);
  const ox = (w - b.w * s) / 2 - vx * s;
  const oy = (h - b.h * s) / 2 - vy * s;
  const id = `cbt-${brand}-${Math.round(w)}-${Math.round(x)}-${Math.round(y)}-${seed}`;

  const dx = (o * CRACK_GAP) / 2;
  const theta =
    (Math.asin(Math.min(1, (CRACK_GAP - CRACK_GAP_TOP) / 2 / h)) * 180) / Math.PI * o;

  const half = (side: -1 | 1) => (
    <g
      key={side}
      transform={
        side < 0
          ? `translate(${(-dx).toFixed(3)} 0) rotate(${theta.toFixed(3)} 0 ${h})`
          : `translate(${dx.toFixed(3)} 0) rotate(${(-theta).toFixed(3)} ${w} ${h})`
      }
    >
      <g clipPath={`url(#${id}-c${side < 0 ? "L" : "R"})`}>
        {contact ? (
          <ellipse
            cx={w / 2}
            cy={h + 1}
            rx={w * CONTACT_SHADOW_RX}
            ry={CONTACT_SHADOW_RY}
            fill="#000"
            opacity={CONTACT_SHADOW_OP}
            style={{ filter: "blur(3px)" }}
          />
        ) : null}
        <path d={tile} fill={`url(#${id}-g)`} opacity={opacity} mask={`url(#${id})`} />
      </g>
    </g>
  );

  return (
    <g transform={`translate(${x - w / 2} ${y - h / 2})`} style={{ filter: TILE_SHADOW(k) }}>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
          <rect width={w} height={h} fill="#fff" />
          <g transform={`translate(${ox.toFixed(4)} ${oy.toFixed(4)}) scale(${s.toFixed(6)})`}>
            <path d={b.knock} fill="#000" />
            {b.ink ? <path d={b.ink} fill="#fff" /> : null}
          </g>
        </mask>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={TILE_GRAD_TOP} />
          <stop offset="100%" stopColor={TILE_GRAD_BOTTOM} />
        </linearGradient>
        <clipPath id={`${id}-cL`} clipPathUnits="userSpaceOnUse">
          <path d={crackHalfPath(w, h, seed, -1)} />
        </clipPath>
        <clipPath id={`${id}-cR`} clipPathUnits="userSpaceOnUse">
          <path d={crackHalfPath(w, h, seed, 1)} />
        </clipPath>
      </defs>
      {half(-1)}
      {half(1)}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE HEAP. Where the records come to rest: rows built up from the sheet, wide
// at the bottom and narrowing, every row centred on the same axis — a composed
// layout, not a hashed scatter. Row r holds max(2, maxRow - r) cards; the row
// pitch is 0.62 h, so each row sits ON the one below with the cards overlapping
// the way a spilled stack does, and the column pitch is 0.78 w, so they overlap
// sideways too. `baseY` is the BOTTOM EDGE of row 0.
//
// The hashing is inside the pile and nowhere else: +/- 14 degrees of rest angle
// and +/- 3 px of slop per card (both scaled with the card, so a 12 px card
// does not wander a quarter of its own width).
// ---------------------------------------------------------------------------
export const HEAP_ROW_PITCH = 0.62; // x h
export const HEAP_COL_PITCH = 0.78; // x w
export const HEAP_MAX_ROW = 7; // cards in the bottom row, by default
export const HEAP_ROT = 14; // degrees, +/-
export const HEAP_SLOP = 3; // world px at the default card size

export type HeapSlot = { x: number; y: number; rot: number };

export const heapSlots = (
  n: number,
  cx: number,
  baseY: number,
  seed: number,
  opts: { w?: number; h?: number; maxRow?: number } = {},
): HeapSlot[] => {
  const w = opts.w ?? RECORD_W;
  const h = opts.h ?? RECORD_H;
  const maxRow = opts.maxRow ?? HEAP_MAX_ROW;
  const slop = (HEAP_SLOP * w) / RECORD_W;
  const out: HeapSlot[] = [];
  let r = 0;
  while (out.length < n) {
    const count = Math.max(2, maxRow - r);
    const y = baseY - h / 2 - r * HEAP_ROW_PITCH * h;
    for (let c = 0; c < count && out.length < n; c++) {
      const i = out.length;
      const x = cx + (c - (count - 1) / 2) * HEAP_COL_PITCH * w;
      out.push({
        x: x + (hash(i, seed) * 2 - 1) * slop,
        y: y + (hash(i, seed + 31) * 2 - 1) * slop * 0.5,
        rot: (hash(i, seed + 61) * 2 - 1) * HEAP_ROT,
      });
    }
    r++;
  }
  return out;
};

// ---------------------------------------------------------------------------
// THE SPILL. Records leaving the break and falling into the heap. A pure
// function of `frame`, like `leakDots` — nothing here is stateful and nothing
// is random at render time.
//
// Card i is born at start + i * rate, jittered by up to 0.6 of the gap on its
// own hash, and flies for `flight` frames: x on `flow` (eased out of the break,
// eased into the slot), y on a REAL GRAVITY PARABOLA — the card is pushed out
// of the break with `peak` world px of lift in it, reaches that apex in the
// first sixth of its flight and then accelerates downward for the rest of it.
//
// IT HAS TO ACCELERATE OR IT IS A CONVEYOR. Written the obvious way — a linear
// fall with a small -4 p t (1 - t) bow on it — the quadratic term is 16 px
// against 134 px of linear travel, so a stream of records born at a fixed rate
// comes out evenly spaced and stays evenly spaced: rendered and looked at, it
// read as a queue of cards on a belt, not as paper falling out of a hole. So
// the parabola is solved from the apex instead:
//     y(t) = y0 - v0 t + G t^2,  G = D + v0,  v0 = 2p + 2 sqrt(p^2 + p D)
// which is the unique upward-then-falling quadratic that peaks `peak` px above
// the break and passes through the slot at t = 1.
//
// THE LAST SIXTH IS AN ARREST. A card at the bottom of that parabola is moving
// about 14 world px a frame and the slot is a dead stop, which is a step in the
// one place the scan exists to protect. So over the last SPILL_ARREST of the
// flight the fall is blended into the slot on a smoothstep, which is zero-sloped
// at t = 1: a card hitting a pile of paper, decelerating into it, rather than a
// card switching off. The first five sixths are pure gravity.
//
// THE TUMBLE LANDS WHERE THE HEAP SAYS. The brief writes the spin as "from 0 to
// rot + 180 * hash", which would leave a card resting at an angle the heap did
// not choose — up to a half turn from it, which for a card with a head at one
// end is upside down. So the spin is written as the same half turn, taken as a
// lobe that is zero at both ends: the card tumbles up to 180 degrees in flight
// and arrives on its slot's own angle.
//
// On arrival, the 4-frame back(0.75) settle, written as a zero-sloped lobe
// (sin^2) rather than a kink: the card overshoots a tenth of its height into
// the pile and comes back up onto its slot.
// ---------------------------------------------------------------------------
export const SPILL_RATE_SLOW = 5; // frames between records: a ring company
export const SPILL_RATE_FAST = 2; // Equifax
export const SPILL_FLIGHT = 26; // frames in the air
export const SPILL_PEAK = 8; // world px of lift on the arc, at most
export const SPILL_SETTLE = 4; // frames of back(0.75) on arrival
export const SPILL_TUMBLE = 180; // degrees, at most
export const SPILL_ARREST = 0.16; // the last sixth of the flight: into the pile
export const HEAP_SMALL = 12;
export const HEAP_BIG = 44;

// `flow` — the house travel ease: eases in over the first `a`, runs flat,
// eases out over the last `a`. Zero velocity at both ends.
export const SPILL_FLOW_A = 0.28;
export const spillFlow = (u: number, a: number = SPILL_FLOW_A) => {
  const x = Math.max(0, Math.min(1, u));
  const area = 1 - a;
  if (x < a) {
    const g = x / a;
    return (a * (g * g * g - (g * g * g * g) / 2)) / area;
  }
  if (x <= 1 - a) return (a * 0.5 + (x - a)) / area;
  const g = (1 - x) / a;
  return (area - a * (g * g * g - (g * g * g * g) / 2)) / area;
};

export type SpillCard = { key: number; x: number; y: number; rot: number; resting: boolean };

export const spillRecords = ({
  frame,
  start,
  rate,
  from,
  slots,
  seed,
  flight = SPILL_FLIGHT,
  peak = SPILL_PEAK,
  settle = SPILL_SETTLE,
  h = RECORD_H,
}: {
  frame: number;
  start: number;
  rate: number;
  from: { x: number; y: number };
  slots: HeapSlot[];
  seed: number;
  flight?: number;
  peak?: number;
  settle?: number;
  h?: number;
}): SpillCard[] => {
  const out: SpillCard[] = [];
  for (let i = 0; i < slots.length; i++) {
    const born = start + i * rate + hash(i, seed) * 0.6 * rate;
    if (frame < born) continue;
    const s = slots[i];
    const t = (frame - born) / flight;
    if (t >= 1) {
      const u = Math.max(0, Math.min(1, (frame - (born + flight)) / settle));
      const lobe = Math.sin(Math.PI * u) ** 2;
      out.push({
        key: i,
        x: s.x,
        y: s.y + 0.1 * h * lobe,
        rot: s.rot + 3 * lobe * (hash(i, seed + 91) * 2 - 1),
        resting: true,
      });
      continue;
    }
    const e = spillFlow(t);
    const spin = SPILL_TUMBLE * hash(i, seed + 17) * Math.sin(Math.PI * t);
    // the gravity arc, normalised so q(0) = 0 and q(1) = 1
    const D = Math.max(1, s.y - from.y);
    const v0 = 2 * peak + 2 * Math.sqrt(peak * peak + peak * D);
    const G = D + v0;
    const qg = (-v0 * t + G * t * t) / D;
    const b = smoothstep((t - (1 - SPILL_ARREST)) / SPILL_ARREST);
    const q = qg * (1 - b) + b;
    out.push({
      key: i,
      x: from.x + (s.x - from.x) * e,
      y: from.y + D * q,
      rot: s.rot * t + spin * (hash(i, seed + 43) < 0.5 ? -1 : 1),
      resting: false,
    });
  }
  return out;
};
