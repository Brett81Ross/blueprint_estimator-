const CURRENCY_AMOUNT = /(?:US\$|\$)\s*\d[\d,]*(?:\.\d+)?/gi

const UNPRICED_MARKERS = [
  /\bUNPRICED\b/i,
  /pricing basis not supplied/i,
  /labor rate not supplied/i,
]

export type PricingOutputGuardResult = {
  text: string
  replacements: number
}

export function guardPricingOutput(report: string): PricingOutputGuardResult {
  let replacements = 0

  const text = report
    .split(/\r?\n/)
    .map(line => {
      const explicitlyUnpriced = UNPRICED_MARKERS.some(marker => marker.test(line))
      if (!explicitlyUnpriced) return line

      return line.replace(CURRENCY_AMOUNT, () => {
        replacements += 1
        return 'UNPRICED'
      })
    })
    .join('\n')

  return { text, replacements }
}
