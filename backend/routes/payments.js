const router = require('express').Router();
const db     = require('../config/db');
const { protect, staffOnly } = require('../middleware/auth');
const { sendEmail, bookingConfirmationEmail } = require('../config/email');

// ── POST /api/payments ── REQ-5.1 to 5.4 ─────────
router.post('/', protect, async (req, res) => {
  const { booking_id, payment_method, transaction_id } = req.body;
  if (!booking_id || !payment_method)
    return res.status(400).json({ success: false, message: 'booking_id and payment_method required.' });

  try {
    const [brows] = await db.query(
      `SELECT b.*, v.model_name, v.brand, v.price_per_day
       FROM bookings b JOIN vehicles v ON b.vehicle_id=v.id
       WHERE b.id=? AND b.user_id=?`,
      [booking_id, req.user.id]
    );
    if (!brows.length) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const booking = brows[0];

    if (booking.status === 'active' || booking.status === 'completed')
      return res.status(400).json({ success: false, message: 'This booking has already been paid.' });
    if (booking.status === 'cancelled')
      return res.status(400).json({ success: false, message: 'Cannot pay for a cancelled booking.' });
    if (booking.status === 'pending')
      return res.status(400).json({ success: false, message: 'Booking is still awaiting admin approval. Please wait.' });
    if (booking.status !== 'confirmed')
      return res.status(400).json({ success: false, message: 'Booking is not approved for payment yet.' });

    const txnId = transaction_id || `TXN_${Date.now()}_${req.user.id}`;

    const [pr] = await db.query(
      `INSERT INTO payments (booking_id,user_id,amount,payment_method,transaction_id,status)
       VALUES (?,?,?,?,?,'completed')`,
      [booking_id, req.user.id, booking.total_price, payment_method, txnId]
    );

    // Move booking to 'active' and mark vehicle as rented
    await db.query("UPDATE bookings SET status='active' WHERE id=?", [booking_id]);
    await db.query("UPDATE vehicles SET status='rented' WHERE id=?", [booking.vehicle_id]);

    // Notification (REQ-5.4)
    await db.query(
      `INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,'payment')`,
      [req.user.id,
       'Payment Successful 🎉',
       `NPR ${booking.total_price} paid for ${booking.brand} ${booking.model_name}. Booking #${booking_id} confirmed!`]
    );

    // Email confirmation (REQ-5.4)
    const [urows] = await db.query('SELECT * FROM users WHERE id=?', [req.user.id]);
    if (urows.length) {
      const emailData = bookingConfirmationEmail(urows[0], booking, booking);
      await sendEmail(emailData);
    }

    res.status(201).json({
      success:    true,
      message:    'Payment successful! Booking confirmed.',
      payment_id: pr.insertId,
      booking_id,
      transaction_id: txnId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error during payment.' });
  }
});

// ── GET /api/payments/my ──────────────────────────
router.get('/my', protect, async (req, res) => {
  try {
    const [payments] = await db.query(
      `SELECT p.*, b.start_date, b.end_date, b.total_days, b.status AS booking_status,
              v.model_name, v.brand, v.image_url
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       JOIN vehicles v ON b.vehicle_id = v.id
       WHERE p.user_id = ?
       ORDER BY p.payment_date DESC`,
      [req.user.id]
    );
    res.json({ success: true, payments });
  } catch { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// ── GET /api/payments ── all (staff) ─────────────
router.get('/', staffOnly, async (req, res) => {
  try {
    const [payments] = await db.query(
      `SELECT p.*, b.start_date, b.end_date, b.total_days,
              v.model_name, v.brand,
              u.first_name, u.last_name, u.email
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       JOIN vehicles v ON b.vehicle_id = v.id
       JOIN users    u ON p.user_id    = u.id
       ORDER BY p.payment_date DESC`
    );
    res.json({ success: true, payments });
  } catch { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// ── POST /api/payments/:id/refund ─────────────────
router.post('/:id/refund', staffOnly, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM payments WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Payment not found.' });
    if (rows[0].status !== 'completed')
      return res.status(400).json({ success: false, message: 'Payment is not in completed state.' });

    await db.query("UPDATE payments SET status='refunded' WHERE id=?", [req.params.id]);
    res.json({ success: true, message: 'Payment marked as refunded.' });
  } catch { res.status(500).json({ success: false, message: 'Server error.' }); }
});

module.exports = router;
