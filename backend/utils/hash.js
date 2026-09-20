import { createHash, randomInt } from 'crypto'

// SHA-256 fingerprint of a file's bytes. Stored alongside the document so
// that any later download can be re-hashed and compared to detect tampering
// or corruption. This is an integrity check, not an encryption scheme —
// files themselves should still be stored on encrypted-at-rest storage in
// production (e.g. an encrypted volume or S3 with SSE).
export function sha256Buffer(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

// Generates a unique, non-sequential-looking case ID like MRD-2026-00147.
// The numeric suffix is randomized (not an auto-increment) so case IDs
// can't be enumerated by guessing the next number.
export function generateCaseId() {
  const year = new Date().getFullYear()
  const suffix = String(randomInt(0, 100000)).padStart(5, '0')
  return `MRD-${year}-${suffix}`
}
