// Warung Rush — everything the player sees, painted on one canvas in the
// fixed 1280x720 logical stage. Big type, warm warung colours, and every
// live number (timer, score, patience) drawn where a glance can read it.

import {
  BOARD,
  BURN_TIME,
  CHOP_HITS,
  COOK_TIME,
  DAY_LENGTH,
  DISHES,
  FIELD,
  FONT,
  INGREDIENTS,
  MAX_STRIKES,
  PALETTE,
  PANTRY,
  SERVE,
  STATIONS,
  TARGET_SCORE,
} from './config.js';
import { drawIngredient, stateColour } from './icons.js';
import { nearestStation } from './engine.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, colour, align = 'left', weight = 'bold') {
  ctx.fillStyle = colour;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function dishById(id) {
  return DISHES.find((d) => d.id === id);
}

export function createRenderer(canvas) {
  canvas.width = FIELD.width;
  canvas.height = FIELD.height;
  const ctx = canvas.getContext('2d');

  function drawBackground() {
    // Wall and tile band.
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(0, 0, FIELD.width, 178);
    ctx.fillStyle = PALETTE.wallDark;
    ctx.fillRect(0, 168, FIELD.width, 10);
    ctx.fillStyle = PALETTE.tile;
    for (let x = 0; x < FIELD.width; x += 46) {
      ctx.fillRect(x, 64, 42, 4);
      ctx.fillStyle = PALETTE.tileDark;
      ctx.fillRect(x, 64, 4, 4);
      ctx.fillStyle = PALETTE.tile;
    }
    // Hanging lamps.
    for (const lx of [180, 640, 1100]) {
      ctx.strokeStyle = '#5d3a1e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, 26);
      ctx.stroke();
      ctx.fillStyle = '#f2b705';
      ctx.beginPath();
      ctx.moveTo(lx - 16, 34);
      ctx.lineTo(lx + 16, 34);
      ctx.lineTo(lx + 8, 22);
      ctx.lineTo(lx - 8, 22);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff3d6';
      ctx.beginPath();
      ctx.arc(lx, 36, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    // Floor planks.
    ctx.fillStyle = PALETTE.floor;
    ctx.fillRect(0, 178, FIELD.width, FIELD.height - 178);
    ctx.fillStyle = PALETTE.floorDark;
    for (let y = 210; y < FIELD.height; y += 54) ctx.fillRect(0, y, FIELD.width, 3);
    for (let x = 90; x < FIELD.width; x += 180) {
      ctx.fillRect(x, 178, 3, FIELD.height - 178);
    }
    // Rug in the middle of the floor.
    ctx.fillStyle = '#a34d2d';
    roundRect(ctx, 440, 470, 400, 130, 18);
    ctx.fill();
    ctx.fillStyle = '#c96a3a';
    roundRect(ctx, 456, 486, 368, 98, 12);
    ctx.fill();
    // Rice sack and chili basket on the floor, for a lived-in warung.
    ctx.fillStyle = '#e8d9b0';
    ctx.beginPath();
    ctx.moveTo(132, 690);
    ctx.quadraticCurveTo(128, 640, 150, 628);
    ctx.quadraticCurveTo(172, 640, 168, 690);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b98d4f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(138, 640);
    ctx.quadraticCurveTo(150, 632, 162, 640);
    ctx.stroke();
    text(ctx, 'BERAS', 150, 668, 11, '#7a5c40', 'center');
    ctx.fillStyle = '#8a5a33';
    ctx.beginPath();
    ctx.ellipse(1140, 676, 34, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e23b2e';
    for (const [ox, oy] of [[-14, -4], [0, -8], [14, -4], [-7, 2], [8, 2]]) {
      ctx.beginPath();
      ctx.ellipse(1140 + ox, 668 + oy, 6, 3.5, -0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    // Potted plants at the floor corners.
    for (const px of [36, 1224]) {
      ctx.fillStyle = '#b5502e';
      ctx.beginPath();
      ctx.moveTo(px - 14, 668);
      ctx.lineTo(px + 14, 668);
      ctx.lineTo(px + 10, 696);
      ctx.lineTo(px - 10, 696);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#3d9b4f';
      for (const [ox, oy, r] of [[-8, -8, 9], [6, -12, 10], [0, -18, 8]]) {
        ctx.beginPath();
        ctx.arc(px + ox, 664 + oy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawTicket(order, i) {
    const x = BOARD.x + 8 + i * 308;
    const y = BOARD.y + 4;
    const w = 296;
    const h = 80;
    const urgent = order.left < 10;
    ctx.fillStyle = PALETTE.paper;
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = urgent ? PALETTE.red : PALETTE.woodDark;
    ctx.lineWidth = urgent ? 3 : 2;
    roundRect(ctx, x, y, w, h, 10);
    ctx.stroke();
    text(ctx, `#${order.id} ${order.short}`, x + 12, y + 16, 15, PALETTE.ink);
    text(ctx, `${Math.ceil(order.left)}s`, x + w - 12, y + 16, 15, urgent ? PALETTE.red : PALETTE.muted, 'right');
    // The three components the dish needs.
    order.needs.forEach((need, j) => {
      const ix = x + 30 + j * 62;
      const iy = y + 44;
      ctx.fillStyle = '#f3e3c2';
      ctx.beginPath();
      ctx.arc(ix, iy, 19, 0, Math.PI * 2);
      ctx.fill();
      drawIngredient(ctx, need.ing, ix, iy, 15, need.state);
      ctx.strokeStyle = stateColour(need);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(ix, iy, 19, 0, Math.PI * 2);
      ctx.stroke();
    });
    text(ctx, 'RING = STATUS', x + 196, y + 44, 10, PALETTE.muted);
    // Patience bar.
    const frac = Math.max(0, order.left / order.max);
    ctx.fillStyle = '#e0cba8';
    roundRect(ctx, x + 12, y + h - 12, w - 24, 7, 3);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? PALETTE.green : frac > 0.25 ? PALETTE.gold : PALETTE.red;
    roundRect(ctx, x + 12, y + h - 12, (w - 24) * frac, 7, 3);
    ctx.fill();
  }

  function drawBoard(state) {
    ctx.fillStyle = PALETTE.woodDark;
    roundRect(ctx, BOARD.x - 6, BOARD.y - 6, BOARD.w + 12, BOARD.h + 12, 12);
    ctx.fill();
    text(ctx, 'PESANAN', BOARD.x + 4, BOARD.y - 16, 13, '#ffe9b8');
    if (state.orders.length === 0) {
      text(ctx, 'Belum ada pesanan — siapkan dapurmu!', BOARD.x + 20, BOARD.y + 44, 17, '#ffe9b8');
    }
    state.orders.forEach((order, i) => drawTicket(order, i));
  }

  function drawServeWindow(state) {
    const glow = state.plateDish;
    ctx.fillStyle = glow ? '#ffe9a8' : PALETTE.woodDark;
    roundRect(ctx, SERVE.x - 6, SERVE.y - 6, SERVE.w + 12, SERVE.h + 12, 12);
    ctx.fill();
    ctx.fillStyle = '#3a2415';
    roundRect(ctx, SERVE.x, SERVE.y, SERVE.w, SERVE.h, 8);
    ctx.fill();
    // Service bell.
    ctx.fillStyle = '#f2b705';
    ctx.beginPath();
    ctx.arc(SERVE.x + 44, SERVE.y + 44, 18, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(SERVE.x + 22, SERVE.y + 42, 44, 6);
    ctx.fillStyle = '#d63c2f';
    ctx.beginPath();
    ctx.arc(SERVE.x + 44, SERVE.y + 22, 4, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, 'SAJIKAN', SERVE.x + 76, SERVE.y + 26, 22, '#ffe9b8');
    if (glow) {
      text(ctx, `${glow.short} SIAP!`, SERVE.x + 76, SERVE.y + 56, 15, '#ffd76a');
      text(ctx, 'Tekan E di sini', SERVE.x + 76, SERVE.y + 74, 12, '#fff3d6');
    } else {
      text(ctx, 'Selesaikan piring,', SERVE.x + 76, SERVE.y + 56, 13, '#cbb28a');
      text(ctx, 'lalu sajikan di sini', SERVE.x + 76, SERVE.y + 74, 13, '#cbb28a');
    }
  }

  function drawPantry(state) {
    const near = nearestStation(state);
    for (const crate of PANTRY) {
      const isNear = near && near.kind === 'pantry' && near.ing === crate.ing;
      ctx.fillStyle = isNear ? '#c98f4e' : PALETTE.counterTop;
      roundRect(ctx, crate.x, crate.y, crate.w, crate.h, 8);
      ctx.fill();
      ctx.strokeStyle = PALETTE.woodDark;
      ctx.lineWidth = 2;
      roundRect(ctx, crate.x, crate.y, crate.w, crate.h, 8);
      ctx.stroke();
      drawIngredient(ctx, crate.ing, crate.x + crate.w / 2, crate.y + 32, 22, 'raw');
      text(ctx, INGREDIENTS[crate.ing].label, crate.x + crate.w / 2, crate.y + 66, 11, PALETTE.ink, 'center');
      const prep = INGREDIENTS[crate.ing].prep;
      text(ctx, prep.includes('chop') && prep.includes('cook') ? 'POTONG+MASAK' : prep[0] === 'chop' ? 'POTONG' : 'MASAK', crate.x + crate.w / 2, crate.y + 78, 8, PALETTE.muted, 'center');
    }
  }

  function drawChop(state) {
    const s = STATIONS.chop;
    const near = nearestStation(state);
    const isNear = near && near.kind === 'chop';
    ctx.fillStyle = isNear ? '#c98f4e' : PALETTE.counterTop;
    roundRect(ctx, s.x, s.y, s.w, s.h, 8);
    ctx.fill();
    ctx.strokeStyle = PALETTE.woodDark;
    ctx.lineWidth = 2;
    roundRect(ctx, s.x, s.y, s.w, s.h, 8);
    ctx.stroke();
    // Wooden board.
    ctx.fillStyle = '#e8c98f';
    roundRect(ctx, s.x + 10, s.y + 16, s.w - 20, 44, 6);
    ctx.fill();
    ctx.strokeStyle = '#b98d4f';
    ctx.lineWidth = 1.5;
    roundRect(ctx, s.x + 10, s.y + 16, s.w - 20, 44, 6);
    ctx.stroke();
    if (state.chop) {
      drawIngredient(ctx, state.chop.ing, s.x + 34, s.y + 38, 15, 'raw');
      for (let i = 0; i < CHOP_HITS; i += 1) {
        ctx.fillStyle = i < state.chop.hits ? PALETTE.green : '#d8c49a';
        ctx.beginPath();
        ctx.arc(s.x + 62 + i * 18, s.y + 38, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      text(ctx, `POTONG ${state.chop.hits}/${CHOP_HITS}`, s.x + s.w / 2, s.y + 70, 11, PALETTE.ink, 'center');
    } else {
      // Knife resting on the board.
      ctx.fillStyle = '#dfe6ea';
      ctx.beginPath();
      ctx.moveTo(s.x + 30, s.y + 30);
      ctx.lineTo(s.x + 78, s.y + 30);
      ctx.lineTo(s.x + 86, s.y + 38);
      ctx.lineTo(s.x + 30, s.y + 38);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#5d3a1e';
      ctx.fillRect(s.x + 82, s.y + 32, 16, 5);
      text(ctx, 'TALENAN', s.x + s.w / 2, s.y + 70, 11, PALETTE.ink, 'center');
    }
  }

  function drawWok(state) {
    const s = STATIONS.wok;
    const near = nearestStation(state);
    const isNear = near && near.kind === 'wok';
    ctx.fillStyle = isNear ? '#c98f4e' : PALETTE.counterTop;
    roundRect(ctx, s.x, s.y, s.w, s.h, 8);
    ctx.fill();
    ctx.strokeStyle = PALETTE.woodDark;
    ctx.lineWidth = 2;
    roundRect(ctx, s.x, s.y, s.w, s.h, 8);
    ctx.stroke();
    state.burners.forEach((burner, i) => {
      const cx = s.x + 46 + i * 92;
      const cy = s.y + 34;
      ctx.fillStyle = '#2b1d12';
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4a3220';
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.fill();
      if (burner) {
        const frac = Math.min(1, burner.t / COOK_TIME);
        const burnt = burner.t >= BURN_TIME;
        const ready = burner.t >= COOK_TIME && !burnt;
        // Wok pan with the cooking ingredient.
        ctx.fillStyle = '#1f1a16';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 22, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        drawIngredient(ctx, burner.item.ing, cx, cy - 2, 12, burner.item.state);
        // Progress ring.
        ctx.strokeStyle = burnt ? PALETTE.red : ready ? PALETTE.gold : '#f2b705';
        ctx.lineWidth = ready ? 5 : 4;
        ctx.beginPath();
        ctx.arc(cx, cy, 28, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
        ctx.stroke();
      } else {
        text(ctx, 'KOMPOR', cx, cy, 10, '#cbb28a', 'center');
      }
    });
    const anyBurnt = state.burners.some((b) => b && b.t >= BURN_TIME);
    const anyReady = state.burners.some((b) => b && b.t >= COOK_TIME && b.t < BURN_TIME);
    text(ctx, anyBurnt ? 'WAJAN — ADA YANG GOSONG!' : anyReady ? 'WAJAN — ADA YANG SIAP!' : 'WAJAN — MASAK 5 DETIK', s.x + s.w / 2, s.y + 70, 10, anyBurnt ? '#ff9a8a' : anyReady ? '#ffd76a' : PALETTE.muted, 'center');
  }

  function drawPlateCounter(state) {
    const s = STATIONS.plate;
    const near = nearestStation(state);
    const isNear = near && near.kind === 'plate';
    const ready = state.plateDish;
    ctx.fillStyle = ready ? '#ffe9a8' : isNear ? '#c98f4e' : PALETTE.counterTop;
    roundRect(ctx, s.x, s.y, s.w, s.h, 8);
    ctx.fill();
    ctx.strokeStyle = ready ? PALETTE.gold : PALETTE.woodDark;
    ctx.lineWidth = ready ? 3 : 2;
    roundRect(ctx, s.x, s.y, s.w, s.h, 8);
    ctx.stroke();
    const cx = s.x + s.w / 2;
    const cy = s.y + 40;
    ctx.fillStyle = PALETTE.plate;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 40, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d8c49a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 40, 26, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, cy, 30, 18, 0, 0, Math.PI * 2);
    ctx.stroke();
    state.plate.forEach((item, i) => {
      const px = cx - 22 + i * 22;
      drawIngredient(ctx, item.ing, px, cy, 12, item.state);
    });
    if (ready) {
      text(ctx, `${ready.short} — SIAP!`, cx, s.y + 72, 12, '#7a4d00', 'center');
    } else {
      text(ctx, state.plate.length === 0 ? 'PIRING SAJI' : `PIRING (${state.plate.length}/3)`, cx, s.y + 72, 11, PALETTE.ink, 'center');
    }
  }

  function drawTrash(state) {
    const s = STATIONS.trash;
    const near = nearestStation(state);
    const isNear = near && near.kind === 'trash';
    ctx.fillStyle = isNear ? '#c98f4e' : PALETTE.counterTop;
    roundRect(ctx, s.x, s.y, s.w, s.h, 8);
    ctx.fill();
    ctx.strokeStyle = PALETTE.woodDark;
    ctx.lineWidth = 2;
    roundRect(ctx, s.x, s.y, s.w, s.h, 8);
    ctx.stroke();
    const cx = s.x + s.w / 2;
    ctx.fillStyle = '#5a6b7a';
    ctx.beginPath();
    ctx.moveTo(cx - 26, s.y + 14);
    ctx.lineTo(cx + 26, s.y + 14);
    ctx.lineTo(cx + 20, s.y + 62);
    ctx.lineTo(cx - 20, s.y + 62);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#46565f';
    ctx.fillRect(cx - 30, s.y + 8, 60, 8);
    text(ctx, 'SAMPAH', cx, s.y + 74, 11, PALETTE.ink, 'center');
  }

  function drawChef(state) {
    const chef = state.chef;
    const bob = chef.bob;
    const x = chef.x;
    const y = chef.y + bob * 0.4;
    // Shadow.
    ctx.fillStyle = 'rgba(43,29,18,0.25)';
    ctx.beginPath();
    ctx.ellipse(x, chef.y + 26, 24, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // Body: apron + shirt.
    ctx.fillStyle = '#e8543f';
    roundRect(ctx, x - 18, y - 6, 36, 30, 10);
    ctx.fill();
    ctx.fillStyle = '#fff8e6';
    roundRect(ctx, x - 13, y + 2, 26, 22, 7);
    ctx.fill();
    ctx.fillStyle = '#e8543f';
    ctx.fillRect(x - 18, y + 16, 6, 10);
    ctx.fillRect(x + 12, y + 16, 6, 10);
    // Head.
    ctx.fillStyle = '#f2c89b';
    ctx.beginPath();
    ctx.arc(x, y - 18, 15, 0, Math.PI * 2);
    ctx.fill();
    // Chef hat.
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x - 9, y - 30, 8, 0, Math.PI * 2);
    ctx.arc(x, y - 34, 9, 0, Math.PI * 2);
    ctx.arc(x + 9, y - 30, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - 14, y - 32, 28, 7);
    // Face: eyes look the way the chef faces.
    ctx.fillStyle = '#2b1d12';
    ctx.beginPath();
    ctx.arc(x - 5 + chef.face * 2, y - 18, 1.8, 0, Math.PI * 2);
    ctx.arc(x + 5 + chef.face * 2, y - 18, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2b1d12';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(x + chef.face * 2, y - 12, 4, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    // Carried ingredients ride above the chef.
    if (state.hands.length > 0) {
      const bw = state.hands.length * 34 + 10;
      ctx.fillStyle = 'rgba(43,29,18,0.85)';
      roundRect(ctx, x - bw / 2, y - 66, bw, 30, 9);
      ctx.fill();
      state.hands.forEach((item, i) => {
        const ix = x - bw / 2 + 22 + i * 34;
        drawIngredient(ctx, item.ing, ix, y - 51, 11, item.state);
        ctx.fillStyle = stateColour(item);
        ctx.beginPath();
        ctx.arc(ix + 9, y - 60, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  function drawParticles(state) {
    for (const p of state.particles) {
      const a = 1 - p.t / p.ttl;
      if (p.kind === 'steam') {
        ctx.fillStyle = `rgba(255,255,255,${0.5 * a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + p.t), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.globalAlpha = a;
        ctx.fillStyle = p.colour;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    for (const f of state.floaters) {
      ctx.globalAlpha = 1 - f.t / f.ttl;
      text(ctx, f.text, f.x, f.y, 17, f.colour, 'center');
      ctx.globalAlpha = 1;
    }
  }

  function drawHud(state, best) {
    ctx.fillStyle = PALETTE.hud;
    ctx.fillRect(0, 0, FIELD.width, 64);
    text(ctx, 'WARUNG RUSH', 24, 24, 26, PALETTE.hudText);
    text(ctx, 'Dapur Kilat — masak cepat, sajikan tepat waktu', 24, 48, 12, '#cbb28a');
    // Day timer, centre.
    const low = state.timeLeft < 30;
    text(ctx, 'SHIFT', 600, 18, 12, '#cbb28a', 'center');
    text(ctx, fmtTime(state.timeLeft), 600, 44, 30, low ? '#ff6b5e' : '#fff3d6', 'center');
    text(ctx, `TARGET ${state.target}`, 700, 44, 14, '#cbb28a', 'center');
    // Score block, right.
    text(ctx, `SKOR ${state.score}`, 1256, 24, 22, '#fff3d6', 'right');
    text(ctx, `TERSAJI ${state.served}   KOMBO x${state.combo}   HANGUS ${state.strikes}/${MAX_STRIKES}   TERBAIK ${best}`, 1256, 48, 13, '#cbb28a', 'right');
    // Day progress bar under the HUD.
    ctx.fillStyle = '#4a3220';
    ctx.fillRect(0, 64, FIELD.width, 5);
    ctx.fillStyle = '#f2b705';
    ctx.fillRect(0, 64, FIELD.width * (state.timeLeft / DAY_LENGTH), 5);
  }

  function drawPrompt(state) {
    if (!state.prompt || state.screen !== SCREEN_PLAY) return;
    ctx.font = `bold 15px ${FONT}`;
    const w = ctx.measureText(state.prompt).width + 36;
    ctx.fillStyle = 'rgba(43,29,18,0.88)';
    roundRect(ctx, (FIELD.width - w) / 2, 676, w, 32, 16);
    ctx.fill();
    text(ctx, state.prompt, FIELD.width / 2, 693, 15, '#ffe9b8', 'center');
  }

  function drawTitle(state, best) {
    ctx.fillStyle = 'rgba(43,29,18,0.62)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = '#fff8e6';
    roundRect(ctx, 240, 120, 800, 480, 20);
    ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 4;
    roundRect(ctx, 240, 120, 800, 480, 20);
    ctx.stroke();
    text(ctx, 'WARUNG RUSH', 640, 190, 72, '#d63c2f', 'center');
    text(ctx, '— DAPUR KILAT —', 640, 248, 26, '#7a4d00', 'center');
    text(ctx, 'Masak cepat, sajikan tepat waktu — sebelum pelanggan kabur!', 640, 292, 18, PALETTE.ink, 'center');
    const steps = [
      '1  AMBIL bahan mentah dari pantry (klik peti / tekan E)',
      '2  POTONG di talenan, MASAK di wajan — jangan sampai gosong!',
      '3  TATA di piring saji sampai resepnya lengkap',
      '4  SAJIKAN di jendela sebelum waktu pesanan habis',
    ];
    steps.forEach((line, i) => text(ctx, line, 640, 340 + i * 32, 17, PALETTE.ink, 'center'));
    text(ctx, `Target shift: ${TARGET_SCORE} poin dalam ${fmtTime(DAY_LENGTH)}  •  3 pesanan hangus = shift berakhir`, 640, 486, 15, PALETTE.muted, 'center');
    text(ctx, 'WASD / panah bergerak  •  E beraksi  •  P jeda  •  M suara', 640, 520, 15, PALETTE.muted, 'center');
    if (best > 0) text(ctx, `Skor terbaik: ${best}`, 640, 552, 15, '#7a4d00', 'center');
    text(ctx, 'TEKAN ENTER ATAU KLIK UNTUK MULAI', 640, 580, 18, '#d63c2f', 'center');
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(43,29,18,0.6)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    text(ctx, 'JEDA', 640, 330, 64, '#fff3d6', 'center');
    text(ctx, 'Tekan P / Esc untuk lanjut  •  R untuk mulai ulang', 640, 390, 18, '#ffe9b8', 'center');
  }

  function drawOver(state, best) {
    const result = state.result;
    ctx.fillStyle = 'rgba(43,29,18,0.66)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = '#fff8e6';
    roundRect(ctx, 340, 150, 600, 420, 20);
    ctx.fill();
    ctx.strokeStyle = result.win ? PALETTE.gold : PALETTE.red;
    ctx.lineWidth = 4;
    roundRect(ctx, 340, 150, 600, 420, 20);
    ctx.stroke();
    text(ctx, result.win ? 'SHIFT SELESAI!' : 'WARUNG TUTUP…', 640, 220, 52, result.win ? '#3d9b4f' : '#d63c2f', 'center');
    text(ctx, result.win ? 'Pelanggan pulang kenyang. Kerja bagus, Chef!' : 'Target tidak tercapai — coba lagi besok!', 640, 268, 18, PALETTE.ink, 'center');
    // Stars.
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = i < result.stars ? PALETTE.gold : '#d8c49a';
      const sx = 640 - 70 + i * 70;
      ctx.beginPath();
      for (let k = 0; k < 10; k += 1) {
        const r = k % 2 === 0 ? 26 : 11;
        const a = -Math.PI / 2 + (k * Math.PI) / 5;
        const px = sx + Math.cos(a) * r;
        const py = 320 + Math.sin(a) * r;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
    text(ctx, `SKOR  ${result.score}  (target ${TARGET_SCORE})`, 640, 392, 22, PALETTE.ink, 'center');
    text(ctx, `Pesanan tersaji: ${result.served}   •   Kombo terbaik: x${result.bestCombo}`, 640, 430, 17, PALETTE.muted, 'center');
    if (best > 0) text(ctx, `Skor terbaik: ${best}`, 640, 462, 16, '#7a4d00', 'center');
    text(ctx, 'TEKAN R UNTUK MAIN LAGI', 640, 520, 18, '#d63c2f', 'center');
  }

  function draw(state, screen, best) {
    ctx.clearRect(0, 0, FIELD.width, FIELD.height);
    drawBackground();
    drawBoard(state);
    drawServeWindow(state);
    drawPantry(state);
    drawChop(state);
    drawWok(state);
    drawPlateCounter(state);
    drawTrash(state);
    drawChef(state);
    drawParticles(state);
    drawHud(state, best);
    drawPrompt(state);
    if (screen === SCREEN_TITLE) drawTitle(state, best);
    else if (screen === SCREEN_PAUSED) drawPaused();
    else if (screen === SCREEN_OVER) drawOver(state, best);
  }

  return { draw, ctx };
}
