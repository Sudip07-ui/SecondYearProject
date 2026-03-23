const router = require('express').Router();
const db     = require('../config/db');
const { protect } = require('../middleware/auth');

// POST /api/reviews  – customer reviews after completed booking
router.post('/', protect, async (req, res) => {
  const { booking_id, rating, comment } = req.body;
  if (!booking_id || !rating)
    return res.status(400).json({ success: false, message: 'booking_id and rating are required.' });
  if (rating < 1 || rating > 5)
    return res.status(400).json({ success: false, message: 'Rating must be 1–5.' });

  try {
    const [rows] = await db.query(
      "SELECT * FROM bookings WHERE id=? AND user_id=? AND status='completed'",
      [booking_id, req.user.id]
    );
    if (!rows.length)
      return res.status(400).json({ success: false, message: 'Can only review completed bookings.' });

    const [exist] = await db.query('SELECT id FROM reviews WHERE booking_id=?', [booking_id]);
    if (exist.length)
      return res.status(409).json({ success: false, message: 'Already reviewed this booking.' });

    await db.query(
      'INSERT INTO reviews (booking_id,user_id,vehicle_id,rating,comment) VALUES (?,?,?,?,?)',
      [booking_id, req.user.id, rows[0].vehicle_id, rating, comment||null]
    );
    res.status(201).json({ success: true, message: 'Review submitted. Thank you!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/reviews/vehicle/:id
router.get('/vehicle/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, u.first_name, u.last_name FROM reviews r
       JOIN users u ON r.user_id=u.id
       WHERE r.vehicle_id=? ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    const avg = rows.length ? (rows.reduce((s,r)=>s+r.rating,0)/rows.length).toFixed(1) : null;
    res.json({ success: true, average_rating: avg, reviews: rows });
  } catch { res.status(500).json({ success: false, message: 'Server error.' }); }
});

module.exports = router;
