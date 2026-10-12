import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { RAPID_TAKEOFF_VERSION } from '../lib/app-version'

test('package and application version stay aligned', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { version: string }
  assert.equal(pkg.version, RAPID_TAKEOFF_VERSION)
  assert.equal(RAPID_TAKEOFF_VERSION, '0.4.0')
})
