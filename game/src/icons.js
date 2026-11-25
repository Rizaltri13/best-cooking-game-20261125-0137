// Warung Rush — every ingredient drawn as a little vector picture, so the
// game needs no image files and looks the same in every browser.
// drawIngredient(ctx, ing, cx, cy, r, state): ing is a key of INGREDIENTS,
// r the radius to draw inside, state raw | chopped | cooked | burnt.

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function wavy(ctx, x, y, w, amp, colour, width) {
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  for (let i = 0; i <= 4; i += 1) {
    const px = x - w / 2 + (w / 4) * i;
    const py = y + (i % 2 === 0 ? -amp : amp);
    ctx.quadraticCurveTo(px - w / 8, y + (i % 2 === 0 ? amp : -amp), px, py);
  }
  ctx.stroke();
}

export function drawIngredient(ctx, ing, cx, cy, r, state = 'raw') {
  ctx.save();
  ctx.translate(cx, cy);
  const s = r / 20; // drawings are authored in a 40x40 box
  ctx.scale(s, s);
  if (state === 'burnt') {
    ctx.fillStyle = '#3a2c22';
    ellipse(ctx, 0, 2, 15, 11);
    ctx.fillStyle = '#241a12';
    ellipse(ctx, -4, -3, 9, 6);
    ctx.strokeStyle = 'rgba(120,120,120,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, -8);
    ctx.quadraticCurveTo(-10, -16, -6, -20);
    ctx.moveTo(4, -8);
    ctx.quadraticCurveTo(8, -16, 4, -20);
    ctx.stroke();
    ctx.restore();
    return;
  }
  switch (ing) {
    case 'rice': {
      ctx.fillStyle = state === 'cooked' ? '#f7e3a1' : '#fbf6ea';
      ellipse(ctx, 0, 4, 16, 10);
      ctx.fillStyle = state === 'cooked' ? '#e8c96a' : '#e8dfc8';
      for (const [gx, gy] of [[-8, 0], [-2, -3], [5, -1], [9, 3], [0, 4]]) {
        ellipse(ctx, gx, gy, 2.2, 1.4);
      }
      if (state === 'cooked') {
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-4, -8);
        ctx.quadraticCurveTo(-7, -14, -4, -18);
        ctx.moveTo(4, -8);
        ctx.quadraticCurveTo(7, -14, 4, -18);
        ctx.stroke();
      }
      break;
    }
    case 'noodle': {
      ctx.fillStyle = '#d98e2b';
      ellipse(ctx, 0, 6, 16, 7);
      wavy(ctx, 0, -2, 28, 3.5, '#f2c14e', 3.4);
      wavy(ctx, 0, 3, 28, 3.5, '#e8a93a', 3.4);
      wavy(ctx, 0, 8, 24, 3, '#f7d774', 3);
      break;
    }
    case 'egg': {
      if (state === 'cooked') {
        ctx.fillStyle = '#fff8e0';
        ellipse(ctx, 0, 2, 16, 11);
        ctx.fillStyle = '#f39c12';
        ellipse(ctx, 2, 1, 7, 6);
        ctx.fillStyle = '#f7b731';
        ellipse(ctx, 0, -1, 3.5, 3);
      } else {
        ctx.fillStyle = '#fdf6e3';
        ellipse(ctx, 0, 0, 12, 15);
        ctx.fillStyle = '#f3e3b3';
        ellipse(ctx, -3, -4, 5, 7);
      }
      break;
    }
    case 'chicken': {
      ctx.fillStyle = state === 'chopped' ? '#e8a06a' : '#d97b4a';
      ctx.beginPath();
      ctx.ellipse(0, 2, 13, 10, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = state === 'cooked' ? '#a85a28' : '#c96a3a';
      ctx.beginPath();
      ctx.ellipse(-2, 0, 9, 6, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f6ead6';
      ctx.lineWidth = 3.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(10, -6);
      ctx.lineTo(17, -13);
      ctx.stroke();
      ctx.fillStyle = '#f6ead6';
      ellipse(ctx, 18, -14, 3.4, 3.4);
      ellipse(ctx, 15, -11, 2.6, 2.6);
      if (state === 'chopped') {
        ctx.strokeStyle = '#8a5a33';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-8, -4);
        ctx.lineTo(4, 6);
        ctx.stroke();
      }
      break;
    }
    case 'chili': {
      ctx.fillStyle = state === 'chopped' ? '#c22e22' : '#e23b2e';
      ctx.beginPath();
      ctx.moveTo(-13, -8);
      ctx.quadraticCurveTo(2, -16, 13, -2);
      ctx.quadraticCurveTo(14, 6, 6, 8);
      ctx.quadraticCurveTo(-6, 8, -13, -8);
      ctx.fill();
      ctx.strokeStyle = '#3d9b4f';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-12, -8);
      ctx.quadraticCurveTo(-16, -14, -11, -17);
      ctx.stroke();
      if (state === 'chopped') {
        ctx.fillStyle = '#ffd76a';
        for (const [sx, sy] of [[-6, -2], [2, 0], [7, 3]]) {
          ellipse(ctx, sx, sy, 2.6, 2.6);
        }
      }
      break;
    }
    case 'scallion': {
      ctx.strokeStyle = '#4caf50';
      ctx.lineCap = 'round';
      ctx.lineWidth = 4.4;
      for (const [x0, tilt] of [[-9, -3], [0, 0], [9, 3]]) {
        ctx.beginPath();
        ctx.moveTo(x0, 12);
        ctx.quadraticCurveTo(x0 + tilt, -4, x0 + tilt * 2, -15);
        ctx.stroke();
      }
      ctx.strokeStyle = '#e8f5e9';
      ctx.lineWidth = 4.4;
      ctx.beginPath();
      ctx.moveTo(-9, 12);
      ctx.lineTo(-9, 16);
      ctx.moveTo(0, 12);
      ctx.lineTo(0, 16);
      ctx.moveTo(9, 12);
      ctx.lineTo(9, 16);
      ctx.stroke();
      if (state === 'chopped') {
        ctx.fillStyle = '#81c784';
        for (const [rx, ry] of [[-8, 4], [0, 8], [8, 4], [-3, -2], [4, -4]]) {
          ellipse(ctx, rx, ry, 3.4, 2.2);
        }
      }
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

/** A small state tag under an ingredient: MENTAH / POTONG / MATANG / GOSONG. */
export function stateTag(item) {
  if (item.state === 'raw') return 'MENTAH';
  if (item.state === 'chopped') return 'POTONG';
  if (item.state === 'cooked') return 'MATANG';
  return 'GOSONG';
}

export function stateColour(item) {
  if (item.state === 'raw') return '#8a9ba8';
  if (item.state === 'chopped') return '#7bc96f';
  if (item.state === 'cooked') return '#f2b705';
  return '#5a4632';
}
