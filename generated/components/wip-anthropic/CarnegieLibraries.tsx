// ---------------------------------------------------------------------------
// CarnegieLibraries (wip-anthropic, cut 0). Works in Progress style (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx).
// Opaque 1080x1920, 24 fps, 75 frames.
//
// CHECK LINE: "Carnegie's fortune became real buildings, stamped all across America." With no sound: this man's money put
// libraries everywhere in the US.
//
// THE LINE: "When Andrew Carnegie got rich, America got thousands of libraries."
// WORD -> FRAME: When 0 · Andrew 3 · Carnegie 6 · got 14 · rich 18 · America 27 · got 35 · thousands 42 · of 51 · libraries 59
// DURATION: the slot 0.000 -> 3.125 s = 3.125 s x 24 = 75 frames (f0..f74).
//
// THE MOTION: one pull-back from f0, already moving, off a b&w cut-out of Carnegie. His chin holds its screen height while
// he shrinks into the lower left, so his face never enters a caption band and the printed indigo USA opens above and behind
// him, all in frame by "America". Real library stamps deal out from behind his coat and press onto the map in a wave from
// Pennsylvania west; the rate peaks on "thousands", the last lands by "libraries". Two red postmarks cancel the end.
// f65-74: camera creep only.
// Contact frames: first stamp (Pittsburgh) f27; the wave f28-59, each stamp's contact is its distance from Pittsburgh, the
// big ones 2 later and printed in front, the small tucking in behind; postmarks f56, f63.
// SPOT INK: red = postmarked, this one counts. Indigo = the printed map.
//
// SOURCES: animation_source/assets_raw/SOURCES.txt, all Commons, public domain except Wyandotte (CC BY-SA 2.0). Carnegie:
// Frances Benjamin Johnston, April 1905. Thirteen libraries, each in Wikipedia's list of Carnegie libraries for its state:
// Athens OH, Benton Harbor MI, Fargo ND, Greenville SC, Meridian MS, Montgomery AL, Pittsburgh PA, Riverside CA, San Diego CA,
// Sandusky OH, Sumter SC, Tuskegee AL, Wyandotte MI. Only Pittsburgh sits at its real place and is named; the rest are an
// unlabelled scatter. Outline: US Census via us-atlas, lower 48, Albers, simplified. Bake: scripts/clips/wip-anthropic/bake-carnegie.py.
// ---------------------------------------------------------------------------
import React from "react";
import { Img, random, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CaptionBandsDebug,
  INDIGO,
  InkPrint,
  PaperGround,
  Postmark,
  PrintPhoto,
  RED,
  Stamp,
  WipCam,
  WipFilmLife,
  WipPlane,
  depthScale,
  depthTransform,
  inkPress,
  runWipCamera,
  slide,
  stampPress,
} from "../kits/works-in-progress/wipShared";

export const FPS = 24;
export const DURATION = 75;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

// -- the bust ---------------------------------------------------------------------
// Finish baked into the PNG (bake-carnegie.py), border and contact shadow included, with a 40 world px margin round the print.
const BUST = "wip-anthropic/carnegie_bust_print.png";
const BUST_ASPECT = 0.7164;
const BUST_MARGIN = 40;
const BUST_W = 1032; // world px: at the last frame his head (0.2374 of the print's width) is 250 px wide; at f0 about 70% of the frame
const BUST_H = BUST_W / BUST_ASPECT;
const CHIN_FX = 0.398; // the beard's bottom, as fractions of the print
const CHIN_FY = 0.378;
const CHEST_FX = 0.5; // the chest: stamps start behind it, hidden
const CHEST_FY = 0.56;
const BUST_D = 1; // on the focus plane with the map and stamps; the paper's own depth gives the parallax
const CHIN_WX = 540;
const CHIN_WY = 1070;
const CHIN_SCREEN_Y = 1070; // held on every frame: the band starts at 1080
const CHIN_X_F0 = 552;
const CHIN_X_END = 165;

