// Creates the first admin user. Run once after migrating:
//   node db/seed-admin.js "Jane Admin" admin@yourfirm.com "a-strong-password-here"
import bcrypt from 'bcrypt'
import 'dotenv/config'
import { pool } from '../config/db.js'

async function main() {
  const [fullName, email, password] = process.argv.slice(2)
  if (!fullName || !email || !password) {
    console.error('Usage: node db/seed-admin.js "Full Name" email@example.com password')
    process.exit(1)
  }
  if (password.length < 10) {
    console.error('Password must be at least 10 characters.')
    process.exit(1)
  }

  const rounds = Number(process.env.BCRYPT_ROUNDS) || 12
  const passwordHash = await bcrypt.hash(password, rounds)

  try {
    await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin'`,
      [fullName, email, passwordHash]
    )
    console.log(`✅ Admin account ready for ${email}`)
  } catch (err) {
    console.error('❌ Could not create admin:', err.message)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

main()
