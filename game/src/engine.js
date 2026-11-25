// Warung Rush — the kitchen rules, pure logic with no DOM in it, so the
// same file can be driven by the browser loop and by Node tests.
// Flow: take raw ingredients from the pantry crates, chop them on the
// talenan, fry them in the wajan, stack them on the plating counter, and
// serve the finished plate at the window before the ticket runs out.

import {
  BOARD,
  BURN_TIME,
  CHOP_HITS,
  COOK_TIME,
  DAY_LENGTH,
  DISHES,
  FLOOR_TOP,
  HAND_LIMIT,
  INGREDIENTS,
  MAX_STRIKES,
  ORDER,
  PANTRY,
  PLATE_LIMIT,
  SCORE_BASE,
  SCORE_PER_SECOND_LEFT,
  SERVE,
  STATIONS,
  TARGET_SCORE,
  createRandom,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

export const EVENT_NONE = 0;
export const EVENT_SERVED = 1;
export const EVENT_EXPIRED = 2;
export const EVENT_OVER = 4;

/** Next prep step an item still needs, or null when it is ready to plate. */
export function nextStep(item) {
  const prep = INGREDIENTS[item.ing].prep;
  if (item.state === 'burnt') return null;
  if (item.state === 'raw') return prep[0] ?? null;
  if (item.state === 'chopped') return prep.includes('cook') ? 'cook' : null;
  return null;
}

/** The dish whose recipe exactly matches the plate, or null. */
export function dishForPlate(plate) {
  if (plate.length === 0) return null;
  for (const dish of DISHES) {
    if (dish.needs.length !== plate.length) continue;
    const rest = plate.map((item) => `${item.ing}:${item.state}`);
    const ok = dish.needs.every((need) => {
      const i = rest.indexOf(`${need.ing}:${need.state}`);
      if (i === -1) return false;
      rest.splice(i, 1);
      return true;
    });
    if (ok) return dish;
  }
  return null;
}

export function createKitchen(seed = 20261125) {
  const rng = createRandom(seed);
  return {
    rng,
    screen: SCREEN_TITLE,
    timeLeft: DAY_LENGTH,
    target: TARGET_SCORE,
    score: 0,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    strikes: 0,
    orders: [],
    orderSeq: 0,
    nextOrderIn: ORDER.firstIn,
    chef: { x: 640, y: 520, tx: 640, ty: 520, moving: false, face: 1, bob: 0, walkT: 0 },
    pendingStation: null,
    hands: [],
    plate: [],
    plateDish: null,
    chop: null,
    burners: [null, null],
    particles: [],
    floaters: [],
    steamT: 0,
    result: null,
    prompt: '',
    muted: false,
    stats: { chops: 0, cooks: 0, serves: 0, picked: 0 },
  };
}

export function resetKitchen(state) {
  const fresh = createKitchen(Math.floor(state.rng() * 4294967296));
  fresh.muted = state.muted;
  Object.keys(fresh).forEach((key) => {
    state[key] = fresh[key];
  });
  state.screen = SCREEN_PLAY;
}

function addFloater(state, x, y, text, colour) {
  state.floaters.push({ x, y, text, t: 0, ttl: 1.4, colour });
}

function burst(state, x, y, colour, n = 14) {
  for (let i = 0; i < n; i += 1) {
    const a = state.rng() * Math.PI * 2;
    const sp = 40 + state.rng() * 120;
    state.particles.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 40,
      t: 0, ttl: 0.7 + state.rng() * 0.5,
      size: 3 + state.rng() * 4,
      colour,
      kind: 'dot',
    });
  }
}

function spawnOrder(state) {
  const dish = DISHES[Math.floor(state.rng() * DISHES.length)];
  state.orderSeq += 1;
  state.orders.push({
    id: state.orderSeq,
    dishId: dish.id,
    name: dish.name,
    short: dish.short,
    needs: dish.needs,
    left: ORDER.patience,
    max: ORDER.patience,
  });
}

function endDay(state) {
  const win = state.score >= state.target;
  const stars = state.score >= 1500 ? 3 : state.score >= 1200 ? 2 : win ? 1 : 0;
  state.result = { win, stars, score: state.score, served: state.served, bestCombo: state.bestCombo };
  state.screen = SCREEN_OVER;
}

