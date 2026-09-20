import { Router } from 'express'
import { query } from '../config/db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      const result = await query(
        `SELECT d.id, d.file_name, d.sha256_hash, d.size_bytes, d.uploaded_at, c.case_id
         FROM documents d JOIN cases c ON c.id = d.case_id
         ORDER BY d.uploaded_at DESC LIMIT 200`
      )
      return res.json({ documents: result.rows.map((r) => formatUnlocked(r)) })
    }

    // Real documents from cases this user is assigned to.
    const visible = await query(
      `SELECT d.id, d.file_name, d.sha256_hash, d.size_bytes, d.uploaded_at, c.case_id
       FROM documents d
       JOIN cases c ON c.id = d.case_id
       JOIN case_assignments ca ON ca.case_id = c.id
       WHERE ca.user_id = $1
       ORDER BY d.uploaded_at DESC`,
      [req.user.id]
    )

    // One locked placeholder per case that has documents but isn't assigned
    // to this user — confirms activity exists without exposing file names,
    // hashes, or counts for a case they can't open.
    const locked = await query(
      `SELECT DISTINCT c.id, c.case_id
       FROM cases c
       JOIN documents d ON d.case_id = c.id
       WHERE c.id NOT IN (
         SELECT case_id FROM case_assignments WHERE user_id = $1
       )
       LIMIT 50`,
      [req.user.id]
    )

    const documents = [
      ...visible.rows.map(formatUnlocked),
      ...locked.rows.map((r) => ({ id: `locked-${r.id}`, caseId: r.case_id, locked: true })),
    ]

    res.json({ documents })
  } catch (err) {
    next(err)
  }
})

function formatUnlocked(r) {
  return {
    id: r.id,
    caseId: r.case_id,
    fileName: r.file_name,
    sha256Hash: r.sha256_hash,
    sizeLabel: r.size_bytes < 1024 * 1024 ? `${(r.size_bytes / 1024).toFixed(1)} KB` : `${(r.size_bytes / (1024 * 1024)).toFixed(1)} MB`,
    uploadedAt: r.uploaded_at.toISOString().slice(0, 10),
    locked: false,
  }
}

export default router
