import { JSDOM } from 'jsdom'
import React, { useLayoutEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'

const dom = new JSDOM('<!doctype html><html><body></body></html>')
global.window = dom.window
global.document = dom.window.document
global.Node = dom.window.Node
global.HTMLElement = dom.window.HTMLElement
Object.defineProperty(globalThis, 'navigator', {
  value: dom.window.navigator,
  configurable: true
})

function ExampleA({ x, y }) {
  return React.createElement('div', {
    style: { transform: `translate(${x}px, ${y}px)` }
  })
}

function ExampleB({ x, y }) {
  const elementRef = useRef(null)
  useLayoutEffect(() => {
    const elm = elementRef.current
    if (!elm) return
    elm.style.transform = `translate(${x}px, ${y}px)`
  }, [x, y])
  return React.createElement('div', { ref: elementRef })
}

function ExampleC({ x, y }) {
  return React.createElement('div', {
    ref: (elm) => {
      if (elm) elm.style.transform = `translate(${x}px, ${y}px)`
    }
  })
}

const variants = [
  { name: 'A: inline style prop', Component: ExampleA },
  { name: 'B: ref + useLayoutEffect', Component: ExampleB },
  { name: 'C: callback ref', Component: ExampleC }
]

function stats(valuesMs) {
  const sorted = [...valuesMs].sort((a, b) => a - b)
  const n = sorted.length
  const sum = sorted.reduce((acc, v) => acc + v, 0)
  const mean = sum / n
  const p50 = sorted[Math.floor((n - 1) * 0.5)]
  const p95 = sorted[Math.floor((n - 1) * 0.95)]
  const min = sorted[0]
  const max = sorted[n - 1]
  return { mean, p50, p95, min, max }
}

function format(ms) {
  return `${ms.toFixed(3)} ms`
}

function renderLoop(Component, iterations, warmup) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)

  flushSync(() => {
    root.render(React.createElement(Component, { x: 0, y: 0 }))
  })

  for (let i = 0; i < warmup; i += 1) {
    flushSync(() => {
      root.render(React.createElement(Component, { x: i, y: -i }))
    })
  }

  const times = []
  for (let i = 0; i < iterations; i += 1) {
    const start = performance.now()
    flushSync(() => {
      root.render(React.createElement(Component, { x: i, y: i * 2 }))
    })
    times.push(performance.now() - start)
  }

  flushSync(() => {
    root.unmount()
  })
  host.remove()

  return stats(times)
}

function printTable(results) {
  const sorted = [...results].sort((a, b) => a.mean - b.mean)
  const fastest = sorted[0].mean
  const header = ['Rank', 'Variant', 'Mean', 'P50', 'P95', 'Min', 'Max', 'Slower vs fastest']
  const rows = sorted.map((r, idx) => {
    const delta = ((r.mean / fastest - 1) * 100)
    const slower = delta <= 0.0001 ? 'baseline' : `+${delta.toFixed(1)}%`
    return [
      String(idx + 1),
      r.name,
      format(r.mean),
      format(r.p50),
      format(r.p95),
      format(r.min),
      format(r.max),
      slower
    ]
  })

  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)))
  const sep = widths.map((w) => '-'.repeat(w)).join('-+-')

  const line = (cells) => cells.map((c, i) => c.padEnd(widths[i], ' ')).join(' | ')

  console.log(line(header))
  console.log(sep)
  rows.forEach((r) => console.log(line(r)))
}

function main() {
  const iterations = 10000
  const warmup = 250
  const rounds = 7

  const aggregate = new Map(variants.map((v) => [v.name, []]))

  for (let round = 0; round < rounds; round += 1) {
    variants.forEach(({ name, Component }) => {
      const r = renderLoop(Component, iterations, warmup)
      aggregate.get(name).push(r)
    })
  }

  const results = variants.map(({ name }) => {
    const runs = aggregate.get(name)
    return {
      name,
      mean: runs.reduce((acc, r) => acc + r.mean, 0) / rounds,
      p50: runs.reduce((acc, r) => acc + r.p50, 0) / rounds,
      p95: runs.reduce((acc, r) => acc + r.p95, 0) / rounds,
      min: Math.min(...runs.map((r) => r.min)),
      max: Math.max(...runs.map((r) => r.max))
    }
  })

  console.log(`Rounds: ${rounds}, iterations/round: ${iterations}, warmup/round: ${warmup}\n`)
  printTable(results)

  const winner = [...results].sort((a, b) => a.mean - b.mean)[0]
  console.log(`\nFastest in this benchmark: ${winner.name} (${format(winner.mean)} mean)`)
  console.log('Note: this runs in Node + jsdom; validate in a real browser for production decisions.')
}

main()