// -- the camera: only k is keyed; x and y are derived from k, so the chin keeps its height on the whole path ----------
const zoomAt = runWipCamera(
  [
    { f: -10, x: 540, y: 960, k: 3.35 },
    { f: 27, x: 540, y: 960, k: 1.09 },
    { f: 82, x: 540, y: 960, k: 1.0, ease: "linear" },
  ],
  DURATION,
);
const KC_F0 = depthScale(zoomAt(0).k, BUST_D);
const KC_END = depthScale(zoomAt(DURATION - 1).k, BUST_D);
const camAt = (frame: number): WipCam => {
  const k = zoomAt(frame).k;
  const kc = depthScale(k, BUST_D);
  const u = Math.max(0, (kc - KC_END) / (KC_F0 - KC_END));
  const xs = CHIN_X_END + (CHIN_X_F0 - CHIN_X_END) * u ** 1.6;
  const xd = CHIN_WX - (xs - 540) / kc;
  const yd = CHIN_WY - (CHIN_SCREEN_Y - 960) / kc;
  return { k, x: 540 + (xd - 540) * BUST_D, y: 960 + (yd - 960) * BUST_D, x0: 540, y0: 960 };
};
const END = depthTransform(camAt(DURATION - 1), 1);
/** The focus plane's world point that sits at this screen point on the last frame: the layout is written in final-frame px. */
const wx = (sx: number) => (sx - END.tx) / END.k;
const wy = (sy: number) => (sy - END.ty) / END.k;
const wl = (l: number) => l / END.k;

