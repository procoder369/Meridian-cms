import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

import authRoutes from './routes/auth.js'
import caseRoutes from './routes/cases.js'
import documentRoutes from './routes/documents.js'
import dashboardRoutes from './routes/dashboard.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()

// --- Security baseline ---
app.disable('x-powered-by')
app.use(helmet()) // sensible security headers (HSTS, no-sniff, frame denial, etc.)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
)
app.use(express.json({ limit: '1mb' }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// Global rate limit as a backstop; the login route has a stricter one on top.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
)

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.use('/api/auth', authRoutes)
app.use('/api/cases', caseRoutes)
app.use('/api/documents', documentRoutes)
app.use('/api/dashboard', dashboardRoutes)

app.use((req, res) => res.status(404).json({ message: 'Not found.' }))
app.use(errorHandler)

const port = process.env.PORT || 4000
app.listen(port, () => {
  console.log(`Meridian CMS backend listening on port ${port}`)
})
