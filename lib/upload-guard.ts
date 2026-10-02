export const DEFAULT_MAX_FILES = 8
export const DEFAULT_MAX_FILE_BYTES = 12 * 1024 * 1024
export const DEFAULT_MAX_TOTAL_BYTES = 32 * 1024 * 1024

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
])

function positiveInt(name: string, fallback: number) {
  const raw = process.env[name]
  if (!raw) return fallback
  if (!/^[1-9]\d*$/.test(raw)) return fallback
  const parsed = Number(raw)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

export function uploadLimits() {
  return {
    maxFiles: positiveInt('RAPID_MAX_FILES', DEFAULT_MAX_FILES),
    maxFileBytes: positiveInt('RAPID_MAX_FILE_BYTES', DEFAULT_MAX_FILE_BYTES),
    maxTotalBytes: positiveInt('RAPID_MAX_TOTAL_BYTES', DEFAULT_MAX_TOTAL_BYTES),
  }
}

export function validateContentLength(value: string | null) {
  if (!value) return { ok: true as const }
  if (!/^\d+$/.test(value)) return { ok: false as const, error: 'Invalid Content-Length.' }
  const bytes = Number(value)
  if (!Number.isSafeInteger(bytes) || bytes < 0) return { ok: false as const, error: 'Invalid Content-Length.' }
  const { maxTotalBytes } = uploadLimits()
  // Multipart framing adds overhead, so allow a small envelope before parsing.
  if (bytes > maxTotalBytes + 1024 * 1024) {
    return { ok: false as const, error: 'Upload is too large.' }
  }
  return { ok: true as const }
}

export function validateFiles(files: File[]) {
  const { maxFiles, maxFileBytes, maxTotalBytes } = uploadLimits()
  if (files.length === 0) return { ok: false as const, error: 'No blueprints uploaded.' }
  if (files.length > maxFiles) return { ok: false as const, error: `Upload at most ${maxFiles} files at a time.` }

  let totalBytes = 0
  for (const file of files) {
    if (!file || typeof file.name !== 'string' || typeof file.type !== 'string' || typeof file.size !== 'number' || typeof file.arrayBuffer !== 'function' || typeof file.slice !== 'function') {
      return { ok: false as const, error: 'Invalid upload payload.' }
    }
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return { ok: false as const, error: 'Only PDF, JPEG, PNG, and WebP blueprint files are accepted.' }
    }
    if (file.size <= 0) return { ok: false as const, error: 'Empty files are not accepted.' }
    if (file.size > maxFileBytes) return { ok: false as const, error: `${file.name || 'A file'} exceeds the per-file upload limit.` }
    totalBytes += file.size
    if (totalBytes > maxTotalBytes) return { ok: false as const, error: 'Combined upload is too large.' }
  }

  return { ok: true as const }
}


function hasPrefix(bytes: Uint8Array, prefix: number[]) {
  return prefix.every((value, index) => bytes[index] === value)
}

export async function validateFileSignatures(files: File[]) {
  for (const file of files) {
    const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer())
    let valid = false

    if (file.type === 'application/pdf') {
      valid = hasPrefix(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])
    } else if (file.type === 'image/jpeg') {
      valid = hasPrefix(bytes, [0xff, 0xd8, 0xff])
    } else if (file.type === 'image/png') {
      valid = hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    } else if (file.type === 'image/webp') {
      valid =
        hasPrefix(bytes, [0x52, 0x49, 0x46, 0x46]) &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
    }

    if (!valid) {
      return { ok: false as const, error: 'A file does not match its declared PDF/image format.' }
    }
  }

  return { ok: true as const }
}


export function validateUploadContentType(value: string | null) {
  if (!value) return { ok: false as const, error: 'Invalid upload request.' }
  const parts = value.split(';').map((part) => part.trim())
  if (parts[0].toLowerCase() !== 'multipart/form-data') {
    return { ok: false as const, error: 'Invalid upload request.' }
  }
  const boundaryPart = parts.slice(1).find((part) => part.toLowerCase().startsWith('boundary='))
  if (!boundaryPart) return { ok: false as const, error: 'Invalid multipart boundary.' }
  const rawBoundary = boundaryPart.slice(boundaryPart.indexOf('=') + 1).trim()
  const quoted = rawBoundary.startsWith('"') || rawBoundary.endsWith('"')
  if (quoted && !(rawBoundary.startsWith('"') && rawBoundary.endsWith('"'))) {
    return { ok: false as const, error: 'Invalid multipart boundary.' }
  }
  const boundary = rawBoundary.startsWith('"') ? rawBoundary.slice(1, -1) : rawBoundary
  // RFC-style multipart boundaries are intentionally kept conservative here:
  // printable ASCII token characters only, no whitespace/control chars, max 70.
  if (!boundary.length || boundary.length > 70 || !/^[0-9A-Za-z'()+_,\-.\/:=?]+$/.test(boundary)) {
    return { ok: false as const, error: 'Invalid multipart boundary.' }
  }
  return { ok: true as const }
}
