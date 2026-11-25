# Warung Rush — Dapur Kilat — dossier

## What it is

A complete, original cooking game for the make.fun best-cooking-game
bounty. One chef, one warung kitchen, one 2:30 shift: orders arrive on the
board with a patience timer, and the player routes the chef between the
pantry, the chopping board, the wok, the plating counter and the serve
window to cook and serve them before they expire.

## The rules, in one paragraph

Six raw ingredients, four recipes. Each ingredient needs its own prep
chain — chop, fry, or chop-then-fry (chicken) — and the wok burns food
left past 8.5 seconds. Hands hold 3 items; the plate holds 3. A plate
that exactly matches an active ticket becomes a finished dish; serving
it pays 100 points plus 2 per second of patience left, times a combo
multiplier that grows with consecutive serves (max x2). Three expired
orders end the shift early; reaching 900 points by the end of the shift
wins, with stars at 900 / 1200 / 1500.

## Why it is fun

Orders force a real route through the kitchen — you cannot just stand at
one station — and the two-burner wok plus the 3-hit chopping make every
dish a small plan: start the rice frying, chop the chicken while it
cooks, plate the egg in between. Pressure grows because tickets arrive
every ~14 seconds while patience is only 30.

## Files

- `game/src/config.js` — tuning, recipes, station geometry, palette
- `game/src/engine.js` — all kitchen rules, no DOM (unit-tested in Node)
- `game/src/icons.js` — vector ingredient art (no image files)
- `game/src/render.js` — canvas painting: kitchen, tickets, HUD, overlays
- `game/src/input.js` — keyboard + mouse (click-to-move, click-to-use)
- `game/src/audio.js` — synthesized WebAudio sounds, no audio files
- `game/src/shots.js` — staged screenshot scenes from real game states
- `game/src/main.js` — boot + fixed-step loop
- `main.ts` — hand-in program; `serve.ts` — local static server

## Screenshots

1. `1-title.jpg` — title screen over the kitchen, two tickets waiting
2. `2-play.jpg` — mid-play: 3 tickets, chicken being chopped (2/3),
   rice frying, noodle ready, plate mid-assembly, 1:44 on the clock
3. `3-serve.jpg` — Nasi Goreng complete on the plate, chef at the
   serve window, +148 floater, combo x3
4. `4-win.jpg` — shift complete: 3 stars, 1620 points, 7 dishes served
