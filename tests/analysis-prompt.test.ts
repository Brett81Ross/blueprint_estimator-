import assert from 'node:assert/strict'
import test from 'node:test'
import { buildAnalysisPrompt } from '../lib/analysis-prompt'

const baseContext = {
  trade: 'Concrete & Masonry',
  projectType: 'Residential',
  location: 'Oklahoma City, OK',
  sqft: '600',
  floors: '1',
  ceilingHeight: 'Not specified',
  scale: '1/4" = 1\'-0"',
  laborRate: 'Not specified',
  costBasis: 'Not specified',
}

test('missing pricing basis explicitly forbids invented market pricing', () => {
  const prompt = buildAnalysisPrompt(baseContext)

  assert.match(prompt, /Labor dollar pricing supplied by user: NO/)
  assert.match(prompt, /Material\/unit pricing basis supplied by user: NO/)
  assert.match(prompt, /UNPRICED — pricing basis not supplied/)
  assert.match(prompt, /UNPRICED — labor rate not supplied/)
  assert.match(prompt, /Never invent, browse for, infer, or substitute "standard industry"/)
  assert.match(prompt, /Project location alone NEVER authorizes a unit price or labor rate/)
  assert.match(prompt, /Do not produce a grand-total dollar estimate unless every included dollar component has a supported pricing basis/)
})

test('user-supplied labor and unit pricing are marked as available evidence', () => {
  const prompt = buildAnalysisPrompt({
    ...baseContext,
    laborRate: '$65/hr',
    costBasis: 'Concrete $145/CY from supplier quote dated 10/8/26',
  })

  assert.match(prompt, /Labor dollar pricing supplied by user: YES/)
  assert.match(prompt, /Material\/unit pricing basis supplied by user: YES/)
  assert.match(prompt, /User-supplied labor rate: \$65\/hr/)
  assert.match(prompt, /Concrete \$145\/CY from supplier quote dated 10\/8\/26/)
  assert.match(prompt, /Every dollar amount must include a short Basis label/)
})

test('location is context only and never treated as pricing authority', () => {
  const prompt = buildAnalysisPrompt({
    ...baseContext,
    location: 'Oklahoma City, Oklahoma',
  })

  assert.match(prompt, /Location: Oklahoma City, Oklahoma/)
  assert.match(prompt, /Project location alone NEVER authorizes a unit price or labor rate/)
})

test('mixed-sheet scale guardrail remains part of the centralized prompt', () => {
  const prompt = buildAnalysisPrompt({
    ...baseContext,
    scale: 'Auto Detect / Mixed Sheets',
  })

  assert.match(prompt, /determine scale independently for each relevant sheet or drawing region/)
  assert.match(prompt, /never assume one project-wide scale/)
})
