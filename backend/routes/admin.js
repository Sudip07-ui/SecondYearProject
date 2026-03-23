const router = require('express').Router();
const db     = require('../config/db');
const path   = require('path');
const fs     = require('fs');
const { staffOnly, adminOnly } = require('../middleware/auth');

// ── GET /api/admin/stats ──────────────────────────
router.get('/stats', staffOnly, async (req, res) => {
  try {
    // Helper - run query safely, return default on error
    const safe = async (query, params = [], defaultVal = 0) => {
      try {
        const [rows] = await db.query(query, params);
        return rows;
      } catch (e) {
        console.error('Stats query error:', e.message);
        return defaultVal;
      }
    };

    const safeOne = async (query, field, defaultVal = 0) => {
      try {
        const [[row]] = await db.query(query);
        return row ? (row[field] || defaultVal) : defaultVal;
      } catch (e) {
        console.error('Stats query error:', e.message, '|', query);
        return defaultVal;
      }
    };

    // TODAY
    const todayRevenue      = await safeOne(`SELECT COALESCE(SUM(amount),0) t FROM payments WHERE status='completed' AND DATE(payment_date)=CURDATE()`, 't', 0);
    const todayTrips        = await safeOne(`SELECT COUNT(*) c FROM bookings WHERE DATE(created_at)=CURDATE() AND status NOT IN ('cancelled')`, 'c', 0);
    const todayNewUsers     = await safeOne(`SELECT COUNT(*) c FROM users WHERE DATE(created_at)=CURDATE() AND role='customer'`, 'c', 0);
    const rentedVehicles    = await safeOne(`SELECT COUNT(*) c FROM vehicles WHERE status='rented'`, 'c', 0);

    // ALL TIME
    const totalRevenue  = await safeOne(`SELECT COALESCE(SUM(amount),0) t FROM payments WHERE status='completed'`, 't', 0);
    const totalBookings = await safeOne(`SELECT COUNT(*) c FROM bookings`, 'c', 0);
    const totalUsers    = await safeOne(`SELECT COUNT(*) c FROM users WHERE role='customer'`, 'c', 0);
    const totalVehicles = await safeOne(`SELECT COUNT(*) c FROM vehicles`, 'c', 0);
    const availVehicles = await safeOne(`SELECT COUNT(*) c FROM vehicles WHERE status='available'`, 'c', 0);
    const pendVerif     = await safeOne(`SELECT COUNT(*) c FROM identity_verifications WHERE status='pending'`, 'c', 0);
    const pendBookings  = await safeOne(`SELECT COUNT(*) c FROM bookings WHERE status='pending'`, 'c', 0);
    const activeBook    = await safeOne(`SELECT COUNT(*) c FROM bookings WHERE status IN ('confirmed','active')`, 'c', 0);

    // Monthly revenue
    const monthly = await safe(
      `SELECT DATE_FORMAT(payment_date,'%b %Y') mo, SUM(amount) revenue, COUNT(*) transactions
       FROM payments WHERE status='completed' AND payment_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(payment_date,'%Y-%m') ORDER BY MIN(payment_date) ASC`,
      [], []
    );

    // Booking status breakdown
    const byStatus = await safe(`SELECT status, COUNT(*) cnt FROM bookings GROUP BY status`, [], []);

    // Today's bookings - LEFT JOIN so it works even if no bookings
    const todayList = await safe(
      `SELECT b.id, b.total_price, b.status, b.created_at,
              u.first_name, u.last_name, v.model_name, v.brand
       FROM bookings b
       LEFT JOIN users u ON b.user_id=u.id
       LEFT JOIN vehicles v ON b.vehicle_id=v.id
       WHERE DATE(b.created_at)=CURDATE()
       ORDER BY b.created_at DESC`,
      [], []
    );

    // Recent bookings - LEFT JOIN
    const recentBookings = await safe(
      `SELECT b.id, b.start_date, b.end_date, b.total_price, b.status, b.created_at,
              u.first_name, u.last_name, v.model_name, v.brand
       FROM bookings b
       LEFT JOIN users u ON b.user_id=u.id
       LEFT JOIN vehicles v ON b.vehicle_id=v.id
       ORDER BY b.created_at DESC LIMIT 10`,
      [], []
    );

    // Pending verifications
    const pendVerifList = await safe(
      `SELECT iv.id, iv.submitted_at, u.first_name, u.last_name, u.email
       FROM identity_verifications iv
       LEFT JOIN users u ON iv.user_id=u.id
       WHERE iv.status='pending' ORDER BY iv.submitted_at DESC LIMIT 5`,
      [], []
    );

    res.json({
      success: true,
      today: {
        revenue:      parseFloat(todayRevenue)  || 0,
        trips:        parseInt(todayTrips)       || 0,
        newUsers:     parseInt(todayNewUsers)    || 0,
        rentedVehicles: parseInt(rentedVehicles) || 0,
        bookingsList: Array.isArray(todayList)   ? todayList : [],
      },
      stats: {
        totalRevenue:         parseFloat(totalRevenue)  || 0,
        totalBookings:        parseInt(totalBookings)   || 0,
        totalUsers:           parseInt(totalUsers)      || 0,
        totalVehicles:        parseInt(totalVehicles)   || 0,
        availableVehicles:    parseInt(availVehicles)   || 0,
        pendingVerifications: parseInt(pendVerif)       || 0,
        pendingBookings:      parseInt(pendBookings)    || 0,
        activeBookings:       parseInt(activeBook)      || 0,
      },
      monthlyRevenue:       Array.isArray(monthly)        ? monthly        : [],
      bookingsByStatus:     Array.isArray(byStatus)       ? byStatus       : [],
      recentBookings:       Array.isArray(recentBookings) ? recentBookings : [],
      pendingVerifications: Array.isArray(pendVerifList)  ? pendVerifList  : [],
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/users ──────────────────────────
router.get('/users', staffOnly, async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.role,
              u.is_active, u.created_at,
              iv.status AS verification_status,
              COUNT(DISTINCT b.id) AS total_bookings
       FROM users u
       LEFT JOIN identity_verifications iv ON u.id = iv.user_id
       LEFT JOIN bookings b ON u.id = b.user_id
       GROUP BY u.id, iv.status
       ORDER BY u.created_at DESC`
    );
    res.json({ success: true, users });
  } catch { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// ── PUT /api/admin/users/:id/toggle ──────────────
router.put('/users/:id/toggle', adminOnly, async (req, res) => {
  try {
    await db.query('UPDATE users SET is_active = NOT is_active WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'User status toggled.' });
  } catch { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// ── DELETE /api/admin/users/:id ───────────────────
router.delete('/users/:id', adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT role FROM users WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });
    if (rows[0].role === 'admin') return res.status(403).json({ success: false, message: 'Cannot delete an admin account.' });
    await db.query('DELETE FROM users WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'User account deleted.' });
  } catch { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// ── GET /api/admin/reports/bookings ──────────────
router.get('/reports/bookings', staffOnly, async (req, res) => {
  const { from, to } = req.query;
  let q = `SELECT b.id, b.start_date, b.end_date, b.total_days, b.total_price, b.status, b.created_at,
                  u.first_name, u.last_name, u.email,
                  v.model_name, v.brand, v.type
           FROM bookings b
           JOIN users    u ON b.user_id    = u.id
           JOIN vehicles v ON b.vehicle_id = v.id
           WHERE 1=1`;
  const p = [];
  if (from) { q += ' AND b.created_at >= ?'; p.push(from); }
  if (to)   { q += ' AND b.created_at <= ?'; p.push(to + ' 23:59:59'); }
  q += ' ORDER BY b.created_at DESC';
  try {
    const [rows] = await db.query(q, p);
    res.json({ success: true, report: rows });
  } catch { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// ── GET /api/admin/reports/revenue ───────────────
router.get('/reports/revenue', staffOnly, async (req, res) => {
  const { from, to } = req.query;
  let q = `SELECT p.id, p.amount, p.payment_method, p.transaction_id, p.payment_date,
                  b.total_days, v.model_name, v.brand,
                  u.first_name, u.last_name, u.email
           FROM payments p
           JOIN bookings b ON p.booking_id = b.id
           JOIN vehicles v ON b.vehicle_id = v.id
           JOIN users    u ON p.user_id    = u.id
           WHERE p.status='completed'`;
  const p = [];
  if (from) { q += ' AND p.payment_date >= ?'; p.push(from); }
  if (to)   { q += ' AND p.payment_date <= ?'; p.push(to + ' 23:59:59'); }
  q += ' ORDER BY p.payment_date DESC';
  try {
    const [rows] = await db.query(q, p);
    const total  = rows.reduce((s, r) => s + parseFloat(r.amount), 0);
    res.json({ success: true, total, report: rows });
  } catch { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// ── POST /api/admin/upload-vehicle-image ──────────
const upload = require('../middleware/upload');
router.post('/upload-vehicle-image', staffOnly, upload.single('vehicle_image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, image_url: imageUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
