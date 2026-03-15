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

## Notes

- This benchmark runs in Node.js using `jsdom`, not a real browser rendering pipeline.
- Use it for relative directional comparison, not absolute production timing.
- For final decisions, validate in Chrome/Firefox/Safari with React Profiler or browser `performance` traces.
