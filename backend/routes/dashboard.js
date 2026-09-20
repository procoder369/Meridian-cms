import { Router } from 'express'
import { query } from '../config/db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/summary', requireAuth, async (req, res, next) => {
  const isAdmin = req.user.role === 'admin'
  const scopeJoin = isAdmin ? '' : 'JOIN case_assignments ca ON ca.case_id = c.id AND ca.user_id = $1'
  const params = isAdmin ? [] : [req.user.id]

  try {
    const [statsResult, statusResult, monthlyResult, categoryResult] = await Promise.all([
      query(
        `SELECT
           count(DISTINCT c.id) AS assigned_cases,
           count(DISTINCT c.id) FILTER (WHERE c.status = 'open') AS open_cases,
           count(DISTINCT d.id) AS total_documents
         FROM cases c
         ${scopeJoin}
         LEFT JOIN documents d ON d.case_id = c.id`,
        params
      ),
      query(
        `SELECT c.status, count(DISTINCT c.id) AS value
         FROM cases c
         ${scopeJoin}
         GROUP BY c.status`,
        params
      ),
      query(
        `SELECT to_char(date_trunc('month', c.created_at), 'Mon') AS month,
                count(*) FILTER (WHERE true) AS opened
         FROM cases c
         ${scopeJoin}
         WHERE c.created_at > now() - interval '6 months'
         GROUP BY date_trunc('month', c.created_at)
         ORDER BY date_trunc('month', c.created_at)`,
        params
      ),
      query(
        `SELECT c.category, count(d.id) AS count
         FROM documents d
         JOIN cases c ON c.id = d.case_id
         ${scopeJoin}
         WHERE d.uploaded_at > now() - interval '30 days'
         GROUP BY c.category
         ORDER BY count DESC`,
        params
      ),
    ])

    const restrictedResult = isAdmin
      ? { rows: [{ restricted: 0 }] }
      : await query(
          `SELECT count(*) AS restricted FROM documents d
           JOIN cases c ON c.id = d.case_id
           WHERE c.id NOT IN (SELECT case_id FROM case_assignments WHERE user_id = $1)`,
          [req.user.id]
        )

    const statusLabels = { open: 'Open', under_review: 'Under Review', closed: 'Closed' }

    res.json({
      stats: {
        assignedCases: Number(statsResult.rows[0].assigned_cases),
        openCases: Number(statsResult.rows[0].open_cases),
        totalDocuments: Number(statsResult.rows[0].total_documents),
        restrictedDocuments: Number(restrictedResult.rows[0].restricted),
      },
      statusBreakdown: statusResult.rows.map((r) => ({
        name: statusLabels[r.status] || r.status,
        value: Number(r.value),
      })),
      monthlyVolume: monthlyResult.rows.map((r) => ({
        month: r.month,
        opened: Number(r.opened),
        closed: 0, // Extend with a closed_at column to track this precisely.
      })),
      documentsByCategory: categoryResult.rows.map((r) => ({
        category: r.category,
        count: Number(r.count),
      })),
    })
  } catch (err) {
    next(err)
  }
})

export default router
