from pathlib import Path

PAGE = Path('app/page.tsx')
text = PAGE.read_text(encoding='utf-8')
original = text

constant_anchor = "]\n\nexport default function Home() {"
if "CACTUSBYTE_RECOVERY_URL" not in text:
    if constant_anchor not in text:
        raise SystemExit('Rapid Takeoff recovery constant anchor not found')
    text = text.replace(constant_anchor, "]\n\nconst CACTUSBYTE_RECOVERY_URL = 'https://cactusbyte-studios.vercel.app/rapid-takeoff-recovery'\n\nexport default function Home() {", 1)

recovery_effect = """
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const recovery = params.get('recovery')
    if (!recovery) return
    if (recovery === 'linked') setCouponMessage('Lifetime Pro is now protected by your CactusByte ID for clean-install recovery.')
    else if (recovery === 'restored') { setProAccess(true); setCouponMessage('Lifetime Pro access restored from your CactusByte ID.') }
    else if (recovery === 'claim-required') setCouponError('Current lifetime Pro access was not found on this device. Open Protect Pro Access from the legacy Rapid Takeoff install where Pro is active.')
    else if (recovery === 'restore-failed') setCouponError('Pro restore could not be verified. Sign in to the CactusByte ID that owns the linked lifetime entitlement and try again.')
    else if (recovery === 'claim-failed') setCouponError('Pro protection could not be completed. Request a fresh secure link and try again from this Pro-enabled device.')
    else if (recovery === 'invalid-link') setCouponError('That recovery link is invalid or incomplete.')
    params.delete('recovery')
    const query = params.toString()
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`)
  }, [])
"""
if "recovery === 'linked'" not in text:
    anchor = "  useEffect(() => {\n    if (report && reportRef.current) reportRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })\n  }, [report])"
    if anchor not in text:
        raise SystemExit('Rapid Takeoff recovery status effect anchor not found')
    text = text.replace(anchor, recovery_effect + "\n" + anchor, 1)

old_copy = "<p className=\"mt-1 text-sm text-zinc-300\">{proAccess ? 'Lifetime Rapid Takeoff Pro access is active on this device.' : 'Redeem a single-use code for free lifetime Rapid Takeoff Pro access.'}</p>"
new_copy = "<p className=\"mt-1 text-sm text-zinc-300\">{proAccess ? 'Lifetime Rapid Takeoff Pro access is active on this device. Protect it with your CactusByte ID before any reinstall or signing migration.' : 'Redeem a single-use code for lifetime Pro, or restore Pro that was already linked to your CactusByte ID.'}</p>"
if old_copy in text:
    text = text.replace(old_copy, new_copy, 1)
elif new_copy not in text:
    raise SystemExit('Rapid Takeoff Pro copy anchor not found')

old_button = "            {!proAccess && <button type=\"button\" onClick={() => { setCouponOpen(value => !value); setCouponError(null) }} className=\"min-h-12 rounded-lg border border-orange-400 bg-orange-500 px-5 font-black text-zinc-950 shadow-lg shadow-orange-950/40 hover:bg-orange-400\">Free Pro Access Coupon</button>}"
new_button = """            <div className=\"flex flex-wrap gap-2\">
              {proAccess ? <button type=\"button\" onClick={() => window.location.assign(`${CACTUSBYTE_RECOVERY_URL}?mode=claim`)} className=\"min-h-12 rounded-lg border border-emerald-400/70 bg-emerald-500 px-5 font-black text-zinc-950 hover:bg-emerald-400\">Protect Pro Access</button> : <>
                <button type=\"button\" onClick={() => { setCouponOpen(value => !value); setCouponError(null) }} className=\"min-h-12 rounded-lg border border-orange-400 bg-orange-500 px-5 font-black text-zinc-950 shadow-lg shadow-orange-950/40 hover:bg-orange-400\">Free Pro Access Coupon</button>
                <button type=\"button\" onClick={() => window.location.assign(`${CACTUSBYTE_RECOVERY_URL}?mode=restore`)} className=\"min-h-12 rounded-lg border border-zinc-600 bg-zinc-800 px-5 font-black text-zinc-100 hover:border-orange-400/60\">Restore Pro Access</button>
              </>}
            </div>"""
if old_button in text:
    text = text.replace(old_button, new_button, 1)
elif 'Protect Pro Access</button>' not in text or 'Restore Pro Access</button>' not in text:
    raise SystemExit('Rapid Takeoff Pro recovery button anchor not found')

required = [
    'CACTUSBYTE_RECOVERY_URL',
    "?mode=claim",
    "?mode=restore",
    'Protect Pro Access',
    'Restore Pro Access',
    "recovery === 'restored'",
    'Free Pro Access Coupon',
]
for marker in required:
    if marker not in text:
        raise SystemExit(f'Missing recovery marker after patch: {marker}')

PAGE.write_text(text, encoding='utf-8')
print('Rapid Takeoff Pro recovery UI already settled.' if text == original else 'Applied Rapid Takeoff Pro recovery UI patch.')
