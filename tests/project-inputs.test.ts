import assert from 'node:assert/strict'
import test from 'node:test'
import { RAPID_UPLOAD_LIMITS, SCALE_OPTIONS, TRADES, requiresCeilingHeight } from '../lib/project-inputs'

test('trade catalog contains 37 unique construction trades', () => {
  assert.equal(TRADES.length, 37)
  assert.equal(new Set(TRADES).size, TRADES.length)
})

test('ceiling height is trade-aware instead of universally required', () => {
  assert.equal(requiresCeilingHeight('Carpenter / Framer'), true)
  assert.equal(requiresCeilingHeight('HVAC Technician'), true)
  assert.equal(requiresCeilingHeight('Excavator'), false)
  assert.equal(requiresCeilingHeight('Landscaper'), false)
  assert.equal(requiresCeilingHeight('Roofing Contractor'), false)
  assert.equal(requiresCeilingHeight('Crane Operator'), false)
  assert.equal(requiresCeilingHeight('Teamster / Construction Hauling'), false)
})

test('scale choices support automatic mixed-sheet and unknown workflows', () => {
  assert.ok(SCALE_OPTIONS.includes('Auto Detect / Mixed Sheets'))
  assert.ok(SCALE_OPTIONS.includes('Unknown / Not Provided'))
})

test('client upload envelope mirrors hardened backend defaults', () => {
  assert.equal(RAPID_UPLOAD_LIMITS.maxFiles, 8)
  assert.equal(RAPID_UPLOAD_LIMITS.maxFileBytes, 4 * 1024 * 1024)
  assert.equal(RAPID_UPLOAD_LIMITS.maxTotalBytes, 4 * 1024 * 1024)
})
