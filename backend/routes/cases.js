import { Router } from 'express'
import fs from 'fs/promises'
import path from 'path'
import { body, validationResult } from 'express-validator'
import { query } from '../config/db.js'
import { requireAuth } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
import { sha256Buffer, generateCaseId } from '../utils/hash.js'

const router = Router()

// Minimal extension -> MIME map so downloads open correctly in the browser
// instead of always falling back to a generic binary download.
const MIME_BY_EXT = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.txt': 'text/plain',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

function formatCaseRow(row, documents = []) {
  return {
    id: row.id,
    caseId: row.case_id,
    title: row.title,
    category: row.category,
    description: row.description,
    status: row.status.replace('_', ' '),
    documentCount: documents.length,
    createdAt: row.created_at.toISOString().slice(0, 10),
    updatedAt: row.updated_at.toISOString().slice(0, 10),
    assignee: row.assignee_name ? { fullName: row.assignee_name, email: row.assignee_email } : null,
    documents: documents.map(formatDocRow),
  }
}

function formatDocRow(doc) {
  return {
    id: doc.id,
    fileName: doc.file_name,
    sha256Hash: doc.sha256_hash,
    sizeLabel: formatBytes(doc.size_bytes),
    uploadedAt: doc.uploaded_at.toISOString().slice(0, 10),
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function hasAccess(userId, role, caseUuid) {
  if (role === 'admin') return true
  const result = await query(
    'SELECT 1 FROM case_assignments WHERE case_id = $1 AND user_id = $2',
    [caseUuid, userId]
  )
  return result.rows.length > 0
}

// List cases visible to the current user (assigned cases, or all for admins).
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const sql =
      req.user.role === 'admin'
        ? `SELECT c.*, (SELECT count(*) FROM documents d WHERE d.case_id = c.id) AS doc_count
           FROM cases c ORDER BY c.updated_at DESC`
        : `SELECT c.*, (SELECT count(*) FROM documents d WHERE d.case_id = c.id) AS doc_count
           FROM cases c
           JOIN case_assignments ca ON ca.case_id = c.id
           WHERE ca.user_id = $1
           ORDER BY c.updated_at DESC`
    const result = await query(sql, req.user.role === 'admin' ? [] : [req.user.id])

    res.json({
      cases: result.rows.map((row) => ({
        id: row.id,
        caseId: row.case_id,
        title: row.title,
        status: row.status.replace('_', ' '),
        documentCount: Number(row.doc_count),
        updatedAt: row.updated_at.toISOString().slice(0, 10),
      })),
    })
  } catch (err) {
    next(err)
  }
})

