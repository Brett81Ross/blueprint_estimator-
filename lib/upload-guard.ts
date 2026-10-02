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
    if (!file || typeof file.name !== 'string' || typeof file.type !== 'string' || typeof file.size !== 'number' || typeof file.arrayBuffer !== 'function') {
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