function allStations() {
  return [
    ...PANTRY.map((crate) => ({ ...crate })),
    ...Object.values(STATIONS),
    { kind: 'serve', ...SERVE, front: { x: 1118, y: FLOOR_TOP + 26 } },
  ];
}

/** The station the chef can reach right now, or null. */
export function nearestStation(state) {
  let best = null;
  let bestD = 110;
  for (const station of allStations()) {
    const dx = state.chef.x - station.front.x;
    const dy = state.chef.y - station.front.y;
    const d = Math.hypot(dx, dy);
    if (d < bestD) {
      bestD = d;
      best = station;
    }
  }
  return best;
}

function stationRect(station) {
  if (station.kind === 'pantry') return { x: station.x - 6, y: station.y - 6, w: station.w + 12, h: station.h + 12 };
  if (station.kind === 'serve') return SERVE;
  return { x: station.x - 6, y: station.y - 6, w: station.w + 12, h: station.h + 12 };
}

/** Station whose rect contains the logical point, or null. */
export function stationAtPoint(x, y) {
  for (const station of allStations()) {
    const r = stationRect(station);
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return station;
  }
  return null;
}

function refreshPlate(state) {
  state.plateDish = dishForPlate(state.plate);
}

/** One interaction with a station. Returns a sound-event name. */
export function interact(state, forced) {
  const station = forced ?? nearestStation(state);
  if (!station || state.screen !== SCREEN_PLAY) return 'deny';
  const chef = state.chef;

  if (station.kind === 'pantry') {
    if (state.hands.length >= HAND_LIMIT) return 'deny';
    state.hands.push({ ing: station.ing, state: 'raw' });
    state.stats.picked += 1;
    addFloater(state, chef.x, chef.y - 46, `+ ${INGREDIENTS[station.ing].label}`, '#fff3d6');
    return 'pickup';
  }

  if (station.kind === 'chop') {
    if (state.chop) {
      state.chop.hits += 1;
      state.stats.chops += 1;
      burst(state, STATIONS.chop.x + 58, STATIONS.chop.y + 40, '#ffe9b8', 5);
      if (state.chop.hits >= CHOP_HITS) {
        if (state.hands.length >= HAND_LIMIT) {
          state.chop.hits = CHOP_HITS;
          return 'chop';
        }
        const ing = state.chop.ing;
        state.chop = null;
        state.hands.push({ ing, state: 'chopped' });
        addFloater(state, chef.x, chef.y - 46, `${INGREDIENTS[ing].label} dipotong!`, '#b6f09c');
        return 'chopDone';
      }
      return 'chop';
    }
    const idx = state.hands.findIndex((item) => nextStep(item) === 'chop');
    if (idx === -1) return 'deny';
    const item = state.hands.splice(idx, 1)[0];
    state.chop = { ing: item.ing, hits: 0 };
    return 'chop';
  }

  if (station.kind === 'wok') {
    const readyIdx = state.burners.findIndex(
      (b) => b && b.t >= COOK_TIME,
    );
    if (readyIdx !== -1) {
      if (state.hands.length >= HAND_LIMIT) return 'deny';
      const burner = state.burners[readyIdx];
      state.burners[readyIdx] = null;
      const burnt = burner.t >= BURN_TIME;
      state.hands.push({ ing: burner.item.ing, state: burnt ? 'burnt' : 'cooked' });
      state.stats.cooks += 1;
      if (burnt) {
        addFloater(state, chef.x, chef.y - 46, 'GOSONG! Buang!', '#ff9a8a');
        return 'burnt';
      }
      addFloater(state, chef.x, chef.y - 46, `${INGREDIENTS[burner.item.ing].label} matang!`, '#ffd76a');
      return 'cookTake';
    }
    const emptyIdx = state.burners.findIndex((b) => b === null);
    if (emptyIdx === -1) return 'deny';
    const idx = state.hands.findIndex((item) => nextStep(item) === 'cook');
    if (idx === -1) return 'deny';
    const item = state.hands.splice(idx, 1)[0];
    state.burners[emptyIdx] = { item, t: 0 };
    return 'cookStart';
  }

  if (station.kind === 'plate') {
    if (state.hands.length === 0) return 'deny';
    while (state.hands.length > 0 && state.plate.length < PLATE_LIMIT) {
      state.plate.push(state.hands.shift());
    }
    refreshPlate(state);
    if (state.plateDish) {
      addFloater(state, STATIONS.plate.x + 72, STATIONS.plate.y - 14, `${state.plateDish.name} SIAP!`, '#ffd76a');
      burst(state, STATIONS.plate.x + 72, STATIONS.plate.y + 40, '#ffd76a', 16);
      return 'plateReady';
    }
    return 'plate';
  }

  if (station.kind === 'trash') {
    if (state.hands.length === 0 && state.plate.length === 0 && !state.chop) return 'deny';
    state.hands = [];
    state.plate = [];
    state.plateDish = null;
    state.chop = null;
    return 'trash';
  }

  if (station.kind === 'serve') {
    if (!state.plateDish) return 'deny';
    const dish = state.plateDish;
    const orderIdx = state.orders.findIndex((o) => o.dishId === dish.id);
    if (orderIdx === -1) return 'deny';
    const order = state.orders[orderIdx];
    const mult = Math.min(2, 1 + 0.25 * state.combo);
    const points = Math.round((SCORE_BASE + order.left * SCORE_PER_SECOND_LEFT) * mult);
    state.score += points;
    state.coins += points;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.served += 1;
    state.stats.serves += 1;
    state.orders.splice(orderIdx, 1);
    state.plate = [];
    state.plateDish = null;
    addFloater(state, SERVE.x + 138, SERVE.y + 100, `+${points}`, '#ffd76a');
    burst(state, SERVE.x + 138, SERVE.y + 60, '#ffd76a', 18);
    return 'serve';
  }

  return 'deny';
}

