const router = require('express').Router();
const db     = require('../config/db');
const { protect, staffOnly } = require('../middleware/auth');

// ── POST /api/bookings ── REQ-3.1 to 3.4 ─────────
router.post('/', protect, async (req, res) => {
  const { vehicle_id, start_date, end_date, notes } = req.body;
  if (!vehicle_id || !start_date || !end_date)
    return res.status(400).json({ success: false, message: 'vehicle_id, start_date, end_date are required.' });

  const start = new Date(start_date);
  const end   = new Date(end_date);
  const today = new Date(); today.setHours(0,0,0,0);

  if (start < today)  return res.status(400).json({ success: false, message: 'Start date cannot be in the past.' });
  if (end   <= start) return res.status(400).json({ success: false, message: 'End date must be after start date.' });

  const total_days = Math.ceil((end - start) / 86400000);

  try {
    // ── Block if identity not verified ───────────
    const [verif] = await db.query(
      `SELECT status FROM identity_verifications WHERE user_id=? ORDER BY submitted_at DESC LIMIT 1`,
      [req.user.id]
    );
    if (!verif.length || verif[0].status !== 'approved') {
      const msg = !verif.length
        ? 'You must complete identity verification before booking.'
        : verif[0].status === 'pending'
          ? 'Your identity verification is still pending approval. Please wait for admin approval.'
          : 'Your identity verification was rejected. Please resubmit your documents.';
      return res.status(403).json({ success: false, message: msg, redirect: '/verification' });
    }

    const [vrows] = await db.query('SELECT * FROM vehicles WHERE id = ?', [vehicle_id]);
    if (!vrows.length || vrows[0].status === 'maintenance')
      return res.status(404).json({ success: false, message: 'Vehicle not found or under maintenance.' });

    const [conflicts] = await db.query(
      `SELECT id FROM bookings WHERE vehicle_id = ? AND status NOT IN ('cancelled')
       AND NOT (end_date < ? OR start_date > ?)`,
      [vehicle_id, start_date, end_date]
    );
    if (conflicts.length)
      return res.status(409).json({ success: false, message: 'Vehicle already booked for selected dates.' });

    const vehicle     = vrows[0];
    const total_price = parseFloat(vehicle.price_per_day) * total_days;
    const soft_lock_expires_at = new Date(Date.now() + 15 * 60 * 1000);

    const [r] = await db.query(
      `INSERT INTO bookings
        (user_id,vehicle_id,start_date,end_date,total_days,total_price,status,soft_lock_expires_at,notes)
       VALUES (?,?,?,?,?,?,'pending',?,?)`,
      [req.user.id, vehicle_id, start_date, end_date, total_days, total_price, soft_lock_expires_at, notes||null]
    );

    await db.query(
      `INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,'booking')`,
      [req.user.id, 'Booking Submitted',
       `Your booking for ${vehicle.brand} ${vehicle.model_name} is pending admin approval.`]
    );

    // Notify all staff/admin
    const [staff] = await db.query(`SELECT id FROM users WHERE role IN ('admin','staff')`);
    for (const s of staff) {
      await db.query(
        `INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,'booking')`,
        [s.id, '🔔 New Booking Request',
         `${req.user.email} booked ${vehicle.brand} ${vehicle.model_name} for ${total_days} day(s). Awaiting your approval.`]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Booking submitted! Awaiting admin approval.',
      booking: { id: r.insertId, vehicle_id, start_date, end_date, total_days, total_price, soft_lock_expires_at }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── GET /api/bookings/my ── booking history ───────
router.get('/my', protect, async (req, res) => {
  try {
    const [bookings] = await db.query(
      `SELECT b.*, v.model_name, v.brand, v.type, v.image_url, v.price_per_day, v.color
       FROM bookings b JOIN vehicles v ON b.vehicle_id = v.id
       WHERE b.user_id = ? ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, bookings });
  } catch { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// ── GET /api/bookings ── all (staff) REQ-6.3 ──────
router.get('/', staffOnly, async (req, res) => {
  const { status } = req.query;
  let q = `SELECT b.*, v.model_name, v.brand, v.type, v.image_url,
                  u.first_name, u.last_name, u.email, u.phone
           FROM bookings b
           JOIN vehicles v ON b.vehicle_id = v.id
           JOIN users    u ON b.user_id    = u.id
           WHERE 1=1`;
  const p = [];
  if (status) { q += ' AND b.status = ?'; p.push(status); }
  q += ' ORDER BY b.created_at DESC';
  try {
    const [bookings] = await db.query(q, p);
    res.json({ success: true, bookings });
  } catch { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// ── GET /api/bookings/:id ─────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT b.*, v.model_name, v.brand, v.type, v.image_url, v.price_per_day, v.color, v.registration_number,
              u.first_name, u.last_name, u.email, u.phone
       FROM bookings b
       JOIN vehicles v ON b.vehicle_id = v.id
       JOIN users    u ON b.user_id    = u.id
       WHERE b.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Booking not found.' });
    const b = rows[0];
    // customer can only see own booking
    if (req.user.role === 'customer' && b.user_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'Access denied.' });
    res.json({ success: true, booking: b });
  } catch { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// ── PUT /api/bookings/:id/cancel ──────────────────
// Business rule: full refund if >24h before start; 50% fee if within 24h
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM bookings WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Booking not found.' });
    const b = rows[0];
    if (req.user.role === 'customer' && b.user_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'Access denied.' });
    if (['completed','cancelled'].includes(b.status))
      return res.status(400).json({ success: false, message: `Cannot cancel a ${b.status} booking.` });

    const hoursUntilStart = (new Date(b.start_date) - Date.now()) / 3600000;
    const refundNote = hoursUntilStart >= 24
      ? 'Full refund will be processed.'
      : 'Cancellation fee of 50% applies (within 24h of start).';

    await db.query("UPDATE bookings SET status='cancelled' WHERE id=?", [req.params.id]);
    // Free vehicle if it was rented
    await db.query("UPDATE vehicles SET status='available' WHERE id=? AND status='rented'", [b.vehicle_id]);

    await db.query(
      `INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,'booking')`,
      [b.user_id, 'Booking Cancelled', `Booking #${b.id} cancelled. ${refundNote}`]
    );
    res.json({ success: true, message: `Booking cancelled. ${refundNote}` });
  } catch { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// ── PUT /api/bookings/:id/status ── staff updates ─
router.put('/:id/status', staffOnly, async (req, res) => {
  const { status } = req.body;
  const allowed = ['confirmed','active','completed','cancelled'];
  if (!allowed.includes(status))
    return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` });
  try {
    const [rows] = await db.query('SELECT * FROM bookings WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Booking not found.' });
    const b = rows[0];

    await db.query('UPDATE bookings SET status=? WHERE id=?', [status, req.params.id]);

    // Keep vehicle status in sync
    if (status === 'active')     await db.query("UPDATE vehicles SET status='rented'    WHERE id=?", [b.vehicle_id]);
    if (status === 'completed')  await db.query("UPDATE vehicles SET status='available' WHERE id=?", [b.vehicle_id]);
    if (status === 'cancelled')  await db.query("UPDATE vehicles SET status='available' WHERE id=? AND status='rented'", [b.vehicle_id]);

    // Send meaningful notification based on status
    const notifMessages = {
      confirmed: ` Your booking #${b.id} has been approved! Go to My Bookings to complete your payment.`,
      active:    ` Your booking #${b.id} is now active. Enjoy your ride!`,
      completed: ` Your booking #${b.id} is complete. Thank you for choosing Rento!`,
      cancelled: ` Your booking #${b.id} has been cancelled by admin.`,
    };
    await db.query(
      `INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,'booking')`,
      [b.user_id,
       `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
       notifMessages[status] || `Your booking #${b.id} is now ${status}.`
      ]
    );
    res.json({ success: true, message: `Booking status updated to ${status}.` });
  } catch { res.status(500).json({ success: false, message: 'Server error.' }); }
});

module.exports = router;
