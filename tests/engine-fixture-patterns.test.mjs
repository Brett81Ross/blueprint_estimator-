import assert from 'node:assert/strict'
import test from 'node:test'
import {
  fourPlumbingFixturesPattern,
  eightPlumbingFixturesPattern,
} from '../scripts/engine-fixture-patterns.mjs'

test('four-fixture assertion accepts plain and LaTeX-wrapped counts', () => {
  assert.match('4 plumbing fixtures', fourPlumbingFixturesPattern)
  assert.match('4 fixtures total', fourPlumbingFixturesPattern)
  assert.match('$4$ fixtures total', fourPlumbingFixturesPattern)
  assert.match('$4 fixtures', fourPlumbingFixturesPattern)
  assert.match('four plumbing fixtures', fourPlumbingFixturesPattern)
})

test('eight-fixture guard catches plain and LaTeX-wrapped double counts', () => {
  assert.match('8 fixtures', eightPlumbingFixturesPattern)
  assert.match('$8$ plumbing fixtures', eightPlumbingFixturesPattern)
  assert.match('eight fixtures', eightPlumbingFixturesPattern)
})

test('four-fixture matcher does not accept eight', () => {
  assert.doesNotMatch('$8$ fixtures total', fourPlumbingFixturesPattern)
})
