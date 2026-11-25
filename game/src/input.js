// Warung Rush — keyboard and mouse, translated into game actions.
// Keys are read every frame; clicks are queued and taken once per frame,
// so a click never fires twice and never gets lost between frames.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_RESTART = 4;
export const ACTION_MUTE = 8;

const KEY_ACTIONS = {
  Enter: ACTION_CONFIRM,
  ' ': ACTION_CONFIRM,
  e: ACTION_CONFIRM,
  E: ACTION_CONFIRM,
  p: ACTION_PAUSE,
  P: ACTION_PAUSE,
  Escape: ACTION_PAUSE,
  r: ACTION_RESTART,
  R: ACTION_RESTART,
  m: ACTION_MUTE,
  M: ACTION_MUTE,
};

const KEY_DIRS = {
  ArrowUp: 'up',
  w: 'up',
  W: 'up',
  ArrowDown: 'down',
  s: 'down',
  S: 'down',
  ArrowLeft: 'left',
  a: 'left',
  A: 'left',
  ArrowRight: 'right',
  d: 'right',
  D: 'right',
};

export function createInput(canvas) {
  const keys = { up: false, down: false, left: false, right: false };
  let actions = 0;
  let click = null;
  let clickCount = 0;

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 1280,
      y: ((event.clientY - rect.top) / rect.height) * 720,
    };
  }

  window.addEventListener('keydown', (event) => {
    const dir = KEY_DIRS[event.key];
    if (dir) {
      keys[dir] = true;
      event.preventDefault();
      return;
    }
    const action = KEY_ACTIONS[event.key];
    if (action) {
      actions |= action;
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => {
    const dir = KEY_DIRS[event.key];
    if (dir) keys[dir] = false;
  });
  window.addEventListener('blur', () => {
    keys.up = keys.down = keys.left = keys.right = false;
  });
  canvas.addEventListener('mousedown', (event) => {
    click = toLogical(event);
    clickCount += 1;
    event.preventDefault();
  });

  return {
    /** Held movement keys, read every frame. */
    keys,
    /** One-shot actions since the last take; clears on read. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** The latest click's logical point, or null; clears on read. */
    takeClick() {
      const taken = click;
      click = null;
      return taken;
    },
    clickCount() {
      return clickCount;
    },
  };
}