/** Contextual hint for the chef's current spot. */
export function promptFor(state) {
  if (state.screen !== SCREEN_PLAY) return '';
  const station = nearestStation(state);
  if (!station) return 'WASD / klik untuk bergerak — E untuk beraksi';
  if (station.kind === 'pantry') {
    return state.hands.length >= HAND_LIMIT
      ? 'Tangan penuh! Masak / sajikan dulu'
      : `E — Ambil ${INGREDIENTS[station.ing].label}`;
  }
  if (station.kind === 'chop') {
    if (state.chop) return `E — Potong! (${state.chop.hits}/${CHOP_HITS})`;
    return state.hands.some((item) => nextStep(item) === 'chop')
      ? 'E — Taruh di talenan'
      : 'Bawa bahan mentah ke sini untuk dipotong';
  }
  if (station.kind === 'wok') {
    const ready = state.burners.some((b) => b && b.t >= COOK_TIME);
    if (ready) return 'E — Angkat dari wajan!';
    if (state.burners.some((b) => b === null)) {
      return state.hands.some((item) => nextStep(item) === 'cook')
        ? 'E — Masukkan ke wajan'
        : 'Bawa bahan ke sini untuk dimasak';
    }
    return 'Wajan penuh — tunggu matang';
  }
  if (station.kind === 'plate') {
    return state.hands.length > 0 ? 'E — Tata di piring' : 'Bawa bahan matang ke sini';
  }
  if (station.kind === 'trash') return 'E — Buang tangan & piring';
  if (station.kind === 'serve') {
    return state.plateDish ? 'E — SAJIKAN! 🛎' : 'Selesaikan piring dulu, lalu sajikan di sini';
  }
  return '';
}

/**
 * Advance the kitchen by dt seconds. keys is {up,down,left,right}.
 * Returns an event bitmask (EVENT_SERVED is set by interact's caller).
 */
