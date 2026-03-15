import { spawnSync } from 'node:child_process'

function decodeHtmlEntities(input) {
  return input
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&#39;', "'")
}

function extractResultJson(domText) {
  const match = domText.match(/<div id="result-json">([\s\S]*?)<\/div>/)
  if (!match) {
    throw new Error('Could not find #result-json in Chromium output.')
  }
  return JSON.parse(decodeHtmlEntities(match[1]).trim())
}

function formatMs(ms) {
  return `${ms.toFixed(3)} ms`
}

function printResults(payload) {
  console.log(`Environment: ${payload.env}`)
  console.log(
    `Warmup frames: ${payload.warmupFrames}, measured frames: ${payload.measureFrames}, updates/frame: ${payload.updatesPerFrame}\n`
  )

  payload.scenarios.forEach((scenario) => {
    const sorted = [...scenario.results].sort((a, b) => a.meanCommit - b.meanCommit)
    const fastest = sorted[0].meanCommit

    console.log(`Scenario: ${scenario.count} elements`)
    console.log('Rank | Variant                  | Mean commit | P95 commit | Mean frame | P95 frame | Frames >16.7ms | Slower vs fastest')
    console.log('-----+--------------------------+-------------+------------+------------+-----------+----------------+------------------')

    sorted.forEach((result, idx) => {
      const delta = fastest > 0 ? (result.meanCommit / fastest - 1) * 100 : 0
      const slower = idx === 0 ? 'baseline' : `+${delta.toFixed(1)}%`
      const line = [
        String(idx + 1).padEnd(4, ' '),
        result.name.padEnd(24, ' '),
        formatMs(result.meanCommit).padEnd(11, ' '),
        formatMs(result.p95Commit).padEnd(10, ' '),
        formatMs(result.meanFrame).padEnd(10, ' '),
        formatMs(result.p95Frame).padEnd(9, ' '),
        `${result.jankPct.toFixed(1)}%`.padEnd(14, ' '),
        slower
      ].join(' | ')
      console.log(line)
    })

    console.log('')
  })
}

function main() {
  const chromeBin = process.env.CHROME_BIN || 'chromium'
  const htmlPath = 'file:///home/ubuntu/apps/react-perf-playground/browser-benchmark.html'

  const run = spawnSync(
    chromeBin,
    [
      '--headless',
      '--disable-gpu',
      '--dump-dom',
      htmlPath
    ],
    { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }
  )

  if (run.error) throw run.error
  if (run.status !== 0) {
    process.stderr.write(run.stderr || 'Chromium run failed.\n')
    process.exit(run.status ?? 1)
  }

  if (!run.stdout.includes('<div id="status">Done</div>')) {
    throw new Error('Benchmark did not finish within Chromium virtual time budget.')
  }

  const payload = extractResultJson(run.stdout)
  printResults(payload)
}

main()
