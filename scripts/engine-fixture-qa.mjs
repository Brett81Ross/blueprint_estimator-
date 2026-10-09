import fs from 'node:fs'
import path from 'node:path'

const site = 'https://blueprint-estimator.vercel.app'
const requestSpacingMs = 25_000
const maxAttempts = 3
let lastRequestStartedAt = 0

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const cases = [
  {
    id: 'concrete_C01',
    trade: 'Concrete & Masonry',
    file: 'tests/fixtures/concrete_C01.pdf',
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
    file: 'tests/fixtures/paint_P01.pdf',
    ceilingHeight: '8 ft',
    scale: '1/4" = 1\'-0"',
    assertions: [
      { name: '715 SF net painted wall area', pattern: /715\s*(?:\|\s*)?(SF|sq\.?\s*ft|square feet)/i },
    ],
  },
  {
    id: 'plumbing_PL01',
    trade: 'Plumber',
    file: 'tests/fixtures/plumbing_PL01.pdf',
    ceilingHeight: 'Not specified',
    scale: 'Unknown / Not Provided',
    assertions: [
      { name: 'four plumbing fixtures', pattern: /(?:4|four)\s+(?:plumbing\s+)?fixtures?/i },
      { name: 'does not double-count to eight fixtures', pattern: /(?:8|eight)\s+(?:plumbing\s+)?fixtures?/i, absent: true },
    ],
  },
]

fs.mkdirSync('qa-results', { recursive: true })

function formFor(testCase) {
  const form = new FormData()
  const bytes = fs.readFileSync(testCase.file)
  form.append('files', new Blob([bytes], { type: 'application/pdf' }), path.basename(testCase.file))
  form.append('trade', testCase.trade)
  form.append('ceilingHeight', testCase.ceilingHeight)
  form.append('projectType', 'Controlled QA Fixture')
  form.append('location', 'QA Test')
  form.append('sqft', 'Not specified')
  form.append('floors', '1')
  form.append('laborRate', 'Not specified')
  form.append('costBasis', 'Not specified')
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
    const response = await fetch(`${site}/api/analyze`, { method: 'POST', body: formFor(testCase) })
    const payload = await response.json().catch(() => ({}))
    finalResponse = response
    finalPayload = payload

    if (response.ok && payload?.success === true && typeof payload?.data === 'string') {
      return { response, payload }
    }

    const retryable = response.status === 429 || response.status === 503
    console.error(`HTTP ${response.status}: ${payload?.error || 'Invalid response'}`)

    if (!retryable || attempt === maxAttempts) break
    console.log('Transient response detected; retrying after pacing interval.')
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

let failed = false
for (const testCase of cases) {
  console.log(`\n=== ${testCase.id}: ${testCase.trade} ===`)
  const { response, payload } = await analyzeWithRetry(testCase)
  fs.writeFileSync(`qa-results/${testCase.id}.json`, JSON.stringify(payload, null, 2))

  if (!response?.ok || payload?.success !== true || typeof payload?.data !== 'string') {
    failed = true
    console.error(`FAIL final HTTP ${response?.status ?? 'unknown'}: ${payload?.error || 'Invalid response'}`)
    continue
  }

  const report = payload.data
  fs.writeFileSync(`qa-results/${testCase.id}.md`, report)
  console.log(`HTTP ${response.status}; report length ${report.length}`)

  const assertions = [
    ...testCase.assertions,
    { name: 'marks missing pricing basis as UNPRICED', pattern: /\bUNPRICED\b/i },
  ]

  for (const assertion of assertions) {
    const matched = assertion.pattern.test(report)
    const passed = assertion.absent ? !matched : matched
    console.log(`${passed ? 'PASS' : 'FAIL'}: ${assertion.name}`)
    if (!passed) failed = true
  }

  const currencyFree = !containsCurrencyAmountInCostSection(report)
  console.log(`${currencyFree ? 'PASS' : 'FAIL'}: does not invent currency amounts without pricing basis`)
  if (!currencyFree) failed = true
}

if (failed) process.exitCode = 1
