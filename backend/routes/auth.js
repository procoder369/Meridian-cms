import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import { body, validationResult } from 'express-validator'
import { query } from '../config/db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// Slow down credential-stuffing / brute-force attempts against login.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again in a few minutes.' },
})

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  )
}

function toPublicUser(row) {
  return { id: row.id, fullName: row.full_name, email: row.email, role: row.role }
}

router.post(
  '/register',
  [
    body('fullName').trim().isLength({ min: 2, max: 120 }).escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 10 }).withMessage('Password must be at least 10 characters.'),
    // Public sign-up can never grant admin — only seeded/db-promoted accounts are admins.
    body('role').isIn(['attorney', 'paralegal', 'investigator']),
  ],
  async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }

    const { fullName, email, password, role } = req.body

    try {
      const existing = await query('SELECT id FROM users WHERE email = $1', [email])
      if (existing.rows.length > 0) {
        return res.status(409).json({ message: 'An account with that email already exists.' })
      }

      const rounds = Number(process.env.BCRYPT_ROUNDS) || 12
      const passwordHash = await bcrypt.hash(password, rounds)

      const result = await query(
        `INSERT INTO users (full_name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, full_name, email, role`,
        [fullName, email, passwordHash, role]
      )

      const user = toPublicUser(result.rows[0])
      const token = signToken(user)
      res.status(201).json({ token, user })
    } catch (err) {
      next(err)
    }
  }
)

router.post(
  '/login',
  loginLimiter,
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    const { email, password } = req.body

    try {
      const result = await query(
        'SELECT id, full_name, email, password_hash, role FROM users WHERE email = $1',
        [email]
      )
      const row = result.rows[0]

      // Compare against a dummy hash even when the user doesn't exist, so
      // response timing doesn't reveal whether an email is registered.
      const hashToCheck = row?.password_hash || '$2b$12$invalidsaltinvalidsaltinvalidsaltinvalidsaltuv'
      const valid = await bcrypt.compare(password, hashToCheck)

      await query(
        `INSERT INTO access_logs (user_id, case_id_requested, action, granted, ip_address)
         VALUES ($1, $2, $3, $4, $5)`,
        [row?.id || null, '-', valid && row ? 'login' : 'login_failed', Boolean(valid && row), req.ip]
      )

      if (!row || !valid) {
        return res.status(401).json({ message: 'Invalid email or password.' })
      }

      const user = toPublicUser(row)
      const token = signToken(user)
      res.json({ token, user })
    } catch (err) {
      next(err)
    }
  }
)

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, full_name, email, role FROM users WHERE id = $1',
      [req.user.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' })
    }
    res.json({ user: toPublicUser(result.rows[0]) })
  } catch (err) {
    next(err)
  }
})

export default router
