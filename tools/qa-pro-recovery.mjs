import fs from 'node:fs'

const read = path => fs.readFileSync(path, 'utf8')
const page = read('app/page.tsx')
const helper = read('lib/pro-recovery.ts')
const claim = read('app/api/access/claim/route.ts')
const restore = read('app/api/access/restore/route.ts')
const coupon = read('app/api/coupon/redeem/route.ts')
const vercel = read('vercel.json')

function must(condition, message) {
  if (!condition) throw new Error(message)
}

must(helper.includes('RAPID_RECOVERY_BRIDGE_SECRET'), 'shared recovery secret missing')
must(helper.includes("rapid-takeoff:claim:${token}"), 'claim HMAC scope missing')
must(helper.includes('/api/rapid-takeoff/recovery/confirm-claim'), 'claim authority endpoint missing')
must(helper.includes('/api/rapid-takeoff/recovery/consume-restore'), 'restore authority endpoint missing')
must(claim.indexOf('verifyProAccessToken') < claim.indexOf('confirmLegacyProClaim'), 'legacy cookie must be verified before account claim')
must(restore.indexOf('consumeProRestoreToken') < restore.indexOf('response.cookies.set'), 'restore authority must be consumed before local Pro cookie issuance')
must(restore.includes('httpOnly: true') && restore.includes('secure: true') && restore.includes("sameSite: 'lax'"), 'restored Pro cookie security flags missing')
must(page.includes('Protect Pro Access') && page.includes('Restore Pro Access'), 'recovery UI buttons missing')
must(page.includes('?mode=claim') && page.includes('?mode=restore'), 'CactusByte recovery handoff modes missing')
must(page.includes("recovery === 'linked'") && page.includes("recovery === 'restored'"), 'recovery result handling missing')
must(coupon.includes('/api/coupons/rapid-takeoff/issue') && coupon.includes('/api/tester/consume-app-token'), 'existing one-time coupon authority changed unexpectedly')
must(!claim.includes('/api/coupon/redeem') && !restore.includes('/api/coupon/redeem'), 'recovery must not reuse coupon redemption')
must(vercel.includes('"deploymentEnabled":false'), 'Git auto-deploy must remain disabled during recovery work')

console.log('Rapid Takeoff Pro recovery source QA: PASS')
