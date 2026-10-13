import fs from 'node:fs'
import path from 'node:path'
import { fourPlumbingFixturesPattern, eightPlumbingFixturesPattern } from './engine-fixture-patterns.mjs'

const site = 'https://blueprint-estimator.vercel.app'
const requestSpacingMs = 25_000
const maxAttempts = 3
const allowedProviderModels = new Set(['gemini-3.8-flash', 'gemini-3.5-flash-lite'])
let lastRequestStartedAt = 0

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const cases = [
  {
    id: 'concrete_C01',
    trade: 'Concrete & Masonry',
    files: ['tests/fixtures/concrete_C01.pdf'],
    ceilingHeight: 'Not specified',
    scale: '1/4" = 1\'-0"',
    assertions: [
      { name: '600 SF slab area', pattern: /600\s*(?:\|\s*)?(SF|sq\.?\s*ft|square feet)/i },
      { name: 'approximately 7.41 CY concrete', pattern: /7(?:\.4|\.41)\s*(?:\|\s*)?(CY|cu\.?\s*yd|cubic yard)/i },
    ],
  },
  {
    id: 'paint_P01',
    trade: 'Painter',
    files: ['tests/fixtures/paint_P01.pdf'],
    ceilingHeight: '8 ft',
    scale: '1/4" = 1\'-0"',
    assertions: [
      { name: '715 SF net painted wall area', pattern: /715\s*(?:\|\s*)?(SF|sq\.?\s*ft|square feet)/i },
    ],
  },
  {
    id: 'plumbing_PL01',
    trade: 'Plumber',
    files: ['tests/fixtures/plumbing_PL01.pdf'],
    ceilingHeight: 'Not specified',
    scale: 'Unknown / Not Provided',
    assertions: [
      { name: 'four plumbing fixtures', pattern: fourPlumbingFixturesPattern },
      { name: 'does not double-count to eight fixtures', pattern: eightPlumbingFixturesPattern, absent: true },
    ],
  },
  {
    id: 'gc_GC01_multisheet_priced',
    trade: 'General Contractor',
    files: ['tests/fixtures/concrete_C01.pdf', 'tests/fixtures/plumbing_PL01.pdf'],
    ceilingHeight: 'Not specified',
    scale: 'Auto Detect / Mixed Sheets',
    costBasis: 'Concrete: $145/CY — user-supplied controlled QA pricing basis.',
    allowCurrency: true,
    assertions: [
      { name: 'GC preserves 600 SF concrete quantity', pattern: /600\s*(?:\|\s*)?(SF|sq\.?\s*ft|square feet)/i },
      { name: 'GC preserves approximately 7.41 CY concrete', pattern: /7(?:\.4|\.41)\s*(?:\|\s*)?(CY|cu\.?\s*yd|cubic yard)/i },
      { name: 'GC counts four plumbing fixtures', pattern: fourPlumbingFixturesPattern },
      { name: 'GC does not double-count plumbing to eight', pattern: eightPlumbingFixturesPattern, absent: true },
      { name: 'SheetLink section is present', pattern: /SheetLink/i },
      { name: 'Conflict Radar section is present', pattern: /Conflict Radar/i },
      { name: 'user-supplied $145 per CY survives pricing guard', pattern: /\$\s*145(?:\.00)?\b/i },
    ],
  },
]

fs.mkdirSync('qa-results', { recursive: true })

function formFor(testCase) {
  const form = new FormData()
  for (const filePath of testCase.files) {
    const bytes = fs.readFileSync(filePath)
    form.append('files', new Blob([bytes], { type: 'application/pdf' }), path.basename(filePath))
  }
  form.append('trade', testCase.trade)
  form.append('ceilingHeight', testCase.ceilingHeight)
  form.append('projectType', 'Controlled QA Fixture')
  form.append('location', 'QA Test')
  form.append('sqft', 'Not specified')
  form.append('floors', '1')
  form.append('laborRate', 'Not specified')
  form.append('costBasis', testCase.costBasis || 'Not specified')
  form.append('scale', testCase.scale)
  return form
}

async function paceRequest() {
  const elapsed = Date.now() - lastRequestStartedAt
  if (lastRequestStartedAt && elapsed < requestSpacingMs) {
    const waitMs = requestSpacingMs - elapsed
    console.log(`Pacing next provider request for ${Math.ceil(waitMs / 1000)}s.`)
    await sleep(waitMs)
  }
  lastRequestStartedAt = Date.now()
}

