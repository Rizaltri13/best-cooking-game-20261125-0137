// Warung Rush — the screenshot scenes behind ?shot=title|play|serve|win.
// Each scene builds a real, reachable kitchen state (real orders with real
// recipes, real hands, a real chopping job, a real cooking burner) and the
// renderer paints it, so every screenshot is what playing looks like.
// ?seed=N picks the order mix; the same seed always gives the same frame.

import { DISHES, ORDER } from './config.js';
import { dishForPlate } from './engine.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function ticket(state, dishId, left) {
  const dish = DISHES.find((d) => d.id === dishId);
  state.orderSeq += 1;
  return {
    id: state.orderSeq,
    dishId: dish.id,
    name: dish.name,
    short: dish.short,
    needs: dish.needs,
    left,
    max: ORDER.patience,
  };
}

/** Set `state` to the named scene; returns the screen to draw and the best score. */
export function stageShot(name, state) {
  if (name === 'play') {
    state.screen = SCREEN_PLAY;
    state.timeLeft = 104;
    state.score = 350;
    state.coins = 350;
    state.combo = 2;
    state.bestCombo = 2;
    state.served = 2;
    state.orders = [
      ticket(state, 'nasi-goreng', 24),
      ticket(state, 'mie-ayam', 17),
      ticket(state, 'ayam-geprek', 8),
    ];
    state.nextOrderIn = 6;
    // Chef mid-assembly: one chopped chili in hand, chicken on the board.
    state.chef.x = 642;
    state.chef.y = 330;
    state.chef.tx = 642;
    state.chef.ty = 330;
    state.hands = [{ ing: 'chili', state: 'chopped' }];
    state.chop = { ing: 'chicken', hits: 2 };
    // Rice frying on burner one, noodle ready on burner two.
    state.burners = [
      { item: { ing: 'rice', state: 'raw' }, t: 3.2 },
      { item: { ing: 'noodle', state: 'raw' }, t: 5.6 },
    ];
    // Plate mid-assembly: cooked egg + chopped chili, waiting for rice.
    state.plate = [
      { ing: 'egg', state: 'cooked' },
      { ing: 'chili', state: 'chopped' },
    ];
    state.plateDish = dishForPlate(state.plate);
    state.prompt = 'E — Potong! (2/3)';
    return { screen: SCREEN_PLAY, best: 350 };
  }

  if (name === 'serve') {
    state.screen = SCREEN_PLAY;
    state.timeLeft = 71;
    state.score = 620;
    state.coins = 620;
    state.combo = 3;
    state.bestCombo = 3;
    state.served = 4;
    state.orders = [
      ticket(state, 'nasi-goreng', 19),
      ticket(state, 'mie-goreng', 26),
    ];
    state.nextOrderIn = 9;
    // Chef at the serve window with a finished Nasi Goreng on the plate.
    state.chef.x = 1118;
    state.chef.y = 330;
    state.chef.tx = 1118;
    state.chef.ty = 330;
    state.plate = [
      { ing: 'rice', state: 'cooked' },
      { ing: 'egg', state: 'cooked' },
      { ing: 'chili', state: 'chopped' },
    ];
    state.plateDish = dishForPlate(state.plate);
    state.floaters = [
      { x: 1118, y: 288, text: '+148', t: 0.2, ttl: 1.4, colour: '#ffd76a' },
    ];
    state.particles = [];
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2;
      state.particles.push({
        x: 1118, y: 130,
        vx: Math.cos(a) * 90, vy: Math.sin(a) * 90 - 40,
        t: 0.15, ttl: 1.0, size: 4, colour: '#ffd76a', kind: 'dot',
      });
    }
    state.prompt = 'E — SAJIKAN!';
    return { screen: SCREEN_PLAY, best: 620 };
  }

  if (name === 'win') {
    state.screen = SCREEN_OVER;
    state.timeLeft = 0;
    state.score = 1620;
    state.coins = 1620;
    state.served = 7;
    state.bestCombo = 4;
    state.result = { win: true, stars: 3, score: 1620, served: 7, bestCombo: 4 };
    state.orders = [ticket(state, 'mie-ayam', 12)];
    return { screen: SCREEN_OVER, best: 1620 };
  }

  // Default: the title screen over a kitchen with two tickets waiting.
  state.screen = SCREEN_TITLE;
  state.timeLeft = 150;
  state.score = 0;
  state.orders = [ticket(state, 'nasi-goreng', 27), ticket(state, 'mie-ayam', 21)];
  state.chef.x = 640;
  state.chef.y = 520;
  state.chef.tx = 640;
  state.chef.ty = 520;
  state.prompt = '';
  return { screen: SCREEN_TITLE, best: 0 };
}
