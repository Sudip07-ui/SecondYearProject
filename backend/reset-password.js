// reset-password.js
// Run this ONCE from your backend folder:
//   node reset-password.js
//
// This sets admin@rento.com password to: 9816Sudip

require('dotenv').config();
const bcrypt = require('./node_modules/bcryptjs');
const mysql  = require('./node_modules/mysql2/promise');

async function main() {
  const db = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'rento_db',
  });

  const password   = '9816Sudip';
  const hash       = await bcrypt.hash(password, 10);

  // Update ALL seed users to this password
  await db.execute(
    `UPDATE users SET password_hash = ? WHERE email IN ('admin@rento.com','staff@rento.com','customer@rento.com')`,
    [hash]
  );

  // Show result
  const [rows] = await db.execute(`SELECT email, role FROM users WHERE email IN ('admin@rento.com','staff@rento.com','customer@rento.com')`);
  console.log('\n  Password updated successfully!\n');
  console.log('All these accounts now use password: 9816Sudip');
  console.log('─'.repeat(45));
  rows.forEach(r => console.log(`  ${r.role.padEnd(10)} → ${r.email}`));
  console.log('─'.repeat(45));
  console.log('\nLogin at: http://localhost:3000/login\n');

  await db.end();
}

main().catch(err => {
  console.error('\n  Error:', err.message);
  console.error('Make sure your .env DB_PASSWORD is correct and MySQL is running.\n');
  process.exit(1);
});