// -- the map (viewBox 2000 x 1265): on the last frame x 10..1070, y 205..875 ------------------------------------------
const MAP_S = 0.53;
const MAP_X = 10;
const MAP_Y = 205;
const mx = (m: number) => MAP_X + m * MAP_S;
const my = (m: number) => MAP_Y + m * MAP_S;
const MAP = "M101 23L106 16L104 14L107 13L125 30L142 38L151 38L153 43L157 43L157 48L159 46L158 43L162 42L160 45L161 47L164 45L164 49L162 49L164 56L161 56L156 62L154 62L156 57L139 75L148 76L148 74L141 74L148 66L156 64L164 57L164 53L166 56L166 63L164 63L164 68L158 84L155 87L153 83L155 79L152 80L151 82L154 87L150 90L148 82L150 79L147 82L146 86L151 91L158 83L161 86L166 83L165 72L168 71L166 68L174 55L177 55L175 42L172 43L173 50L170 43L171 40L176 39L173 31L169 31L170 28L168 28L172 26L176 30L176 25L179 24L177 21L179 17L176 15L174 18L173 16L174 14L172 13L171 5L174 3L277 31L409 61L542 85L655 101L822 117L992 123L1049 123L1049 105L1055 105L1059 109L1064 134L1069 137L1092 140L1093 146L1104 144L1108 140L1119 140L1131 143L1128 147L1135 148L1140 158L1143 157L1143 152L1150 151L1154 157L1161 158L1161 162L1166 163L1166 166L1177 163L1188 155L1192 162L1213 160L1222 165L1234 163L1219 173L1201 180L1190 188L1171 210L1153 226L1152 227L1157 232L1182 223L1192 216L1196 220L1190 234L1196 231L1197 229L1207 235L1220 229L1228 221L1240 219L1249 212L1255 210L1272 191L1285 185L1291 185L1294 188L1286 189L1287 191L1278 199L1272 210L1271 221L1282 210L1278 217L1284 212L1293 213L1301 217L1310 230L1321 228L1326 232L1329 229L1332 231L1331 226L1333 225L1336 230L1350 218L1371 215L1381 210L1388 209L1386 213L1388 223L1395 224L1400 221L1402 224L1409 219L1417 217L1419 231L1416 232L1415 234L1423 236L1421 238L1429 242L1432 240L1430 236L1438 236L1442 240L1441 243L1421 243L1412 247L1402 242L1400 253L1390 246L1373 243L1368 250L1361 251L1361 253L1355 252L1348 253L1346 261L1339 266L1339 271L1335 268L1340 257L1337 260L1332 259L1331 266L1327 269L1324 261L1323 267L1320 270L1307 297L1307 304L1300 307L1296 318L1295 325L1299 326L1309 311L1314 308L1316 309L1320 294L1324 292L1325 287L1328 287L1327 297L1315 324L1314 342L1310 351L1310 367L1305 389L1306 400L1312 411L1312 434L1326 463L1332 466L1340 464L1353 454L1366 426L1366 402L1363 390L1351 366L1354 358L1350 346L1357 330L1356 314L1361 310L1362 302L1364 302L1365 299L1369 300L1377 286L1375 304L1378 308L1380 296L1378 308L1380 308L1384 299L1383 282L1388 278L1397 275L1391 271L1389 267L1394 260L1392 258L1399 257L1400 255L1411 260L1419 260L1423 266L1445 270L1450 274L1455 286L1450 284L1449 286L1457 300L1457 319L1451 324L1451 333L1441 339L1440 350L1442 353L1450 356L1456 349L1457 341L1458 343L1460 341L1458 339L1473 330L1480 333L1484 339L1498 380L1497 398L1492 403L1490 400L1493 396L1487 397L1488 401L1485 404L1485 411L1480 415L1479 426L1470 441L1470 446L1474 446L1490 453L1493 449L1507 457L1523 448L1532 448L1546 432L1577 414L1615 382L1617 375L1623 369L1620 362L1616 360L1616 356L1613 356L1612 347L1635 337L1655 335L1665 339L1669 336L1684 333L1692 328L1700 317L1706 316L1707 310L1704 302L1701 301L1706 297L1697 293L1697 284L1709 273L1724 247L1734 237L1849 208L1850 198L1848 197L1852 192L1858 194L1861 188L1867 192L1866 184L1867 182L1873 183L1868 178L1870 173L1876 164L1875 162L1878 156L1878 154L1876 153L1876 144L1874 142L1874 135L1878 130L1876 116L1891 74L1897 74L1899 82L1905 84L1914 76L1920 74L1921 70L1927 70L1942 78L1959 131L1961 143L1973 142L1976 147L1973 148L1978 153L1977 158L1984 164L1984 160L1989 160L1998 170L2000 174L1994 187L1992 188L1991 182L1988 185L1990 187L1984 192L1987 194L1985 197L1982 194L1980 197L1978 194L1977 201L1972 203L1972 207L1969 205L1967 206L1968 213L1961 214L1958 211L1961 208L1957 207L1957 210L1956 207L1954 210L1957 215L1956 223L1958 228L1956 229L1954 223L1952 222L1952 217L1950 214L1946 216L1946 207L1939 212L1942 215L1940 228L1943 229L1943 234L1939 235L1936 242L1936 238L1933 240L1933 237L1931 238L1930 245L1928 243L1920 254L1917 251L1915 255L1910 258L1910 265L1906 267L1906 276L1902 279L1899 303L1902 310L1909 310L1908 314L1901 318L1903 320L1899 326L1901 328L1899 328L1900 332L1904 329L1910 332L1915 337L1914 343L1920 344L1922 349L1927 351L1933 351L1940 346L1934 335L1932 334L1931 336L1929 334L1936 335L1943 344L1944 357L1942 351L1930 356L1913 372L1921 363L1920 355L1916 355L1915 360L1911 362L1911 367L1904 372L1900 365L1902 371L1899 374L1901 362L1899 360L1898 364L1893 358L1895 364L1892 364L1895 368L1895 379L1859 394L1847 398L1846 395L1840 404L1838 404L1832 410L1823 415L1819 424L1821 426L1822 422L1830 417L1839 416L1842 413L1859 408L1869 396L1868 399L1878 402L1882 397L1885 396L1843 429L1818 440L1812 434L1813 440L1807 445L1816 446L1818 444L1821 478L1816 496L1808 508L1803 523L1799 524L1799 513L1793 512L1790 514L1773 504L1770 493L1768 497L1771 504L1780 513L1782 522L1786 528L1792 532L1796 532L1801 550L1799 568L1796 578L1792 580L1791 583L1789 601L1782 620L1777 610L1778 596L1780 586L1784 582L1781 580L1784 576L1779 577L1776 580L1776 570L1771 571L1774 566L1771 564L1772 559L1770 565L1767 560L1766 567L1762 567L1758 564L1754 556L1756 554L1754 552L1754 550L1758 549L1764 551L1754 544L1751 547L1752 539L1756 540L1754 535L1749 537L1748 540L1749 531L1751 533L1755 531L1754 526L1752 527L1753 530L1752 530L1749 525L1751 516L1753 513L1757 512L1755 512L1756 503L1752 505L1754 509L1749 515L1747 510L1747 518L1744 514L1745 518L1744 520L1746 520L1743 524L1737 522L1744 527L1746 532L1744 535L1744 542L1743 545L1746 556L1753 563L1750 565L1754 566L1759 578L1753 573L1752 576L1747 572L1739 572L1737 567L1737 572L1734 571L1729 564L1723 569L1721 569L1719 564L1724 556L1719 556L1718 566L1721 571L1728 566L1733 575L1747 575L1752 580L1763 585L1761 589L1762 596L1764 597L1761 599L1756 598L1752 593L1738 586L1750 594L1755 600L1764 601L1763 604L1766 604L1768 612L1762 609L1761 611L1765 615L1760 617L1769 621L1770 628L1765 630L1757 624L1754 620L1751 622L1746 620L1743 622L1752 624L1753 621L1756 628L1763 631L1764 634L1769 632L1770 633L1769 630L1771 629L1782 629L1796 657L1811 679L1802 670L1793 652L1786 648L1786 651L1790 652L1798 668L1792 661L1790 660L1793 664L1781 660L1787 666L1783 668L1780 666L1782 670L1772 668L1779 670L1769 677L1765 676L1762 665L1761 672L1766 681L1789 674L1791 675L1790 680L1793 689L1794 674L1799 673L1804 679L1805 688L1800 692L1793 706L1779 707L1774 701L1778 700L1778 698L1772 701L1775 707L1757 704L1760 707L1779 709L1781 712L1779 721L1771 729L1763 726L1764 728L1773 730L1782 724L1782 721L1786 725L1789 725L1787 722L1790 722L1791 726L1787 730L1784 740L1782 740L1780 736L1781 739L1778 740L1785 741L1799 718L1789 734L1785 745L1784 742L1778 741L1765 745L1747 761L1739 775L1736 791L1731 789L1720 792L1704 802L1696 817L1695 831L1689 842L1680 843L1679 846L1681 848L1672 857L1668 856L1671 861L1667 865L1654 874L1649 874L1651 882L1644 886L1640 883L1639 884L1643 888L1635 898L1638 899L1637 901L1634 902L1633 908L1630 907L1630 912L1625 916L1628 916L1629 920L1628 922L1624 924L1628 925L1625 931L1626 941L1619 953L1622 952L1624 975L1637 1007L1656 1039L1675 1061L1678 1067L1676 1072L1679 1084L1712 1142L1716 1191L1716 1197L1714 1193L1710 1200L1712 1211L1710 1216L1717 1205L1711 1222L1700 1236L1706 1228L1707 1221L1704 1220L1696 1225L1691 1224L1680 1229L1677 1227L1676 1217L1667 1204L1651 1196L1648 1198L1636 1175L1627 1168L1628 1170L1626 1171L1621 1162L1625 1162L1624 1148L1620 1151L1622 1157L1617 1161L1615 1156L1591 1125L1593 1127L1598 1121L1604 1109L1603 1106L1599 1105L1601 1110L1597 1109L1596 1103L1590 1101L1589 1105L1593 1107L1596 1111L1594 1116L1591 1117L1591 1121L1590 1116L1584 1110L1582 1093L1586 1100L1584 1094L1588 1082L1586 1069L1584 1068L1583 1062L1584 1059L1578 1052L1578 1048L1569 1048L1567 1051L1566 1045L1550 1034L1549 1027L1543 1025L1538 1018L1521 1010L1511 1011L1507 1016L1509 1021L1501 1021L1487 1032L1486 1029L1483 1033L1477 1034L1482 1038L1495 1029L1481 1039L1473 1036L1468 1037L1464 1029L1465 1027L1468 1036L1469 1030L1456 1019L1441 1012L1425 1008L1406 1008L1355 1021L1365 1017L1358 1012L1357 1002L1353 999L1351 1001L1349 1017L1344 1014L1339 1014L1335 1018L1317 1016L1301 1021L1300 1018L1295 1028L1288 1029L1284 1036L1279 1037L1280 1040L1284 1039L1284 1042L1287 1044L1294 1033L1299 1034L1296 1038L1299 1040L1303 1036L1305 1037L1301 1042L1304 1042L1300 1044L1302 1046L1303 1045L1302 1048L1299 1046L1297 1053L1293 1050L1295 1055L1288 1054L1291 1057L1287 1055L1289 1058L1288 1060L1292 1061L1295 1066L1304 1066L1307 1069L1308 1067L1312 1074L1317 1075L1314 1076L1316 1077L1315 1079L1313 1078L1312 1084L1307 1080L1300 1088L1305 1076L1304 1075L1301 1079L1290 1071L1281 1070L1266 1083L1262 1074L1259 1073L1258 1076L1256 1071L1255 1073L1250 1073L1251 1076L1246 1082L1242 1083L1241 1086L1239 1086L1235 1080L1224 1078L1218 1075L1221 1072L1228 1077L1227 1073L1223 1068L1218 1070L1217 1065L1213 1067L1209 1059L1205 1060L1206 1054L1196 1056L1196 1050L1191 1050L1185 1055L1181 1055L1185 1057L1185 1061L1189 1061L1180 1065L1164 1063L1140 1055L1128 1056L1100 1062L1081 1071L1075 1076L1073 1076L1078 1071L1085 1068L1083 1066L1074 1068L1077 1057L1072 1057L1067 1062L1066 1060L1064 1062L1063 1067L1068 1070L1069 1079L1060 1086L1057 1085L1057 1089L1064 1085L1071 1077L1075 1078L1048 1101L1012 1119L991 1134L979 1147L970 1162L964 1175L962 1187L971 1234L966 1212L962 1212L965 1210L961 1195L963 1173L976 1146L982 1138L1003 1126L1004 1123L993 1127L992 1123L989 1123L988 1132L982 1136L977 1133L972 1136L970 1139L973 1140L977 1137L978 1140L971 1150L964 1148L957 1149L963 1150L963 1155L968 1157L961 1175L957 1177L955 1176L957 1175L956 1173L951 1177L955 1179L960 1178L958 1199L959 1209L966 1225L965 1231L966 1234L971 1235L972 1241L963 1242L962 1246L955 1244L950 1237L926 1235L914 1226L906 1226L900 1220L886 1216L887 1214L884 1211L880 1196L872 1187L873 1176L869 1173L872 1168L871 1161L857 1150L853 1140L839 1125L836 1115L837 1114L831 1106L825 1092L824 1085L820 1077L811 1071L809 1066L801 1063L801 1058L800 1060L795 1051L789 1049L768 1048L758 1043L754 1048L742 1049L732 1067L731 1074L727 1075L721 1084L714 1083L692 1067L683 1064L665 1047L659 1033L660 1021L654 1010L652 999L641 989L634 985L613 958L603 952L599 941L595 937L524 927L521 949L404 932L264 850L265 844L270 840L173 828L172 821L169 821L171 798L166 787L148 763L145 760L141 762L136 759L138 755L134 744L123 743L112 736L108 726L99 717L87 714L78 708L65 706L64 702L60 699L64 685L63 682L67 672L60 666L61 654L57 653L53 643L50 641L45 622L35 605L35 590L43 587L45 582L44 575L42 572L35 571L28 557L30 549L28 540L32 528L36 528L35 539L44 548L43 537L38 530L40 524L37 520L44 518L44 515L41 512L37 513L37 519L34 521L36 524L34 523L34 526L32 526L22 513L16 512L21 501L19 498L18 490L13 483L4 460L7 456L6 440L11 432L12 418L7 403L0 393L1 384L17 364L20 354L27 341L28 326L26 323L30 313L27 307L27 299L32 285L30 270L36 264L42 250L50 243L59 225L74 186L85 163L93 132L97 127L97 119L101 124L101 122L105 124L112 122L107 118L101 120L98 115L95 116L100 100L98 112L100 113L101 107L102 109L105 106L104 101L109 98L101 94L102 86L103 89L111 87L104 80L103 85L101 85L104 76L102 64L105 46L100 37ZM1652 1260L1654 1255L1666 1246L1676 1251L1670 1255L1665 1254L1658 1260ZM1242 169L1264 153L1268 153L1263 158L1261 161L1250 167L1253 168L1246 171ZM154 18L158 17L161 21L160 18L166 15L170 19L167 20L168 23L165 29L162 29L155 22ZM163 38L169 31L171 32L172 38L165 39L168 42L168 46L168 50L169 47L173 51L173 55L171 57L169 52L167 52L167 43Z";
const LAND = MAP.split("Z")[0]
  .slice(1)
  .split("L")
  .map((p) => p.split(" ").map(Number) as [number, number]);
