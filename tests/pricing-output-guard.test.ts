import assert from 'node:assert/strict'
import test from 'node:test'
import { guardPricingOutput } from '../lib/pricing-output-guard'

test('replaces zero-dollar placeholders on explicitly unpriced table rows', () => {
  const input = '| WC-1 | 1 | EA | UNPRICED | $0.00 | Pricing basis not supplied | UNPRICED |'
  const result = guardPricingOutput(input)

  assert.equal(result.replacements, 1)
  assert.equal(result.text.includes('$0.00'), false)
  assert.match(result.text, /UNPRICED/)
})

test('replaces nonzero currency when the same line admits pricing basis is missing', () => {
  const input = 'Material Cost: $145.00 — UNPRICED — pricing basis not supplied'
  const result = guardPricingOutput(input)

  assert.equal(result.replacements, 1)
  assert.equal(result.text.includes('$145.00'), false)
})

test('preserves legitimately priced rows that identify a real basis', () => {
  const input = '| Concrete | 7.41 | CY | $145.00 | $1,074.45 | Supplier quote dated 10/8/26 | VERIFIED |'
  const result = guardPricingOutput(input)

  assert.equal(result.replacements, 0)
  assert.equal(result.text, input)
})

test('does not mistake dimension math for pricing when the line is not unpriced', () => {
  const input = 'Ceiling height ($8\'$) and room dimensions $20\'\\times30\'$ are directly evidenced.'
  const result = guardPricingOutput(input)

  assert.equal(result.replacements, 0)
  assert.equal(result.text, input)
})

test('scrubs multiple contradictory currency placeholders in one report', () => {
  const input = [
    'Labor Cost: $0.00 — labor rate not supplied',
    'Material Cost: $0 — pricing basis not supplied',
    'Grand Total: UNPRICED',
  ].join('\\n')

  const result = guardPricingOutput(input)

  assert.equal(result.replacements, 2)
  assert.equal(/\\$0/.test(result.text), false)
})
