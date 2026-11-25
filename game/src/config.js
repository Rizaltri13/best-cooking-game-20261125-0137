// Warung Rush — every tuning number, colour and recipe in one place.
// The kitchen is a fixed 1280x720 logical stage; the renderer scales it to
// the window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** Fixed simulation step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

/** One work shift lasts this long; reach the target score before it ends. */
export const DAY_LENGTH = 150;
export const TARGET_SCORE = 900;

/** Orders: how long a ticket waits, how fast new ones arrive, how many at once. */
export const ORDER = {
  patience: 30,
  firstIn: 2,
  interval: 14,
  maxActive: 3,
};

/** Chopping takes this many hits; cooking finishes at this many seconds. */
export const CHOP_HITS = 3;
export const COOK_TIME = 5;
export const BURN_TIME = 8.5;

/** Hands and the plating plate each hold at most this many items. */
export const HAND_LIMIT = 3;
export const PLATE_LIMIT = 3;

/** Score: base per served dish, plus this per second of patience left. */
export const SCORE_BASE = 100;
export const SCORE_PER_SECOND_LEFT = 2;

/** How many expired orders end the shift early. */
export const MAX_STRIKES = 3;

export const CHEF = { radius: 22, speed: 310 };

/** Chef may not walk into the counter band; the floor starts here. */
export const FLOOR_TOP = 292;

/**
 * Ingredients. prep is the chain of steps a raw ingredient needs:
 * chop -> cook, cook only, or chop only. label is what the crates show.
 */
export const INGREDIENTS = {
  rice: { label: 'Nasi', prep: ['cook'], colour: '#f5f0e1' },
  noodle: { label: 'Mie', prep: ['cook'], colour: '#f2c14e' },
  egg: { label: 'Telur', prep: ['cook'], colour: '#fff3d6' },
  chicken: { label: 'Ayam', prep: ['chop', 'cook'], colour: '#e08a5a' },
  chili: { label: 'Cabai', prep: ['chop'], colour: '#e23b2e' },
  scallion: { label: 'Daun Bawang', prep: ['chop'], colour: '#4caf50' },
};

export const INGREDIENT_ORDER = ['rice', 'noodle', 'egg', 'chicken', 'chili', 'scallion'];

/** A dish component is an ingredient in the state the recipe wants. */
export const DISHES = [
  {
    id: 'nasi-goreng',
    name: 'Nasi Goreng Kilat',
    short: 'NASI GORENG',
    price: 100,
    needs: [
      { ing: 'rice', state: 'cooked' },
      { ing: 'egg', state: 'cooked' },
      { ing: 'chili', state: 'chopped' },
    ],
  },
  {
    id: 'mie-ayam',
    name: 'Mie Ayam Mantap',
    short: 'MIE AYAM',
    price: 100,
    needs: [
      { ing: 'noodle', state: 'cooked' },
      { ing: 'chicken', state: 'cooked' },
      { ing: 'scallion', state: 'chopped' },
    ],
  },
  {
    id: 'ayam-geprek',
    name: 'Ayam Geprek Kilat',
    short: 'AYAM GEPREK',
    price: 100,
    needs: [
      { ing: 'chicken', state: 'cooked' },
      { ing: 'chili', state: 'chopped' },
      { ing: 'egg', state: 'cooked' },
    ],
  },
  {
    id: 'mie-goreng',
    name: 'Mie Goreng Pedas',
    short: 'MIE GORENG',
    price: 100,
    needs: [
      { ing: 'noodle', state: 'cooked' },
      { ing: 'egg', state: 'cooked' },
      { ing: 'chili', state: 'chopped' },
    ],
  },
];

/**
 * Stations, in logical coordinates. Pantry crates are one station each
 * (their rects are built from PANTRY below); the rest are single stations.
 * front is where the chef stands to use the station.
 */
export const PANTRY = INGREDIENT_ORDER.map((ing, i) => ({
  kind: 'pantry',
  ing,
  x: 24 + i * 92,
  y: 178,
  w: 84,
  h: 82,
  front: { x: 24 + i * 92 + 42, y: FLOOR_TOP + 26 },
}));

export const STATIONS = {
  chop: { kind: 'chop', label: 'Talenan', x: 584, y: 178, w: 116, h: 82, front: { x: 642, y: FLOOR_TOP + 26 } },
  wok: { kind: 'wok', label: 'Wajan', x: 716, y: 178, w: 184, h: 82, front: { x: 808, y: FLOOR_TOP + 26 } },
  plate: { kind: 'plate', label: 'Piring Saji', x: 916, y: 178, w: 144, h: 82, front: { x: 988, y: FLOOR_TOP + 26 } },
  trash: { kind: 'trash', label: 'Tong Sampah', x: 1076, y: 178, w: 180, h: 82, front: { x: 1240, y: FLOOR_TOP + 26 } },
};

/** Order board (tickets) and serve window, on the wall band. */
export const BOARD = { x: 24, y: 76, w: 940, h: 88 };
export const SERVE = { x: 980, y: 76, w: 276, h: 88 };

export const PALETTE = {
  wall: '#f6cf8f',
  wallDark: '#e8b878',
  tile: '#7ec8c0',
  tileDark: '#63b3ab',
  floor: '#c98f5f',
  floorDark: '#b57a4c',
  counter: '#8a5a33',
  counterTop: '#a9713f',
  woodDark: '#5d3a1e',
  paper: '#fff8e6',
  ink: '#2b1d12',
  muted: '#7a5c40',
  cream: '#fff3d6',
  red: '#d63c2f',
  green: '#3d9b4f',
  gold: '#f2b705',
  hud: '#2b1d12',
  hudText: '#ffe9b8',
  plate: '#fdfdfd',
};

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

/** Best shift score, kept in this browser only. */
export const BEST_KEY = 'warung-rush.best';

/** Deterministic RNG (mulberry32) so staged shots always look the same. */
export function createRandom(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