const onLand = (x: number, y: number) => {
  let inside = false;
  for (let i = 0, j = LAND.length - 1; i < LAND.length; j = i++) {
    const [xi, yi] = LAND[i];
    const [xj, yj] = LAND[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

// -- the stamps -------------------------------------------------------------------
const PHOTOS: Record<string, number> = {
  Athens_OH: 1.6205,
  BentonHarbor_MI: 1.5416,
  Fargo_ND: 1.5109,
  Greenville_SC: 1.4232,
  Meridian_MS: 1.4902,
  Montgomery_AL: 1.5109,
  Pittsburgh_PA: 1.4286,
  Riverside_CA: 1.4615,
  SanDiego_CA: 1.4394,
  Sandusky_OH: 1.4786,
  Sumter_SC: 1.6558,
  Tuskegee_AL: 1.4587,
  Wyandotte_MI: 1.5109,
};
const NAMES = Object.keys(PHOTOS);
const PITT: [number, number] = [1600, 480]; // map units
// The buildings that read: real size, map units, in the page's own order. w = final-frame px.
const FRONT: [string, number, number, number][] = [
  ["Pittsburgh_PA", 1570, 480, 185],
  ["Wyandotte_MI", 1180, 300, 185],
  ["Athens_OH", 1330, 620, 195],
  ["Sumter_SC", 1640, 790, 190],
  ["Tuskegee_AL", 1340, 930, 185],
  ["Fargo_ND", 870, 270, 190],
  ["Montgomery_AL", 960, 600, 200],
  ["Sandusky_OH", 830, 940, 185],
  ["BentonHarbor_MI", 560, 430, 190],
  ["Riverside_CA", 280, 540, 185],
  ["SanDiego_CA", 280, 240, 185],
  ["Greenville_SC", 600, 760, 180],
];

type S = { name: string; big: boolean; x: number; y: number; w: number; h: number; rot: number; contact: number; start: number; dur: number; sx0: number; sy0: number; sx1: number; sy1: number; rot0: number; seed: string };

const STAMPS: S[] = (() => {
  const raw: { name: string; m: number; n: number; w: number; big: boolean; seed: string }[] = [];
  // a jittered brick grid over the land: small ones keep their corners on land, so the mass of stamps draws the country
  const PX = 126;
  const PY = 100;
  let row = 0;
  for (let n = 60; n < 1250; n += PY, row++) {
    for (let m = 60 + (row % 2) * (PX / 2); m < 1980; m += PX) {
      const seed = `c${row}-${Math.round(m)}`;
      const jm = m + (random(`${seed}jx`) - 0.5) * 44;
      const jn = n + (random(`${seed}jy`) - 0.5) * 36;
      const w = 92 + random(`${seed}w`) * 26;
      const hw = (w / MAP_S) * 0.34;
      const hh = hw * 0.7;
      if (![[0, 0], [hw, hh], [-hw, hh], [hw, -hh], [-hw, -hh]].every(([a, b]) => onLand(jm + a, jn + b))) continue;
      raw.push({ name: NAMES[Math.floor(random(`${seed}p`) * NAMES.length)], m: jm, n: jn, w, big: false, seed });
    }
  }
  FRONT.forEach(([name, m, n, w]) => raw.push({ name, m, n, w, big: true, seed: `f-${name}` }));
  const far = Math.max(...raw.map((s) => Math.hypot(s.m - PITT[0], s.n - PITT[1])));
  return raw
    .map((s) => {
      const u = Math.hypot(s.m - PITT[0], s.n - PITT[1]) / far;
      const contact = s.name === "Pittsburgh_PA" && s.big ? 27 : Math.min(59, 28 + 29 * u ** 0.85 + (s.big ? 2 : 0));
      const x = wx(mx(s.m));
      const y = wy(my(s.n));
      const dist = Math.hypot(x - 300, y - 1250);
      const dur = 14 + 6 * (dist / 900);
      const start = contact - dur;
      // start hidden behind his chest as it is on the frame the stamp sets off
      const c = depthTransform(camAt(start), BUST_D);
      const cs = c.toScreen(CHIN_WX + (CHEST_FX - CHIN_FX) * BUST_W, CHIN_WY + (CHEST_FY - CHIN_FY) * BUST_H);
      // the flight is laid out on screen, chest to where its place is at contact, so a stamp is never carried off frame by the pull-back
      const land = depthTransform(camAt(contact), 1).toScreen(x, y);
      const rot = (random(`${s.seed}r`) - 0.5) * (s.big ? 7 : 11);
      return {
        name: s.name,
        big: s.big,
        x,
        y,
        w: wl(s.w),
        h: wl(s.w) / PHOTOS[s.name] + wl(s.w) * 0.04,
        rot,
        contact,
        start,
        dur,
        sx0: cs.x,
        sy0: cs.y,
        sx1: land.x,
        sy1: land.y,
        rot0: rot + (random(`${s.seed}r0`) - 0.5) * 24,
        seed: s.seed,
      };
    })
    .sort((a, b) => Number(a.big) - Number(b.big) || a.contact - b.contact); // the small fill in behind, the buildings stay in front
})();

const CarnegieLibraries: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const plane = depthTransform(cam, 1);
  return (
    <>
      <WipFilmLife frame={frame}>
        <PaperGround cam={cam} />
        {/* the printed map */}
        <WipPlane cam={cam} ink>
          <InkPrint x={wx(MAP_X)} y={wy(MAP_Y)} w={wl(2000 * MAP_S)} h={wl(1265 * MAP_S)} ink={INDIGO} seed="usa" rough={1.1} wear={0.22} misregister={1.2}>
            <svg width="100%" height="100%" viewBox="0 0 2000 1265" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              <path d={MAP} fill="none" stroke="currentColor" strokeWidth={9} strokeLinejoin="round" />
            </svg>
          </InkPrint>
        </WipPlane>
        {/* the stamps, dealt in landing order */}
        <WipPlane cam={cam}>
          {STAMPS.map((s) => {
            if (frame < s.start) return null;
            const t = slide(frame, s.start, s.dur);
            const flying = frame < s.contact;
            return (
              <Stamp
                key={s.seed}
                x={flying ? (s.sx0 + (s.sx1 - s.sx0) * t - plane.tx) / plane.k : s.x}
                y={flying ? (s.sy0 + (s.sy1 - s.sy0) * t - plane.ty) / plane.k : s.y}
                w={s.w}
                h={s.h}
                rotate={s.rot0 + (s.rot - s.rot0) * t}
                press={stampPress(frame, s.contact)}
                seed={s.seed}
              >
                <PrintPhoto src={`wip-anthropic/carnegie_lib_${s.name}.png`} seed={s.seed} />
              </Stamp>
            );
          })}
        </WipPlane>
        {/* the cancels */}
        <WipPlane cam={cam} ink>
          <Postmark x={wx(868)} y={wy(375)} size={wl(310)} ink={RED} seed="pitt-b" top="PITTSBURGH" wear={0.3} rotate={-9} press={inkPress(frame, 56)} />
          <Postmark x={wx(650)} y={wy(825)} size={wl(225)} ink={RED} seed="gulf" bars="wavy" stars={3} rotate={-6} press={inkPress(frame, 63)} />
        </WipPlane>
        {/* the man, nearest */}
        <WipPlane cam={cam} d={BUST_D}>
          <Img
            src={staticFile(BUST)}
            style={{
              position: "absolute",
              left: CHIN_WX - CHIN_FX * BUST_W - BUST_MARGIN,
              top: CHIN_WY - CHIN_FY * BUST_H - BUST_MARGIN,
              width: BUST_W + 2 * BUST_MARGIN,
              height: BUST_H + 2 * BUST_MARGIN,
              maxWidth: "none",
            }}
          />
        </WipPlane>
      </WipFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default CarnegieLibraries;