// Create a new case and assign it to the creator plus a named assignee.
router.post(
  '/',
  requireAuth,
  [
    body('title').trim().isLength({ min: 3, max: 200 }).escape(),
    body('category').trim().isLength({ min: 2, max: 80 }).escape(),
    body('description').trim().isLength({ max: 5000 }).escape(),
    body('assigneeEmail').isEmail().normalizeEmail(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }

    const { title, category, description, assigneeEmail } = req.body

    try {
      const assigneeResult = await query('SELECT id, full_name, email FROM users WHERE email = $1', [
        assigneeEmail,
      ])
      if (assigneeResult.rows.length === 0) {
        return res.status(404).json({ message: 'No user is registered with that email yet.' })
      }
      const assignee = assigneeResult.rows[0]

      // Retry on the rare case_id collision instead of trusting one attempt.
      let caseRow
      for (let attempt = 0; attempt < 5 && !caseRow; attempt++) {
        const caseId = generateCaseId()
        try {
          const result = await query(
            `INSERT INTO cases (case_id, title, category, description, created_by)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [caseId, title, category, description || '', req.user.id]
          )
          caseRow = result.rows[0]
        } catch (err) {
          if (err.code !== '23505') throw err // not a unique-violation, don't retry
        }
      }
      if (!caseRow) {
        return res.status(500).json({ message: 'Could not generate a unique case ID. Please try again.' })
      }

      await query(
        `INSERT INTO case_assignments (case_id, user_id) VALUES ($1, $2), ($1, $3)
         ON CONFLICT DO NOTHING`,
        [caseRow.id, req.user.id, assignee.id]
      )

      res.status(201).json({
        case: {
          caseId: caseRow.case_id,
          title: caseRow.title,
          status: caseRow.status,
        },
      })
    } catch (err) {
      next(err)
    }
  }
)

// Fetch one case by its human-readable ID. Returns 403 (not 200 with hidden
// fields) when the case exists but the requester isn't assigned — the
// existence of the case ID is confirmed, but no case content is leaked.
router.get('/:caseId', requireAuth, async (req, res, next) => {
  const { caseId } = req.params

  try {
    const caseResult = await query('SELECT * FROM cases WHERE case_id = $1', [caseId])
    if (caseResult.rows.length === 0) {
      await logAccess(req.user.id, caseId, 'view', false, req.ip)
      return res.status(404).json({ message: 'No case found with that ID.' })
    }
    const caseRow = caseResult.rows[0]

    const granted = await hasAccess(req.user.id, req.user.role, caseRow.id)
    await logAccess(req.user.id, caseId, 'view', granted, req.ip)

    if (!granted) {
      return res.status(403).json({
        message: 'This case is not assigned to your account.',
        case: { caseId: caseRow.case_id },
      })
    }

    const [assigneeResult, documentsResult] = await Promise.all([
      query(
        `SELECT u.full_name AS assignee_name, u.email AS assignee_email
         FROM case_assignments ca JOIN users u ON u.id = ca.user_id
         WHERE ca.case_id = $1 ORDER BY ca.assigned_at ASC LIMIT 1`,
        [caseRow.id]
      ),
      query('SELECT * FROM documents WHERE case_id = $1 ORDER BY uploaded_at DESC', [caseRow.id]),
    ])

    const enriched = {
      ...caseRow,
      assignee_name: assigneeResult.rows[0]?.assignee_name,
      assignee_email: assigneeResult.rows[0]?.assignee_email,
    }

    res.json({ case: formatCaseRow(enriched, documentsResult.rows) })
  } catch (err) {
    next(err)
  }
})

// Upload a document to a case. Rejects with 403 if the uploader isn't
// assigned, so a locked case can't be written to any more than it can be read.
router.post('/:caseId/documents', requireAuth, upload.single('file'), async (req, res, next) => {
  const { caseId } = req.params

  try {
    const caseResult = await query('SELECT * FROM cases WHERE case_id = $1', [caseId])
    if (caseResult.rows.length === 0) {
      if (req.file) await fs.unlink(req.file.path).catch(() => {})
      return res.status(404).json({ message: 'No case found with that ID.' })
    }
    const caseRow = caseResult.rows[0]

    const granted = await hasAccess(req.user.id, req.user.role, caseRow.id)
    await logAccess(req.user.id, caseId, 'upload', granted, req.ip)

    if (!granted) {
      if (req.file) await fs.unlink(req.file.path).catch(() => {})
      return res.status(403).json({ message: 'You are not assigned to this case.' })
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file was provided.' })
    }

    const fileBuffer = await fs.readFile(req.file.path)
    const hash = sha256Buffer(fileBuffer)

    const result = await query(
      `INSERT INTO documents (case_id, file_name, storage_path, sha256_hash, size_bytes, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [caseRow.id, req.file.originalname, req.file.path, hash, req.file.size, req.user.id]
    )

    await query('UPDATE cases SET updated_at = now() WHERE id = $1', [caseRow.id])

    res.status(201).json({ document: formatDocRow(result.rows[0]) })
  } catch (err) {
    next(err)
  }
})

// Download a single document. Same access check as viewing the case, plus
// a re-hash of the file on disk against the stored SHA-256 fingerprint —
// if they don't match, something altered the file since upload and we
// refuse to serve it silently.
router.get('/:caseId/documents/:docId/download', requireAuth, async (req, res, next) => {
  const { caseId, docId } = req.params

  try {
    const caseResult = await query('SELECT * FROM cases WHERE case_id = $1', [caseId])
    if (caseResult.rows.length === 0) {
      return res.status(404).json({ message: 'No case found with that ID.' })
    }
    const caseRow = caseResult.rows[0]

    const granted = await hasAccess(req.user.id, req.user.role, caseRow.id)
    await logAccess(req.user.id, caseId, 'download', granted, req.ip)
    if (!granted) {
      return res.status(403).json({ message: 'You are not assigned to this case.' })
    }

    const docResult = await query('SELECT * FROM documents WHERE id = $1 AND case_id = $2', [
      docId,
      caseRow.id,
    ])
    if (docResult.rows.length === 0) {
      return res.status(404).json({ message: 'Document not found on this case.' })
    }
    const doc = docResult.rows[0]

    const fileBuffer = await fs.readFile(doc.storage_path)
    const currentHash = sha256Buffer(fileBuffer)
    if (currentHash !== doc.sha256_hash) {
      // The file on disk no longer matches what was recorded at upload time.
      console.error(`Integrity mismatch for document ${doc.id}: stored=${doc.sha256_hash} current=${currentHash}`)
      return res.status(409).json({
        message: 'This file failed its integrity check and was not served. It may have been altered since upload.',
      })
    }

    const ext = path.extname(doc.file_name).toLowerCase()
    res.setHeader('Content-Type', MIME_BY_EXT[ext] || 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.file_name)}"`)
    res.setHeader('X-SHA256-Checksum', doc.sha256_hash)
    res.send(fileBuffer)
  } catch (err) {
    next(err)
  }
})

async function logAccess(userId, caseIdRequested, action, granted, ip) {
  await query(
    `INSERT INTO access_logs (user_id, case_id_requested, action, granted, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, caseIdRequested, action, granted, ip]
  )
}

export default router
