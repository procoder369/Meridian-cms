import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { pool } from '../config/db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function migrate() {
  const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf8')
  try {
    await pool.query(sql)
    console.log('✅ Schema applied successfully.')
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

migrate()