async function analyzeWithRetry(testCase) {
  let finalResponse
  let finalPayload = {}

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    await paceRequest()
    console.log(`Attempt ${attempt}/${maxAttempts}`)
    const startedAt = Date.now()
    const response = await fetch(`${site}/api/analyze`, { method: 'POST', body: formFor(testCase) })
    const durationMs = Date.now() - startedAt
    const payload = await response.json().catch(() => ({}))
    finalResponse = response
    finalPayload = payload

    console.log(`Attempt duration: ${durationMs}ms`)

    if (response.ok && payload?.success === true && typeof payload?.data === 'string') {
      return { response, payload, durationMs }
    }

    const retryable = response.status === 503
    console.error(`HTTP ${response.status}: ${payload?.error || 'Invalid response'}`)

    if (response.status === 429) {
      console.log('Capacity/limit response detected; failing fast so recovery checks do not hammer the provider.')
      break
    }

    if (!retryable || attempt === maxAttempts) break
    console.log('Transient 503 response detected; retrying after pacing interval.')
  }

  return { response: finalResponse, payload: finalPayload }
}

function detailedCostSection(report) {
  const match = report.match(/#\s+Detailed Cost Breakdown\b([\s\S]*?)(?=\n#\s+|$)/i)
  return match?.[1] || ''
}

function containsCurrencyAmountInCostSection(report) {
  const costSection = detailedCostSection(report)
  return /(?:\$\s*\d[\d,]*(?:\.\d+)?|\b(?:USD|US\$)\s*\d[\d,]*(?:\.\d+)?)/i.test(costSection)
}

const summary = {
  site,
  startedAt: new Date().toISOString(),
  cases: [],
}
let failed = false

for (const testCase of cases) {
  console.log(`\n=== ${testCase.id}: ${testCase.trade} ===`)
  const { response, payload, durationMs } = await analyzeWithRetry(testCase)
  fs.writeFileSync(`qa-results/${testCase.id}.json`, JSON.stringify(payload, null, 2))

  const result = {
    id: testCase.id,
    trade: testCase.trade,
    httpStatus: response?.status ?? null,
    providerModel: payload?.providerModel ?? null,
    providerFallback: payload?.providerFallback ?? null,
    durationMs: durationMs ?? null,
    status: 'UNKNOWN',
    assertions: [],
  }

  if (!response?.ok || payload?.success !== true || typeof payload?.data !== 'string') {
    failed = true
    result.status = response?.status === 429
      ? 'BLOCKED_PROVIDER_CAPACITY'
      : response?.status === 503
        ? 'BLOCKED_PROVIDER_TEMPORARY'
        : 'FAIL_REQUEST'
    summary.cases.push(result)
    console.error(`FAIL final HTTP ${response?.status ?? 'unknown'}: ${payload?.error || 'Invalid response'}`)
    continue
  }

  const report = payload.data
  fs.writeFileSync(`qa-results/${testCase.id}.md`, report)
  console.log(`HTTP ${response.status}; report length ${report.length}`)
  console.log(`Provider model: ${payload.providerModel || 'missing'}; fallback=${String(payload.providerFallback)}`)

  const providerModelValid = allowedProviderModels.has(payload.providerModel)
  console.log(`${providerModelValid ? 'PASS' : 'FAIL'}: reports an allowed provider model`)
  result.assertions.push({ name: 'allowed provider model', passed: providerModelValid })
  if (!providerModelValid) failed = true

  const assertions = [
    ...testCase.assertions,
    { name: 'marks unsupported pricing components as UNPRICED', pattern: /\bUNPRICED\b/i },
  ]

  let productPassed = providerModelValid
  for (const assertion of assertions) {
    const matched = assertion.pattern.test(report)
    const passed = assertion.absent ? !matched : matched
    console.log(`${passed ? 'PASS' : 'FAIL'}: ${assertion.name}`)
    result.assertions.push({ name: assertion.name, passed })
    if (!passed) {
      failed = true
      productPassed = false
    }
  }

  if (!testCase.allowCurrency) {
    const currencyFree = !containsCurrencyAmountInCostSection(report)
    console.log(`${currencyFree ? 'PASS' : 'FAIL'}: does not invent currency amounts without pricing basis`)
    result.assertions.push({ name: 'no invented currency without pricing basis', passed: currencyFree })
    if (!currencyFree) {
      failed = true
      productPassed = false
    }
  }

  result.status = productPassed ? 'PASS' : 'FAIL_PRODUCT'
  summary.cases.push(result)
}

summary.completedAt = new Date().toISOString()
summary.status = failed ? 'FAIL' : 'PASS'
fs.writeFileSync('qa-results/summary.json', JSON.stringify(summary, null, 2))

if (failed) process.exitCode = 1
