import multer from 'multer'
import { randomUUID } from 'crypto'
import path from 'path'
import fs from 'fs'

const uploadDir = process.env.UPLOAD_DIR || './uploads'
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

// Only accept document/image types a case management tool actually needs.
// This blocks executables, scripts, and other types that have no business
// being "case evidence" and reduces what an attacker could smuggle through.
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // Never trust the client-supplied filename for the path on disk —
    // store under a random name and keep the original name only as metadata.
    const ext = path.extname(file.originalname).slice(0, 10)
    cb(null, `${randomUUID()}${ext}`)
  },
})

export const upload = multer({
  storage,
  limits: { fileSize: (Number(process.env.MAX_UPLOAD_MB) || 25) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error('That file type is not allowed.'))
    }
    cb(null, true)
  },
})
