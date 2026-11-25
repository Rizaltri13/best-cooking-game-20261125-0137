// Warung Rush — boot and the one loop: input is read every frame, the
// kitchen advances in fixed 1/60 s steps, and the renderer paints it.
// Screens: title, play, paused, game over.
// ?seed=N fixes the order mix. ?shot=title|play|serve|win stages that scene
// instead of running the loop, paints it twice and sets window.__shotReady.

import { BEST_KEY, STEP } from './config.js';
import { createKitchen, goToPoint, goToStation, interact, resetKitchen, stationAtPoint, stepKitchen, EVENT_EXPIRED, EVENT_NONE, EVENT_OVER } from './engine.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';
import { playSound, setMuted } from './audio.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const state = createKitchen(seed);
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off: the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, state);
  let painted = 0;
  function paint() {
    renderer.draw(state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  // Debug hook for automated play-tests (read-only state + screen).
  window.__warung = {
    state,
    screen: () => screen,
    start: startGame,
  };

  function startGame() {
    resetKitchen(state);
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Playing. Serve dishes before the tickets run out!');
  }

  function endGame(events) {
    screen = SCREEN_OVER;
    if (state.score > best) {
      best = state.score;
      saveBest(best);
    }
    playSound(state.result && state.result.win ? 'win' : 'lose');
    announce(`Shift over. Score ${state.score}. Best ${best}.`);
  }

  function doInteract() {
    const event = interact(state, null);
    playSound(event);
    if (event === 'serve') announce(`Served! Score ${state.score}.`);
  }

  function handleClick() {
    const point = input.takeClick();
    if (!point) return;
    if (screen === SCREEN_TITLE) {
      startGame();
      return;
    }
    if (screen === SCREEN_OVER) {
      startGame();
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    playSound('click');
    const station = stationAtPoint(point.x, point.y);
    if (station) goToStation(state, station);
    else goToPoint(state, point.x, point.y);
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      state.muted = !state.muted;
      setMuted(state.muted);
      announce(state.muted ? 'Sound off.' : 'Sound on.');
    }
    if (actions & ACTION_RESTART && (screen === SCREEN_PLAY || screen === SCREEN_OVER || screen === SCREEN_PAUSED)) {
      startGame();
      return;
    }
    if (actions & ACTION_CONFIRM && screen === SCREEN_TITLE) startGame();
    else if (actions & ACTION_CONFIRM && screen === SCREEN_OVER) startGame();
    else if (actions & ACTION_CONFIRM && screen === SCREEN_PLAY) doInteract();
    else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      state.screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & ACTION_PAUSE && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      state.screen = SCREEN_PLAY;
      announce('Playing.');
    }
  }

  function step() {
    if (screen !== SCREEN_PLAY) return EVENT_NONE;
    const events = stepKitchen(state, STEP, input.keys);
    if (events & EVENT_EXPIRED) playSound('expire');
    if (events & EVENT_OVER) endGame(events);
    return events;
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleClick();
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        step();
        accumulator -= STEP;
      }
      if (screen === SCREEN_TITLE) accumulator = 0;
    } else {
      accumulator = 0;
    }
    state.screen = screen;
    renderer.draw(state, screen, best);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      state.screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Warung Rush. Press Enter or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
