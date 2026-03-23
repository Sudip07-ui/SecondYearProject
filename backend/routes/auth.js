const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../config/db');
const { protect } = require('../middleware/auth');

const SECRET  = process.env.JWT_SECRET || 'rento_jwt_super_secret_2024';
const EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

const makeToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: EXPIRES });

// ── POST /api/auth/register ────────────────────────
router.post('/register', async (req, res) => {
  const { first_name, last_name, email, phone, password, date_of_birth, address } = req.body;

  if (!first_name || !last_name || !email || !phone || !password)
    return res.status(400).json({ success: false, message: 'All required fields must be filled.' });

  // REQ-1.2: min 8 chars, 1 number, 1 special char
  const pwdRx = /^(?=.*[0-9])(?=.*[!@#$%^&*])/;
  if (password.length < 8 || !pwdRx.test(password))
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters with 1 number and 1 special character.',
    });

  try {
    const [exist] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (exist.length) return res.status(409).json({ success: false, message: 'Email already registered.' });

    const hash = await bcrypt.hash(password, 10);
    const [r]  = await db.query(
      'INSERT INTO users (first_name,last_name,email,phone,password_hash,date_of_birth,address) VALUES (?,?,?,?,?,?,?)',
      [first_name, last_name, email, phone, hash, date_of_birth || null, address || null]
    );
    const user = { id: r.insertId, first_name, last_name, email, phone, role: 'customer' };
    res.status(201).json({ success: true, message: 'Registration successful!', token: makeToken(user), user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── POST /api/auth/login ───────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password required.' });

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND is_active = TRUE', [email]);
    if (!rows.length) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const user = rows[0];
    const ok   = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const { password_hash: _, ...safeUser } = user;
    res.json({ success: true, message: 'Login successful!', token: makeToken(user), user: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── GET /api/auth/me ───────────────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id,first_name,last_name,email,phone,role,profile_image,address,date_of_birth,created_at FROM users WHERE id=?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// ── PUT /api/auth/profile ──────────────────────────
router.put('/profile', protect, async (req, res) => {
  const { first_name, last_name, phone, address, date_of_birth } = req.body;
  try {
    await db.query(
      'UPDATE users SET first_name=?,last_name=?,phone=?,address=?,date_of_birth=? WHERE id=?',
      [first_name, last_name, phone, address, date_of_birth || null, req.user.id]
    );
    res.json({ success: true, message: 'Profile updated.' });
  } catch { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// ── PUT /api/auth/change-password ─────────────────
router.put('/change-password', protect, async (req, res) => {
  const { current_password, new_password } = req.body;
  try {
    const [rows] = await db.query('SELECT password_hash FROM users WHERE id=?', [req.user.id]);
    const ok = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!ok) return res.status(400).json({ success: false, message: 'Current password incorrect.' });

    const hash = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password_hash=? WHERE id=?', [hash, req.user.id]);
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch { res.status(500).json({ success: false, message: 'Server error.' }); }
});

module.exports = router;
