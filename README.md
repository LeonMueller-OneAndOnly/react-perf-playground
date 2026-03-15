# React Position Update Benchmark

This repo benchmarks three React patterns for updating a `div` position using `transform: translate(...)`.

## What is measured

For each variant, the benchmark repeatedly renders updates with changing `x` and `y` values and records per-update render time.

Variants:

1. `A: inline style prop` - sets `style={{ transform: ... }}` in render.
2. `B: ref + useLayoutEffect` - updates `elm.style.transform` inside `useLayoutEffect`.
3. `C: callback ref` - updates `elm.style.transform` in a ref callback.

Reported metrics:

- Mean update time
- P50 update time
- P95 update time
- Min / Max update time
- Relative slowdown vs fastest variant

Current benchmark configuration (in `benchmark.mjs`):

- `rounds = 7`
- `iterations = 10000` updates per round per variant
- `warmup = 250` updates per round per variant

## How to run

Requirements:

- Node.js 18+
- npm

Install dependencies:

```bash
npm install
```

Run benchmark:

```bash
npm run bench
```

Run real-browser benchmark (headless Chromium):

```bash
npm run bench:browser
```

This command executes `browser-benchmark.html` in headless Chromium and prints a parsed CLI table.

Browser benchmark design (more realistic):

- Uses a real renderer/compositor (Chromium headless).
- Runs three scenarios: `100`, `500`, and `1000` moving elements.
- Every measured frame updates all elements.
- Current browser config in `browser-benchmark.html`:
  - `warmupFrames = 60`
  - `measureFrames = 360`
  - `updatesPerFrame = 6`
- Captures both:
  - React update/commit time (`flushSync` render timing)
  - Frame interval timing (`requestAnimationFrame` deltas)
- Reports frame jank share (`Frames >16.7ms`).

## Notes

- `npm run bench` runs in Node.js using `jsdom`.
- `npm run bench:browser` runs in a real Chromium renderer (headless) and is more realistic than jsdom.
- For final decisions across users/devices, still validate in full Chrome/Firefox/Safari with DevTools Performance and React Profiler.
