const router = require('express').Router();
const db     = require('../config/db');
const upload = require('../middleware/upload');
const { protect, staffOnly } = require('../middleware/auth');
const { sendEmail, verificationStatusEmail } = require('../config/email');

// ── POST /api/verification/submit ── REQ-4.1 REQ-4.2
// Upload citizenship, license, photo (3-step as multipart)
router.post('/submit',
  protect,
  upload.fields([
    { name: 'citizenship_doc', maxCount: 1 },
    { name: 'license_doc',     maxCount: 1 },
    { name: 'user_photo',      maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const files       = req.files || {};
      const citizenship = files.citizenship_doc?.[0]?.filename || null;
      const license     = files.license_doc?.[0]?.filename     || null;
      const photo       = files.user_photo?.[0]?.filename      || null;

      // Check if already submitted
      const [exist] = await db.query(
        'SELECT id, status FROM identity_verifications WHERE user_id=? ORDER BY submitted_at DESC LIMIT 1',
        [req.user.id]
      );
      if (exist.length && exist[0].status === 'pending')
        return res.status(400).json({ success: false, message: 'Verification already pending review.' });
      if (exist.length && exist[0].status === 'approved')
        return res.status(400).json({ success: false, message: 'Already verified.' });

      const [r] = await db.query(
        `INSERT INTO identity_verifications (user_id,citizenship_doc,license_doc,user_photo)
         VALUES (?,?,?,?)`,
        [req.user.id, citizenship, license, photo]
      );

      // Notify staff (REQ-4.3)
      const [staff] = await db.query("SELECT id FROM users WHERE role IN ('admin','staff')");
      for (const s of staff) {
        await db.query(
          `INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,'verification')`,
          [s.id, 'New Verification Request', `User #${req.user.id} submitted identity documents for review.`]
        );
      }

      res.status(201).json({ success: true, message: 'Verification documents submitted. Pending review.', id: r.insertId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error.' });
    }
  }
);

// ── GET /api/verification/my ──────────────────────
router.get('/my', protect, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM identity_verifications WHERE user_id=? ORDER BY submitted_at DESC LIMIT 1',
      [req.user.id]
    );
    res.json({ success: true, verification: rows[0] || null });
  } catch { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// ── GET /api/verification ── all (staff) REQ-6.2 ──
router.get('/', staffOnly, async (req, res) => {
  const { status } = req.query;
  let q = `SELECT iv.*, u.first_name, u.last_name, u.email, u.phone
           FROM identity_verifications iv JOIN users u ON iv.user_id=u.id
           WHERE 1=1`;
  const p = [];
  if (status) { q += ' AND iv.status=?'; p.push(status); }
  q += ' ORDER BY iv.submitted_at DESC';
  try {
    const [rows] = await db.query(q, p);
    res.json({ success: true, verifications: rows });
  } catch { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// ── PUT /api/verification/:id ── approve/reject ── REQ-4.4
router.put('/:id', staffOnly, async (req, res) => {
  const { status, rejection_reason } = req.body;
  if (!['approved','rejected'].includes(status))
    return res.status(400).json({ success: false, message: 'Status must be approved or rejected.' });

  try {
    const [rows] = await db.query('SELECT iv.*, u.email, u.first_name, u.last_name FROM identity_verifications iv JOIN users u ON iv.user_id=u.id WHERE iv.id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Verification not found.' });

    const v = rows[0];
    await db.query(
      'UPDATE identity_verifications SET status=?,rejection_reason=?,reviewed_by=?,reviewed_at=NOW() WHERE id=?',
      [status, rejection_reason||null, req.user.id, req.params.id]
    );

    // Notify user
    const title = `Verification ${status.charAt(0).toUpperCase()+status.slice(1)}`;
    const msg   = status === 'approved'
      ? 'Your identity has been verified! You can now book vehicles.'
      : `Verification rejected. Reason: ${rejection_reason || 'Documents unclear or invalid.'}`;

    await db.query(
      `INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,'verification')`,
      [v.user_id, title, msg]
    );

    // Email (REQ-4)
    await sendEmail(verificationStatusEmail(v, status, rejection_reason));

    res.json({ success: true, message: `Verification ${status}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
