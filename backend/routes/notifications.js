const router = require('express').Router();
const db     = require('../config/db');
const { protect } = require('../middleware/auth');

// GET /api/notifications
router.get('/', protect, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    const unread = rows.filter(n => !n.is_read).length;
    res.json({ success: true, notifications: rows, unread });
  } catch { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', protect, async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read=TRUE WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// PUT /api/notifications/read-all
router.put('/read-all', protect, async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read=TRUE WHERE user_id=?', [req.user.id]);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch { res.status(500).json({ success: false, message: 'Server error.' }); }
});

module.exports = router;
