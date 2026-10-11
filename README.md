# Refract

Refract is a browser puzzle game about drawing light across a dark optical
bench. Each board is a lattice of emitters, lenses, and crystals. You trace one
beam for each color channel, connect that channel's two emitters, thread every
matching lens, and spend every crystal charge exactly once.

The game has two modes:

- Campaign: 24 hand-built boards with a board-select grid and session progress.
- Cascade: an endless sequence of generated boards that climbs through five
  tiers of density and channel count.

## Install

```sh
npm ci
```

## Development

```sh
npm run dev
```

Open the Vite URL printed in the terminal. The game runs entirely in the
browser; there is no backend and no runtime asset download.

## Production Build

```sh
npm run build
```

The static site is emitted to `dist/` with `dist/index.html` as its entry point.

## Controls

- Pointer: press a node and drag across adjacent nodes to draw or unwind a beam.
- Arrow keys or WASD: move menu and board-select highlights.
- Enter or Space: confirm the highlighted choice.
- Escape: go back.
- R: clear the current board.
- M: mute or unmute audio.

Moves that break the light rules simply do not take, so you can trace fluidly and
let the board refuse illegal segments.
