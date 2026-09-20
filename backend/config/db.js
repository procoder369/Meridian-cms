import pg from 'pg'
import 'dotenv/config'

const { Pool } = pg

export const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
})

pool.on('error', (err) => {
  // A background/idle client error should not crash the whole process.
  console.error('Unexpected PostgreSQL error on idle client', err)
})

// Always use parameterized queries ($1, $2, ...) — never string-concatenate
// user input into SQL. This is the single most important defense against
// SQL injection and every route in this project follows it.
export const query = (text, params) => pool.query(text, params)
