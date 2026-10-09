export const TRADES = [
  'General Contractor',
  'Architect',
  'Carpenter / Framer',
  'Concrete & Masonry',
  'Electrician',
  'Excavator',
  'Flooring Specialist',
  'HVAC Technician',
  'Insulation Contractor',
  'Landscaper',
  'Low Voltage / Security',
  'Painter',
  'Plumber',
  'Roofing Contractor',
  'Siding Contractor',
  'Structural Engineer',
  'Boilermaker',
  'Carpet / Linoleum Installer',
  'Crane Operator',
  'Dredger',
  'Elevator Mechanic',
  'Fence Contractor / Fencer',
  'Glazier',
  'Heavy Equipment Operator',
  'Ironworker / Steel Erector',
  'Construction Laborer',
  'Lineman / Power Line Technician',
  'Millwright',
  'Pile Driver',
  'Pipefitter / Steamfitter',
  'Pipelayer',
  'Plasterer',
  'Sheet Metal Worker',
  'Sign Display Worker',
  'Steel Fixer / Rebar Installer',
  'Teamster / Construction Hauling',
  'Welder',
] as const

export const SCALE_OPTIONS = [
  'Auto Detect / Mixed Sheets',
  'Unknown / Not Provided',
  '1/8" = 1\'0"',
  '1/4" = 1\'0"',
  '1/2" = 1\'0"',
  '1" = 1\'0"',
  '1:20',
  '1:50',
  '1:100',
] as const

const CEILING_HEIGHT_REQUIRED_TRADES = new Set<string>([
  'Carpenter / Framer',
  'HVAC Technician',
  'Insulation Contractor',
  'Painter',
  'Siding Contractor',
  'Elevator Mechanic',
  'Glazier',
  'Sheet Metal Worker',
])

export function requiresCeilingHeight(trade: string) {
  return CEILING_HEIGHT_REQUIRED_TRADES.has(trade)
}

export const RAPID_UPLOAD_LIMITS = {
  maxFiles: 8,
  maxFileBytes: 4 * 1024 * 1024,
  maxTotalBytes: 4 * 1024 * 1024,
} as const

export const SUPPORTED_UPLOAD_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
])

export const FILE_ACCEPT = 'application/pdf,image/jpeg,image/png,image/webp'