export function stepKitchen(state, dt, keys = {}) {
  if (state.screen !== SCREEN_PLAY) return EVENT_NONE;
  let events = EVENT_NONE;

  // --- chef movement: keys win over a click target ---
  const chef = state.chef;
  const kx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  const ky = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
  if (kx !== 0 || ky !== 0) {
    state.pendingStation = null;
    const len = Math.hypot(kx, ky);
    chef.x += (kx / len) * 310 * dt;
    chef.y += (ky / len) * 310 * dt;
    chef.face = kx !== 0 ? Math.sign(kx) : chef.face;
    chef.moving = true;
    chef.walkT += dt;
  } else if (chef.tx !== chef.x || chef.ty !== chef.y) {
    const dx = chef.tx - chef.x;
    const dy = chef.ty - chef.y;
    const d = Math.hypot(dx, dy);
    const step = 310 * dt;
    if (d <= Math.max(step, 10)) {
      chef.x = chef.tx;
      chef.y = chef.ty;
      chef.moving = false;
      if (state.pendingStation) {
        const station = state.pendingStation;
        state.pendingStation = null;
        interact(state, station);
      }
    } else {
      chef.x += (dx / d) * step;
      chef.y += (dy / d) * step;
      chef.face = dx !== 0 ? Math.sign(dx) : chef.face;
      chef.moving = true;
      chef.walkT += dt;
    }
  } else {
    chef.moving = false;
    // Already standing at the target (e.g. clicked the station the chef
    // is already in front of): use it now instead of waiting for a walk.
    if (state.pendingStation) {
      const station = state.pendingStation;
      state.pendingStation = null;
      interact(state, station);
    }
  }
  chef.x = Math.max(30, Math.min(1250, chef.x));
  chef.y = Math.max(FLOOR_TOP, Math.min(692, chef.y));
  chef.bob = chef.moving ? Math.sin(chef.walkT * 14) * 2 : 0;

  // --- shift clock ---
  state.timeLeft -= dt;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    endDay(state);
    return EVENT_OVER;
  }

  // --- orders ---
  state.nextOrderIn -= dt;
  if (state.nextOrderIn <= 0 && state.orders.length < ORDER.maxActive) {
    spawnOrder(state);
    state.nextOrderIn = ORDER.interval + (state.rng() * 4 - 2);
  }
  for (let i = state.orders.length - 1; i >= 0; i -= 1) {
    const order = state.orders[i];
    order.left -= dt;
    if (order.left <= 0) {
      state.orders.splice(i, 1);
      state.strikes += 1;
      state.combo = 0;
      addFloater(state, BOARD.x + 470, BOARD.y + 44, 'Pesanan hangus!', '#ff9a8a');
      events |= EVENT_EXPIRED;
      if (state.strikes >= MAX_STRIKES) {
        endDay(state);
        return events | EVENT_OVER;
      }
    }
  }

  // --- burners: burn past the window ---
  for (const burner of state.burners) {
    if (burner) burner.t += dt;
  }

  // --- steam from cooking burners ---
  state.steamT -= dt;
  if (state.steamT <= 0) {
    state.steamT = 0.25;
    state.burners.forEach((burner, i) => {
      if (burner) {
        state.particles.push({
          x: STATIONS.wok.x + 46 + i * 92 + (state.rng() * 20 - 10),
          y: STATIONS.wok.y + 18,
          vx: 0, vy: -34,
          t: 0, ttl: 0.9, size: 5 + state.rng() * 5,
          colour: 'rgba(255,255,255,0.55)', kind: 'steam',
        });
      }
    });
  }

  // --- particles & floaters ---
  for (let i = state.particles.length - 1; i >= 0; i -= 1) {
    const p = state.particles[i];
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.kind === 'dot') p.vy += 160 * dt;
    if (p.t >= p.ttl) state.particles.splice(i, 1);
  }
  for (let i = state.floaters.length - 1; i >= 0; i -= 1) {
    const f = state.floaters[i];
    f.t += dt;
    f.y -= 26 * dt;
    if (f.t >= f.ttl) state.floaters.splice(i, 1);
  }

  state.prompt = promptFor(state);
  return events;
}

/** Walk the chef to a station, then interact on arrival. */
export function goToStation(state, station) {
  state.chef.tx = station.front.x;
  state.chef.ty = station.front.y;
  state.pendingStation = station;
}

/** Walk the chef to a floor point. */
export function goToPoint(state, x, y) {
  state.pendingStation = null;
  state.chef.tx = Math.max(30, Math.min(1250, x));
  state.chef.ty = Math.max(FLOOR_TOP, Math.min(692, y));
}
