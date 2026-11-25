[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Rizaltri13/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Rizaltri13/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

# Warung Rush — Dapur Kilat

A complete, original cooking game built for the
[make.fun best cooking game bounty](https://make.fun/bounty/best-cooking-game-20261125-0137).
You run a small Indonesian warung kitchen: take orders from the board, grab
raw ingredients from the pantry, chop them on the talenan, fry them in the
wajan (but not too long — they burn!), stack them on the plating counter,
and serve the finished dish at the window before the ticket runs out.

## How to play

- **Move:** WASD / arrow keys, or click anywhere on the floor (click a
  station to walk there and use it).
- **Act:** E or Space near a station — or click the station.
- **Pause:** P or Esc. **Restart:** R. **Mute:** M.

### The loop

1. **Pantry** — take raw ingredients (Nasi, Mie, Telur, Ayam, Cabai,
   Daun Bawang). Hands hold at most 3.
2. **Talenan (chopping board)** — chop what needs chopping (3 hits).
   Ayam needs chop *then* fry; Cabai and Daun Bawang only need chopping.
3. **Wajan (wok)** — fry for 5 seconds. Take it out in time: past
   8.5 seconds it burns and must go in the trash.
4. **Piring saji (plating counter)** — stack the finished components.
   When the plate matches a ticket exactly, the dish is ready.
5. **Serve window** — serve the ready plate. Fast serves pay more, and
   serving in a row builds a combo multiplier (up to x2).

### Recipes

| Dish | Needs |
| --- | --- |
| Nasi Goreng Kilat | cooked rice + cooked egg + chopped chili |
| Mie Ayam Mantap | cooked noodle + cooked chicken + chopped scallion |
| Ayam Geprek Kilat | cooked chicken + chopped chili + cooked egg |
| Mie Goreng Pedas | cooked noodle + cooked egg + chopped chili |

### Win / lose

One shift lasts 2:30. Reach the **900-point target** before the clock runs
out. An order that runs out of patience is a strike — **3 strikes** ends
the shift early. Score stars: 900+ = 1★, 1200+ = 2★, 1500+ = 3★.

## Play it

No build step, no network — just static files under `game/`:

```sh
node serve.ts
# open http://localhost:8080
```

Screenshots live under `screenshots/` (title, mid-play, serve moment, and
the win screen), staged with `?shot=title|play|serve|win&seed=1`.

## Structure

```
main.ts                  hand-in program (Node 22, stdlib only)
vendor/makefun-game.ts   make.fun dossier library, unchanged from the kit
game/
  index.html             canvas page, loads the modules below
  src/config.js          tuning, recipes, stations, palette
  src/engine.js          kitchen rules (orders, chop/cook/plate/serve)
  src/icons.js           vector-drawn ingredient art
  src/render.js          everything painted on the canvas
  src/input.js           keyboard + mouse
  src/audio.js           synthesized WebAudio sound, no audio files
  src/shots.js           staged screenshot scenes
  src/main.js            boot + game loop
screenshots/            4 real renders of the game
```

All art and sound are original and drawn/synthesized in code. Built with
[Muse](https://muse.ai) for the make.fun bounty.
